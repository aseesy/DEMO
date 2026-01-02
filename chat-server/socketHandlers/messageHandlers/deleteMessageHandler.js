/**
 * Delete Message Handler
 *
 * Single Responsibility: Handle delete_message socket events.
 *
 * Handles:
 * - User validation
 * - Message ownership verification
 * - Message deletion via MessageService
 * - Broadcast deletion
 */

const { emitError } = require('../utils');
const { validateActiveUser, verifyMessageOwnership } = require('../messageOperations');
const { wrapSocketHandler } = require('../errorBoundary');

/**
 * Register delete_message handler
 *
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} services - Service dependencies
 */
function registerDeleteMessageHandler(socket, io, services) {
  const { dbSafe, dbPostgres, userSessionService } = services;

  socket.on(
    'delete_message',
    wrapSocketHandler(
      async ({ messageId }) => {
        // Step 1: Validate user is active
        const userValidation = validateActiveUser(userSessionService, socket.id);
        if (!userValidation.valid) {
          emitError(socket, 'You must join before deleting messages.');
          return;
        }
        const { user } = userValidation;

        // Step 2: Verify ownership
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
        } catch (error) {
          emitError(socket, 'Failed to verify message.', error, 'delete_message:verifyOwnership');
          return;
        }

        // Step 3: Delete message using MessageService
        try {
          const MessageService = require('../../src/services/messages/messageService');
          const messageService = new MessageService();
          const userEmail = user.email || user.username;

          await messageService.deleteMessage(messageId, userEmail);
        } catch (error) {
          console.error(
            '[delete_message] MessageService failed, falling back to dbSafe:',
            error.message
          );
          // Fallback to direct database update (soft delete)
          try {
            await dbSafe.safeUpdate(
              'messages',
              {
                deleted: 1,
                deleted_at: new Date().toISOString(),
              },
              { id: messageId }
            );
          } catch (fallbackError) {
            emitError(socket, 'Failed to delete message.', fallbackError, 'delete_message:update');
            return;
          }
        }

        // Step 4: Broadcast deletion
        io.to(user.roomId).emit('message_deleted', { messageId, roomId: user.roomId });
      },
      'delete_message',
      { retry: false }
    )
  );
}

module.exports = {
  registerDeleteMessageHandler,
};
