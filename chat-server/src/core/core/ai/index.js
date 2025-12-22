/**
 * AI Service Index
 *
 * Orchestrates AI service modules.
 * Each module has a single responsibility:
 *
 * - nameDetector.js - Detect names in messages
 * - contactSuggester.js - Generate contact suggestions
 * - insightsExtractor.js - Extract relationship insights
 *
 * @module liaizen/core/ai
 */

const { detectNamesInMessage } = require('./nameDetector');
const { generateContactSuggestion } = require('./contactSuggester');
const {
  extractRelationshipInsights,
  persistInsights,
  getRelationshipInsights,
} = require('./insightsExtractor');

module.exports = {
  detectNamesInMessage,
  generateContactSuggestion,
  extractRelationshipInsights,
  persistInsights,
  getRelationshipInsights,
  // Deprecated alias - use getRelationshipInsights instead
  loadRelationshipInsights: getRelationshipInsights,
};
