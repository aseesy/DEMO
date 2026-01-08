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
const { defaultLogger } = require('../src/infrastructure/logging/logger');

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
  const logger = defaultLogger.child({ function: 'handleAiMediation', messageId: message.id });

  // 1. IF THIS IS A PRE-APPROVED REWRITE AND NOT EDITED, SKIP AI ANALYSIS
  // Only bypass if the message closely matches the original rewrite (>= 95% similar)
  if (isPreApprovedRewrite && originalRewrite) {
    const similarity = stringSimilarity.compareTwoStrings(message.text, originalRewrite);
    if (similarity >= 0.95) {
      logger.debug('Skipping AI analysis for unedited rewrite', {
        similarity: similarity.toFixed(3),
        messageId: message.id,
      });
      await updateUserStats(services, user, user.roomId, false);
      await sendMessageDirectly(message, user.roomId, io, addToHistory, { isRevision: true });
      return;
    }
    logger.debug('Rewrite was edited, running AI analysis', {
      similarity: similarity.toFixed(3),
      messageId: message.id,
    });
  }

  // 2. User chose "Send Original Anyway" - bypass mediation
  // CRITICAL: Prevent bypass for direct insults/hostility (should NEVER be transmitted)
  if (bypassMediation) {
    // Quick check for direct hostility before allowing bypass
    const { hasDirectHostility } = require('./utils/directHostilityCheck');
    const hasDirectInsult = hasDirectHostility(message.text);

    if (hasDirectInsult) {
      logger.warn('BLOCKED bypass attempt for direct hostility', {
        messageId: message.id,
        textPreview: message.text.substring(0, 50),
        // Don't log email - PII
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
    logger.error('Required service not available, sending message without analysis', {
      missingService,
      messageId: message.id,
    });
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
      const analysisLogger = defaultLogger.child({ function: 'handleAiMediation' });
      analysisLogger.warn('Socket disconnected before AI analysis - skipping', {
        socketId: socketId.substring(0, 20) + '...',
        messageId: message.id,
        // Don't log email - PII
      });
      return;
    }

    processAiAnalysis(socket, io, services, {
      user,
      message,
      addToHistory,
    }).catch(error => {
      const analysisLogger = defaultLogger.child({ function: 'handleAiMediation' });
      analysisLogger.error('Unhandled error in AI analysis', error, {
        errorCode: error.code,
        messageId: message.id,
      });
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
  const logger = defaultLogger.child({ function: 'processAiAnalysis', messageId: message.id });

  try {
    logger.debug('Starting AI analysis for message', {
      messageId: message.id,
      roomId: user.roomId,
      textPreview: message.text?.substring(0, 50),
      // Don't log email - PII
    });

    // Gather all context needed for analysis (include message for thread context)
    const analysisContext = await gatherAnalysisContext(services, user, user.roomId, message);
    logger.debug('Context gathered for analysis', {
      recentMessages: analysisContext.recentMessages.length,
      participants: analysisContext.participantUsernames.length,
      hasThreadContext: !!analysisContext.threadContext,
      threadTitle: analysisContext.threadContext?.threadTitle,
    });

    // Build thread context string for AI prompt if thread exists
    let threadContextString = null;
    if (analysisContext.threadContext) {
      const tc = analysisContext.threadContext;
      threadContextString = `This message is in the thread "${tc.threadTitle}" (${tc.threadCategoryDescription}). `;
      if (tc.isSubThread) {
        threadContextString += `This is a sub-thread (depth ${tc.threadDepth}). `;
      }
      threadContextString += `Thread category: ${tc.threadCategory}.`;
    }

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
        analysisContext.roleContext,
        threadContextString // Pass thread context as additional parameter
      ),
      AI_ANALYSIS_TIMEOUT_MS,
      'AI analysis'
    );

    // Handle contact detection if no intervention
    let contactSuggestion = null;
    if (!intervention) {
      logger.debug('Running contact mention detection', {
        textPreview: message.text.substring(0, 50),
      });
      contactSuggestion = await handleNameDetection(socket, aiMediator, {
        text: message.text,
        existingContacts: analysisContext.contactContext.existingContacts,
        participantUsernames: analysisContext.participantUsernames,
        recentMessages: analysisContext.recentMessages,
      });
      logger.debug('Contact detection result', {
        found: !!contactSuggestion,
        detectedName: contactSuggestion?.detectedName,
        relationship: contactSuggestion?.detectedRelationship || 'none',
      });
    } else {
      logger.debug('Contact detection skipped - message triggered intervention');
    }

    // Process result
    if (intervention) {
      logger.debug('Processing intervention', {
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
      logger.debug('Processing approved message');
      await processApprovedMessage(socket, io, services, {
        user,
        message,
        contactSuggestion,
        addToHistory,
      });
    }
    logger.debug('AI analysis completed successfully');
  } catch (aiError) {
    logger.error('ERROR in AI analysis', aiError, {
      errorCode: aiError.code,
      messageId: message.id,
      // Don't log email - PII
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
