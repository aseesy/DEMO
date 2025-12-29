/**
 * AI Action Helpers for Socket Messages
 *
 * Refactored to use options objects instead of many positional parameters.
 * See: Clean Code - "How Many Arguments?" (niladic > monadic > dyadic > triadic)
 *
 * Side Effect Policy:
 * - Functions with side effects have explicit names (e.g., "AndStore", "AndEmit")
 * - Pure functions are documented as such
 */

const contactIntelligence = require('../src/core/intelligence/contactIntelligence');

// ============================================================================
// PURE DETECTION FUNCTIONS (no side effects)
// ============================================================================

/**
 * Detect contact mentions in message text and generate contact suggestion with relationship
 * PURE FUNCTION: Only analyzes text, does not store or emit anything
 *
 * Uses detectContactMentions which detects both name AND relationship (unlike detectNamesInMessage)
 *
 * @param {Object} aiMediator - AI mediator service
 * @param {Object} context - Detection context
 * @param {string} context.text - Message text to analyze
 * @param {Array} context.existingContacts - User's existing contacts
 * @param {Array} context.participantUsernames - Room participant usernames
 * @param {Array} context.recentMessages - Recent conversation messages for context
 * @returns {Promise<Object|null>} Contact suggestion with relationship or null
 */
async function detectContactSuggestion(aiMediator, context) {
  const { text, existingContacts, participantUsernames, recentMessages = [] } = context;

  try {
    // Use detectContactMentions which detects both name AND relationship
    const detectionResult = await contactIntelligence.detectContactMentions(
      text,
      existingContacts,
      recentMessages,
      participantUsernames // Pass participant usernames to exclude them from detection
    );

    if (
      detectionResult &&
      detectionResult.detectedPeople &&
      detectionResult.detectedPeople.length > 0
    ) {
      // Get the first detected person (highest confidence)
      // Note: detectContactMentions returns relationships in display format:
      // "My Child", "My Co-Parent", "My Partner", "My Child's Teacher", "My Family", "My Friend", "Other"
      const detectedPerson = detectionResult.detectedPeople[0];
      const detectedName = detectedPerson.name;
      const detectedRelationship = detectedPerson.relationship; // Already in display format

      // Generate suggestion text
      const contactSuggestion = await aiMediator.generateContactSuggestion(detectedName, text);

      if (contactSuggestion) {
        // Include relationship in the suggestion (in display format, matches frontend dropdown options)
        return {
          ...contactSuggestion,
          detectedRelationship, // Will be pre-filled in contact form
        };
      }
    }
  } catch (err) {
    console.error('Error detecting contact mentions:', err);
  }
  return null;
}

// ============================================================================
// FUNCTIONS WITH SIDE EFFECTS (explicit in name)
// ============================================================================

/**
 * Detect names and store pending suggestion on socket
 * SIDE EFFECT: Mutates socket.data.pendingContactSuggestion
 *
 * @param {Object} socket - Socket.io connection (will be mutated)
 * @param {Object} aiMediator - AI mediator service
 * @param {Object} context - Detection context
 * @param {string} context.text - Message text to analyze
 * @param {Array} context.existingContacts - User's existing contacts
 * @param {Array} context.participantUsernames - Room participant usernames
 * @returns {Promise<Object|null>} Contact suggestion or null
 */
async function detectAndStorePendingSuggestion(socket, aiMediator, context) {
  const contactSuggestion = await detectContactSuggestion(aiMediator, context);

  if (contactSuggestion) {
    // SIDE EFFECT: Store on socket for later retrieval
    socket.data = socket.data || {};
    socket.data.pendingContactSuggestion = {
      detectedName: contactSuggestion.detectedName,
      detectedRelationship: contactSuggestion.detectedRelationship, // Store relationship
      messageContext: contactSuggestion.messageContext,
      timestamp: Date.now(),
    };
  }

  return contactSuggestion;
}

/**
 * @deprecated Use detectContactSuggestion() for pure detection
 * or detectAndStorePendingSuggestion() for detection with socket storage
 */
async function handleNameDetection(socket, aiMediator, context) {
  return detectAndStorePendingSuggestion(socket, aiMediator, context);
}

/**
 * Processes an AI intervention (coaching moment)
 *
 * SIDE EFFECTS (explicit):
 *   1. Updates communication stats via communicationStats.updateCommunicationStats()
 *   2. Emits 'pending_original' message to socket
 *   3. Emits 'ai_intervention' message to socket (or broadcasts ai_comment to room)
 *   4. Persists messages via addToHistory() for ai_comment type
 *
 * @param {Object} socket - Socket.io connection
 * @param {Object} io - Socket.io server
 * @param {Object} services - Service container (communicationStats, dbSafe)
 * @param {Object} context - Message context
 * @param {Object} context.user - User info (username, roomId)
 * @param {Object} context.message - Original message
 * @param {Object} context.intervention - AI intervention data
 * @param {Function} context.addToHistory - Callback to persist message
 */
