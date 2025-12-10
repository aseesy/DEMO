/**
 * State Manager - Conversation State Management
 * 
 * Manages escalation, emotional, and policy state for conversations.
 * Handles state initialization, updates, and decay.
 * 
 * @module src/liaizen/core/stateManager
 */

const { ESCALATION, MESSAGE } = require('../../utils/constants');

// Shared conversation context (imported from mediator.js)
// This will be passed in as a parameter to avoid circular dependencies
let conversationContext = null;

/**
 * Initialize state manager with conversation context
 * @param {Object} context - Conversation context object from mediator
 */
function initialize(context) {
  conversationContext = context;
}

/**
 * Initialize escalation state for a room
 * @param {string} roomId - Room identifier
 * @returns {Object} Escalation state object
 */
function initializeEscalationState(roomId) {
  if (!conversationContext) {
    throw new Error('StateManager not initialized. Call initialize() first.');
  }

  if (!conversationContext.escalationState.has(roomId)) {
    conversationContext.escalationState.set(roomId, {
      escalationScore: 0,
      lastNegativeTime: null,
      patternCounts: {
        accusatory: 0,
        triangulation: 0,
        comparison: 0,
        blaming: 0
      }
    });
  }
  return conversationContext.escalationState.get(roomId);
}

/**
 * Initialize emotional state for a room
 * @param {string} roomId - Room identifier
 * @returns {Object} Emotional state object
 */
function initializeEmotionalState(roomId) {
  if (!conversationContext) {
    throw new Error('StateManager not initialized. Call initialize() first.');
  }

  if (!conversationContext.emotionalState.has(roomId)) {
    conversationContext.emotionalState.set(roomId, {
      participants: {},
      conversationEmotion: 'neutral',
      escalationRisk: 0,
      lastUpdated: Date.now()
    });
  }
  return conversationContext.emotionalState.get(roomId);
}

/**
 * Initialize policy state for a room
 * @param {string} roomId - Room identifier
 * @returns {Object} Policy state object
 */
function initializePolicyState(roomId) {
  if (!conversationContext) {
    throw new Error('StateManager not initialized. Call initialize() first.');
  }

  if (!conversationContext.policyState.has(roomId)) {
    conversationContext.policyState.set(roomId, {
      interventionThreshold: 50,
      interventionHistory: [],
      lastInterventionTime: null,
      adaptationLevel: 'moderate'
    });
  }
  return conversationContext.policyState.get(roomId);
}

/**
 * Update escalation score based on detected patterns
 * @param {string} roomId - Room identifier
 * @param {Object} patterns - Detected conflict patterns
 * @returns {Object} Updated escalation state
 */
function updateEscalationScore(roomId, patterns) {
  const state = initializeEscalationState(roomId);

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
 * @param {string} roomId - Room identifier
 * @param {string} username - Participant username
 * @param {Object} emotionData - Emotion data from AI analysis
 */
function updateEmotionalState(roomId, username, emotionData) {
  const emotionalState = initializeEmotionalState(roomId);

  if (!emotionalState.participants[username]) {
    emotionalState.participants[username] = {
      currentEmotion: 'neutral',
      emotionHistory: [],
      stressLevel: 0,
      stressTrajectory: 'stable',
      emotionalMomentum: 0,
      stressPoints: [],
      recentTriggers: []
    };
  }

  const participantState = emotionalState.participants[username];

  if (emotionData) {
    participantState.currentEmotion = emotionData.currentEmotion || participantState.currentEmotion;
    participantState.stressLevel = emotionData.stressLevel || participantState.stressLevel;
    participantState.stressTrajectory = emotionData.stressTrajectory || participantState.stressTrajectory;
    participantState.emotionalMomentum = emotionData.emotionalMomentum || participantState.emotionalMomentum;

    // Track emotion history
    if (emotionData.currentEmotion) {
      participantState.emotionHistory.push({
        timestamp: Date.now(),
        emotion: emotionData.currentEmotion,
        intensity: emotionData.stressLevel || 0,
        triggers: emotionData.triggers || []
      });
      if (participantState.emotionHistory.length > MESSAGE.MAX_EMOTION_HISTORY) {
        participantState.emotionHistory.shift();
      }
    }

    // Update recent triggers
    if (emotionData.triggers && emotionData.triggers.length > 0) {
      participantState.recentTriggers.push(...emotionData.triggers);
      if (participantState.recentTriggers.length > MESSAGE.MAX_RECENT_TRIGGERS) {
        participantState.recentTriggers = participantState.recentTriggers.slice(-MESSAGE.MAX_RECENT_TRIGGERS);
      }
    }
  }

  // Update conversation-level emotion
  if (emotionData && emotionData.conversationEmotion) {
    emotionalState.conversationEmotion = emotionData.conversationEmotion;
  }

  // Calculate overall escalation risk
  const allStressLevels = Object.values(emotionalState.participants).map(p => p.stressLevel);
  const avgStress = allStressLevels.length > 0
    ? allStressLevels.reduce((a, b) => a + b, 0) / allStressLevels.length
    : 0;
  emotionalState.escalationRisk = avgStress;
  emotionalState.lastUpdated = Date.now();

  return emotionalState;
}

/**
 * Update policy state after intervention
 * @param {string} roomId - Room identifier
 * @param {Object} intervention - Intervention data
 */
function updatePolicyState(roomId, intervention) {
  const policyState = initializePolicyState(roomId);

  policyState.interventionHistory.push({
    timestamp: Date.now(),
    type: (intervention && intervention.type) || 'intervene',
    escalationRisk: (intervention && intervention.escalationRisk) || 'unknown',
    emotionalState: (intervention && intervention.emotionalState) || 'unknown'
  });

  if (policyState.interventionHistory.length > MESSAGE.MAX_INTERVENTION_HISTORY) {
    policyState.interventionHistory.shift();
  }

  policyState.lastInterventionTime = Date.now();

  return policyState;
}

/**
 * Record intervention feedback and adjust threshold
 * @param {string} roomId - Room identifier
 * @param {boolean} helpful - Whether intervention was helpful
 */
function recordInterventionFeedback(roomId, helpful) {
  const policyState = initializePolicyState(roomId);

  if (policyState.interventionHistory.length > 0) {
    const lastIntervention = policyState.interventionHistory[policyState.interventionHistory.length - 1];
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
  initialize,
  initializeEscalationState,
  initializeEmotionalState,
  initializePolicyState,
  updateEscalationScore,
  updateEmotionalState,
  updatePolicyState,
  recordInterventionFeedback,
};

