/**
 * Thread Analysis Module
 *
 * Handles AI-powered thread analysis:
 * - Suggest threads for messages
 * - Analyze conversation history
 * - Generate embeddings for semantic search
 */

const openaiClient = require('../../../openaiClient');
const { validateCategory } = require('./threadCategories');
const { extractDistinctiveKeywords } = require('./threadKeywords');

// Neo4j client for semantic threading
let neo4jClient = null;
try {
  neo4jClient = require('../../infrastructure/database/neo4jClient');
} catch (err) {
  console.warn('⚠️  Neo4j client not available - semantic threading will use fallback');
}

/**
 * Auto-detect if a message should start a new thread or belong to an existing thread
 * Uses AI to analyze message content and recent conversation
 * @param {Object} message - Message object
 * @param {Array} recentMessages - Recent messages for context
 * @param {string} roomId - Room ID
 * @param {Function} getThreadsForRoom - Function to get existing threads
 */
async function suggestThreadForMessage(message, recentMessages, roomId, getThreadsForRoom) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    // Get existing threads for this room
    const existingThreads = await getThreadsForRoom(roomId, false);

    // Analyze recent messages (last 10) to understand context
    const recentContext = recentMessages
      .slice(-10)
      .map(m => `${m.username}: ${m.text}`)
      .join('\n');

    const prompt = `Analyze this co-parenting message and determine if it:
1. Starts a NEW topic/thread (e.g., discussing pickup times, school events, medical appointments)
2. Belongs to an EXISTING thread (continuing a previous conversation)
3. Is a GENERAL message (doesn't need threading)

Current message: ${message.username}: "${message.text}"

Recent conversation:
${recentContext}

${
  existingThreads.length > 0
    ? `Existing threads:\n${existingThreads
        .slice(0, 5)
        .map(t => `- ${t.title} (${t.message_count} messages)`)
        .join('\n')}`
    : 'No existing threads'
}

Respond in JSON:
{
  "action": "new_thread|existing_thread|none",
  "threadTitle": "Suggested title if new_thread",
  "threadId": "thread_id if existing_thread",
  "confidence": 0-100,
  "reasoning": "Why this decision"
}`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at analyzing co-parenting conversations to identify distinct topics and threads. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const response = completion.choices[0].message.content.trim();
    const suggestion = JSON.parse(response);

    // Only suggest if confidence is high enough
    if (suggestion.confidence >= 60) {
      return {
        action: suggestion.action,
        threadTitle: suggestion.threadTitle || null,
        threadId: suggestion.threadId || null,
        confidence: suggestion.confidence,
        reasoning: suggestion.reasoning,
      };
    }

    return null;
  } catch (error) {
    console.error('Error suggesting thread:', error);
    return null;
  }
}

/**
 * Analyze conversation history to identify recurring topics and automatically create threads
 * Reviews all messages in a room to find ongoing or recurring conversation patterns
 * Automatically creates threads for identified topics
 *
 * @param {string} roomId - Room ID to analyze
 * @param {number} limit - Maximum number of messages to analyze (default: 100)
 * @param {Object} dependencies - Required functions from other modules
 * @param {Function} dependencies.getThreadsForRoom - Get threads for room
 * @param {Function} dependencies.createThread - Create new thread
 * @param {Function} dependencies.addMessageToThread - Add message to thread
 * @param {Function} dependencies.archiveThread - Archive thread
 * @param {Function} dependencies.generateEmbeddingForText - Generate embedding
 * @returns {Promise<Object>} Object with suggestions and createdThreads arrays
 */
