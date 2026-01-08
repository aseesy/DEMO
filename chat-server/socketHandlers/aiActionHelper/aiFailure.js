/**
 * AI Failure Handling for AI Action Helper
 *
 * Gracefully handles AI processing failures by delivering messages
 * and notifying users of the issue.
 */

const { defaultLogger } = require('../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'aiFailure',
});

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

  logger.error('❌ AI Mediator failure', {
    message: error.message,
  });

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
  handleAiFailure,
};
