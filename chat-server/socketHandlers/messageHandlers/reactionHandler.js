/**
 * Reaction Handler
 *
 * Single Responsibility: Handle add_reaction socket events.
 *
 * Handles:
 * - User validation
 * - Reaction addition via MessageService
 * - Fallback to manual reaction handling
 * - Broadcast reaction updates
 */

const { validateActiveUser } = require('../messageOperations');
const { parseReactions, toggleReaction } = require('../messageOperations');
const { wrapSocketHandler } = require('../errorBoundary');

/**
 * Register add_reaction handler
 *
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} services - Service dependencies
 */
function registerReactionHandler(socket, io, services) {
  const { dbSafe, userSessionService } = services;

  socket.on(
    'add_reaction',
    wrapSocketHandler(
      async ({ messageId, emoji }) => {
        // Step 1: Validate user and emoji
        const userValidation = await validateActiveUser(userSessionService, socket.id);
        if (!userValidation.valid || !emoji) return;
        const { user } = userValidation;

        // Step 2: Add reaction using MessageService
        try {
          const MessageService = require('../../src/services/messages/messageService');
          const messageService = new MessageService();
          const userEmail = user.email || user.username;

          const updatedMessage = await messageService.addReaction(messageId, emoji, userEmail);

          if (updatedMessage) {
            // Broadcast updated message
            io.to(user.roomId).emit('reaction_updated', {
              messageId,
              reactions: updatedMessage.reactions,
              roomId: user.roomId,
            });
          }
        } catch (error) {
          console.error(
            '[add_reaction] MessageService failed, falling back to manual update:',
            error.message
          );
          // Fallback to manual reaction handling
          try {
            // Get current reactions
            let currentReactions;
            const result = await dbSafe.safeSelect(
              'messages',
              { id: messageId, room_id: user.roomId },
              { limit: 1, fields: ['reactions'] }
            );
            const messages = dbSafe.parseResult(result);
            if (messages.length === 0) return;
            currentReactions = parseReactions(messages[0].reactions);

            // Toggle reaction
            const userEmail = user.email || user.username;
            const updatedReactions = toggleReaction(currentReactions, emoji, userEmail);

            // Save updated reactions
            await dbSafe.safeUpdate(
              'messages',
              { reactions: JSON.stringify(updatedReactions) },
              { id: messageId }
            );

            // Broadcast update
            io.to(user.roomId).emit('reaction_updated', {
              messageId,
              reactions: updatedReactions,
              roomId: user.roomId,
            });
          } catch (fallbackError) {
            console.error('Error in fallback reaction handling:', fallbackError);
          }
        }
      },
      'add_reaction',
      { retry: false }
    )
  );
}

module.exports = {
  registerReactionHandler,
};
