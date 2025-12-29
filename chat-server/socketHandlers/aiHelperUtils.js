/**
 * AI Helper Utilities
 *
 * Common helper functions used across AI mediation flow.
 * Extracted to reduce duplication and improve maintainability.
 */

/**
 * Update communication stats for a user
 * @param {Object} services - Service container
 * @param {Object} user - User object with email or username (for backward compatibility)
 * @param {string} roomId - Room ID
 * @param {boolean} intervened - Whether AI intervened
 * @returns {Promise<void>}
 */
async function updateUserStats(services, user, roomId, intervened) {
  const { dbSafe, communicationStats } = services;
  try {
    // Validate user object
    if (!user) {
      console.warn('[aiHelper] Cannot update stats: user object is null/undefined');
      return;
    }

    // Log user object structure for debugging
    console.log('[aiHelper] updateUserStats called:', {
      userKeys: Object.keys(user),
      hasEmail: !!user.email,
      hasUsername: !!user.username,
      email: user.email,
      username: user.username,
      roomId,
      intervened,
    });

    // Use email if available, fallback to username for backward compatibility
    // Note: In the session service, username is actually the email
    const userIdentifier = user.email || user.username;
    if (!userIdentifier) {
      console.warn('[aiHelper] Cannot update stats: user has no email or username', {
        userKeys: Object.keys(user || {}),
        roomId,
        userObject: user,
      });
      return;
    }

    console.log('[aiHelper] Looking up user by email:', userIdentifier.toLowerCase());
    const userResult = await dbSafe.safeSelect(
      'users',
      { email: userIdentifier.toLowerCase() },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);
    
    console.log('[aiHelper] User lookup result:', {
      found: users.length > 0,
      userId: users.length > 0 ? users[0].id : null,
      email: userIdentifier.toLowerCase(),
    });
    
    if (users.length > 0) {
      await communicationStats.updateCommunicationStats(users[0].id, roomId, intervened);
      console.log(`[aiHelper] ✅ Updated stats for user ${users[0].id} in room ${roomId}, intervention: ${intervened}`);
    } else {
      console.warn(`[aiHelper] ❌ User not found for stats update: ${userIdentifier}`, {
        userObject: { email: user.email, username: user.username, roomId: user.roomId },
        searchedEmail: userIdentifier.toLowerCase(),
      });
    }
  } catch (err) {
    console.error('[aiHelper] ❌ Error updating stats:', err, {
      user: user ? { email: user.email, username: user.username, roomId: user.roomId } : null,
      roomId,
      intervened,
      errorMessage: err.message,
      errorStack: err.stack,
    });
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
  const userEmail = user.email || user.username; // Fallback for backward compatibility
  const otherParticipants = participantUsernames.filter(
    u => u.toLowerCase() !== userEmail.toLowerCase()
  );
  const roleContext = {
    senderId: userEmail.toLowerCase(),
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
