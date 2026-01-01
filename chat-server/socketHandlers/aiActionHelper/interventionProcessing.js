/**
 * Intervention Processing for AI Action Helper
 *
 * Processes AI interventions (coaching moments) for flagged messages.
 */

const { updateUserStats } = require('../aiHelperUtils');

/**
 * Processes an AI intervention (coaching moment)
 *
 * SIDE EFFECTS (explicit):
 *   1. Updates communication stats via communicationStats.updateCommunicationStats()
 *   2. Emits 'draft_coaching' event to socket (shows ObserverCard on frontend)
 *   3. For ai_comment type: broadcasts ai_comment message to room and persists via addToHistory()
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

module.exports = {
  processIntervention,
};
