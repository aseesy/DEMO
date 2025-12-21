/**
 * Response Processor Index
 *
 * Orchestrates response processing modules.
 * Each module has a single responsibility:
 *
 * - parser.js - Parse JSON responses
 * - validator.js - Validate rewrites
 * - recorder.js - Record to profiles/graph
 * - resultBuilder.js - Build result objects
 *
 * @module liaizen/core/response
 */

const { parseResponse, extractAction, validateInterventionFields } = require('./parser');
const { validateRewrites, validateCodeLayerResponse } = require('./validator');
const { recordToProfile, updateGraphMetrics, recordToHistory } = require('./recorder');
const {
  buildInterventionResult,
  buildCommentResult,
  buildSafetyFallback,
} = require('./resultBuilder');
const { registry: actionHandlerRegistry } = require('./handlers/ActionHandlerRegistry');

/**
 * Process AI response and build appropriate result
 *
 * @param {Object} params - Processing parameters
 * @returns {Promise<Object|null>} Processed result or null
 */
async function processResponse({
  responseText,
  message,
  roleContext,
  participantProfiles,
  roomId,
  policyState,
  parsedMessage,
  languageAnalysis,
  shouldLimitComments,
}) {
  // Parse response
  const result = parseResponse(responseText);
  if (!result) {
    return null;
  }

  // Debug logging
  if (result.intervention) {
    console.log('📝 VALIDATION:', result.intervention.validation);
    // Removed insight logging per user request
    console.log('📝 REWRITE 1:', result.intervention.rewrite1);
    console.log('📝 REWRITE 2:', result.intervention.rewrite2);
  }

  const action = extractAction(result);

  // Use action handler registry (Strategy Pattern - OCP compliant)
  const handler = actionHandlerRegistry.get(action);
  return handler.process({
    result,
    message,
    roleContext,
    participantProfiles,
    roomId,
    policyState,
    parsedMessage,
    languageAnalysis,
    shouldLimitComments,
  });
}

module.exports = {
  // Main processor
  processResponse,

  // Re-export for direct access
  parseResponse,
  extractAction,
  validateInterventionFields,
  validateRewrites,
  validateCodeLayerResponse,
  recordToProfile,
  updateGraphMetrics,
  recordToHistory,
  buildInterventionResult,
  buildCommentResult,
  buildSafetyFallback,
};
