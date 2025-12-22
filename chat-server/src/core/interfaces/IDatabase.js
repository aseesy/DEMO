/**
 * Database Interface
 *
 * Defines the contract for database operations used by the core domain.
 * Implementations are provided by the infrastructure layer.
 *
 * @interface IDatabase
 */

/**
 * @typedef {Object} QueryResult
 * @property {Array<Object>} rows - Array of row objects
 * @property {number} rowCount - Number of rows affected/returned
 */

/**
 * Database interface for PostgreSQL-like operations
 *
 * Implementations:
 * - PostgresDatabase (production)
 * - InMemoryDatabase (testing)
 *
 * @example
 * // Implementation must provide:
 * const database = {
 *   query: async (sql, params) => ({ rows: [...], rowCount: n }),
 *   transaction: async (callback) => result,
 * };
 */
const IDatabase = {
  /**
   * Execute a parameterized SQL query
   * @param {string} sql - SQL query with $1, $2, etc. placeholders
   * @param {Array} params - Parameters to substitute
   * @returns {Promise<QueryResult>} Query result
   */
  query: async (/* sql, params */) => {
    throw new Error('IDatabase.query must be implemented');
  },

  /**
   * Execute multiple queries in a transaction
   * @param {Function} callback - Async function receiving a transaction client
   * @returns {Promise<*>} Result of the callback
   */
  transaction: async (/* callback */) => {
    throw new Error('IDatabase.transaction must be implemented');
  },
};

module.exports = { IDatabase };
