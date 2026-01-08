/**
 * Context Builder Index
 *
 * Orchestrates all context building modules.
 * Each module has a single responsibility.
 *
 * @module liaizen/core/contexts
 */

const { MESSAGE } = require('../../../infrastructure/config/constants');
const { isEnabled } = require('../../../infrastructure/config/featureFlags');
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
const { buildDualBrainContext, updateDualBrainFromMessage } = require('./dualBrainContext');

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

  // Build enriched message history with situation awareness
  // Include timestamps and extract key situational details for better context
  const messageHistory = recentMessages
    .slice(-MESSAGE.RECENT_MESSAGES_COUNT)
    .map((msg, index) => {
      // Add sequence markers for flow awareness
      const sequence =
        index === 0 ? '[Most Recent]' : index === recentMessages.length - 1 ? '[Earlier]' : '';
      const timestamp = msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';
      const timePrefix = timestamp ? `[${timestamp}]` : '';
      return `${timePrefix} ${sequence} ${msg.username}: ${msg.text}`.trim();
    })
    .join('\n');

  // Get sender and receiver user IDs for dual-brain context
  const senderProfile = participantProfiles.get(roleContext?.senderId?.toLowerCase());
  const receiverProfileForIds = participantProfiles.get(roleContext?.receiverId?.toLowerCase());
  const senderUserId = senderProfile?.id;
  const receiverUserId = receiverProfileForIds?.id;

  // Build all contexts in parallel where possible
  // Experimental contexts are only built if feature flags are enabled
  const [
    roleAwareContext,
    graphContextString,
    valuesContextString,
    userIntelligence,
    voiceSignatureSection,
    interventionLearningSection,
    dualBrainContext,
  ] = await Promise.all([
    buildRoleAwareContext(roleContext, recentMessages, message.text),
    isEnabled('GRAPH_CONTEXT') ? buildGraphContext(roleContext, participantProfiles, roomId) : null,
    isEnabled('VALUES_CONTEXT')
      ? buildValuesContext(roleContext, participantProfiles, message.text)
      : null,
    isEnabled('USER_INTELLIGENCE')
      ? buildUserIntelligenceContext(roleContext, participantProfiles, message.text, roomId)
      : null,
    isEnabled('VOICE_SIGNATURE') ? buildVoiceSignatureSection(roleContext, recentMessages) : null,
    isEnabled('INTERVENTION_LEARNING') ? buildInterventionLearningSection(roleContext) : null,
    isEnabled('DUAL_BRAIN_CONTEXT') && senderUserId
      ? buildDualBrainContext(message.text, senderUserId, receiverUserId, roomId)
      : null,
  ]);

  // Build synchronous contexts
  const profileContext = buildProfileContext(roleContext, participantProfiles);
  const { contextString: coparentingContextString, messageGoal } = buildCoparentingContext(
    roleContext,
    existingContacts,
    message.text
  );
  const conversationPatternsSection = isEnabled('CONVERSATION_PATTERNS')
    ? buildConversationPatternsSection(roleContext, recentMessages)
    : null;

  // Get display names - prefer contact_name from contacts, then first_name from profile, fallback to username
  // Contacts may have relationship names like "Dad" or "Mom" which are preferred
  // Note: senderProfile and receiverProfileForIds already defined above for dual-brain context
  const senderProfileForDisplay = participantProfiles.get(message.username?.toLowerCase());
  const receiverProfile = participantProfiles.get(roleContext?.receiverId?.toLowerCase());

  // Try to get display name from contacts first (contact_name might be "Dad" or "Mom")
  // existingContacts are the sender's contacts, so we can find how the sender refers to the receiver
  let receiverContactName = null;
  if (existingContacts && roleContext?.receiverId) {
    // Get receiver user ID if available from profile (for linked_user_id matching)
    const receiverUserIdForContact = receiverProfile?.id;
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
      if (
        c.linked_user_id &&
        receiverUserIdForContact &&
        c.linked_user_id === receiverUserIdForContact
      ) {
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
  const senderFirstName = senderProfileForDisplay?.first_name?.split(' ')[0];
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
    // Dual-Brain AI Mediator context
    dualBrainContext,
    dualBrainContextString: dualBrainContext?.synthesis?.promptSection || '',
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
  // Dual-Brain AI Mediator
  buildDualBrainContext,
  updateDualBrainFromMessage,
};
