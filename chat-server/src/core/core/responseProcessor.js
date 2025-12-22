/**
 * Response Processor
 *
 * REFACTORED: This file now delegates to focused response modules.
 * Each module has a single responsibility:
 *
 * - response/parser.js - Parse JSON responses
 * - response/validator.js - Validate rewrites
 * - response/recorder.js - Record to profiles/graph
 * - response/resultBuilder.js - Build result objects
 *
 * @module liaizen/core/responseProcessor
 * @see liaizen/core/response/index.js
 */

// Re-export everything from the response module
module.exports = require('./response');
