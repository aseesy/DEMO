/**
 * Socket Feedback and Intervention Handlers
 */

const { defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'feedbackHandler',
});

function registerFeedbackHandlers(socket, io, services) {
  const { aiMediator, feedbackLearner, dbSafe, userSessionService } = services;

  // intervention_feedback handler
  socket.on('intervention_feedback', async ({ interventionId, helpful, reason }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before providing feedback.' });
        return;
      }

      await feedbackLearner.recordExplicitFeedback(
        user.username,
        helpful ? 'helpful' : 'not_helpful',
        { interventionId },
        reason || null
      );

      aiMediator.recordInterventionFeedback(user.roomId, helpful);
      socket.emit('feedback_recorded', { success: true });
    } catch (error) {
      logger.error('Error recording intervention feedback', {
        error: error,
      });
      socket.emit('error', { message: 'Failed to record feedback.' });
    }
  });

  // accept_rewrite handler
  socket.on('accept_rewrite', async ({ original, rewrite, tip }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) return;

      await aiMediator.recordAcceptedRewrite(user.username, { original, rewrite, tip });
      socket.emit('rewrite_recorded', { success: true });
    } catch (error) {
      logger.error('Error recording accepted rewrite', {
        error: error,
      });
    }
  });

  // override_intervention handler
  socket.on('override_intervention', async ({ messageId, overrideAction }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before overriding.' });
        return;
      }

      await feedbackLearner.recordImplicitFeedback(user.username, 'override_intervention', {
        messageId,
        overrideAction,
      });

      const messageResult = await dbSafe.safeSelect('messages', { id: messageId }, { limit: 1 });
      const messages = dbSafe.parseResult(messageResult);

      if (messages.length > 0) {
        const originalMessage = messages[0];
        const messageObj = {
          id: originalMessage.id || messageId,
          type: 'user',
          username: originalMessage.username || user.username,
          text: originalMessage.text,
          timestamp: originalMessage.timestamp || new Date().toISOString(),
          roomId: user.roomId,
          overrideNote: 'User chose to send this message despite intervention',
        };

        io.to(user.roomId).emit('new_message', messageObj);
        socket.emit('override_success', { messageId });
      } else {
        socket.emit('error', { message: 'Original message not found.' });
      }
    } catch (error) {
      logger.error('Error handling override', {
        error: error,
      });
      socket.emit('error', { message: 'Failed to override intervention.' });
    }
  });
}

module.exports = { registerFeedbackHandlers };
