/**
 * PostgreSQL Database Implementation
 *
 * Implements IDatabase interface using PostgreSQL via dbPostgres/dbSafe.
 * This is the infrastructure layer - it knows about the specific database.
 */

const dbPostgres = require('../../dbPostgres');
const dbSafe = require('../../dbSafe');

/**
 * PostgreSQL implementation of IDatabase
 * Wraps both dbPostgres and dbSafe for backward compatibility
 */
const PostgresDatabase = {
  /**
   * Execute a parameterized SQL query using dbPostgres
   * @param {string} sql - SQL query with $1, $2, etc. placeholders
   * @param {Array} params - Parameters to substitute
   * @returns {Promise<{rows: Array, rowCount: number}>} Query result
   */
  async query(sql, params = []) {
    return dbPostgres.query(sql, params);
  },

  /**
   * Execute a parameterized SQL query using dbSafe (with additional safety)
   * @param {string} sql - SQL query with $1, $2, etc. placeholders
   * @param {Array} params - Parameters to substitute
   * @returns {Promise<{rows: Array, rowCount: number}>} Query result
   */
  async safeQuery(sql, params = []) {
    return dbSafe.query(sql, params);
  },

  /**
   * Execute multiple queries in a transaction
   * @param {Function} callback - Async function receiving a transaction client
   * @returns {Promise<*>} Result of the callback
   */
  async transaction(callback) {
    const client = await dbPostgres.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Get the raw dbPostgres module (for migration/backward compatibility)
   * @returns {Object} dbPostgres module
   */
  getRawClient() {
    return dbPostgres;
  },

  /**
   * Get the raw dbSafe module (for migration/backward compatibility)
   * @returns {Object} dbSafe module
   */
  getSafeClient() {
    return dbSafe;
  },
};

module.exports = { PostgresDatabase };
