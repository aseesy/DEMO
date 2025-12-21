/**
 * AI Service
 *
 * REFACTORED: This file now delegates to focused AI modules.
 * Each module has a single responsibility:
 *
 * - ai/nameDetector.js - Detect names in messages
 * - ai/contactSuggester.js - Generate contact suggestions
 * - ai/insightsExtractor.js - Extract relationship insights
 *
 * @module liaizen/core/aiService
 * @see liaizen/core/ai/index.js
 */

// Re-export everything from the ai module
module.exports = require('./ai');
