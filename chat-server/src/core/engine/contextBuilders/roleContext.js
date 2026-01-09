/**
 * Role Context
 *
 * Builds role-aware mediation context (sender vs receiver).
 *
 * @module liaizen/core/contexts/roleContext
 */

const libs = require('../libraryLoader');
const { defaultLogger } = require('../../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'roleContext' });

/**
 * Build role-aware mediation context
 *
 * @param {Object} roleContext - { senderId, receiverId }
 * @param {Array} recentMessages - Recent conversation messages
 * @param {string} messageText - Current message
 * @returns {Promise<Object|null>} Role-aware context or null
 */
async function buildRoleAwareContext(roleContext, recentMessages, messageText) {
  if (!libs.communicationProfile || !roleContext?.senderId || !roleContext?.receiverId) {
    return null;
  }

  try {
    const dbPostgres = require('../../../../dbPostgres');

    const profiles = await libs.communicationProfile.getProfiles(
      [roleContext.senderId, roleContext.receiverId],
      dbPostgres
    );

    const senderProfile = profiles.get(roleContext.senderId.toLowerCase());
    const receiverProfile = profiles.get(roleContext.receiverId.toLowerCase());

    return libs.communicationProfile.buildMediationContext({
      senderId: roleContext.senderId,
      receiverId: roleContext.receiverId,
      senderProfile,
      receiverProfile,
      messageText,
      recentMessages,
    });
  } catch (err) {
    logger.warn('Failed to build role-aware context', {
      error: err.message,
      senderId: roleContext?.senderId,
      receiverId: roleContext?.receiverId,
    });
    return null;
  }
}

/**
 * Format role-aware context for AI prompt
 *
 * @param {Object} roleAwareContext - Built role context
 * @returns {string} Formatted prompt section
 */
function formatRoleAwarePromptSection(roleAwareContext) {
  if (!roleAwareContext || !libs.communicationProfile) {
    return '';
  }

  try {
    const mediationContext = require('../../profiles/communicationProfile/mediationContext');
    return mediationContext.formatFullContext(roleAwareContext);
  } catch (err) {
    logger.warn('Failed to format role-aware prompt section', {
      error: err.message,
    });
    return '';
  }
}

/**
 * Get display names from role context
 *
 * @param {Object} roleAwareContext - Built role context
 * @param {string} fallbackSender - Fallback sender name
 * @param {string} fallbackReceiver - Fallback receiver name
 * @returns {Object} { senderDisplayName, receiverDisplayName }
 */
function getDisplayNames(roleAwareContext, fallbackSender, fallbackReceiver) {
  return {
    senderDisplayName: roleAwareContext?.roles?.sender?.display_name || fallbackSender,
    receiverDisplayName:
      roleAwareContext?.roles?.receiver?.display_name || fallbackReceiver || 'the other co-parent',
  };
}

module.exports = {
  buildRoleAwareContext,
  formatRoleAwarePromptSection,
  getDisplayNames,
};
