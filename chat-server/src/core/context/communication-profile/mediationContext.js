/**
 * Mediation Context Builder
 *
 * Builds role-aware context for AI mediation.
 * Distinguishes sender from receiver with separate profile formatting.
 *
 * Key Principle: "I am helping THIS person send a better message to THAT person"
 *
 * Feature: 002-sender-profile-mediation
 */

const temporalDecay = require('./temporalDecay');

/**
 * Build complete mediation context with sender/receiver distinction
 * @param {Object} params - Context parameters
 * @param {string} params.senderId - Sender's user ID
 * @param {string} params.receiverId - Receiver's user ID
 * @param {Object} params.senderProfile - Sender's communication profile
 * @param {Object} params.receiverProfile - Receiver's communication profile (read-only context)
 * @param {string} params.messageText - The message being sent
 * @param {Array} params.recentMessages - Recent conversation history
 * @returns {Object} - Structured mediation context
 */
function buildContext(params) {
  const {
    senderId,
    receiverId,
    senderProfile,
    receiverProfile,
    messageText,
    recentMessages = [],
  } = params;

  // Get decayed patterns for both users
  const senderPatterns = temporalDecay.getDecayedPatterns(senderProfile);
  const receiverPatterns = temporalDecay.getDecayedPatterns(receiverProfile);

  return {
    // Role identification (critical for AI prompt)
    roles: {
      sender: {
        id: senderId,
        display_name: senderProfile?.display_name || senderId,
      },
      receiver: {
        id: receiverId,
        display_name: receiverProfile?.display_name || receiverId,
      },
    },

    // Sender context (full details - this is who we're coaching)
    sender: {
      profile: senderPatterns,
      intervention_stats: senderProfile?.intervention_history || {},
      recent_accepted_rewrites: (senderPatterns?.successful_rewrites || []).slice(0, 5),
      coaching_notes: buildCoachingNotes(senderPatterns),
    },

    // Receiver context (read-only - for awareness, not coaching)
    receiver: {
      known_triggers: receiverPatterns?.triggers || { topics: [], phrases: [] },
      communication_style: receiverPatterns?.tone_tendencies || [],
      // Note: We don't include receiver's intervention history - not relevant
    },

    // Current message
    message: {
      text: messageText,
      length: messageText?.length || 0,
    },

    // Conversation context
    conversation: {
      recent_messages: recentMessages.slice(-10),
      message_count: recentMessages.length,
    },

    // Metadata
    meta: {
      sender_profile_fresh: !senderPatterns?.is_stale,
      receiver_profile_fresh: !receiverPatterns?.is_stale,
      context_version: 1,
      built_at: new Date().toISOString(),
    },
  };
}

/**
 * Build coaching notes based on sender's patterns
 * @param {Object} patterns - Decayed sender patterns
 * @returns {Array<string>} - Coaching notes for AI
 */
function buildCoachingNotes(patterns) {
  const notes = [];

  if (!patterns) return notes;

  // Note high trigger intensity
  if (patterns.triggers?.intensity > 0.7) {
    notes.push('Sender has high sensitivity to conflict triggers');
  }

  // Note acceptance rate
  if (patterns.acceptance_rate > 0.8) {
    notes.push('Sender typically accepts AI suggestions (receptive to coaching)');
  } else if (patterns.acceptance_rate < 0.3 && patterns.acceptance_rate > 0) {
    notes.push('Sender often rejects AI suggestions (adjust approach)');
  }

  // Note successful patterns
  if (patterns.successful_rewrites?.length > 5) {
    notes.push('Sender has history of successful communication improvements');
  }

  // Note if profile is stale
  if (patterns.is_stale) {
    notes.push('Profile data is older - patterns may have changed');
  }

  return notes;
}

/**
 * Format sender context as a string for AI prompt
 * @param {Object} context - Mediation context from buildContext()
 * @returns {string} - Formatted string for AI prompt
 */
function formatSenderContext(context) {
  if (!context?.sender) return '';

  const sender = context.sender;
  const profile = sender.profile || {};
  const stats = sender.intervention_stats || {};

  const parts = [];

  // Identity
  parts.push(`SENDER: ${context.roles?.sender?.display_name || 'Unknown'}`);

  // Communication patterns
  if (profile.tone_tendencies?.length > 0) {
    parts.push(`Typical tone: ${profile.tone_tendencies.join(', ')}`);
  }

  // Triggers (what stresses this sender)
  if (profile.triggers?.topics?.length > 0) {
    parts.push(`Sensitive topics for sender: ${profile.triggers.topics.join(', ')}`);
  }
  if (profile.triggers?.phrases?.length > 0) {
    parts.push(`Triggering phrases for sender: ${profile.triggers.phrases.slice(0, 3).join(', ')}`);
  }

  // Intervention history
  if (stats.total_interventions > 0) {
    parts.push(
      `AI interventions: ${stats.total_interventions} total, ${((stats.acceptance_rate || 0) * 100).toFixed(0)}% accepted`
    );
  }

  // Recent successful rewrites (what worked before)
  if (sender.recent_accepted_rewrites?.length > 0) {
    const example = sender.recent_accepted_rewrites[0];
    parts.push(
      `Recent successful rewrite: "${example.original?.substring(0, 30)}..." → "${example.rewrite?.substring(0, 30)}..."`
    );
  }

  // Coaching notes
  if (sender.coaching_notes?.length > 0) {
    parts.push(`Notes: ${sender.coaching_notes.join('; ')}`);
  }

  return parts.join('\n');
}

/**
 * Format receiver context as a string for AI prompt
 * (Read-only awareness - we don't coach the receiver)
 * @param {Object} context - Mediation context from buildContext()
 * @returns {string} - Formatted string for AI prompt
 */
function formatReceiverContext(context) {
  if (!context?.receiver) return '';

  const receiver = context.receiver;
  const parts = [];

  // Identity
  parts.push(`RECEIVER: ${context.roles?.receiver?.display_name || 'Unknown'}`);

  // Known triggers (so sender can avoid them)
  if (receiver.known_triggers?.topics?.length > 0) {
    parts.push(`Receiver is sensitive to: ${receiver.known_triggers.topics.join(', ')}`);
  }

  // Communication style (so sender can adapt)
  if (receiver.communication_style?.length > 0) {
    parts.push(`Receiver prefers: ${receiver.communication_style.join(', ')} communication`);
  }

  return parts.join('\n');
}

/**
 * Build the complete AI prompt context section
 * @param {Object} context - Mediation context from buildContext()
 * @returns {string} - Complete context section for AI prompt
 */
function formatFullContext(context) {
  const senderContext = formatSenderContext(context);
  const receiverContext = formatReceiverContext(context);

  return `
=== ROLE-AWARE MEDIATION CONTEXT ===
You are helping ${context.roles?.sender?.display_name || 'the sender'} send a better message to ${context.roles?.receiver?.display_name || 'the receiver'}.

${senderContext}

${receiverContext}

IMPORTANT: Your coaching is for the SENDER only. Address only "${context.roles?.sender?.display_name || 'the sender'}" using "you/your".
Never use "we/us/our/both" - you are not part of their relationship.
=== END CONTEXT ===
`.trim();
}

module.exports = {
  buildContext,
  formatSenderContext,
  formatReceiverContext,
  formatFullContext,
  buildCoachingNotes,
};
