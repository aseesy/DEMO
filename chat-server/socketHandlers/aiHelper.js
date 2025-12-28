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
 * @param {Function} context.addToHistory - Callback to persist message
 */
async function handleAiMediation(socket, io, services, context) {
  const { user, message, data, addToHistory } = context;
  const { aiMediator, dbSafe, dbPostgres, communicationStats, userSessionService } = services;
  const { isPreApprovedRewrite, originalRewrite, bypassMediation } = data;

  // 1. IF THIS IS A PRE-APPROVED REWRITE AND NOT EDITED, SKIP AI ANALYSIS
  // Only bypass if the message closely matches the original rewrite (>= 95% similar)
  if (isPreApprovedRewrite && originalRewrite) {
    const similarity = stringSimilarity.compareTwoStrings(message.text, originalRewrite);
    if (similarity >= 0.95) {
      console.log(
        '[aiHelper] Skipping AI analysis for unedited rewrite (similarity:',
        similarity,
        ')'
      );
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
    console.log('[aiHelper] Rewrite was edited (similarity:', similarity, '), running AI analysis');
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
  // Validate required services - if missing, send message anyway
  if (!aiMediator) {
    console.error(
      '[aiHelper] ERROR: aiMediator not available in services - sending message without analysis'
    );
    // Send message directly without AI analysis
    await addToHistory(message, user.roomId);
    io.to(user.roomId).emit('new_message', message);
    return;
  }

  if (!userSessionService) {
    console.error(
      '[aiHelper] ERROR: userSessionService not available in services - sending message without analysis'
    );
    // Send message directly without AI analysis
    await addToHistory(message, user.roomId);
    io.to(user.roomId).emit('new_message', message);
    return;
  }

  aiMediator.updateContext(message);

  setImmediate(async () => {
    try {
      console.log('[aiHelper] Starting AI analysis for message:', {
        messageId: message.id,
        username: user.username,
        roomId: user.roomId,
        text: message.text?.substring(0, 50),
      });

      const recentMessages = await getRecentMessages(dbPostgres, user.roomId);
      console.log('[aiHelper] Got recent messages:', recentMessages.length);

      const participantUsernames = await getParticipantUsernames(
        dbSafe,
        user.roomId,
        userSessionService
      );
      console.log('[aiHelper] Got participants:', participantUsernames);

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
        console.log(
          '[NameDetection] Running contact mention detection for:',
          message.text.substring(0, 50)
        );
        contactSuggestion = await handleNameDetection(socket, aiMediator, {
          text: message.text,
          existingContacts: contactContext.existingContacts,
          participantUsernames,
          recentMessages, // Pass recentMessages for relationship detection
        });
        console.log(
          '[NameDetection] Result:',
          contactSuggestion
            ? `Found: ${contactSuggestion.detectedName} (relationship: ${contactSuggestion.detectedRelationship || 'none'})`
            : 'No contacts detected'
        );
      } else {
        console.log('[NameDetection] Skipped - message triggered intervention');
      }

      if (intervention) {
        console.log('[aiHelper] Processing intervention:', {
          type: intervention.type,
          shouldIntervene: intervention.shouldIntervene,
        });
        await processIntervention(socket, io, services, {
          user,
          message,
          intervention,
          addToHistory,
        });
      } else {
        console.log('[aiHelper] Processing approved message');
        await processApprovedMessage(socket, io, services, {
          user,
          message,
          contactSuggestion,
          addToHistory,
        });
      }
      console.log('[aiHelper] AI analysis completed successfully');
    } catch (aiError) {
      console.error('[aiHelper] ERROR in AI analysis:', {
        error: aiError.message,
        stack: aiError.stack,
        messageId: message.id,
        username: user.username,
      });
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
