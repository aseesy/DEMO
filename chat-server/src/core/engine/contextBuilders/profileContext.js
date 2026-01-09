/**
 * Profile Context
 *
 * Builds comprehensive profile context for empathetic AI coaching.
 *
 * @module liaizen/core/contexts/profileContext
 */

const libs = require('../libraryLoader');
const { defaultLogger } = require('../../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'profileContext' });

/**
 * Build comprehensive profile context
 *
 * @param {Object} roleContext - { senderId, receiverId }
 * @param {Map} participantProfiles - Pre-fetched profiles
 * @returns {Object|null} Profile context with combined summary
 */
function buildProfileContext(roleContext, participantProfiles) {
  if (!libs.profileHelpers || !roleContext?.senderId || !roleContext?.receiverId) {
    return null;
  }

  try {
    const senderUsername = roleContext.senderId.toLowerCase();
    const receiverUsername = roleContext.receiverId.toLowerCase();

    let senderProfile = participantProfiles.get(senderUsername);
    let receiverProfile = participantProfiles.get(receiverUsername);

    // Decrypt sensitive fields for AI context building
    if (senderProfile) {
      senderProfile = libs.profileHelpers.decryptSensitiveFields(senderProfile);
    }
    if (receiverProfile) {
      receiverProfile = libs.profileHelpers.decryptSensitiveFields(receiverProfile);
    }

    return libs.profileHelpers.buildDualProfileContext(senderProfile, receiverProfile);
  } catch (err) {
    logger.warn('Failed to build profile context', {
      error: err.message,
      senderId: roleContext?.senderId,
      receiverId: roleContext?.receiverId,
    });
    return null;
  }
}

/**
 * Format profile context for AI prompt
 *
 * @param {Object} profileContext - Built profile context
 * @returns {string} Formatted prompt section
 */
function formatProfileContextForPrompt(profileContext) {
  if (!profileContext?.combinedSummary) {
    return '';
  }

  return `\n\n=== PARTICIPANT CONTEXT (for empathetic coaching) ===
${profileContext.combinedSummary}

COACHING GUIDANCE: Use this context to provide more understanding coaching. If a sender is under financial stress, be gentle when coaching messages about expenses. If someone is in recovery, be mindful about discussions involving substances. This context helps you coach with empathy.`;
}

module.exports = {
  buildProfileContext,
  formatProfileContextForPrompt,
};
