/**
 * State Manager - Conversation State Management
 *
 * Manages minimal essential state for conversations.
 * Tracks only proven metrics: intervention history, pattern counts, and basic throttling.
 *
 * SIMPLIFIED: Removed unproven tracking (emotional states, stress trajectories, adaptive thresholds).
 * These can be added back if A/B testing proves they improve outcomes.
 *
 * REFACTORED: No longer uses global state. Context is passed as parameter.
 *
 * @module src/liaizen/core/stateManager
 */

const { ESCALATION, MESSAGE } = require('../../infrastructure/config/constants');
const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'stateManager' });

/**
 * Initialize escalation state for a room
 * SIMPLIFIED: Only tracks essential metrics (pattern counts, last intervention time)
 * @param {Object} conversationContext - Conversation context object (must have escalationState Map)
 * @param {string} roomId - Room identifier
 * @returns {Object} Escalation state object
 */
function initializeEscalationState(conversationContext, roomId) {
  if (!conversationContext) {
    throw new Error('conversationContext is required');
  }

  // Ensure escalationState Map exists
  if (!conversationContext.escalationState) {
    conversationContext.escalationState = new Map();
  }

  if (!conversationContext.escalationState.has(roomId)) {
    conversationContext.escalationState.set(roomId, {
      lastInterventionTime: null,
      recentInterventionCount: 0, // Count in last 24 hours
      lastInterventionResetTime: Date.now(),
      patternCounts: {
        accusatory: 0,
        triangulation: 0,
      },
    });
  }
  return conversationContext.escalationState.get(roomId);
}

/**
 * REMOVED: initializeEmotionalState
 * Emotional state tracking removed - no evidence it improves outcomes.
 * Can be re-added if A/B testing proves value.
 */

/**
 * REMOVED: initializePolicyState
 * Policy state with adaptive thresholds removed - too complex, unproven.
 * Can be re-added if A/B testing proves value.
 */

/**
 * Update escalation state based on detected patterns
 * SIMPLIFIED: Only tracks pattern counts, no complex scoring/decay
 * @param {Object} conversationContext - Conversation context object
 * @param {string} roomId - Room identifier
 * @param {Object} patterns - Detected conflict patterns
 * @returns {Object} Updated escalation state
 */
function updateEscalationScore(conversationContext, roomId, patterns) {
  const state = initializeEscalationState(conversationContext, roomId);

  // Update pattern counts (simple increment, no complex scoring)
  if (patterns.hasAccusatory) {
    state.patternCounts.accusatory++;
  }
  if (patterns.hasTriangulation) {
    state.patternCounts.triangulation++;
  }

  // Reset intervention count if 24 hours have passed
  const hoursSinceReset = (Date.now() - state.lastInterventionResetTime) / (1000 * 60 * 60);
  if (hoursSinceReset >= 24) {
    state.recentInterventionCount = 0;
    state.lastInterventionResetTime = Date.now();
    logger.debug('Reset intervention count for room', { roomId });
  }

  return state;
}

/**
 * REMOVED: updateEmotionalState
 * Emotional state tracking removed - no evidence it improves outcomes.
 */

/**
 * Update intervention tracking (simplified)
 * @param {Object} conversationContext - Conversation context object
 * @param {string} roomId - Room identifier
 */
function recordIntervention(conversationContext, roomId) {
  const state = initializeEscalationState(conversationContext, roomId);
  state.lastInterventionTime = Date.now();
  state.recentInterventionCount++;

  logger.debug('Intervention recorded', {
    roomId,
    recentCount: state.recentInterventionCount,
  });

  return state;
}

/**
 * Get intervention throttling info
 * Returns whether interventions should be throttled (too many recently)
 * @param {Object} conversationContext - Conversation context object
 * @param {string} roomId - Room identifier
 * @param {number} maxInterventionsPerDay - Maximum interventions per 24 hours (default: 10)
 * @returns {Object} { shouldThrottle: boolean, lastInterventionTime: number|null, recentCount: number }
 */
function getInterventionThrottle(conversationContext, roomId, maxInterventionsPerDay = 10) {
  const state = initializeEscalationState(conversationContext, roomId);

  const shouldThrottle = state.recentInterventionCount >= maxInterventionsPerDay;

  return {
    shouldThrottle,
    lastInterventionTime: state.lastInterventionTime,
    recentCount: state.recentInterventionCount,
    maxPerDay: maxInterventionsPerDay,
  };
}

/**
 * REMOVED: updatePolicyState, recordInterventionFeedback
 * Adaptive threshold system removed - too complex, unproven.
 * Can be re-added if A/B testing proves value.
 */

module.exports = {
  initializeEscalationState,
  updateEscalationScore,
  recordIntervention,
  getInterventionThrottle,
  // Deprecated exports (for backward compatibility - will be removed)
  initializeEmotionalState: () => {
    logger.warn('initializeEmotionalState is deprecated and returns null');
    return null;
  },
  initializePolicyState: () => {
    logger.warn('initializePolicyState is deprecated and returns null');
    return null;
  },
  updateEmotionalState: () => {
    logger.warn('updateEmotionalState is deprecated and returns null');
    return null;
  },
  updatePolicyState: () => {
    logger.warn('updatePolicyState is deprecated and returns null');
    return null;
  },
  recordInterventionFeedback: () => {
    logger.warn('recordInterventionFeedback is deprecated');
  },
};
