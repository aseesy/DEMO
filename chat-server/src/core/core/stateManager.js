/**
 * State Manager - Conversation State Management
 *
 * Manages escalation, emotional, and policy state for conversations.
 * Handles state initialization, updates, and decay.
 *
 * REFACTORED: No longer uses global state. Context is passed as parameter.
 *
 * @module src/liaizen/core/stateManager
 */

const { ESCALATION, MESSAGE } = require('../../infrastructure/config/constants');

/**
 * Initialize escalation state for a room
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
      escalationScore: 0,
      lastNegativeTime: null,
      patternCounts: {
        accusatory: 0,
        triangulation: 0,
        comparison: 0,
        blaming: 0,
      },
    });
  }
  return conversationContext.escalationState.get(roomId);
}

/**
 * Initialize emotional state for a room
 * @param {Object} conversationContext - Conversation context object (must have emotionalState Map)
 * @param {string} roomId - Room identifier
 * @returns {Object} Emotional state object
 */
function initializeEmotionalState(conversationContext, roomId) {
  if (!conversationContext) {
    throw new Error('conversationContext is required');
  }

  // Ensure emotionalState Map exists
  if (!conversationContext.emotionalState) {
    conversationContext.emotionalState = new Map();
  }

  if (!conversationContext.emotionalState.has(roomId)) {
    conversationContext.emotionalState.set(roomId, {
      participants: {},
      conversationEmotion: 'neutral',
      escalationRisk: 0,
      lastUpdated: Date.now(),
    });
  }
  return conversationContext.emotionalState.get(roomId);
}

/**
 * Initialize policy state for a room
 * @param {Object} conversationContext - Conversation context object (must have policyState Map)
 * @param {string} roomId - Room identifier
 * @returns {Object} Policy state object
 */
function initializePolicyState(conversationContext, roomId) {
  if (!conversationContext) {
    throw new Error('conversationContext is required');
  }

  // Ensure policyState Map exists
  if (!conversationContext.policyState) {
    conversationContext.policyState = new Map();
  }

  if (!conversationContext.policyState.has(roomId)) {
    conversationContext.policyState.set(roomId, {
      interventionThreshold: 50,
      interventionHistory: [],
      lastInterventionTime: null,
      adaptationLevel: 'moderate',
    });
  }
  return conversationContext.policyState.get(roomId);
}

/**
 * Update escalation score based on detected patterns
 * @param {Object} conversationContext - Conversation context object
 * @param {string} roomId - Room identifier
 * @param {Object} patterns - Detected conflict patterns
 * @returns {Object} Updated escalation state
 */
function updateEscalationScore(conversationContext, roomId, patterns) {
  const state = initializeEscalationState(conversationContext, roomId);

  // Update pattern counts
  if (patterns.accusatory) {
    state.patternCounts.accusatory++;
    state.escalationScore += ESCALATION.SCORE_INCREMENT;
    state.lastNegativeTime = Date.now();
  }
  if (patterns.triangulation) {
    state.patternCounts.triangulation++;
    state.escalationScore += ESCALATION.SCORE_INCREMENT;
    state.lastNegativeTime = Date.now();
  }
  if (patterns.comparison) {
    state.patternCounts.comparison++;
    state.escalationScore += ESCALATION.SCORE_INCREMENT;
    state.lastNegativeTime = Date.now();
  }
  if (patterns.blaming) {
    state.patternCounts.blaming++;
    state.escalationScore += ESCALATION.SCORE_INCREMENT;
    state.lastNegativeTime = Date.now();
  }

  // Decay escalation score over time (reduce by 1 every 5 minutes)
  const timeSinceLastNegative = state.lastNegativeTime
    ? Date.now() - state.lastNegativeTime
    : Infinity;
  if (timeSinceLastNegative > ESCALATION.DECAY_INTERVAL_MS) {
    state.escalationScore = Math.max(0, state.escalationScore - ESCALATION.SCORE_DECAY);
  }

  return state;
}

/**
 * Update emotional state for a participant
 * @param {Object} conversationContext - Conversation context object
 * @param {string} roomId - Room identifier
 * @param {string} username - Participant username
 * @param {Object} emotionData - Emotion data from AI analysis
 */
