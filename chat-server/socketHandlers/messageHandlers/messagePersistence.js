/**
 * Message Persistence Helper
 *
 * Single Responsibility: Persist messages to database with auto-threading.
 *
 * Handles:
 * - Message saving via MessageService
 * - Auto-threading (background processing)
 * - Error handling and retries
 */

/**
 * Add message to history
 * Uses MessageService with built-in retry logic - single source of truth for persistence
 *
 * @param {Object} message - Message to save
 * @param {string} roomId - Room ID
 * @param {Object} options - Optional: { socket, io } for error notification and auto-threading
 * @returns {Promise<boolean>} True if saved successfully, false otherwise
 */
async function addToHistory(message, roomId, options = {}) {
  const MessageService = require('../../src/services/messages/messageService');
  const messageService = new MessageService();

  const userEmail =
    message.sender?.email || message.user_email || message.email || message.username;
  if (!userEmail) {
    console.error('[addToHistory] No user email found in message:', message);
    return false;
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

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[addToHistory] Saving message via MessageService:', {
        id: messageToSave.id,
        userEmail,
        text: messageToSave.text?.substring(0, 50),
        type: messageToSave.type,
        roomId: messageToSave.roomId,
      });
    }

    // MessageService has built-in retry logic for transient database errors
    await messageService.createMessage(messageToSave, userEmail, { retry: true, maxRetries: 3 });

    if (process.env.NODE_ENV !== 'production') {
      console.log('[addToHistory] Message saved successfully via MessageService');
    }

    // Auto-threading: Process message in background (non-blocking)
    // Only process regular user messages, not system/AI messages
    let autoThreading = null;
    try {
      autoThreading = require('../../services/autoThreading');
    } catch (err) {
      // Auto-threading service not available - non-fatal
    }

    if (
      autoThreading &&
      message.type !== 'system' &&
      message.type !== 'ai_intervention' &&
      options.io
    ) {
      setImmediate(() => {
        autoThreading
          .processMessageForThreading(messageToSave, { io: options.io })
          .catch(err => console.error('[AutoThreading] Background error:', err.message));
      });
    }
    return true; // Success
  } catch (err) {
    // MessageService handles retries internally, so if we get here, it's a persistent error
    console.error('❌ Error saving message (after retries):', {
      error: err.message,
      code: err.code,
      messageId: messageToSave.id,
      roomId: messageToSave.roomId,
      userEmail,
    });
    // Log full message data for debugging
    console.error('Message data:', JSON.stringify(messageToSave, null, 2));

    // Notify client of persistent save failure if socket provided
    if (options.socket && options.socket.connected) {
      options.socket.emit('message_save_failed', {
        messageId: messageToSave.id,
        error: 'Message could not be saved. It may not appear after refresh.',
        code: 'PERSIST_FAILED',
      });
    }

    return false; // Failure
  }
}

module.exports = {
  addToHistory,
};
