/**
 * No-Op Semantic Index Implementation
 *
 * Null object pattern implementation of ISemanticIndex.
 * Used when Neo4j is unavailable - all operations are no-ops.
 * This allows the system to "fail open" gracefully.
 */

const { ISemanticIndex } = require('../../core/interfaces/ISemanticIndex');

/**
 * No-op implementation of semantic index
 * All operations silently succeed (null object pattern)
 */
class NoOpSemanticIndex {
  /**
   * Index a thread for semantic search (no-op)
   * @param {string} threadId - Thread ID
   * @param {string} roomId - Room ID
   * @param {string} title - Thread title
   * @returns {Promise<void>}
   */
  async indexThread(threadId, roomId, title) {
    // No-op: semantic indexing unavailable
    return Promise.resolve();
  }

  /**
   * Index a message and link it to a thread (no-op)
   * @param {string} messageId - Message ID
   * @param {string} threadId - Thread ID
   * @returns {Promise<void>}
   */
  async indexMessage(messageId, threadId) {
    // No-op: semantic indexing unavailable
    return Promise.resolve();
  }

  /**
   * Link a thread to its parent thread in the semantic graph (no-op)
   * @param {string} threadId - Child thread ID
   * @param {string} parentThreadId - Parent thread ID
   * @returns {Promise<void>}
   */
  async linkThreadToParent(threadId, parentThreadId) {
    // No-op: semantic indexing unavailable
    return Promise.resolve();
  }

  /**
   * Find similar messages using semantic search (no-op)
   * @param {Array<number>} embedding - Text embedding vector
   * @param {string} roomId - Room ID to search within
   * @param {number} limit - Maximum number of results
   * @param {number} threshold - Similarity threshold (0-1)
   * @returns {Promise<Array<{messageId: string}>>} Empty array (no results)
   */
  async findSimilarMessages(embedding, roomId, limit, threshold) {
    // No-op: semantic indexing unavailable, return empty results
    return Promise.resolve([]);
  }
}

module.exports = { NoOpSemanticIndex };

