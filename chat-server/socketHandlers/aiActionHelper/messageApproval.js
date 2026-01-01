/**
 * Message Approval Processing for AI Action Helper
 *
 * Processes approved (non-flagged) messages including persistence,
 * broadcasting, push notifications, and information extraction.
 */

const { updateUserStats, gatherAnalysisContext } = require('../aiHelperUtils');

/**
 * Processes an approved (non-flagged) message
 *
 * SIDE EFFECTS (explicit):
 *   1. Updates communication stats via communicationStats.updateCommunicationStats()
 *   2. Persists message via addToHistory()
 *   3. Broadcasts message to room via io.to(roomId).emit()
 *   4. Emits 'contact_suggestion' to socket if contactSuggestion provided
 *
 * @param {Object} socket - Socket.io connection
 * @param {Object} io - Socket.io server
 * @param {Object} services - Service container (communicationStats, dbSafe)
 * @param {Object} context - Message context
 * @param {Object} context.user - User info (username, roomId)
 * @param {Object} context.message - Message to send
 * @param {Object|null} context.contactSuggestion - Optional contact suggestion
 * @param {Function} context.addToHistory - Callback to persist message
 */
async function processApprovedMessage(socket, io, services, context) {
  const { user, message, contactSuggestion, addToHistory } = context;
  const { dbPostgres } = services;

  await updateUserStats(services, user, user.roomId, false);

  // CRITICAL: Save message to database BEFORE emitting
  // This ensures message persists even if client disconnects
  try {
    await addToHistory(message, user.roomId);
    console.log('[processApprovedMessage] Message saved to database:', {
      id: message.id,
      username: message.username,
      text: message.text?.substring(0, 50),
      roomId: user.roomId,
    });
  } catch (saveError) {
    console.error('[processApprovedMessage] ERROR saving message:', saveError);
    // Still emit the message even if save fails (user should see it)
    // But log the error so we can debug
  }

  // Emit to room AFTER saving (ensures persistence)
  io.to(user.roomId).emit('new_message', message);

  // Send push notification to recipient (other user in room)
  // Do this asynchronously so it doesn't block message delivery
  setImmediate(async () => {
    await sendPushNotification(dbPostgres, user, message);
  });

  // Contact suggestion is only for the sender, so check connection before emit
  if (contactSuggestion && socket.connected) {
    socket.emit('new_message', {
      id: `contact-suggestion-${Date.now()}`,
      type: 'contact_suggestion',
      username: 'AI Assistant',
      text: contactSuggestion.suggestionText,
      detectedName: contactSuggestion.detectedName,
      detectedRelationship: contactSuggestion.detectedRelationship, // Include relationship
      timestamp: new Date().toISOString(),
      roomId: user.roomId,
    });
  }

  // Extract information from message and update contacts automatically
  // Do this asynchronously so it doesn't block message delivery
  setImmediate(async () => {
    await extractAndUpdateContacts(socket, services, user, message);
  });
}

/**
 * Send push notification to room recipient
 * @private
 */
async function sendPushNotification(dbPostgres, user, message) {
  try {
    // Get room members to find the recipient
    const roomMembersResult = await dbPostgres.query(
      `SELECT user_id, username FROM room_members rm
       JOIN users u ON rm.user_id = u.id
       WHERE rm.room_id = $1`,
      [user.roomId]
    );

    if (roomMembersResult.rows.length > 0) {
      // Find the recipient (other user in room, not the sender)
      const userEmail = user.email || user.username; // Fallback for backward compatibility
      const recipient = roomMembersResult.rows.find(member => {
        const memberEmail = member.email || member.username;
        return memberEmail?.toLowerCase() !== userEmail?.toLowerCase();
      });

      console.log('[processApprovedMessage] Push notification check:', {
        roomMembersCount: roomMembersResult.rows.length,
        senderEmail: userEmail,
        roomMembers: roomMembersResult.rows.map(r => r.email || r.username),
        recipientFound: !!recipient,
        recipientUserId: recipient?.user_id,
      });

      if (recipient && recipient.user_id) {
        // Import push notification service
        const pushNotificationService = require('../../services/pushNotificationService');
        console.log('[processApprovedMessage] Sending push notification:', {
          recipientUserId: recipient.user_id,
          recipientUsername: recipient.username,
          messageId: message.id,
          messageUsername: message.username,
          messageDisplayName: message.displayName,
          messageText: message.text?.substring(0, 50),
          hasText: !!message.text,
        });
        const result = await pushNotificationService.notifyNewMessage(recipient.user_id, message);
        console.log('[processApprovedMessage] Push notification result:', {
          recipientUserId: recipient.user_id,
          sent: result.sent,
          failed: result.failed,
          totalSubscriptions: result.sent + result.failed,
        });
      } else {
        const userEmail = user.email || user.username; // Fallback for backward compatibility
        console.log('[processApprovedMessage] No recipient found for push notification:', {
          roomMembersCount: roomMembersResult.rows.length,
          senderEmail: userEmail,
          roomMembers: roomMembersResult.rows.map(r => ({
            email: r.email || r.username,
            userId: r.user_id,
          })),
        });
      }
    } else {
      console.log('[processApprovedMessage] No room members found, skipping push notification');
    }
  } catch (pushError) {
    // Don't fail message delivery if push notification fails
    console.error('[processApprovedMessage] Error sending push notification:', pushError);
  }
}

/**
 * Extract information from message and update contacts automatically
 * @private
 */
async function extractAndUpdateContacts(socket, services, user, message) {
  try {
    const informationExtraction = require('../../src/core/intelligence/informationExtractionService');
    const { dbPostgres } = services;

    // Get user's ID
    const userEmail = user.email || user.username; // Fallback for backward compatibility
    const userResult = await dbPostgres.query(`SELECT id FROM users WHERE email = $1`, [
      userEmail.toLowerCase(),
    ]);

    if (userResult.rows.length === 0) {
      return;
    }

    const userId = userResult.rows[0].id;

    // Gather context (includes existing contacts and recent messages)
    const analysisContext = await gatherAnalysisContext(services, user, user.roomId);

    // Process extraction
    const updatedContacts = await informationExtraction.processMessageExtraction(
      message.text,
      userId,
      analysisContext.contactContext.existingContacts || [],
      analysisContext.recentMessages || []
    );

    if (updatedContacts.length > 0) {
      console.log('[processApprovedMessage] ✅ Updated contacts with extracted information:', {
        count: updatedContacts.length,
        contacts: updatedContacts.map(c => c.contact_name),
      });

      // Optionally notify the user that contacts were updated
      if (socket.connected) {
        socket.emit('new_message', {
          id: `info-extracted-${Date.now()}`,
          type: 'system',
          username: 'AI Assistant',
          text: `✅ Updated ${updatedContacts.length} contact${updatedContacts.length > 1 ? 's' : ''} with information from your message.`,
          timestamp: new Date().toISOString(),
          roomId: user.roomId,
        });
      }
    }
  } catch (extractionError) {
    // Don't fail message delivery if extraction fails
    console.error('[processApprovedMessage] Error extracting information:', extractionError);
  }
}

module.exports = {
  processApprovedMessage,
};