async function analyzeConversationHistory(roomId, limit = 100, dependencies = {}) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, skipping conversation analysis');
    return {
      suggestions: [],
      createdThreads: [],
    };
  }

  const {
    getThreadsForRoom,
    createThread,
    addMessageToThread,
    archiveThread,
    generateEmbeddingForText,
  } = dependencies;

  try {
    console.log(
      `[threadManager] Starting conversation analysis for room: ${roomId}, limit: ${limit}`
    );
    const messageStore = require('../../../messageStore');

    // Get recent messages for the room (excluding system messages)
    const messages = await messageStore.getMessagesByRoom(roomId, limit);

    // Only analyze messages from the last 30 days to avoid old historical data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter out system messages, private messages, flagged messages, messages without text,
    // and messages older than 30 days
    const filteredMessages = messages.filter(m => {
      if (!m.text || m.type === 'system' || m.private || m.flagged || !m.username) {
        return false;
      }
      // Filter out old messages
      const msgDate = new Date(m.timestamp);
      return msgDate >= thirtyDaysAgo;
    });

    if (filteredMessages.length < 5) {
      // Not enough messages to analyze
      console.log(
        `[threadManager] Not enough messages to analyze (${filteredMessages.length} < 5)`
      );
      return {
        suggestions: [],
        createdThreads: [],
      };
    }

    console.log(
      `[threadManager] Analyzing ${filteredMessages.length} messages for room: ${roomId}`
    );

    // Get existing threads to avoid duplicates
    const existingThreads = await getThreadsForRoom(roomId, false);

    // Group messages by time windows to identify recurring topics
    // Analyze messages in chunks to find patterns
    const conversationText = filteredMessages
      .slice(-50) // Analyze last 50 messages for patterns
      .map(m => `${m.username}: ${m.text}`)
      .join('\n\n');

    const prompt = `Analyze this co-parenting conversation and identify distinct conversations (back-and-forth exchanges about specific subjects).

A "conversation" is a focused exchange between two people about ONE specific matter - NOT just a keyword.

Examples of good conversation titles:
- "Planning Thanksgiving Schedule" (specific event being discussed)
- "Emma's Doctor Appointment Friday" (specific appointment discussion)
- "Soccer Practice Carpool Arrangement" (specific logistical discussion)
- "Homework Help for Math Test" (specific child need being addressed)

Examples of BAD titles (too vague/keyword-based):
- "School" (too broad)
- "Pickup" (just a keyword)
- "Medical" (category, not a conversation)

CATEGORIES - Each conversation MUST be assigned to exactly one:
- schedule: Pickup, dropoff, custody, visitation times
- medical: Doctor appointments, health, medications, therapy
- education: School, homework, grades, teachers, tutoring
- finances: Money, expenses, support, reimbursements
- activities: Sports, hobbies, lessons, camps, extracurriculars
- travel: Vacations, trips, flights, visits
- safety: Emergency contacts, concerns, protection
- logistics: General coordination, supplies, belongings
- co-parenting: Parenting decisions, boundaries, communication

Conversation history (most recent messages):
${conversationText}

${
  existingThreads.length > 0
    ? `Existing conversations (avoid duplicates):\n${existingThreads
        .map(t => `- ${t.title} [${t.category || 'logistics'}] (${t.message_count} messages)`)
        .join('\n')}`
    : 'No existing conversations'
}

Identify 3-5 distinct CONVERSATIONS (not keywords). For each:
- Title should describe the SPECIFIC subject being discussed (3-7 words)
- Category MUST be one of: schedule, medical, education, finances, activities, travel, safety, logistics, co-parenting
- Must be a back-and-forth exchange (at least 2 participants)
- Should be actionable or about a specific event/need

Respond in JSON array format:
[
  {
    "title": "Specific conversation title",
    "category": "one of the 9 categories above",
    "messageCount": estimated_count,
    "isRecurring": true/false,
    "reasoning": "What makes this a distinct conversation",
    "confidence": 0-100
  }
]

Only include conversations with confidence >= 60 and at least 3 related messages.`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at analyzing co-parenting conversations to identify distinct recurring topics and ongoing conversations. Respond only with valid JSON array.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const response = completion.choices[0].message.content.trim();
    // Remove markdown code blocks if present
    const cleanResponse = response.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const suggestions = JSON.parse(cleanResponse);

    // Filter and validate suggestions
    const validSuggestions = suggestions
      .filter(s => s.confidence >= 60 && s.messageCount >= 3)
      .filter(s => {
        // Check if similar thread already exists
        const titleLower = s.title.toLowerCase();
        return !existingThreads.some(
          t =>
            t.title.toLowerCase().includes(titleLower) || titleLower.includes(t.title.toLowerCase())
        );
      })
      .sort((a, b) => b.messageCount - a.messageCount) // Sort by message count
      .slice(0, 5); // Limit to top 5 suggestions

    // Automatically create threads from suggestions using semantic search
    const createdThreads = [];
    console.log(`[threadManager] Processing ${validSuggestions.length} valid suggestions`);

    for (const suggestion of validSuggestions) {
      try {
        let matchingMessages = [];
        console.log(
          `[threadManager] Processing suggestion: "${suggestion.title}" (${suggestion.messageCount} messages)`
        );

        // Use Neo4j semantic search if available, otherwise fall back to keyword matching
        if (neo4jClient && neo4jClient.isAvailable()) {
          try {
            // Generate embedding for the thread title
            const threadEmbedding = await generateEmbeddingForText(suggestion.title);

            if (threadEmbedding) {
              console.log(`[threadManager] Using Neo4j semantic search for "${suggestion.title}"`);
              // Use cosine similarity function to find similar messages
              const similarMessages = await neo4jClient.findSimilarMessages(
                threadEmbedding,
                roomId,
                suggestion.messageCount || 20,
                0.7 // 70% similarity threshold
              );

              console.log(
                `[threadManager] Found ${similarMessages.length} similar messages via Neo4j`
              );
              // Map Neo4j results to message objects
              const messageIds = similarMessages.map(m => m.messageId);
              matchingMessages = filteredMessages.filter(
                msg => messageIds.includes(msg.id) && !msg.threadId
              );
            } else {
              console.warn(
                `[threadManager] Failed to generate embedding for "${suggestion.title}", using keyword fallback`
              );
            }
          } catch (neo4jError) {
            console.warn(
              `⚠️  Neo4j semantic search failed for "${suggestion.title}", using keyword fallback:`,
              neo4jError.message
            );
            // Fall through to keyword matching
          }
        } else {
          console.log(
            `[threadManager] Neo4j not available, using keyword matching for "${suggestion.title}"`
          );
        }

        // Fallback to keyword matching if Neo4j not available or failed
        if (matchingMessages.length < 3) {
          // Extract DISTINCTIVE keywords only (filter out stop words)
          const topicKeywords = extractDistinctiveKeywords(suggestion.title, 3);
          const reasoningKeywords = extractDistinctiveKeywords(suggestion.reasoning || '', 4);

          // Combine and deduplicate
          const allKeywords = [...new Set([...topicKeywords, ...reasoningKeywords])];

          console.log(`[threadManager] Keyword matching for "${suggestion.title}":`, {
            topicKeywords,
            reasoningKeywords: reasoningKeywords.slice(0, 5), // Log first 5
            totalDistinctive: allKeywords.length,
          });

          // Skip if no distinctive keywords found
          if (allKeywords.length === 0) {
            console.log(
              `[threadManager] No distinctive keywords for "${suggestion.title}", skipping`
            );
            continue;
          }

          matchingMessages = filteredMessages.filter(msg => {
            if (!msg.id || msg.threadId) {
              return false;
            }
            // Extract distinctive keywords from message
            const msgKeywords = extractDistinctiveKeywords(msg.text || '', 3);

            // Count how many topic keywords appear in message
            const matchedTopicKeywords = topicKeywords.filter(k => msgKeywords.includes(k));
            const matchedAllKeywords = allKeywords.filter(k => msgKeywords.includes(k));

            // STRICT MATCHING: Require at least 2 distinctive topic keywords
            // OR 1 topic keyword + 2 from reasoning
            return (
              matchedTopicKeywords.length >= 2 ||
              (matchedTopicKeywords.length >= 1 && matchedAllKeywords.length >= 3)
            );
          });
        }

        console.log(
          `[threadManager] Found ${matchingMessages.length} matching messages for "${suggestion.title}"`
        );

        if (matchingMessages.length >= 3) {
          // Create thread with category
          const threadCategory = validateCategory(suggestion.category);
          console.log(
            `[threadManager] Creating thread "${suggestion.title}" [${threadCategory}] with ${matchingMessages.length} messages`
          );
          const threadId = await createThread(
            roomId,
            suggestion.title,
            'system',
            null,
            threadCategory
          );

          // Add matching messages to the thread (limit to avoid too many, prioritize recent)
          const messagesToAdd = matchingMessages
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Most recent first
            .slice(0, Math.min(suggestion.messageCount || 20, matchingMessages.length));

          let addedCount = 0;
          for (const msg of messagesToAdd) {
            if (msg.id && !msg.threadId) {
              // Only add messages that aren't already in a thread
              await addMessageToThread(msg.id, threadId);
              addedCount++;
            }
          }

          if (addedCount > 0) {
            console.log(
              `[threadManager] ✅ Created thread "${suggestion.title}" with ${addedCount} messages`
            );
            createdThreads.push({
              threadId,
              title: suggestion.title,
              messageCount: addedCount,
            });
          } else {
            console.warn(
              `[threadManager] ⚠️  No messages added to thread "${suggestion.title}", archiving empty thread`
            );
            // If no messages were added, delete the empty thread
            await archiveThread(threadId, true);
          }
        } else {
          console.log(
            `[threadManager] ⚠️  Not enough matching messages (${matchingMessages.length} < 3) for "${suggestion.title}"`
          );
        }
      } catch (error) {
        console.error(`[threadManager] ❌ Error creating thread for "${suggestion.title}":`, error);
        // Continue with other suggestions even if one fails
      }
    }

    console.log(`[threadManager] Analysis complete: ${createdThreads.length} threads created`);

    return {
      suggestions: validSuggestions,
      createdThreads,
    };
  } catch (error) {
    console.error('Error analyzing conversation history:', error);
    return {
      suggestions: [],
      createdThreads: [],
    };
  }
}

/**
 * Generate embedding for text (helper function)
 * @private
 */
async function generateEmbeddingForText(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }

  try {
    // Use the OpenAI client from core/engine/client
    const coreOpenaiClient = require('../../../core/engine/client');
    const client = coreOpenaiClient.getClient();

    if (!client) {
      return null;
    }

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.trim(),
    });

    if (!response.data || !response.data[0] || !response.data[0].embedding) {
      return null;
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ Failed to generate embedding:', error.message);
    return null;
  }
}

module.exports = {
  suggestThreadForMessage,
  analyzeConversationHistory,
  generateEmbeddingForText,
};
