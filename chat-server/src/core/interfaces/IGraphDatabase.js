/**
 * Graph Database Interface
 *
 * Defines the contract for graph database operations (Neo4j-like).
 * Used for relationship queries between users and entities.
 *
 * @interface IGraphDatabase
 */

/**
 * @typedef {Object} GraphRecord
 * @property {Function} get - Get a value by key
 */

/**
 * @typedef {Object} GraphResult
 * @property {Array<GraphRecord>} records - Query results
 */

/**
 * Graph database interface for relationship operations
 *
 * Implementations:
 * - Neo4jDatabase (production)
 * - InMemoryGraphDatabase (testing)
 *
 * @example
 * // Implementation must provide:
 * const graphDb = {
 *   isAvailable: () => true,
 *   executeCypher: async (query, params) => ({ records: [...] }),
 *   int: (value) => Neo4jInteger,
 * };
 */
const IGraphDatabase = {
  /**
   * Check if graph database is available
   * @returns {boolean} True if connected and ready
   */
  isAvailable: () => {
    throw new Error('IGraphDatabase.isAvailable must be implemented');
  },

  /**
   * Execute a Cypher query
   * @param {string} query - Cypher query string
   * @param {Object} params - Query parameters
   * @returns {Promise<GraphResult>} Query result
   */
  executeCypher: async (/* query, params */) => {
    throw new Error('IGraphDatabase.executeCypher must be implemented');
  },

  /**
   * Convert a number to graph database integer type
   * @param {number} value - Integer value
   * @returns {*} Database-specific integer representation
   */
  int: (/* value */) => {
    throw new Error('IGraphDatabase.int must be implemented');
  },
};

module.exports = { IGraphDatabase };
