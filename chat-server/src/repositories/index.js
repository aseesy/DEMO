/**
 * Repositories Index
 *
 * Central export point for all repositories (interfaces and implementations).
 * Services should import from here.
 *
 * @module repositories
 */

// Interfaces (abstractions - services depend on these)
const interfaces = require('./interfaces');

// PostgreSQL implementations (concrete implementations - injected at startup)
const postgres = require('./postgres');

// Infrastructure implementations (database and AI client wrappers)
const { PostgresDatabase } = require('./PostgresDatabase');
const { Neo4jDatabase } = require('./Neo4jDatabase');
const { OpenAIClient } = require('./OpenAIClient');

/**
 * Default infrastructure dependencies
 * These are injected into core domain functions
 */
const infrastructure = {
  database: PostgresDatabase,
  graphDatabase: Neo4jDatabase,
  aiClient: OpenAIClient,
};

/**
 * Create a dependency container for core functions
 * @param {Object} overrides - Override specific dependencies
 * @returns {Object} Container with all dependencies
 */
function createDependencies(overrides = {}) {
  return {
    ...infrastructure,
    ...overrides,
  };
}

module.exports = {
  // Interfaces
  ...interfaces,

  // PostgreSQL implementations (for dependency injection)
  ...postgres,

  // Infrastructure implementations
  PostgresDatabase,
  Neo4jDatabase,
  OpenAIClient,

  // Dependency injection helpers
  infrastructure,
  createDependencies,
};

