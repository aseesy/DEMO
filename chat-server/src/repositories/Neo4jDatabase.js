/**
 * Neo4j Graph Database Implementation
 *
 * Implements IGraphDatabase interface using Neo4j.
 * This is the infrastructure layer - it knows about the specific graph database.
 */

let neo4jClient = null;
let neo4jDriver = null;

// Lazy load Neo4j dependencies
function loadNeo4j() {
  if (!neo4jClient) {
    try {
      neo4jClient = require('../utils/neo4jClient');
      neo4jDriver = require('neo4j-driver');
    } catch (err) {
      console.warn('⚠️ Neo4jDatabase: Neo4j not available:', err.message);
    }
  }
  return { neo4jClient, neo4jDriver };
}

/**
 * Neo4j implementation of IGraphDatabase
 */
const Neo4jDatabase = {
  /**
   * Check if Neo4j is available
   * @returns {boolean} True if connected and ready
   */
  isAvailable() {
    const { neo4jClient } = loadNeo4j();
    return neo4jClient && neo4jClient.isAvailable();
  },

  /**
   * Execute a Cypher query
   * @param {string} query - Cypher query string
   * @param {Object} params - Query parameters
   * @returns {Promise<{records: Array}>} Query result
   */
  async executeCypher(query, params = {}) {
    const { neo4jClient } = loadNeo4j();
    if (!neo4jClient) {
      throw new Error('Neo4j client not available');
    }
    return neo4jClient._executeCypher(query, params);
  },

  /**
   * Convert a number to Neo4j integer type
   * @param {number} value - Integer value
   * @returns {*} Neo4j integer representation
   */
  int(value) {
    const { neo4jDriver } = loadNeo4j();
    if (!neo4jDriver) {
      return value; // Fallback to regular number
    }
    return neo4jDriver.int(value);
  },

  /**
   * Get the raw neo4jClient module (for migration/backward compatibility)
   * @returns {Object|null} neo4jClient module or null
   */
  getRawClient() {
    const { neo4jClient } = loadNeo4j();
    return neo4jClient;
  },

  /**
   * Get the raw neo4j-driver module (for migration/backward compatibility)
   * @returns {Object|null} neo4j-driver module or null
   */
  getDriver() {
    const { neo4jDriver } = loadNeo4j();
    return neo4jDriver;
  },
};

module.exports = { Neo4jDatabase };
