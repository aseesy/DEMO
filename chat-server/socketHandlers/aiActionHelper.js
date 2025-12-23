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
      recentMessages
    );

    if (detectionResult && detectionResult.detectedPeople && detectionResult.detectedPeople.length > 0) {
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
  const { communicationStats, dbSafe } = services;

  if (intervention.type === 'ai_intervention') {
    try {
      const userResult = await dbSafe.safeSelect(
        'users',
        { username: user.username.toLowerCase() },
        { limit: 1 }
      );
      if (userResult.length > 0) {
        await communicationStats.updateCommunicationStats(userResult[0].id, user.roomId, true);
      }
    } catch (err) {
      console.error('Error updating stats:', err);
    }

    const baseTimestamp = Date.now();
    const interventionId = `ai-intervention-${baseTimestamp}`;
    const pendingOriginalId = `pending-original-${baseTimestamp}`;

    socket.emit('new_message', {
      id: pendingOriginalId,
      type: 'pending_original',
      username: message.username,
      text: message.text,
      timestamp: message.timestamp,
      roomId: user.roomId,
      interventionId,
    });

    socket.emit('new_message', {
      id: interventionId,
      type: 'ai_intervention',
      personalMessage: intervention.validation,
      tip1: intervention.insight,
      rewrite1: intervention.rewrite1,
      rewrite2: intervention.rewrite2,
      originalMessage: message,
      pendingOriginalId,
      escalation: intervention.escalation,
      emotion: intervention.emotion,
      timestamp: message.timestamp,
      roomId: user.roomId,
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
  const { communicationStats, dbSafe } = services;

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

  await addToHistory(message, user.roomId);
  io.to(user.roomId).emit('new_message', message);

  if (contactSuggestion) {
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
  socket.emit('new_message', {
    id: `ai-error-${Date.now()}`,
    type: 'ai_error',
    username: 'LiaiZen',
    text: 'I had trouble analyzing your message, but it was sent successfully.',
    timestamp: new Date().toISOString(),
    roomId: user.roomId,
    isPrivate: true,
  });

  await addToHistory(message, user.roomId);
  io.to(user.roomId).emit('new_message', message);
}

module.exports = {
  handleNameDetection,
  processIntervention,
  processApprovedMessage,
  handleAiFailure,
};
