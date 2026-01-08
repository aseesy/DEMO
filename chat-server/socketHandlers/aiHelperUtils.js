/**
 * AI Helper Utilities
 *
 * Common helper functions used across AI mediation flow.
 * Extracted to reduce duplication and improve maintainability.
 */

const { defaultLogger } = require('../src/infrastructure/logging/logger');

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
  const logger = defaultLogger.child({ function: 'updateUserStats' });
  
  try {
    // Validate user object
    if (!user) {
      logger.warn('Cannot update stats: user object is null/undefined');
      return;
    }

    // Use email if available, fallback to username for backward compatibility
    // Note: In the session service, username is actually the email
    const userIdentifier = user.email || user.username;
    if (!userIdentifier) {
      logger.warn('Cannot update stats: user has no email or username', {
        userKeys: Object.keys(user || {}),
        roomId,
        hasRoomId: !!user?.roomId,
      });
      return;
    }

    logger.debug('Looking up user for stats update', {
      hasEmail: !!user.email,
      hasUsername: !!user.username,
      roomId,
      intervened,
      // Don't log email - PII
    });

    const userResult = await dbSafe.safeSelect(
      'users',
      { email: userIdentifier.toLowerCase() },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);
    
    logger.debug('User lookup result for stats', {
      found: users.length > 0,
      userId: users.length > 0 ? users[0].id : null,
      // Don't log email - PII
    });
    
    if (users.length > 0) {
      await communicationStats.updateCommunicationStats(users[0].id, roomId, intervened);
      logger.debug('Updated communication stats', {
        userId: users[0].id,
        roomId,
        intervened,
      });
    } else {
      logger.warn('User not found for stats update', {
        hasEmail: !!user.email,
        hasUsername: !!user.username,
        roomId: user.roomId,
        // Don't log email - PII
      });
    }
  } catch (err) {
    logger.error('Error updating stats', err, {
      hasEmail: !!user?.email,
      hasUsername: !!user?.username,
      roomId: user?.roomId,
      intervened,
      errorCode: err.code,
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
 * @param {Object} message - Optional message object (for thread context)
 * @returns {Promise<Object>} Context object with all gathered data
 */
async function gatherAnalysisContext(services, user, roomId, message = null) {
  // Import helpers here to avoid circular dependency
  const {
    getRecentMessages,
    getParticipantUsernames,
    getContactContext,
    getTaskContext,
    getFlaggedContext,
    getThreadContext,
  } = require('./aiContextHelper');

  const { dbPostgres, dbSafe, userSessionService } = services;

  // Gather all context in parallel for better performance
  const [recentMessages, participantUsernames, taskContext, flaggedContext, threadContext] = await Promise.all([
    getRecentMessages(dbPostgres, roomId),
    getParticipantUsernames(dbSafe, roomId, userSessionService),
    getTaskContext(services, user),
    getFlaggedContext(services, user),
    message ? getThreadContext(services, message) : Promise.resolve(null),
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
    threadContext, // Add thread context
  };
}

module.exports = {
  updateUserStats,
  sendMessageDirectly,
  gatherAnalysisContext,
};
