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

const { defaultLogger } = require('../../src/infrastructure/logging/logger');

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
  const logger = defaultLogger.child({ function: 'addToHistory' });

  const userEmail =
    message.sender?.email || message.user_email || message.email || message.username;
  if (!userEmail) {
    logger.error('No user email found in message', {
      messageId: message.id,
      hasSender: !!message.sender,
      hasUserEmail: !!message.user_email,
      hasEmail: !!message.email,
      hasUsername: !!message.username,
    });
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
    logger.debug('Saving message via MessageService', {
      messageId: messageToSave.id,
      text: messageToSave.text?.substring(0, 50),
      type: messageToSave.type,
      roomId: messageToSave.roomId,
      // Don't log userEmail - PII
    });

    // MessageService has built-in retry logic for transient database errors
    await messageService.createMessage(messageToSave, userEmail, { retry: true, maxRetries: 3 });

    logger.debug('Message saved successfully via MessageService', {
      messageId: messageToSave.id,
    });

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
          .catch(err => {
            logger.warn('AutoThreading background error', {
              error: err.message,
              errorCode: err.code,
              messageId: messageToSave.id,
            });
          });
      });
    }

    // Topic Detection: Assign message to topics for AI summaries (non-blocking)
    // Only process regular user messages with sufficient text content
    // Note: Runs in background after embedding generation
    if (
      message.type !== 'system' &&
      message.type !== 'ai_intervention' &&
      messageToSave.text &&
      messageToSave.text.length > 10 &&
      options.io
    ) {
      setImmediate(async () => {
        try {
          // Step 1: Generate and store embedding for this message
          // Required for topic similarity matching
          const { storeMessageEmbedding } = require('../../src/core/memory/narrativeMemory');
          const embeddingStored = await storeMessageEmbedding(messageToSave.id, messageToSave.text);

          if (!embeddingStored) {
            // Can't do topic detection without embedding - exit silently
            return;
          }

          // Step 2: Try to assign to existing topic
          const { getTopicService } = require('../../src/services/topics');
          const { broadcastMessageAddedToTopic } = require('../topicsHandler');

          const topicService = getTopicService();
          const topicId = await topicService.detector.assignMessageToTopic(
            { id: messageToSave.id, text: messageToSave.text },
            messageToSave.roomId
          );

          if (topicId) {
            // Add message to existing topic
            await topicService.addMessageToTopic(messageToSave.id, topicId);

            // Broadcast to subscribers
            broadcastMessageAddedToTopic(options.io, messageToSave.roomId, topicId, messageToSave.id);

            logger.info('Message assigned to topic', {
              messageId: messageToSave.id,
              topicId,
              roomId: messageToSave.roomId,
            });
          }
          // If no matching topic, message will be picked up by next manual/scheduled detection
        } catch (err) {
          // Topic detection is non-critical - log and continue
          logger.warn('TopicDetection background error', {
            error: err.message,
            errorCode: err.code,
            messageId: messageToSave.id,
          });
        }
      });
    }

    // Conversation Threading: Queue room for thread processing (debounced)
    // Uses new conversation-based threading that groups messages by time windows
    if (
      message.type !== 'system' &&
      message.type !== 'ai_intervention' &&
      messageToSave.text &&
      messageToSave.text.length > 0
    ) {
      setImmediate(() => {
        try {
          const { getThreadService } = require('../../src/services/threads');
          const threadService = getThreadService();
          // Queue processing with 30-second debounce per room
          threadService.queueProcessing(messageToSave.roomId);
        } catch (err) {
          // Thread processing is non-critical - log and continue
          logger.warn('ThreadProcessing queue error', {
            error: err.message,
            errorCode: err.code,
            roomId: messageToSave.roomId,
          });
        }
      });
    }

    return true; // Success
  } catch (err) {
    // MessageService handles retries internally, so if we get here, it's a persistent error
    logger.error('Error saving message (after retries)', err, {
      errorCode: err.code,
      messageId: messageToSave.id,
      roomId: messageToSave.roomId,
      messageType: messageToSave.type,
      // Don't log userEmail or message text - PII
    });

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
