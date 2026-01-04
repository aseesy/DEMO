/**
 * Memory Module Index
 *
 * Part of the Dual-Brain AI Mediator architecture.
 * Exports narrative memory services for semantic search and user profiling.
 */

const narrativeMemory = require('./narrativeMemory');

module.exports = {
  ...narrativeMemory,

  // Re-export the entire module for named imports
  narrativeMemory,
};
