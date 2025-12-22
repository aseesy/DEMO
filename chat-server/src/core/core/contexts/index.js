/**
 * Context Builder Index
 *
 * Orchestrates all context building modules.
 * Each module has a single responsibility.
 *
 * @module liaizen/core/contexts
 */

const { MESSAGE } = require('../../../utils/constants');
const { getParticipantProfiles } = require('./participantContext');
const {
  buildRoleAwareContext,
  formatRoleAwarePromptSection,
  getDisplayNames,
} = require('./roleContext');
const { buildProfileContext, formatProfileContextForPrompt } = require('./profileContext');
const {
  buildCoparentingContext,
  buildGraphContext,
  buildValuesContext,
} = require('./situationContext');
const {
  buildUserIntelligenceContext,
  buildVoiceSignatureSection,
  buildConversationPatternsSection,
  buildInterventionLearningSection,
} = require('./intelligenceContext');

/**
 * Build all contexts for AI mediation
 *
 * @param {Object} params - Context building parameters
 * @returns {Promise<Object>} All built contexts
 */
async function buildAllContexts({
  message,
  recentMessages,
  participantUsernames,
  existingContacts,
  contactContextForAI,
  roomId,
  taskContextForAI,
  flaggedMessagesContext,
  roleContext,
}) {
  // Get all participant usernames
  const allParticipants = [...new Set([message.username, ...participantUsernames])];

  // Get participant profiles
  const participantProfiles = await getParticipantProfiles(allParticipants);

  // Build message history
  const messageHistory = recentMessages
    .slice(-MESSAGE.RECENT_MESSAGES_COUNT)
    .map(msg => `${msg.username}: ${msg.text}`)
    .join('\n');

  // Build all contexts in parallel where possible
  const [
    roleAwareContext,
    graphContextString,
    valuesContextString,
    userIntelligence,
    voiceSignatureSection,
    interventionLearningSection,
  ] = await Promise.all([
    buildRoleAwareContext(roleContext, recentMessages, message.text),
    buildGraphContext(roleContext, participantProfiles, roomId),
    buildValuesContext(roleContext, participantProfiles, message.text),
    buildUserIntelligenceContext(roleContext, participantProfiles, message.text, roomId),
    buildVoiceSignatureSection(roleContext, recentMessages),
    buildInterventionLearningSection(roleContext),
  ]);

  // Build synchronous contexts
  const profileContext = buildProfileContext(roleContext, participantProfiles);
  const { contextString: coparentingContextString, messageGoal } = buildCoparentingContext(
    roleContext,
    existingContacts,
    message.text
  );
  const conversationPatternsSection = buildConversationPatternsSection(roleContext, recentMessages);

  // Get display names
  const { senderDisplayName, receiverDisplayName } = getDisplayNames(
    roleAwareContext,
    message.username,
    roleContext?.receiverId
  );

  // Format role-aware prompt section
  const roleAwarePromptSection = formatRoleAwarePromptSection(roleAwareContext);

  return {
    participantProfiles,
    messageHistory,
    roleAwareContext,
    profileContext,
    graphContextString,
    valuesContextString,
    userIntelligenceContextString: userIntelligence.senderContext,
    receiverIntelligenceContextString: userIntelligence.receiverContext,
    coparentingContextString,
    messageGoal,
    voiceSignatureSection,
    conversationPatternsSection,
    interventionLearningSection,
    roleAwarePromptSection,
    senderDisplayName,
    receiverDisplayName,
    contactContextForAI,
    taskContextForAI,
    flaggedMessagesContext,
  };
}

module.exports = {
  // Main orchestrator
  buildAllContexts,

  // Re-export individual builders for direct access
  getParticipantProfiles,
  // Deprecated alias - use getParticipantProfiles instead
  fetchParticipantProfiles: getParticipantProfiles,
  buildRoleAwareContext,
  buildProfileContext,
  formatProfileContextForPrompt,
  buildCoparentingContext,
  buildGraphContext,
  buildValuesContext,
  buildUserIntelligenceContext,
  buildVoiceSignatureSection,
  buildConversationPatternsSection,
  buildInterventionLearningSection,
};
