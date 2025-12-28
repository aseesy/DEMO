/**
 * AI Helper Utilities
 *
 * Common helper functions used across AI mediation flow.
 * Extracted to reduce duplication and improve maintainability.
 */

/**
 * Update communication stats for a user
 * @param {Object} services - Service container
 * @param {Object} user - User object with username
 * @param {string} roomId - Room ID
 * @param {boolean} intervened - Whether AI intervened
 * @returns {Promise<void>}
 */
async function updateUserStats(services, user, roomId, intervened) {
  const { dbSafe, communicationStats } = services;
  try {
    const userResult = await dbSafe.safeSelect(
      'users',
      { username: user.username.toLowerCase() },
      { limit: 1 }
    );
    if (userResult.length > 0) {
      await communicationStats.updateCommunicationStats(userResult[0].id, roomId, intervened);
    }
  } catch (err) {
    console.error('[aiHelper] Error updating stats:', err);
    // Non-fatal - continue even if stats update fails
  }
}

/**
 * Send message directly without AI analysis
 * Used when bypassing mediation or when services are unavailable
 * @param {Object} message - Message object
 * @param {string} roomId - Room ID
 * @param {Object} io - Socket.io server
 * @param {Function} addToHistory - Callback to persist message
 * @param {Object} options - Additional options
 * @param {boolean} options.isRevision - Whether this is a revision
 * @param {boolean} options.bypassedMediation - Whether mediation was bypassed
 * @returns {Promise<void>}
 */
async function sendMessageDirectly(message, roomId, io, addToHistory, options = {}) {
  if (options.isRevision) {
    message.isRevision = true;
  }
  if (options.bypassedMediation) {
    message.bypassedMediation = true;
  }

  await addToHistory(message, roomId);
  io.to(roomId).emit('new_message', message);
}

/**
 * Gather all context needed for AI analysis
 * @param {Object} services - Service container
 * @param {Object} user - User object
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Context object with all gathered data
 */
async function gatherAnalysisContext(services, user, roomId) {
  // Import helpers here to avoid circular dependency
  const {
    getRecentMessages,
    getParticipantUsernames,
    getContactContext,
    getTaskContext,
    getFlaggedContext,
  } = require('./aiContextHelper');

  const { dbPostgres, dbSafe, userSessionService } = services;

  // Gather all context in parallel for better performance
  const [recentMessages, participantUsernames, taskContext, flaggedContext] = await Promise.all([
    getRecentMessages(dbPostgres, roomId),
    getParticipantUsernames(dbSafe, roomId, userSessionService),
    getTaskContext(services, user),
    getFlaggedContext(services, user),
  ]);

  // Get contact context with actual participants (needs participants first)
  const contactContext = await getContactContext(services, user, participantUsernames);

  // Build role context
  const otherParticipants = participantUsernames.filter(
    u => u.toLowerCase() !== user.username.toLowerCase()
  );
  const roleContext = {
    senderId: user.username.toLowerCase(),
    receiverId: otherParticipants.length > 0 ? otherParticipants[0].toLowerCase() : null,
  };

  return {
    recentMessages,
    participantUsernames,
    contactContext,
    taskContext,
    flaggedContext,
    roleContext,
  };
}

module.exports = {
  updateUserStats,
  sendMessageDirectly,
  gatherAnalysisContext,
};
