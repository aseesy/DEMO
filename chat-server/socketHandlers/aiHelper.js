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
  if (bypassMediation) {
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

  // Process AI analysis asynchronously (non-blocking)
  // Use setImmediate to avoid blocking the socket handler response
  setImmediate(() => {
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
      username: user.username,
      roomId: user.roomId,
      text: message.text?.substring(0, 50),
    });

    // Gather all context needed for analysis
    const analysisContext = await gatherAnalysisContext(services, user, user.roomId);
    console.log('[aiHelper] Context gathered:', {
      recentMessages: analysisContext.recentMessages.length,
      participants: analysisContext.participantUsernames.length,
    });

    // Call AI mediator
    const intervention = await aiMediator.analyzeMessage(
      message,
      analysisContext.recentMessages,
      analysisContext.participantUsernames,
      analysisContext.contactContext.existingContacts,
      analysisContext.contactContext.aiContext,
      user.roomId,
      analysisContext.taskContext,
      analysisContext.flaggedContext,
      analysisContext.roleContext
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
      username: user.username,
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
