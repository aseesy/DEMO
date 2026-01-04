/**
 * Context Builder Index
 *
 * Orchestrates all context building modules.
 * Each module has a single responsibility.
 *
 * @module liaizen/core/contexts
 */

const { MESSAGE } = require('../../../infrastructure/config/constants');
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

  // Get display names - prefer contact_name from contacts, then first_name from profile, fallback to username
  // Contacts may have relationship names like "Dad" or "Mom" which are preferred
  const senderProfile = participantProfiles.get(message.username?.toLowerCase());
  const receiverProfile = participantProfiles.get(roleContext?.receiverId?.toLowerCase());

  // Try to get display name from contacts first (contact_name might be "Dad" or "Mom")
  // existingContacts are the sender's contacts, so we can find how the sender refers to the receiver
  let receiverContactName = null;
  if (existingContacts && roleContext?.receiverId) {
    // Get receiver user ID if available from profile (for linked_user_id matching)
    const receiverUserId = receiverProfile?.id;
    const receiverIdLower = roleContext.receiverId.toString().toLowerCase();

    // Find the contact where receiver is the co-parent
    // Match by linked_user_id (user ID) or contact_email (email/username)
    const receiverContact = existingContacts.find(c => {
      const isCoParent =
        c.relationship === 'co-parent' ||
        c.relationship === 'My Co-Parent' ||
        c.relationship === 'coparent';

      if (!isCoParent) return false;

      // Match by linked_user_id if available (links to user ID)
      // Check against receiver user ID from profile
      if (c.linked_user_id && receiverUserId && c.linked_user_id === receiverUserId) {
        return true;
      }

      // Also check if receiverId is a numeric string matching linked_user_id
      if (c.linked_user_id) {
        const linkedUserIdStr = c.linked_user_id.toString();
        if (linkedUserIdStr === roleContext.receiverId.toString()) return true;
      }

      // Match by contact_email (might be email or username)
      if (c.contact_email) {
        const contactEmailLower = c.contact_email.toLowerCase();
        if (contactEmailLower === receiverIdLower) return true;
      }

      return false;
    });
    receiverContactName = receiverContact?.contact_name;
  }

  // Fallback chain: contact_name > first_name > username
  const senderFirstName = senderProfile?.first_name?.split(' ')[0];
  const receiverFirstName = receiverProfile?.first_name?.split(' ')[0];
  const senderFallback = senderFirstName || message.username;
  const receiverFallback = receiverContactName || receiverFirstName || roleContext?.receiverId;

  const { senderDisplayName, receiverDisplayName } = getDisplayNames(
    roleAwareContext,
    senderFallback,
    receiverFallback
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
