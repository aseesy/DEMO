/**
 * Semantic Index Interface
 *
 * Defines the contract for semantic search/indexing operations.
 * Abstracts the semantic index provider (Neo4j, etc.) from the core domain.
 *
 * @interface ISemanticIndex
 */

/**
 * Semantic index interface for thread and message indexing
 *
 * Implementations:
 * - Neo4jSemanticIndex (production - uses Neo4j)
 * - NoOpSemanticIndex (fallback - when Neo4j unavailable)
 *
 * @example
 * // Implementation must provide:
 * const semanticIndex = {
 *   indexThread: async (threadId, roomId, title) => {},
 *   indexMessage: async (messageId, threadId) => {},
 *   linkThreadToParent: async (threadId, parentThreadId) => {},
 *   findSimilarMessages: async (embedding, roomId, limit, threshold) => [],
 * };
 */
const ISemanticIndex = {
  /**
   * Index a thread for semantic search
   * @param {string} threadId - Thread ID
   * @param {string} roomId - Room ID
   * @param {string} title - Thread title
   * @returns {Promise<void>}
   */
  indexThread: async (/* threadId, roomId, title */) => {
    throw new Error('ISemanticIndex.indexThread must be implemented');
  },

  /**
   * Index a message and link it to a thread
   * @param {string} messageId - Message ID
   * @param {string} threadId - Thread ID
   * @returns {Promise<void>}
   */
  indexMessage: async (/* messageId, threadId */) => {
    throw new Error('ISemanticIndex.indexMessage must be implemented');
  },

  /**
   * Link a thread to its parent thread in the semantic graph
   * @param {string} threadId - Child thread ID
   * @param {string} parentThreadId - Parent thread ID
   * @returns {Promise<void>}
   */
  linkThreadToParent: async (/* threadId, parentThreadId */) => {
    throw new Error('ISemanticIndex.linkThreadToParent must be implemented');
  },

  /**
   * Find similar messages using semantic search
   * @param {Array<number>} embedding - Text embedding vector
   * @param {string} roomId - Room ID to search within
   * @param {number} limit - Maximum number of results
   * @param {number} threshold - Similarity threshold (0-1)
   * @returns {Promise<Array<{messageId: string}>>} Array of similar message IDs
   */
  findSimilarMessages: async (/* embedding, roomId, limit, threshold */) => {
    throw new Error('ISemanticIndex.findSimilarMessages must be implemented');
  },
};

module.exports = { ISemanticIndex };

