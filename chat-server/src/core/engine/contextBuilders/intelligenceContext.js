/**
 * Intelligence Context
 *
 * Builds user intelligence, voice signatures, and conversation patterns.
 * Handles passive learning from conversations.
 *
 * @module liaizen/core/contexts/intelligenceContext
 */

const libs = require('../libraryLoader');
const { defaultLogger } = require('../../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'intelligenceContext' });

/**
 * Build user intelligence context (passive learning)
 *
 * @param {Object} roleContext - { senderId, receiverId }
 * @param {Map} participantProfiles - Pre-fetched profiles
 * @param {string} messageText - Current message
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} { senderContext, receiverContext }
 */
async function buildUserIntelligenceContext(roleContext, participantProfiles, messageText, roomId) {
  if (!libs.userIntelligence || !roleContext?.senderId) {
    return { senderContext: '', receiverContext: '' };
  }

  let senderContext = '';
  let receiverContext = '';

  try {
    const senderProfile = participantProfiles.get(roleContext.senderId.toLowerCase());

    if (senderProfile?.id) {
      // Learn from this message
      await libs.userIntelligence.learnFromMessage(senderProfile.id, messageText, roomId);

      // Get formatted context
      senderContext =
        (await libs.userIntelligence.formatForAI(senderProfile.id, messageText)) || '';

      if (senderContext) {
        logger.debug('User intelligence loaded for sender', {
          senderId: senderProfile.id,
        });
      }
    }

    // Load receiver intelligence for better attunement
    if (roleContext?.receiverId) {
      const receiverProfile = participantProfiles.get(roleContext.receiverId.toLowerCase());
      if (receiverProfile?.id) {
        receiverContext =
          (await libs.userIntelligence.formatForReceiverAI(receiverProfile.id, messageText)) || '';

        if (receiverContext) {
          logger.debug('Receiver intelligence loaded', {
            receiverId: receiverProfile.id,
          });
        }
      }
    }
  } catch (err) {
    logger.warn('Failed to build user intelligence context', {
      error: err.message,
      senderId: roleContext?.senderId,
      receiverId: roleContext?.receiverId,
    });
  }

  return { senderContext, receiverContext };
}

/**
 * Build voice signature section for sender
 *
 * @param {Object} roleContext - { senderId }
 * @param {Array} recentMessages - Recent messages
 * @returns {Promise<string>} Voice signature prompt section
 */
async function buildVoiceSignatureSection(roleContext, recentMessages) {
  if (!libs.voiceSignature || !libs.communicationProfile || !roleContext?.senderId) {
    return '';
  }

  try {
    const senderMessages = recentMessages
      .filter(msg => msg.username === roleContext.senderId)
      .slice(-20)
      .map(msg => msg.text);

    if (senderMessages.length < 3) {
      return '';
    }

    const signature = libs.voiceSignature.buildVoiceSignature(senderMessages);
    const section = libs.voiceSignature.formatVoiceSignatureForAI(signature);

    // Update profile with voice signature (async, non-blocking)
    if (signature.sample_count >= 5) {
      updateVoiceSignatureInProfile(roleContext.senderId, signature);
    }

    return section;
  } catch (err) {
    logger.warn('Voice signature extraction failed', {
      error: err.message,
      senderId: roleContext?.senderId,
    });
    return '';
  }
}

/**
 * Update voice signature in user profile (non-blocking)
 */
function updateVoiceSignatureInProfile(senderId, signature) {
  const dbPostgres = require('../../../../dbPostgres');

  libs.communicationProfile
    .getProfile(senderId, dbPostgres)
    .then(senderProfile => {
      if (senderProfile) {
        const existingPatterns = senderProfile.communication_patterns || {};
        const updatedPatterns = libs.voiceSignature.mergeVoiceSignature(
          existingPatterns,
          signature
        );
        return libs.communicationProfile.updateProfile(
          senderId,
          { communication_patterns: updatedPatterns },
          dbPostgres
        );
      }
    })
    .catch(err => {
      logger.warn('Failed to update voice signature in profile', {
        error: err.message,
        senderId,
      });
    });
}

/**
 * Build conversation patterns section
 *
 * @param {Object} roleContext - { senderId, receiverId }
 * @param {Array} recentMessages - Recent messages
 * @returns {string} Conversation patterns prompt section
 */
function buildConversationPatternsSection(roleContext, recentMessages) {
  if (!libs.conversationPatterns || !roleContext?.senderId || !roleContext?.receiverId) {
    return '';
  }

  if (recentMessages.length < 2) {
    return '';
  }

  try {
    const patterns = libs.conversationPatterns.analyzeConversationPatterns(
      recentMessages,
      roleContext.senderId,
      roleContext.receiverId
    );

    if (patterns.sample_size >= 2) {
      return libs.conversationPatterns.formatPatternsForAI(patterns);
    }
  } catch (err) {
    logger.warn('Conversation pattern analysis failed', {
      error: err.message,
      senderId: roleContext?.senderId,
      receiverId: roleContext?.receiverId,
      messageCount: recentMessages.length,
    });
  }

  return '';
}

/**
 * Build intervention learning section
 *
 * @param {Object} roleContext - { senderId }
 * @returns {Promise<string>} Intervention learning prompt section
 */
async function buildInterventionLearningSection(roleContext) {
  if (!libs.interventionLearning || !roleContext?.senderId) {
    return '';
  }

  try {
    const dbPostgres = require('../../../../dbPostgres');
    const learningData = await libs.interventionLearning.getInterventionLearning(
      roleContext.senderId,
      dbPostgres
    );

    if (learningData?.successful_interventions?.length > 0) {
      return libs.interventionLearning.formatLearningForAI(learningData);
    }
  } catch (err) {
    logger.warn('Failed to load intervention learning', {
      error: err.message,
      senderId: roleContext?.senderId,
    });
  }

  return '';
}

module.exports = {
  buildUserIntelligenceContext,
  buildVoiceSignatureSection,
  buildConversationPatternsSection,
  buildInterventionLearningSection,
};
