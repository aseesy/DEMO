/**
 * Auto-Threading Service
 *
 * Automatically assigns messages to threads based on semantic similarity.
 * Uses OpenAI embeddings and Neo4j for context-aware thread matching.
 *
 * Flow:
 * 1. Generate embedding for new message
 * 2. Store message + embedding in Neo4j
 * 3. Find similar threads using cosine similarity
 * 4. Auto-assign if similarity > threshold
 * 5. Notify clients of thread assignment
 */

const neo4jClient = require('../src/infrastructure/database/neo4jClient');
const threadManager = require('../threadManager');

// Configuration
const CONFIG = {
  // Minimum similarity score to auto-assign (0.0 - 1.0)
  AUTO_ASSIGN_THRESHOLD: 0.75,
  // Minimum similarity to suggest a thread (0.0 - 1.0)
  SUGGEST_THRESHOLD: 0.6,
  // Maximum threads to consider
  MAX_THREADS_TO_CHECK: 10,
  // Minimum message length to process (skip very short messages)
  MIN_MESSAGE_LENGTH: 10,
  // Skip common conversational messages
  SKIP_PATTERNS: [
    /^(ok|okay|yes|no|yeah|yep|nope|sure|thanks|thank you|lol|haha|k|kk)$/i,
    /^(hi|hey|hello|bye|goodbye)$/i,
  ],
};

/**
 * Check if a message should be processed for auto-threading
 * @param {string} text - Message text
 * @returns {boolean} Whether to process this message
 */
function shouldProcessMessage(text) {
  if (!text || typeof text !== 'string') return false;
  if (text.length < CONFIG.MIN_MESSAGE_LENGTH) return false;

  // Skip common conversational messages
  for (const pattern of CONFIG.SKIP_PATTERNS) {
    if (pattern.test(text.trim())) return false;
  }

  return true;
}

/**
 * Process a new message for auto-threading
 * This is called asynchronously after a message is saved
 *
 * @param {Object} message - The saved message object
 * @param {string} message.id - Message ID
 * @param {string} message.text - Message text
 * @param {string} message.username - Sender username
 * @param {string} message.roomId - Room ID
 * @param {string} message.timestamp - Message timestamp
 * @param {Object} options - Additional options
 * @param {Object} options.io - Socket.io instance for notifications
 * @returns {Promise<Object|null>} Threading result or null if not processed
 */
async function processMessageForThreading(message, options = {}) {
  const { io } = options;

  try {
    // Check if Neo4j is available
    if (!neo4jClient.isAvailable()) {
      console.log('[AutoThreading] Neo4j not available, skipping');
      return null;
    }

    // Check if message should be processed
    if (!shouldProcessMessage(message.text)) {
      return null;
    }

    // Skip if message already has a thread
    if (message.threadId || message.thread_id) {
      return null;
    }

    console.log(`[AutoThreading] Processing message ${message.id?.substring(0, 20)}...`);

    // Step 1: Generate embedding and store in Neo4j
    const messageNode = await neo4jClient.createOrUpdateMessageNode(
      message.id,
      message.roomId,
      message.text,
      message.username,
      message.timestamp
    );

    if (!messageNode || !messageNode.embedding || messageNode.embedding.length === 0) {
      console.log('[AutoThreading] Failed to generate embedding');
      return null;
    }

    // Step 2: Find similar threads
    const similarThreads = await neo4jClient.findSimilarThreads(
      messageNode.embedding,
      message.roomId,
      CONFIG.MAX_THREADS_TO_CHECK,
      CONFIG.SUGGEST_THRESHOLD
    );

    if (!similarThreads || similarThreads.length === 0) {
      console.log('[AutoThreading] No similar threads found');
      return { processed: true, assigned: false, reason: 'no_similar_threads' };
    }

    // Step 3: Check if top match exceeds auto-assign threshold
    const topMatch = similarThreads[0];
    console.log(
      `[AutoThreading] Top match: "${topMatch.title}" (similarity: ${(topMatch.similarity * 100).toFixed(1)}%)`
    );

    if (topMatch.similarity >= CONFIG.AUTO_ASSIGN_THRESHOLD) {
      // Auto-assign to thread
      await threadManager.addMessageToThread(message.id, topMatch.threadId);

      console.log(`[AutoThreading] ✅ Auto-assigned to thread "${topMatch.title}"`);

      // Notify clients
      if (io) {
        io.to(message.roomId).emit('message_auto_threaded', {
          messageId: message.id,
          threadId: topMatch.threadId,
          threadTitle: topMatch.title,
          similarity: topMatch.similarity,
          autoAssigned: true,
        });
      }

      return {
        processed: true,
        assigned: true,
        threadId: topMatch.threadId,
        threadTitle: topMatch.title,
        similarity: topMatch.similarity,
      };
    } else if (topMatch.similarity >= CONFIG.SUGGEST_THRESHOLD) {
      // Suggest thread but don't auto-assign
      console.log(
        `[AutoThreading] 💡 Suggesting thread "${topMatch.title}" (below auto-assign threshold)`
      );

      if (io) {
        io.to(message.roomId).emit('thread_suggestion', {
          messageId: message.id,
          suggestions: similarThreads.slice(0, 3).map(t => ({
            threadId: t.threadId,
            title: t.title,
            similarity: t.similarity,
          })),
        });
      }

      return {
        processed: true,
        assigned: false,
        reason: 'suggested_only',
        suggestions: similarThreads.slice(0, 3),
      };
    }

    return { processed: true, assigned: false, reason: 'low_similarity' };
  } catch (error) {
    console.error('[AutoThreading] Error processing message:', error.message);
    // Don't throw - auto-threading is non-critical
    return null;
  }
}

/**
 * Process multiple messages in batch (for historical data)
 *
 * @param {Array} messages - Array of message objects
 * @param {string} roomId - Room ID
 * @param {Object} options - Options
 * @param {Function} options.onProgress - Progress callback (current, total)
 * @returns {Promise<Object>} Batch processing results
 */
async function processMessagesBatch(messages, roomId, options = {}) {
  const { onProgress } = options;
  const results = {
    total: messages.length,
    processed: 0,
    assigned: 0,
    skipped: 0,
    errors: 0,
  };

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    try {
      const result = await processMessageForThreading(
        { ...message, roomId },
        { io: null } // No notifications for batch processing
      );

      if (result === null) {
        results.skipped++;
      } else if (result.assigned) {
        results.assigned++;
        results.processed++;
      } else {
        results.processed++;
      }
    } catch (error) {
      results.errors++;
    }

    // Report progress
    if (onProgress && (i + 1) % 100 === 0) {
      onProgress(i + 1, messages.length);
    }
  }

  return results;
}

/**
 * Ensure a thread has an embedding for similarity matching
 * Call this when a thread is created to enable semantic search
 *
 * @param {string} threadId - Thread ID
 * @param {string} roomId - Room ID
 * @param {string} title - Thread title
 */
async function ensureThreadEmbedding(threadId, roomId, title) {
  try {
    if (!neo4jClient.isAvailable()) return;

    await neo4jClient.createOrUpdateThreadNode(threadId, roomId, title);
    console.log(`[AutoThreading] Created/updated thread embedding for "${title}"`);
  } catch (error) {
    console.error('[AutoThreading] Error creating thread embedding:', error.message);
  }
}

module.exports = {
  processMessageForThreading,
  processMessagesBatch,
  ensureThreadEmbedding,
  shouldProcessMessage,
  CONFIG,
};
