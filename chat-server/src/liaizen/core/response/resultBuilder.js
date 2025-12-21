/**
 * Result Builder
 *
 * Builds response result objects for different action types.
 *
 * @module liaizen/core/response/resultBuilder
 */

/**
 * Build intervention result object
 *
 * @param {Object} params - Result parameters
 * @returns {Object} Complete intervention result
 */
function buildInterventionResult({ intervention, message, result, parsedMessage }) {
  return {
    type: 'ai_intervention',
    action: 'INTERVENE',
    validation: intervention.validation,
    insight: intervention.insight || '', // Optional - removed from display per user request
    rewrite1: intervention.rewrite1,
    rewrite2: intervention.rewrite2,
    originalMessage: message,
    escalation: result.escalation,
    emotion: result.emotion,
    codeLayerAnalysis: parsedMessage
      ? {
          axiomsFired: parsedMessage.axiomsFired,
          conflictPotential: parsedMessage.assessment.conflictPotential,
          attackSurface: parsedMessage.assessment.attackSurface,
          childAsInstrument: parsedMessage.assessment.childAsInstrument,
          vector: parsedMessage.vector,
          latencyMs: parsedMessage.meta.latencyMs,
        }
      : null,
  };
}

/**
 * Build comment result object
 *
 * @param {Object} params - Result parameters
 * @returns {Object} Comment result
 */
function buildCommentResult({ commentText, message, result }) {
  return {
    type: 'ai_comment',
    action: 'COMMENT',
    text: commentText,
    originalMessage: message,
    escalation: result.escalation,
    emotion: result.emotion,
  };
}

/**
 * Build safety fallback result (when intervention is incomplete)
 *
 * @returns {Object} Allow result
 */
function buildSafetyFallback() {
  return {
    type: 'allow',
    action: 'STAY_SILENT',
  };
}

module.exports = {
  buildInterventionResult,
  buildCommentResult,
  buildSafetyFallback,
};
