/**
 * AI Thread Analyzer
 *
 * Implementation of IConversationAnalyzer using OpenAI.
 * Handles all AI-powered conversation analysis logic.
 */

const { IConversationAnalyzer } = require('../../../core/interfaces/IConversationAnalyzer');
const openaiClient = require('../../../../openaiClient');
const { normalizeCategory, getCategoryKeywords } = require('../threadCategories');
const { extractDistinctiveKeywords } = require('../threadKeywords');
const threadEmbeddings = require('../threadEmbeddings');

/**
 * AI Thread Analyzer implementation
 * Uses OpenAI for conversation analysis
 * Uses ISemanticIndex for semantic search (dependency injection)
 */
class AIThreadAnalyzer {
  /**
   * @param {ISemanticIndex} semanticIndex - Semantic index implementation (injected)
   */
  constructor(semanticIndex = null) {
    this.semanticIndex = semanticIndex;
  }
  /**
   * Suggest if a message should start a new thread or belong to an existing thread
   * @param {Object} message - Message object with username and text
   * @param {Array<Object>} recentMessages - Recent messages for context
   * @param {string} roomId - Room ID
   * @param {Function} getThreadsForRoom - Function to get existing threads
   * @returns {Promise<Object|null>} Suggestion or null if no suggestion
   */
  async suggestThreadForMessage(message, recentMessages, roomId, getThreadsForRoom) {
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
   * @param {string} roomId - Room ID to analyze
   * @param {number} limit - Maximum number of messages to analyze (default: 100)
   * @param {Object} dependencies - Required functions from use cases
   * @returns {Promise<Object>} Object with suggestions and createdThreads arrays
   */
  async analyzeConversationHistory(roomId, limit = 100, dependencies = {}) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AIThreadAnalyzer] ⚠️  OpenAI API key not configured, skipping conversation analysis');
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
        `[AIThreadAnalyzer] 🔍 DEBUG: Starting conversation analysis for room: ${roomId}, limit: ${limit}`
      );
      const messageStore = require('../../../../messageStore');

      // Get recent messages for the room (excluding system messages)
      const messages = await messageStore.getMessagesByRoom(roomId, limit);
      console.log(`[AIThreadAnalyzer] 🔍 DEBUG: Retrieved ${messages.length} messages from messageStore`);

      // Only analyze messages from the last 30 days to avoid old historical data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      console.log(`[AIThreadAnalyzer] 🔍 DEBUG: Filtering messages after ${thirtyDaysAgo.toISOString()}`);

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

      console.log(`[AIThreadAnalyzer] 🔍 DEBUG: After filtering: ${filteredMessages.length} messages (removed ${messages.length - filteredMessages.length})`);

      if (filteredMessages.length < 5) {
        // Not enough messages to analyze
        console.log(
          `[AIThreadAnalyzer] ⚠️  Not enough messages to analyze (${filteredMessages.length} < 5)`
        );
        return {
          suggestions: [],
          createdThreads: [],
        };
      }

      console.log(
        `[AIThreadAnalyzer] Analyzing ${filteredMessages.length} messages for room: ${roomId}`
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

      console.log(`[AIThreadAnalyzer] 🔍 DEBUG: Calling OpenAI API with ${filteredMessages.length} messages`);
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
      console.log(`[AIThreadAnalyzer] 🔍 DEBUG: OpenAI response length: ${response.length} chars`);
      // Remove markdown code blocks if present
      const cleanResponse = response.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      let suggestions;
      try {
        suggestions = JSON.parse(cleanResponse);
        console.log(`[AIThreadAnalyzer] 🔍 DEBUG: Parsed ${suggestions.length} suggestions from OpenAI`);
      } catch (parseError) {
        console.error(`[AIThreadAnalyzer] ❌ Failed to parse OpenAI response:`, parseError.message);
        console.error(`[AIThreadAnalyzer] 🔍 DEBUG: Response was:`, cleanResponse.substring(0, 500));
        return {
          suggestions: [],
          createdThreads: [],
        };
      }

      // Filter and validate suggestions
      console.log(`[AIThreadAnalyzer] 🔍 DEBUG: Filtering ${suggestions.length} suggestions`);
      const validSuggestions = suggestions
        .filter(s => {
          const hasConfidence = s.confidence >= 60;
          const hasMessages = s.messageCount >= 3;
          if (!hasConfidence) {
            console.log(`[AIThreadAnalyzer] 🔍 DEBUG: Suggestion "${s.title}" filtered out: confidence ${s.confidence} < 60`);
          }
          if (!hasMessages) {
            console.log(`[AIThreadAnalyzer] 🔍 DEBUG: Suggestion "${s.title}" filtered out: messageCount ${s.messageCount} < 3`);
          }
          return hasConfidence && hasMessages;
        })
        .filter(s => {
          // Check if similar thread already exists
          const titleLower = s.title.toLowerCase();
          const isDuplicate = existingThreads.some(
            t =>
              t.title.toLowerCase().includes(titleLower) || titleLower.includes(t.title.toLowerCase())
          );
          if (isDuplicate) {
            console.log(`[AIThreadAnalyzer] 🔍 DEBUG: Suggestion "${s.title}" filtered out: duplicate of existing thread`);
          }
          return !isDuplicate;
        })
        .sort((a, b) => b.messageCount - a.messageCount) // Sort by message count
        .slice(0, 5); // Limit to top 5 suggestions

      console.log(`[AIThreadAnalyzer] 🔍 DEBUG: ${validSuggestions.length} valid suggestions after filtering`);
      
      // Automatically create threads from suggestions using semantic search
      const createdThreads = [];
      console.log(`[AIThreadAnalyzer] Processing ${validSuggestions.length} valid suggestions`);

      for (const suggestion of validSuggestions) {
        try {
          let matchingMessages = [];
          console.log(
            `[AIThreadAnalyzer] Processing suggestion: "${suggestion.title}" (${suggestion.messageCount} messages)`
          );

          // Use semantic search if available, otherwise fall back to keyword matching
          if (this.semanticIndex) {
            try {
              // Generate embedding for the thread title
              const threadEmbedding = await generateEmbeddingForText(suggestion.title);

              if (threadEmbedding) {
                console.log(`[AIThreadAnalyzer] Using semantic search for "${suggestion.title}"`);
                // Use semantic index to find similar messages
                const similarMessages = await this.semanticIndex.findSimilarMessages(
                  threadEmbedding,
                  roomId,
                  suggestion.messageCount || 20,
                  0.7 // 70% similarity threshold
                );

                console.log(
                  `[AIThreadAnalyzer] Found ${similarMessages.length} similar messages via semantic search`
                );
                // Map semantic search results to message objects
                const messageIds = similarMessages.map(m => m.messageId);
                // Filter to only unthreaded messages - check both msg.threadId and msg.thread_id
                // Also need to verify in database since messageStore may not include thread_id
                matchingMessages = filteredMessages.filter(
                  msg => messageIds.includes(msg.id) && !msg.threadId && !msg.thread_id
                );
                
                // Double-check in database to ensure messages aren't already threaded
                // This prevents the "Messages already assigned to threads" issue
                if (matchingMessages.length > 0) {
                  const db = require('../../../../dbPostgres');
                  const messageIdsToCheck = matchingMessages.map(m => m.id);
                  const dbCheck = await db.query(
                    'SELECT id FROM messages WHERE id = ANY($1) AND thread_id IS NOT NULL',
                    [messageIdsToCheck]
                  );
                  const alreadyThreadedIds = new Set(dbCheck.rows.map(r => r.id));
                  matchingMessages = matchingMessages.filter(m => !alreadyThreadedIds.has(m.id));
                  if (alreadyThreadedIds.size > 0) {
                    console.log(`[AIThreadAnalyzer] Filtered out ${alreadyThreadedIds.size} messages already in threads`);
                  }
                }
              } else {
                console.warn(
                  `[AIThreadAnalyzer] Failed to generate embedding for "${suggestion.title}", using keyword fallback`
                );
              }
            } catch (semanticError) {
              console.warn(
                `⚠️  Semantic search failed for "${suggestion.title}", using keyword fallback:`,
                semanticError.message
              );
              // Fall through to keyword matching
            }
          } else {
            console.log(
              `[AIThreadAnalyzer] Semantic index not available, using keyword matching for "${suggestion.title}"`
            );
          }

          // Fallback to keyword matching if Neo4j not available or failed
          if (matchingMessages.length < 3) {
            // Extract DISTINCTIVE keywords only (filter out stop words)
            const topicKeywords = extractDistinctiveKeywords(suggestion.title, 3);
            const reasoningKeywords = extractDistinctiveKeywords(suggestion.reasoning || '', 4);

            // Combine and deduplicate
            const allKeywords = [...new Set([...topicKeywords, ...reasoningKeywords])];

            console.log(`[AIThreadAnalyzer] Keyword matching for "${suggestion.title}":`, {
              topicKeywords,
              reasoningKeywords: reasoningKeywords.slice(0, 5), // Log first 5
              totalDistinctive: allKeywords.length,
            });

            // Skip if no distinctive keywords found
            if (allKeywords.length === 0) {
              console.log(
                `[AIThreadAnalyzer] No distinctive keywords for "${suggestion.title}", skipping`
              );
              continue;
            }

            matchingMessages = filteredMessages.filter(msg => {
              // Check both threadId and thread_id (messageStore may use either)
              if (!msg.id || msg.threadId || msg.thread_id) {
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
            `[AIThreadAnalyzer] Found ${matchingMessages.length} matching messages for "${suggestion.title}"`
          );

          if (matchingMessages.length >= 3) {
            // Create thread with category
            const threadCategory = normalizeCategory(suggestion.category);
            console.log(
              `[AIThreadAnalyzer] Creating thread "${suggestion.title}" [${threadCategory}] with ${matchingMessages.length} messages`
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

            // Final database check: verify messages aren't already threaded before adding
            // This prevents the "Messages already assigned to threads" issue
            const db = require('../../../../dbPostgres');
            const messageIdsToCheck = messagesToAdd.map(m => m.id);
            let unthreadedMessages = messagesToAdd;
            
            if (messageIdsToCheck.length > 0) {
              const dbCheck = await db.query(
                'SELECT id, thread_id FROM messages WHERE id = ANY($1)',
                [messageIdsToCheck]
              );
              const alreadyThreadedIds = new Set(
                dbCheck.rows.filter(r => r.thread_id).map(r => r.id)
              );
              if (alreadyThreadedIds.size > 0) {
                console.log(`[AIThreadAnalyzer] Filtering out ${alreadyThreadedIds.size} messages already in threads`);
                unthreadedMessages = messagesToAdd.filter(m => !alreadyThreadedIds.has(m.id));
              }
            }

            let addedCount = 0;
            for (const msg of unthreadedMessages) {
              if (msg.id && !msg.threadId && !msg.thread_id) {
                // Only add messages that aren't already in a thread
                await addMessageToThread(msg.id, threadId);
                addedCount++;
              }
            }

            if (addedCount > 0) {
              console.log(
                `[AIThreadAnalyzer] ✅ Created thread "${suggestion.title}" with ${addedCount} messages`
              );
              createdThreads.push({
                threadId,
                title: suggestion.title,
                messageCount: addedCount,
              });
            } else {
              console.warn(
                `[AIThreadAnalyzer] ⚠️  No messages added to thread "${suggestion.title}", archiving empty thread`
              );
              // If no messages were added, delete the empty thread
              await archiveThread(threadId, true);
            }
          } else {
            console.log(
              `[AIThreadAnalyzer] ⚠️  Not enough matching messages (${matchingMessages.length} < 3) for "${suggestion.title}"`
            );
          }
        } catch (error) {
          console.error(`[AIThreadAnalyzer] ❌ Error creating thread for "${suggestion.title}":`, error);
          // Continue with other suggestions even if one fails
        }
      }

      console.log(`[AIThreadAnalyzer] ✅ Analysis complete: ${createdThreads.length} threads created`);
      if (createdThreads.length === 0 && validSuggestions.length > 0) {
        console.log(`[AIThreadAnalyzer] ⚠️  WARNING: ${validSuggestions.length} suggestions were generated but no threads were created`);
        console.log(`[AIThreadAnalyzer] 🔍 DEBUG: This could mean:`);
        console.log(`[AIThreadAnalyzer]    - Not enough matching messages found (need 3+)`);
        console.log(`[AIThreadAnalyzer]    - Messages already assigned to threads`);
        console.log(`[AIThreadAnalyzer]    - Thread creation failed`);
      }

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
   * Auto-assign a message to the best matching existing thread
   * @param {Object} message - Message object with id, text, roomId
   * @param {Function} getThreadsForRoom - Function to get existing threads
   * @param {Function} addMessageToThread - Function to add message to thread
   * @returns {Promise<Object|null>} Assignment result or null
   */
  async autoAssignMessageToThread(message, getThreadsForRoom, addMessageToThread) {
    if (!message || !message.text || !message.roomId) {
      return null;
    }

    try {
      // Get existing active threads for this room
      const existingThreads = await getThreadsForRoom(message.roomId, false);

      if (existingThreads.length === 0) {
        return null;
      }

      // Extract keywords from the message
      const messageKeywords = extractDistinctiveKeywords(message.text, 3);

      if (messageKeywords.length === 0) {
        return null;
      }

      // Score each thread based on keyword overlap
      const scoredThreads = existingThreads.map(thread => {
        // Extract keywords from thread title
        const titleKeywords = extractDistinctiveKeywords(thread.title, 3);

        // Get category-specific keywords
        const categoryKeywords = getCategoryKeywords(thread.category);

        // Calculate score
        let score = 0;

        // 1. Direct keyword match with thread title (highest weight)
        const titleMatches = messageKeywords.filter(k => titleKeywords.includes(k));
        score += titleMatches.length * 3;

        // 2. Category keyword match (medium weight)
        const categoryMatches = messageKeywords.filter(k => categoryKeywords.includes(k));
        score += categoryMatches.length * 2;

        // 3. Bonus for category keywords appearing in thread title
        const titleCategoryOverlap = titleKeywords.filter(k => categoryKeywords.includes(k));
        if (titleCategoryOverlap.length > 0 && categoryMatches.length > 0) {
          score += 2; // Bonus for strong category alignment
        }

        return {
          threadId: thread.id,
          threadTitle: thread.title,
          category: thread.category,
          score,
          titleMatches,
          categoryMatches,
        };
      });

      // Find the best matching thread
      const bestMatch = scoredThreads
        .filter(t => t.score >= 3) // Minimum score threshold
        .sort((a, b) => b.score - a.score)[0];

      if (bestMatch) {
        console.log(`[AIThreadAnalyzer] Auto-assigning message to thread "${bestMatch.threadTitle}" (score: ${bestMatch.score})`);

        // Actually assign the message to the thread
        await addMessageToThread(message.id, bestMatch.threadId);

        return {
          threadId: bestMatch.threadId,
          threadTitle: bestMatch.threadTitle,
          category: bestMatch.category,
          score: bestMatch.score,
        };
      }

      return null;
    } catch (error) {
      console.error('[AIThreadAnalyzer] Error auto-assigning message to thread:', error);
      return null;
    }
  }
}

module.exports = { AIThreadAnalyzer };