function updateEmotionalState(conversationContext, roomId, username, emotionData) {
  const emotionalState = initializeEmotionalState(conversationContext, roomId);

  if (!emotionalState.participants[username]) {
    emotionalState.participants[username] = {
      currentEmotion: 'neutral',
      emotionHistory: [],
      stressLevel: 0,
      stressTrajectory: 'stable',
      emotionalMomentum: 0,
      stressPoints: [],
      recentTriggers: [],
    };
  }

  const participantState = emotionalState.participants[username];

  if (emotionData) {
    participantState.currentEmotion = emotionData.currentEmotion || participantState.currentEmotion;
    participantState.stressLevel = emotionData.stressLevel || participantState.stressLevel;
    participantState.stressTrajectory =
      emotionData.stressTrajectory || participantState.stressTrajectory;
    participantState.emotionalMomentum =
      emotionData.emotionalMomentum || participantState.emotionalMomentum;

    // Track emotion history
    if (emotionData.currentEmotion) {
      participantState.emotionHistory.push({
        timestamp: Date.now(),
        emotion: emotionData.currentEmotion,
        intensity: emotionData.stressLevel || 0,
        triggers: emotionData.triggers || [],
      });
      if (participantState.emotionHistory.length > MESSAGE.MAX_EMOTION_HISTORY) {
        participantState.emotionHistory.shift();
      }
    }

    // Update recent triggers
    if (emotionData.triggers && emotionData.triggers.length > 0) {
      participantState.recentTriggers.push(...emotionData.triggers);
      if (participantState.recentTriggers.length > MESSAGE.MAX_RECENT_TRIGGERS) {
        participantState.recentTriggers = participantState.recentTriggers.slice(
          -MESSAGE.MAX_RECENT_TRIGGERS
        );
      }
    }
  }

  // Update conversation-level emotion
  if (emotionData && emotionData.conversationEmotion) {
    emotionalState.conversationEmotion = emotionData.conversationEmotion;
  }

  // Calculate overall escalation risk
  const allStressLevels = Object.values(emotionalState.participants).map(p => p.stressLevel);
  const avgStress =
    allStressLevels.length > 0
      ? allStressLevels.reduce((a, b) => a + b, 0) / allStressLevels.length
      : 0;
  emotionalState.escalationRisk = avgStress;
  emotionalState.lastUpdated = Date.now();

  return emotionalState;
}

/**
 * Update policy state after intervention
 * @param {Object} conversationContext - Conversation context object
 * @param {string} roomId - Room identifier
 * @param {Object} intervention - Intervention data
 */
function updatePolicyState(conversationContext, roomId, intervention) {
  const policyState = initializePolicyState(conversationContext, roomId);

  policyState.interventionHistory.push({
    timestamp: Date.now(),
    type: (intervention && intervention.type) || 'intervene',
    escalationRisk: (intervention && intervention.escalationRisk) || 'unknown',
    emotionalState: (intervention && intervention.emotionalState) || 'unknown',
  });

  if (policyState.interventionHistory.length > MESSAGE.MAX_INTERVENTION_HISTORY) {
    policyState.interventionHistory.shift();
  }

  policyState.lastInterventionTime = Date.now();

  return policyState;
}

/**
 * Record intervention feedback and adjust threshold
 * @param {Object} conversationContext - Conversation context object
 * @param {string} roomId - Room identifier
 * @param {boolean} helpful - Whether intervention was helpful
 */
function recordInterventionFeedback(conversationContext, roomId, helpful) {
  const policyState = initializePolicyState(conversationContext, roomId);

  if (policyState.interventionHistory.length > 0) {
    const lastIntervention =
      policyState.interventionHistory[policyState.interventionHistory.length - 1];
    lastIntervention.outcome = helpful ? 'helpful' : 'unhelpful';
    lastIntervention.feedback = helpful ? 'User found helpful' : 'User found unhelpful';

    // Adjust threshold based on feedback
    if (!helpful) {
      policyState.interventionThreshold = Math.min(
        ESCALATION.INTERVENTION_THRESHOLD_MAX,
        policyState.interventionThreshold + ESCALATION.INTERVENTION_THRESHOLD_INCREMENT
      );
    } else {
      policyState.interventionThreshold = Math.max(
        ESCALATION.INTERVENTION_THRESHOLD_MIN,
        policyState.interventionThreshold - ESCALATION.INTERVENTION_THRESHOLD_DECREMENT
      );
    }
  }
}

module.exports = {
  initializeEscalationState,
  initializeEmotionalState,
  initializePolicyState,
  updateEscalationScore,
  updateEmotionalState,
  updatePolicyState,
  recordInterventionFeedback,
};
