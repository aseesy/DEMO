/**
 * Safety controls and explanation system
 * Provides transparency, override controls, and graceful degradation
 */

const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'safety',
});

/**
 * Generate explanation for an intervention
 * @param {Object} intervention - Intervention details
 * @param {Object} emotionalState - Emotional state that triggered it
 * @param {Object} escalationAssessment - Escalation assessment
 * @returns {string} - Human-readable explanation
 */
function generateInterventionExplanation(intervention, emotionalState, escalationAssessment) {
  const parts = [];

  if (intervention.type === 'ai_intervention') {
    parts.push('I noticed this message could escalate conflict.');

    if (emotionalState && emotionalState.participant) {
      parts.push(
        `Your co-parent's stress level is ${emotionalState.participant.stressLevel}/100 and ${emotionalState.participant.stressTrajectory}.`
      );
    }

    if (escalationAssessment && escalationAssessment.riskLevel !== 'low') {
      parts.push(`The conversation shows ${escalationAssessment.riskLevel} escalation risk.`);
    }

    if (intervention.whyMediation) {
      parts.push(`Specifically: ${intervention.whyMediation.substring(0, 100)}...`);
    }

    parts.push("I've provided some suggestions to help communicate more effectively.");
  } else if (intervention.type === 'ai_comment') {
    parts.push(
      "I'm sharing an observation that might be helpful for your co-parenting communication."
    );
  }

  return parts.join(' ');
}

/**
 * Check if intervention confidence is sufficient
 * @param {Object} intervention - Intervention details
 * @param {number} confidenceThreshold - Minimum confidence required (default: 60)
 * @returns {boolean} - Whether intervention should proceed
 */
function checkInterventionConfidence(intervention, confidenceThreshold = 60) {
  const confidence = intervention.confidence || 0;

  if (confidence < confidenceThreshold) {
    logger.debug('Log message', {
      value: `⚠️ Intervention confidence (${confidence}%) below threshold (${confidenceThreshold}%) - considering fallback`,
    });
    return false;
  }

  return true;
}

/**
 * Determine if graceful degradation is needed
 * @param {Object} intervention - Intervention details
 * @param {Object} emotionalState - Emotional state
 * @param {number} confidence - Confidence level
 * @returns {Object} - Degradation decision
 */
function assessDegradationNeed(intervention, emotionalState, confidence) {
  // Degrade if confidence is very low
  if (confidence < 40) {
    return {
      shouldDegrade: true,
      reason: 'Low confidence in intervention',
      fallbackAction: 'monitor_only',
      message:
        "I'm not certain about this situation. I'll monitor the conversation and step in if needed.",
    };
  }

  // Degrade if emotional state is unclear
  if (emotionalState && emotionalState.confidence < 50) {
    return {
      shouldDegrade: true,
      reason: 'Unclear emotional state',
      fallbackAction: 'gentle_suggestion',
      message:
        "I want to help, but I'm not entirely sure about the best approach here. Would you like some gentle suggestions?",
    };
  }

  // Don't degrade
  return {
    shouldDegrade: false,
    reason: 'Sufficient confidence',
    fallbackAction: null,
    message: null,
  };
}

/**
 * Generate override options for user
 * @param {Object} intervention - Intervention that can be overridden
 * @returns {Object} - Override options
 */
function generateOverrideOptions(intervention) {
  return {
    canOverride: true,
    overrideOptions: [
      {
        action: 'send_anyway',
        label: 'Send message anyway',
        description: 'I understand the risk, but want to send this message',
      },
      {
        action: 'edit_first',
        label: 'Edit first',
        description: "I'll revise the message before sending",
      },
      {
        action: 'get_more_help',
        label: 'Get more help',
        description: "I'd like additional coaching",
      },
    ],
    explanation: generateInterventionExplanation(intervention, null, null),
  };
}

/**
 * Validate intervention safety before applying
 * @param {Object} intervention - Proposed intervention
 * @param {Object} context - Full context
 * @returns {Object} - Safety validation result
 */
function validateInterventionSafety(intervention, context) {
  const warnings = [];
  const errors = [];

  // Check for potential misinterpretation
  if (!intervention.validation || intervention.validation.length < 20) {
    warnings.push(
      'Intervention validation seems too brief - may not adequately validate user feelings'
    );
  }

  // Check for tone policing
  const validationText = (intervention.validation || '').toLowerCase();
  if (validationText.includes('you should') || validationText.includes('you must')) {
    warnings.push('Intervention may be too directive - could feel like tone policing');
  }

  // Check for censorship risk
  if (intervention.action === 'INTERVENE' && !intervention.rewrite1 && !intervention.rewrite2) {
    errors.push('Intervention blocks message but provides no alternatives - high censorship risk');
  }

  // Check confidence
  if (context.confidence && context.confidence < 50) {
    warnings.push('Low confidence in intervention - consider graceful degradation');
  }

  return {
    safe: errors.length === 0,
    warnings: warnings,
    errors: errors,
    recommendation:
      errors.length > 0
        ? 'block_intervention'
        : warnings.length > 0
          ? 'proceed_with_caution'
          : 'proceed',
  };
}

module.exports = {
  generateInterventionExplanation,
  checkInterventionConfidence,
  assessDegradationNeed,
  generateOverrideOptions,
  validateInterventionSafety,
};