async function processIntervention(socket, io, services, context) {
  const { user, message, intervention, addToHistory } = context;
  const { updateUserStats } = require('./aiHelperUtils');

  if (intervention.type === 'ai_intervention') {
    await updateUserStats(services, user, user.roomId, true);

    // RACE CONDITION GUARD: Check if socket is still connected before emitting
    if (!socket.connected) {
      const userEmail = user.email || user.username; // Fallback for backward compatibility
      console.warn('[processIntervention] Socket disconnected, skipping emit', {
        email: userEmail,
        messageId: message.id,
      });
      return;
    }

    // Emit draft_coaching event to show ObserverCard on frontend
    // This is the single transport (WebSocket) for AI analysis results
    socket.emit('draft_coaching', {
      analyzing: false,
      shouldSend: false,
      riskLevel: intervention.escalation?.riskLevel || 'medium',
      originalText: message.text,
      observerData: {
        axiomsFired: intervention.escalation?.reasons || [],
        explanation: intervention.validation || '',
        tip: intervention.insight || '',
        refocusQuestions: intervention.refocusQuestions || [],
        rewrite1: intervention.rewrite1 || '',
        rewrite2: intervention.rewrite2 || '',
        escalation: intervention.escalation,
        emotion: intervention.emotion,
      },
    });
  } else if (intervention.type === 'ai_comment') {
    await addToHistory(message, user.roomId);
    io.to(user.roomId).emit('new_message', message);

    const aiComment = {
      id: `ai-comment-${Date.now()}`,
      type: 'ai_comment',
      username: 'Alex',
      text: intervention.text,
      timestamp: new Date().toISOString(),
      roomId: user.roomId,
    };
    await addToHistory(aiComment, user.roomId);
    io.to(user.roomId).emit('new_message', aiComment);
  }
}

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
  const { updateUserStats } = require('./aiHelperUtils');

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
        const recipient = roomMembersResult.rows.find(
          member => {
            const memberEmail = member.email || member.username;
            return memberEmail?.toLowerCase() !== userEmail?.toLowerCase();
          }
        );

        console.log('[processApprovedMessage] Push notification check:', {
          roomMembersCount: roomMembersResult.rows.length,
          senderEmail: userEmail,
          roomMembers: roomMembersResult.rows.map(r => r.email || r.username),
          recipientFound: !!recipient,
          recipientUserId: recipient?.user_id,
        });

        if (recipient && recipient.user_id) {
          // Import push notification service
          const pushNotificationService = require('../services/pushNotificationService');
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
    try {
      const informationExtraction = require('../src/core/intelligence/informationExtractionService');
      const { dbPostgres } = services;
      const { gatherAnalysisContext } = require('./aiHelperUtils');

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
  });
}

/**
 * Handles AI processing failure gracefully
 *
 * SIDE EFFECTS (explicit):
 *   1. Emits 'ai_error' message to socket (private, not persisted)
 *   2. Persists original message via addToHistory()
 *   3. Broadcasts original message to room via io.to(roomId).emit()
 *
 * @param {Object} socket - Socket.io connection
 * @param {Object} io - Socket.io server
 * @param {Object} context - Error context
 * @param {Object} context.user - User info (username, roomId)
 * @param {Object} context.message - Message that failed processing
 * @param {Error} context.error - The error that occurred
 * @param {Function} context.addToHistory - Callback to persist message
 */
async function handleAiFailure(socket, io, context) {
  const { user, message, error, addToHistory } = context;

  console.error('❌ AI Mediator failure:', error.message);

  // RACE CONDITION GUARD: Only emit private error to socket if still connected
  if (socket.connected) {
    socket.emit('new_message', {
      id: `ai-error-${Date.now()}`,
      type: 'ai_error',
      username: 'LiaiZen',
      text: 'I had trouble analyzing your message, but it was sent successfully.',
      timestamp: new Date().toISOString(),
      roomId: user.roomId,
      isPrivate: true,
    });
  }

  // Still persist and broadcast message even if sender disconnected
  // (io.to broadcasts to room, not to specific socket)
  await addToHistory(message, user.roomId);
  io.to(user.roomId).emit('new_message', message);
}

module.exports = {
  handleNameDetection,
  processIntervention,
  processApprovedMessage,
  handleAiFailure,
};
