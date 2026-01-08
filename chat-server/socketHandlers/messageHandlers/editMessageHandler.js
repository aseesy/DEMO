/**
 * Edit Message Handler
 *
 * Single Responsibility: Handle edit_message socket events.
 *
 * Handles:
 * - User validation
 * - Message ownership verification
 * - Message text validation
 * - Message update via MessageService
 * - Broadcast edited message
 */

const { emitError } = require('../utils');
const {
  validateMessageText,
  validateActiveUser,
  verifyMessageOwnership,
  createEditedMessage,
} = require('../messageOperations');
const { wrapSocketHandler } = require('../errorBoundary');
const { defaultLogger } = require('../../src/infrastructure/logging/logger');

/**
 * Register edit_message handler
 *
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} services - Service dependencies
 */
function registerEditMessageHandler(socket, io, services) {
  const { dbSafe, dbPostgres, userSessionService } = services;
  const logger = defaultLogger.child({ handler: 'edit_message' });

  socket.on(
    'edit_message',
    wrapSocketHandler(
      async ({ messageId, text }) => {
        // Step 1: Validate user is active
        const userValidation = await validateActiveUser(userSessionService, socket.id);
        if (!userValidation.valid) {
          emitError(socket, 'You must join before editing messages.');
          return;
        }
        const { user } = userValidation;

        // Step 2: Validate message text
        const textValidation = validateMessageText(text);
        if (!textValidation.valid) {
          if (textValidation.empty) {
            emitError(socket, 'Message cannot be empty.');
            return;
          }
          emitError(socket, textValidation.error);
          return;
        }

        // Step 3: Verify ownership
        let originalMessage;
        try {
          const userEmail = user.email || user.username; // Fallback for backward compatibility
          const ownership = await verifyMessageOwnership(
            messageId,
            userEmail,
            user.roomId,
            dbPostgres
          );
          if (!ownership.valid) {
            emitError(socket, ownership.error);
            return;
          }
          originalMessage = ownership.message;
        } catch (error) {
          emitError(socket, 'Failed to verify message.', error, 'edit_message:verifyOwnership');
          return;
        }

        // Step 4: Update message in database using MessageService
        try {
          const MessageService = require('../../src/services/messages/messageService');
          const messageService = new MessageService();
          const userEmail = user.email || user.username;

          await messageService.updateMessage(
            messageId,
            {
              text: textValidation.cleanText,
            },
            userEmail
          );
        } catch (error) {
          logger.warn('MessageService failed, falling back to dbSafe', {
            error: error.message,
            errorCode: error.code,
            messageId,
            // Don't log userEmail - PII
          });
          // Fallback to direct database update
          try {
            await dbSafe.safeUpdate(
              'messages',
              {
                text: textValidation.cleanText,
                edited: 1,
                edited_at: new Date().toISOString(),
              },
              { id: messageId }
            );
          } catch (fallbackError) {
            emitError(socket, 'Failed to edit message.', fallbackError, 'edit_message:update');
            return;
          }
        }

        // Step 5: Broadcast edited message
        const editedMessage = createEditedMessage(
          originalMessage,
          textValidation.cleanText,
          user.roomId
        );
        io.to(user.roomId).emit('message_edited', editedMessage);
      },
      'edit_message',
      { retry: false }
    )
  );
}

module.exports = {
  registerEditMessageHandler,
};
