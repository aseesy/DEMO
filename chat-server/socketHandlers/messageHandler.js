/**
 * Socket Message Handlers
 *
 * This module handles message-related socket events with clear separation:
 * - Business logic delegated to messageOperations.js
 * - Error handling consolidated at handler boundaries
 *
 * Architecture:
 * - registerMessageHandlers(): Main registration function for all message socket events
 * - addToHistory(): Internal helper for message persistence with auto-threading
 * - Event handlers: send_message, edit_message, delete_message, add_reaction
 *
 * Dependencies:
 * - messageOperations.js: Pure business logic (validation, message creation, reactions)
 * - socketMiddleware.js: Security (room membership verification, error codes)
 * - aiHelper.js: AI mediation for message analysis
 * - autoThreading (optional): Automatic thread assignment
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
const { verifyRoomMembership, emitSocketError, SocketErrorCodes } = require('./socketMiddleware');
const { wrapSocketHandler } = require('./errorBoundary');

// Auto-threading service for semantic thread assignment
let autoThreading = null;
try {
  autoThreading = require('../services/autoThreading');
} catch (err) {
  console.warn('⚠️  Auto-threading service not available:', err.message);
}

function registerMessageHandlers(socket, io, services) {
  // Phase 2: No longer receives activeUsers/messageHistory
  // Services manage their own state via UserSessionService
  const { messageStore, dbSafe, dbPostgres, userSessionService } = services;

  /**
   * Helper to add to message history
   * Uses MessageService for persistence - no in-memory cache needed
   */
  async function addToHistory(message, roomId) {
    try {
      // Use new MessageService if available, fallback to messageStore
      const MessageService = require('../src/services/messages/messageService');
      const messageService = new MessageService();
      
      const userEmail = message.sender?.email || message.user_email || message.email || message.username;
      if (!userEmail) {
        console.error('[addToHistory] No user email found in message:', message);
        return;
      }

      const messageToSave = {
        id: message.id,
        roomId: roomId || message.roomId,
        text: message.text || '',
        type: message.type || 'user',
        threadId: message.threadId || message.thread_id || null,
        threadSequence: message.threadSequence || message.thread_sequence || null,
        socketId: message.socketId || message.socket_id || null,
        private: message.private || false,
        flagged: message.flagged || false,
        metadata: {
          validation: message.validation || message.metadata?.validation || null,
          tip1: message.tip1 || message.metadata?.tip1 || null,
          tip2: message.tip2 || message.metadata?.tip2 || null,
          rewrite: message.rewrite || message.metadata?.rewrite || null,
          originalMessage: message.originalMessage || message.metadata?.originalMessage || null,
        },
        reactions: message.reactions || {},
        user_flagged_by: message.user_flagged_by || [],
        timestamp: message.timestamp || new Date().toISOString(),
      };

      console.log('[addToHistory] Saving message via MessageService:', {
        id: messageToSave.id,
        userEmail,
        text: messageToSave.text?.substring(0, 50),
        type: messageToSave.type,
        roomId: messageToSave.roomId,
      });

      await messageService.createMessage(messageToSave, userEmail);
      console.log('[addToHistory] Message saved successfully via MessageService');

      // Auto-threading: Process message in background (non-blocking)
      // Only process regular user messages, not system/AI messages
      if (autoThreading && message.type !== 'system' && message.type !== 'ai_intervention') {
        setImmediate(() => {
          autoThreading
            .processMessageForThreading(messageToSave, { io })
            .catch(err => console.error('[AutoThreading] Background error:', err.message));
        });
      }
    } catch (err) {
      console.error('❌ Error saving message via MessageService:', err);
      // Fallback to messageStore if available
      if (messageStore) {
        try {
          const messageToSave = { ...message, roomId };
          await messageStore.saveMessage(messageToSave);
          console.log('[addToHistory] Fallback: saved via messageStore');
        } catch (fallbackErr) {
          console.error('❌ Fallback messageStore also failed:', fallbackErr);
          console.error('Message data:', JSON.stringify(message, null, 2));
        }
      } else {
        console.error('Message data:', JSON.stringify(message, null, 2));
      }
    }
  }

  // send_message handler - wrapped with error boundary and retry
  socket.on('send_message', wrapSocketHandler(async data => {
    // Step 1: Validate user is active
    const userValidation = validateActiveUser(userSessionService, socket.id);
    if (!userValidation.valid) {
      emitError(socket, userValidation.error);
      return;
    }
    const { user } = userValidation;

    // CRITICAL: Ensure user.roomId is set from userSessionService
    // This ensures messages are saved to the same room that will be loaded on refresh
    if (!user.roomId) {
      const userEmail = user.email || user.username;
      console.error('[send_message] ERROR: user.roomId is missing!', {
        socketId: socket.id,
        email: userEmail,
        activeUserData: userSessionService.getUserBySocketId(socket.id),
      });
      emitError(socket, 'Room not available. Please rejoin the chat.');
      return;
    }

    // Step 1.5: Verify room membership (security check)
    // Ensures user is actually a member of the room they claim to be in
    const authenticatedUser = socket.data?.authenticatedUser;
    if (authenticatedUser?.id && dbSafe) {
      const isMember = await verifyRoomMembership(authenticatedUser.id, user.roomId, dbSafe);
      if (!isMember) {
        console.warn('[send_message] Room membership verification failed:', {
          userId: authenticatedUser.id,
          roomId: user.roomId,
          socketId: socket.id,
        });
        emitSocketError(
          socket,
          SocketErrorCodes.ROOM_MEMBERSHIP_INVALID,
          'You are not a member of this room.'
        );
        return;
      }
    }

    const userEmail = user.email || user.username;
    console.log('[send_message] User sending message:', {
      email: userEmail,
      roomId: user.roomId,
      socketId: socket.id.substring(0, 20) + '...',
    });

    // Step 2: Validate message text
    const { text, isPreApprovedRewrite, originalRewrite, bypassMediation, optimisticId } = data;
    const textValidation = validateMessageText(text);

    if (!textValidation.valid) {
      if (textValidation.empty) return; // Silent ignore for empty
      emitError(socket, textValidation.error);
      return;
    }

    // Step 3: Get display name and create message
    let displayName;
    try {
      displayName = await getUserDisplayName(userEmail, dbSafe);
    } catch (error) {
      // Non-fatal: use email as fallback
      displayName = userEmail;
    }

    // Create message with sender/receiver structure (async)
    const message = await createUserMessage(
      socket.id,
      user,
      textValidation.cleanText,
      displayName,
      optimisticId,
      dbSafe // Pass dbSafe for receiver lookup
    );

    // Step 4: Delegate to AI mediation handler
    try {
      const { handleAiMediation } = require('./aiHelper');
      await handleAiMediation(socket, io, services, {
        user,
        message,
        data,
        addToHistory,
      });
    } catch (error) {
      console.error('[send_message] AI mediation error:', error.message);
      emitError(socket, 'Failed to send message.', error, 'send_message:aiMediation');

      // Emit message_error for client reconciliation (Invariant I-15)
      if (optimisticId) {
        socket.emit('message_error', {
          optimisticId,
          error: 'Message failed to send',
          code: 'SEND_FAILED',
        });
      }
    }
  }, 'send_message', { retry: true }));

  // edit_message handler
  socket.on('edit_message', async ({ messageId, text }) => {
    // Step 1: Validate user is active
    const userValidation = validateActiveUser(userSessionService, socket.id);
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
      const ownership = await verifyMessageOwnership(messageId, userEmail, user.roomId, dbPostgres);
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
      const MessageService = require('../src/services/messages/messageService');
      const messageService = new MessageService();
      const userEmail = user.email || user.username;
      
      await messageService.updateMessage(messageId, {
        text: textValidation.cleanText,
      }, userEmail);
    } catch (error) {
      console.error('[edit_message] MessageService failed, falling back to dbSafe:', error.message);
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
  });

  // delete_message handler
  socket.on('delete_message', async ({ messageId }) => {
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
      const ownership = await verifyMessageOwnership(messageId, userEmail, user.roomId, dbPostgres);
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
      const MessageService = require('../src/services/messages/messageService');
      const messageService = new MessageService();
      const userEmail = user.email || user.username;
      
      await messageService.deleteMessage(messageId, userEmail);
    } catch (error) {
      console.error('[delete_message] MessageService failed, falling back to dbSafe:', error.message);
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
  });

  // add_reaction handler
  socket.on('add_reaction', async ({ messageId, emoji }) => {
    // Step 1: Validate user and emoji
    const userValidation = validateActiveUser(userSessionService, socket.id);
    if (!userValidation.valid || !emoji) return;
    const { user } = userValidation;

    // Step 2: Add reaction using MessageService
    try {
      const MessageService = require('../src/services/messages/messageService');
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
      console.error('[add_reaction] MessageService failed, falling back to manual update:', error.message);
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
  });
}

module.exports = { registerMessageHandlers };
