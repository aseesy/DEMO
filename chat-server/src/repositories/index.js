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

module.exports = {
  // Interfaces
  ...interfaces,

  // PostgreSQL implementations (for dependency injection)
  ...postgres,
};

