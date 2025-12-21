/**
 * Intervention Recorder
 *
 * Records interventions to profiles and graph database.
 * Handles side effects from AI responses.
 *
 * @module liaizen/core/response/recorder
 */

const libs = require('../libraryLoader');

/**
 * Record intervention to sender's communication profile
 *
 * @param {Object} roleContext - { senderId }
 * @param {Object} result - AI response
 * @param {string} originalText - Original message text
 */
async function recordToProfile(roleContext, result, originalText) {
  if (!libs.communicationProfile || !roleContext?.senderId) {
    return;
  }

  try {
    const dbPostgres = require('../../../../dbPostgres');
    await libs.communicationProfile.recordIntervention(
      roleContext.senderId,
      {
        type: 'intervene',
        escalation_level: result.escalation?.riskLevel,
        original_message: originalText,
      },
      dbPostgres
    );
  } catch (err) {
    console.warn('⚠️ Recorder: Failed to record intervention to profile:', err.message);
  }
}

/**
 * Update graph database metrics
 *
 * @param {Object} roleContext - { senderId, receiverId }
 * @param {Map} participantProfiles - Participant profile map
 * @param {string} roomId - Room ID
 */
async function updateGraphMetrics(roleContext, participantProfiles, roomId) {
  if (!libs.graphContext || !roleContext?.senderId || !roleContext?.receiverId || !roomId) {
    return;
  }

  try {
    const senderProfile = participantProfiles.get(roleContext.senderId.toLowerCase());
    const receiverProfile = participantProfiles.get(roleContext.receiverId.toLowerCase());

    if (senderProfile?.id && receiverProfile?.id) {
      await libs.graphContext.updateMetrics(senderProfile.id, receiverProfile.id, roomId, {
        incrementInterventions: true,
      });
      console.log('📊 Recorder: Updated Neo4j intervention count');
    }
  } catch (err) {
    console.warn('⚠️ Recorder: Failed to update graph metrics:', err.message);
  }
}

/**
 * Record intervention to policy state history
 *
 * @param {Object} policyState - Policy state object
 * @param {Object} result - AI response
 * @param {number} maxHistory - Max history entries
 */
function recordToHistory(policyState, result, maxHistory = 20) {
  if (!policyState) {
    return;
  }

  policyState.interventionHistory.push({
    timestamp: Date.now(),
    type: 'intervene',
    escalationRisk: result.escalation?.riskLevel || 'unknown',
    emotionalState: result.emotion?.currentEmotion || 'unknown',
  });

  if (policyState.interventionHistory.length > maxHistory) {
    policyState.interventionHistory.shift();
  }
}

module.exports = {
  recordToProfile,
  updateGraphMetrics,
  recordToHistory,
};
