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
const { defaultLogger } = require('../../../infrastructure/logging/logger');

const logger = defaultLogger.child({ component: 'AIThreadAnalyzer' });

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
      logger.error('Error suggesting thread', error, { roomId, messageId: message.id });
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
      logger.warn('OpenAI API key not configured, skipping conversation analysis');
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
      logger.debug('Starting conversation analysis', { roomId, limit });
      const messageStore = require('../../../../messageStore');

      // Get recent messages for the room (excluding system messages)
      const messages = await messageStore.getMessagesByRoom(roomId, limit);
      logger.debug('Retrieved messages from messageStore', { count: messages.length, roomId });

      // Only analyze messages from the last 30 days to avoid old historical data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      logger.debug('Filtering messages after date', { cutoffDate: thirtyDaysAgo.toISOString() });

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

      logger.debug('After filtering', {
        filteredCount: filteredMessages.length,
        removedCount: messages.length - filteredMessages.length,
        roomId,
      });

      if (filteredMessages.length < 5) {
        // Not enough messages to analyze
        logger.debug('Not enough messages to analyze', {
          count: filteredMessages.length,
          minRequired: 5,
          roomId,
        });
        return {
          suggestions: [],
          createdThreads: [],
        };
      }

      logger.info('Analyzing messages for room', {
        messageCount: filteredMessages.length,
        roomId,
      });

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

      logger.debug('Calling OpenAI API', { messageCount: filteredMessages.length, roomId });
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
      logger.debug('OpenAI response received', { responseLength: response.length, roomId });
      // Remove markdown code blocks if present
      const cleanResponse = response.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      let suggestions;
      try {
        suggestions = JSON.parse(cleanResponse);
        logger.debug('Parsed suggestions from OpenAI', {
          suggestionCount: suggestions.length,
          roomId,
        });
      } catch (parseError) {
        logger.error('Failed to parse OpenAI response', parseError, {
          roomId,
          responsePreview: cleanResponse.substring(0, 500),
        });
        return {
          suggestions: [],
          createdThreads: [],
        };
      }

      // Filter and validate suggestions
      logger.debug('Filtering suggestions', { suggestionCount: suggestions.length, roomId });
      const validSuggestions = suggestions
        .filter(s => {
          const hasConfidence = s.confidence >= 60;
          const hasMessages = s.messageCount >= 3;
          if (!hasConfidence) {
            logger.debug('Suggestion filtered out: low confidence', {
              title: s.title,
              confidence: s.confidence,
              threshold: 60,
            });
          }
          if (!hasMessages) {
            logger.debug('Suggestion filtered out: insufficient messages', {
              title: s.title,
              messageCount: s.messageCount,
              required: 3,
            });
          }
          return hasConfidence && hasMessages;
        })
        .filter(s => {
          // Check if similar thread already exists
          const titleLower = s.title.toLowerCase();
          const isDuplicate = existingThreads.some(
            t =>
              t.title.toLowerCase().includes(titleLower) ||
              titleLower.includes(t.title.toLowerCase())
          );
          if (isDuplicate) {
            logger.debug('Suggestion filtered out: duplicate thread', { title: s.title });
          }
          return !isDuplicate;
        })
        .sort((a, b) => b.messageCount - a.messageCount) // Sort by message count
        .slice(0, 5); // Limit to top 5 suggestions

      logger.debug('Valid suggestions after filtering', {
        validCount: validSuggestions.length,
        roomId,
      });

      // Automatically create threads from suggestions using semantic search
      const createdThreads = [];
      logger.info('Processing valid suggestions', {
        suggestionCount: validSuggestions.length,
        roomId,
      });

      for (const suggestion of validSuggestions) {
        try {
          let matchingMessages = [];
          logger.debug('Processing suggestion', {
            title: suggestion.title,
            messageCount: suggestion.messageCount,
            roomId,
          });

          // Use semantic search if available, otherwise fall back to keyword matching
          if (this.semanticIndex) {
            try {
              // Generate embedding for the thread title
              const threadEmbedding = await generateEmbeddingForText(suggestion.title);

              if (threadEmbedding) {
                logger.debug('Using semantic search', { title: suggestion.title, roomId });
                // Use semantic index to find similar messages
                const similarMessages = await this.semanticIndex.findSimilarMessages(
                  threadEmbedding,
                  roomId,
                  suggestion.messageCount || 20,
                  0.7 // 70% similarity threshold
                );

                logger.debug('Found similar messages via semantic search', {
                  title: suggestion.title,
                  count: similarMessages.length,
                  roomId,
                });
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
                    logger.debug('Filtered out messages already in threads', {
                      filteredCount: alreadyThreadedIds.size,
                      title: suggestion.title,
                    });
                  }
                }
              } else {
                logger.warn('Failed to generate embedding, using keyword fallback', {
                  title: suggestion.title,
                });
              }
            } catch (semanticError) {
              logger.warn('Semantic search failed, using keyword fallback', semanticError, {
                title: suggestion.title,
              });
              // Fall through to keyword matching
            }
          } else {
            logger.debug('Semantic index not available, using keyword matching', {
              title: suggestion.title,
            });
          }

          // Fallback to keyword matching if Neo4j not available or failed
          if (matchingMessages.length < 3) {
            // Extract DISTINCTIVE keywords only (filter out stop words)
            const topicKeywords = extractDistinctiveKeywords(suggestion.title, 3);
            const reasoningKeywords = extractDistinctiveKeywords(suggestion.reasoning || '', 4);

            // Combine and deduplicate
            const allKeywords = [...new Set([...topicKeywords, ...reasoningKeywords])];

            logger.debug('Keyword matching', {
              title: suggestion.title,
              topicKeywords,
              reasoningKeywords: reasoningKeywords.slice(0, 5), // Log first 5
              totalDistinctive: allKeywords.length,
            });

            // Skip if no distinctive keywords found
            if (allKeywords.length === 0) {
              logger.debug('No distinctive keywords found, skipping', { title: suggestion.title });
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

          logger.debug('Found matching messages', {
            title: suggestion.title,
            count: matchingMessages.length,
            roomId,
          });

          if (matchingMessages.length >= 3) {
            // Create thread with category
            const threadCategory = normalizeCategory(suggestion.category);
            logger.info('Creating thread', {
              title: suggestion.title,
              category: threadCategory,
              messageCount: matchingMessages.length,
              roomId,
            });
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
                logger.debug('Filtering out messages already in threads', {
                  filteredCount: alreadyThreadedIds.size,
                  title: suggestion.title,
                });
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
              logger.info('Created thread', {
                threadId,
                title: suggestion.title,
                messageCount: addedCount,
                roomId,
              });
              createdThreads.push({
                threadId,
                title: suggestion.title,
                messageCount: addedCount,
              });
            } else {
              logger.warn('No messages added to thread, archiving empty thread', {
                threadId,
                title: suggestion.title,
              });
              // If no messages were added, delete the empty thread
              await archiveThread(threadId, true);
            }
          } else {
            logger.debug('Not enough matching messages', {
              title: suggestion.title,
              count: matchingMessages.length,
              required: 3,
            });
          }
        } catch (error) {
          logger.error('Error creating thread for suggestion', error, {
            title: suggestion.title,
            roomId,
          });
          // Continue with other suggestions even if one fails
        }
      }

      logger.info('Analysis complete', {
        threadsCreated: createdThreads.length,
        suggestionsGenerated: validSuggestions.length,
        roomId,
      });
      if (createdThreads.length === 0 && validSuggestions.length > 0) {
        logger.warn('Suggestions generated but no threads created', {
          suggestionCount: validSuggestions.length,
          roomId,
          possibleReasons: [
            'Not enough matching messages found (need 3+)',
            'Messages already assigned to threads',
            'Thread creation failed',
          ],
        });
      }

      return {
        suggestions: validSuggestions,
        createdThreads,
      };
    } catch (error) {
      logger.error('Error analyzing conversation history', error, { roomId, limit });
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
        logger.info('Auto-assigning message to thread', {
          threadId: bestMatch.threadId,
          threadTitle: bestMatch.threadTitle,
          score: bestMatch.score,
          messageId: message.id,
        });

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
      logger.error('Error auto-assigning message to thread', error, {
        messageId: message.id,
        roomId: message.roomId,
      });
      return null;
    }
  }
}

module.exports = { AIThreadAnalyzer };
