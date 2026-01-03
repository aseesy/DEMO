/**
 * AI Mediation Helper for Socket Messages
 *
 * Refactored to use options objects instead of many positional parameters.
 * See: Clean Code - "How Many Arguments?" (niladic > monadic > dyadic > triadic)
 */
const stringSimilarity = require('string-similarity');
const {
  handleNameDetection,
  processIntervention,
  processApprovedMessage,
  handleAiFailure,
} = require('./aiActionHelper');
const { updateUserStats, sendMessageDirectly, gatherAnalysisContext } = require('./aiHelperUtils');

// AI analysis timeout (30 seconds) - prevents indefinite hangs
const AI_ANALYSIS_TIMEOUT_MS = 30000;

/**
 * Wrap a promise with a timeout
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operationName - Name for error message
 * @returns {Promise} Promise that rejects on timeout
 */
function withTimeout(promise, timeoutMs, operationName = 'Operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

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
      await updateUserStats(services, user, user.roomId, false);
      await sendMessageDirectly(message, user.roomId, io, addToHistory, { isRevision: true });
      return;
    }
    console.log('[aiHelper] Rewrite was edited (similarity:', similarity, '), running AI analysis');
  }

  // 2. User chose "Send Original Anyway" - bypass mediation
  // CRITICAL: Prevent bypass for direct insults/hostility (should NEVER be transmitted)
  if (bypassMediation) {
    // Quick check for direct hostility before allowing bypass
    const { hasDirectHostility } = require('./utils/directHostilityCheck');
    const hasDirectInsult = hasDirectHostility(message.text);

    if (hasDirectInsult) {
      console.warn('[aiHelper] BLOCKED bypass attempt for direct hostility:', {
        messageId: message.id,
        email: user.email || user.username,
        text: message.text.substring(0, 50),
      });
      // Emit error to client - direct insults cannot be bypassed
      const { emitError } = require('./utils');
      emitError(
        socket,
        'This message contains direct hostility and cannot be sent as-is. Please use one of the suggested rewrites.',
        null,
        'bypass_blocked_direct_hostility'
      );
      return;
    }

    await updateUserStats(services, user, user.roomId, false);
    await sendMessageDirectly(message, user.roomId, io, addToHistory, { bypassedMediation: true });
    return;
  }

  // 3. Validate required services - if missing, send message anyway
  if (!aiMediator || !userSessionService) {
    const missingService = !aiMediator ? 'aiMediator' : 'userSessionService';
    console.error(
      `[aiHelper] ERROR: ${missingService} not available in services - sending message without analysis`
    );
    await sendMessageDirectly(message, user.roomId, io, addToHistory);
    return;
  }

  // 4. Queue for AI analysis (non-blocking)
  // Use setImmediate to avoid blocking the socket handler
  aiMediator.updateContext(message);

  // Capture socket.id for connection check in callback
  const socketId = socket.id;

  // Process AI analysis asynchronously (non-blocking)
  // Use setImmediate to avoid blocking the socket handler response
  setImmediate(() => {
    // RACE CONDITION FIX: Check if socket is still connected before processing
    // The user may have disconnected or the room state may have changed
    if (!socket.connected) {
      const userEmail = user.email || user.username; // Fallback for backward compatibility
      console.warn('[aiHelper] Socket disconnected before AI analysis - skipping', {
        socketId,
        email: userEmail,
        messageId: message.id,
      });
      return;
    }

    processAiAnalysis(socket, io, services, {
      user,
      message,
      addToHistory,
    }).catch(error => {
      console.error('[aiHelper] Unhandled error in AI analysis:', error);
      // Error is already handled in processAiAnalysis, but catch here as safety net
    });
  });
}

/**
 * Process AI analysis for a message
 * Extracted to separate function for better readability and testability
 * @param {Object} socket - Socket.io connection
 * @param {Object} io - Socket.io server
 * @param {Object} services - Service container
 * @param {Object} context - Message context
 * @returns {Promise<void>}
 */
async function processAiAnalysis(socket, io, services, context) {
  const { user, message, addToHistory } = context;
  const { aiMediator } = services;

  try {
    console.log('[aiHelper] Starting AI analysis for message:', {
      messageId: message.id,
      email: user.email || user.username,
      roomId: user.roomId,
      text: message.text?.substring(0, 50),
    });

    // Gather all context needed for analysis
    const analysisContext = await gatherAnalysisContext(services, user, user.roomId);
    console.log('[aiHelper] Context gathered:', {
      recentMessages: analysisContext.recentMessages.length,
      participants: analysisContext.participantUsernames.length,
    });

    // Call AI mediator with timeout protection
    const intervention = await withTimeout(
      aiMediator.analyzeMessage(
        message,
        analysisContext.recentMessages,
        analysisContext.participantUsernames,
        analysisContext.contactContext.existingContacts,
        analysisContext.contactContext.aiContext,
        user.roomId,
        analysisContext.taskContext,
        analysisContext.flaggedContext,
        analysisContext.roleContext
      ),
      AI_ANALYSIS_TIMEOUT_MS,
      'AI analysis'
    );

    // Handle contact detection if no intervention
    let contactSuggestion = null;
    if (!intervention) {
      console.log(
        '[NameDetection] Running contact mention detection for:',
        message.text.substring(0, 50)
      );
      contactSuggestion = await handleNameDetection(socket, aiMediator, {
        text: message.text,
        existingContacts: analysisContext.contactContext.existingContacts,
        participantUsernames: analysisContext.participantUsernames,
        recentMessages: analysisContext.recentMessages,
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

    // Process result
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
      email: user.email || user.username,
    });
    await handleAiFailure(socket, io, {
      user,
      message,
      error: aiError,
      addToHistory,
    });
  }
}

module.exports = { handleAiMediation };
