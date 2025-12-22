/**
 * Socket Message Handlers
 *
 * This module handles message-related socket events with clear separation:
 * - Business logic delegated to messageOperations.js
 * - Error handling consolidated at handler boundaries
 */

const { emitError, getUserDisplayName } = require('./utils');
const {
  validateMessageText,
  validateActiveUser,
  createUserMessage,
  verifyMessageOwnership,
  createEditedMessage,
  parseReactions,
  toggleReaction,
} = require('./messageOperations');

function registerMessageHandlers(socket, io, services, activeUsers, messageHistory) {
  const { messageStore, dbSafe, dbPostgres } = services;

  /**
   * Helper to add to message history
   */
  async function addToHistory(message, roomId) {
    messageHistory.push(message);
    if (messageHistory.length > 100) {
      messageHistory.shift();
    }
    if (messageStore) {
      try {
        await messageStore.saveMessage({ ...message, roomId });
      } catch (err) {
        console.error('Error saving message to database:', err);
      }
    }
  }

  // send_message handler
  socket.on('send_message', async data => {
    // Step 1: Validate user is active
    const userValidation = validateActiveUser(activeUsers, socket.id);
    if (!userValidation.valid) {
      emitError(socket, userValidation.error);
      return;
    }
    const { user } = userValidation;

    // Step 2: Validate message text
    const { text, isPreApprovedRewrite, originalRewrite, bypassMediation } = data;
    const textValidation = validateMessageText(text);

    if (!textValidation.valid) {
      if (textValidation.empty) return; // Silent ignore for empty
      emitError(socket, textValidation.error);
      return;
    }

    // Step 3: Get display name and create message
    let displayName;
    try {
      displayName = await getUserDisplayName(user.username, dbSafe);
    } catch (error) {
      // Non-fatal: use username as fallback
      displayName = user.username;
    }

    const message = createUserMessage(socket.id, user, textValidation.cleanText, displayName);

    // Step 4: Delegate to AI mediation handler
    try {
      const { handleAiMediation } = require('./aiHelper');
      await handleAiMediation(socket, io, services, {
        user,
        message,
        data,
        activeUsers,
        addToHistory,
      });
    } catch (error) {
      emitError(socket, 'Failed to send message.', error, 'send_message:aiMediation');
    }
  });

  // edit_message handler
  socket.on('edit_message', async ({ messageId, text }) => {
    // Step 1: Validate user is active
    const userValidation = validateActiveUser(activeUsers, socket.id);
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
      const ownership = await verifyMessageOwnership(
        messageId,
        user.username,
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

    // Step 4: Update message in database
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
    } catch (error) {
      emitError(socket, 'Failed to edit message.', error, 'edit_message:update');
      return;
    }

    // Step 5: Broadcast edited message
    const editedMessage = createEditedMessage(
      originalMessage,
      textValidation.cleanText,
      user.roomId
    );
    io.to(user.roomId).emit('message_edited', editedMessage);
  });

  // delete_message handler
  socket.on('delete_message', async ({ messageId }) => {
    // Step 1: Validate user is active
    const userValidation = validateActiveUser(activeUsers, socket.id);
    if (!userValidation.valid) {
      emitError(socket, 'You must join before deleting messages.');
      return;
    }
    const { user } = userValidation;

    // Step 2: Verify ownership
    try {
      const ownership = await verifyMessageOwnership(
        messageId,
        user.username,
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

    // Step 3: Mark message as deleted
    try {
      await dbSafe.safeUpdate(
        'messages',
        {
          deleted: 1,
          deleted_at: new Date().toISOString(),
        },
        { id: messageId }
      );
    } catch (error) {
      emitError(socket, 'Failed to delete message.', error, 'delete_message:update');
      return;
    }

    // Step 4: Broadcast deletion
    io.to(user.roomId).emit('message_deleted', { messageId, roomId: user.roomId });
  });

  // add_reaction handler
  socket.on('add_reaction', async ({ messageId, emoji }) => {
    // Step 1: Validate user and emoji
    const userValidation = validateActiveUser(activeUsers, socket.id);
    if (!userValidation.valid || !emoji) return;
    const { user } = userValidation;

    // Step 2: Get current reactions
    let currentReactions;
    try {
      const result = await dbPostgres.query(
        'SELECT reactions FROM messages WHERE id = $1 AND room_id = $2 LIMIT 1',
        [messageId, user.roomId]
      );
      if (result.rows.length === 0) return;
      currentReactions = parseReactions(result.rows[0].reactions);
    } catch (error) {
      console.error('Error getting reactions:', error);
      return;
    }

    // Step 3: Toggle reaction
    const updatedReactions = toggleReaction(currentReactions, emoji, user.username);

    // Step 4: Save updated reactions
    try {
      await dbSafe.safeUpdate(
        'messages',
        { reactions: JSON.stringify(updatedReactions) },
        { id: messageId }
      );
    } catch (error) {
      console.error('Error saving reaction:', error);
      return;
    }

    // Step 5: Broadcast update
    io.to(user.roomId).emit('reaction_updated', {
      messageId,
      reactions: updatedReactions,
      roomId: user.roomId,
    });
  });
}

module.exports = { registerMessageHandlers };
