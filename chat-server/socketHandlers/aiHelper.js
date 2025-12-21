/**
 * AI Mediation Helper for Socket Messages
 *
 * Refactored to use options objects instead of many positional parameters.
 * See: Clean Code - "How Many Arguments?" (niladic > monadic > dyadic > triadic)
 */
const stringSimilarity = require('string-similarity');
const {
  getRecentMessages,
  getParticipantUsernames,
  getContactContext,
  getTaskContext,
  getFlaggedContext,
} = require('./aiContextHelper');
const {
  handleNameDetection,
  processIntervention,
  processApprovedMessage,
  handleAiFailure,
} = require('./aiActionHelper');

/**
 * Handles AI mediation for incoming messages
 * @param {Object} socket - Socket.io connection
 * @param {Object} io - Socket.io server
 * @param {Object} services - Service container
 * @param {Object} context - Message context
 * @param {Object} context.user - User info (username, roomId)
 * @param {Object} context.message - Message to process
 * @param {Object} context.data - Additional message data (isPreApprovedRewrite, etc.)
 * @param {Map} context.activeUsers - Active users map
 * @param {Function} context.addToHistory - Callback to persist message
 */
async function handleAiMediation(socket, io, services, context) {
  const { user, message, data, activeUsers, addToHistory } = context;
  const { aiMediator, dbSafe, dbPostgres, communicationStats } = services;
  const { isPreApprovedRewrite, originalRewrite, bypassMediation } = data;

  // 1. IF THIS IS A PRE-APPROVED REWRITE, CHECK FOR EDITS
  if (isPreApprovedRewrite && originalRewrite) {
    const similarity = stringSimilarity.compareTwoStrings(message.text, originalRewrite);
    if (similarity >= 0.85) {
      try {
        const userResult = await dbSafe.safeSelect(
          'users',
          { username: user.username.toLowerCase() },
          { limit: 1 }
        );
        if (userResult.length > 0) {
          await communicationStats.updateCommunicationStats(userResult[0].id, user.roomId, false);
        }
      } catch (err) {
        console.error('Error updating stats:', err);
      }

      message.isRevision = true;
      await addToHistory(message, user.roomId);
      io.to(user.roomId).emit('new_message', message);
      return;
    }
  }

  // 2. User chose "Send Original Anyway" - bypass mediation
  if (bypassMediation) {
    try {
      const userResult = await dbSafe.safeSelect(
        'users',
        { username: user.username.toLowerCase() },
        { limit: 1 }
      );
      if (userResult.length > 0) {
        await communicationStats.updateCommunicationStats(userResult[0].id, user.roomId, false);
      }
    } catch (err) {
      console.error('Error updating stats:', err);
    }

    message.bypassedMediation = true;
    await addToHistory(message, user.roomId);
    io.to(user.roomId).emit('new_message', message);
    return;
  }

  // 3. Queue for AI analysis
  aiMediator.updateContext(message);

  setImmediate(async () => {
    try {
      const recentMessages = await getRecentMessages(dbPostgres, user.roomId);
      const participantUsernames = await getParticipantUsernames(dbSafe, user.roomId, activeUsers);
      const contactContext = await getContactContext(services, user, participantUsernames);
      const taskContext = await getTaskContext(services, user);
      const flaggedContext = await getFlaggedContext(services, user);

      const otherParticipants = participantUsernames.filter(
        u => u.toLowerCase() !== user.username.toLowerCase()
      );
      const roleContext = {
        senderId: user.username.toLowerCase(),
        receiverId: otherParticipants.length > 0 ? otherParticipants[0].toLowerCase() : null,
      };

      const intervention = await aiMediator.analyzeMessage(
        message,
        recentMessages,
        participantUsernames,
        contactContext.existingContacts,
        contactContext.aiContext,
        user.roomId,
        taskContext,
        flaggedContext,
        roleContext
      );

      let contactSuggestion = null;
      if (!intervention) {
        contactSuggestion = await handleNameDetection(socket, aiMediator, {
          text: message.text,
          existingContacts: contactContext.existingContacts,
          participantUsernames,
        });
      }

      if (intervention) {
        await processIntervention(socket, io, services, {
          user,
          message,
          intervention,
          addToHistory,
        });
      } else {
        await processApprovedMessage(socket, io, services, {
          user,
          message,
          contactSuggestion,
          addToHistory,
        });
      }
    } catch (aiError) {
      await handleAiFailure(socket, io, {
        user,
        message,
        error: aiError,
        addToHistory,
      });
    }
  });
}

module.exports = { handleAiMediation };
