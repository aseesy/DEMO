/**
 * Core Interfaces
 *
 * These interfaces define the contracts between the domain core and
 * the infrastructure layer. The core depends on abstractions, not
 * concrete implementations.
 *
 * Dependency Rule: Code in src/core (domain) must ONLY import from:
 * - Other files in src/core
 * - These interfaces
 * - Node.js built-ins
 *
 * Infrastructure implementations (in src/repositories) implement these
 * interfaces and are injected at runtime.
 */

const { IDatabase } = require('./IDatabase');
const { IGraphDatabase } = require('./IGraphDatabase');
const { IAIClient } = require('./IAIClient');

module.exports = {
  IDatabase,
  IGraphDatabase,
  IAIClient,
};
