/**
 * Neo4j Semantic Index Implementation
 *
 * Implements ISemanticIndex using Neo4j graph database.
 * Provides semantic search capabilities for threads and messages.
 */

const { ISemanticIndex } = require('../../core/interfaces/ISemanticIndex');

const { defaultLogger: defaultLogger } = require('../logging/logger');

const logger = defaultLogger.child({
  module: 'Neo4jSemanticIndex',
});

// Neo4j client for semantic threading
let neo4jClient = null;
try {
  neo4jClient = require('../database/neo4jClient');
} catch (err) {
  logger.warn('⚠️  Neo4j client not available - semantic indexing will use fallback');
}

/**
 * Neo4j implementation of semantic index
 */
class Neo4jSemanticIndex {
  /**
   * Check if Neo4j is available
   * @returns {boolean} True if Neo4j is connected and ready
   */
  isAvailable() {
    return neo4jClient && neo4jClient.isAvailable();
  }

  /**
   * Index a thread for semantic search
   * @param {string} threadId - Thread ID
   * @param {string} roomId - Room ID
   * @param {string} title - Thread title
   * @returns {Promise<void>}
   */
  async indexThread(threadId, roomId, title) {
    if (!this.isAvailable()) {
      throw new Error('Neo4j is not available');
    }

    try {
      await neo4jClient.createOrUpdateThreadNode(threadId, roomId, title);
    } catch (err) {
      logger.warn('⚠️  Failed to index thread in Neo4j (non-fatal)', {
        message: err.message,
      });
      throw err; // Re-throw to allow fallback handling
    }
  }

  /**
   * Index a message and link it to a thread
   * @param {string} messageId - Message ID
   * @param {string} threadId - Thread ID
   * @returns {Promise<void>}
   */
  async indexMessage(messageId, threadId) {
    if (!this.isAvailable()) {
      throw new Error('Neo4j is not available');
    }

    try {
      await neo4jClient.linkMessageToThread(messageId, threadId);
    } catch (err) {
      logger.warn('⚠️  Failed to index message in Neo4j (non-fatal)', {
        message: err.message,
      });
      throw err; // Re-throw to allow fallback handling
    }
  }

  /**
   * Link a thread to its parent thread in the semantic graph
   * @param {string} threadId - Child thread ID
   * @param {string} parentThreadId - Parent thread ID
   * @returns {Promise<void>}
   */
  async linkThreadToParent(threadId, parentThreadId) {
    if (!this.isAvailable()) {
      throw new Error('Neo4j is not available');
    }

    try {
      await neo4jClient.linkThreadToParent(threadId, parentThreadId);
    } catch (err) {
      logger.warn('⚠️  Failed to link thread to parent in Neo4j (non-fatal)', {
        message: err.message,
      });
      throw err; // Re-throw to allow fallback handling
    }
  }

  /**
   * Find similar messages using semantic search
   * @param {Array<number>} embedding - Text embedding vector
   * @param {string} roomId - Room ID to search within
   * @param {number} limit - Maximum number of results
   * @param {number} threshold - Similarity threshold (0-1)
   * @returns {Promise<Array<{messageId: string}>>} Array of similar message IDs
   */
  async findSimilarMessages(embedding, roomId, limit, threshold) {
    if (!this.isAvailable()) {
      throw new Error('Neo4j is not available');
    }

    try {
      return await neo4jClient.findSimilarMessages(embedding, roomId, limit, threshold);
    } catch (err) {
      logger.warn('⚠️  Failed to find similar messages in Neo4j (non-fatal)', {
        message: err.message,
      });
      throw err; // Re-throw to allow fallback handling
    }
  }
}

module.exports = { Neo4jSemanticIndex };
