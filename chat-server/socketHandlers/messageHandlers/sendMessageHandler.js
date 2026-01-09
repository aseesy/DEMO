/**
 * Send Message Handler
 *
 * Single Responsibility: Handle send_message socket events.
 *
 * Handles:
 * - User validation
 * - Room membership verification
 * - Message text validation
 * - Message creation
 * - AI mediation delegation
 */

const { emitError, getUserDisplayName } = require('../utils');
const {
  validateMessageText,
  validateActiveUser,
  createUserMessage,
} = require('../messageOperations');
const { verifyRoomMembership, emitSocketError, SocketErrorCodes } = require('../socketMiddleware');
const { wrapSocketHandler } = require('../errorBoundary');
const { addToHistory } = require('./messagePersistence');
const { defaultLogger } = require('../../src/infrastructure/logging/logger');

/**
 * Register send_message handler
 *
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} services - Service dependencies
 */
function registerSendMessageHandler(socket, io, services) {
  const { dbSafe, userSessionService } = services;
  const logger = defaultLogger.child({ handler: 'send_message' });

  socket.on(
    'send_message',
    wrapSocketHandler(
      async data => {
        // DEBUG: Log immediately when message is received
        console.log('[sendMessageHandler] 📨 MESSAGE RECEIVED:', {
          hasText: !!data?.text,
          textPreview: data?.text?.substring(0, 50),
          socketId: socket.id?.substring(0, 20),
          timestamp: new Date().toISOString(),
        });

        // Step 1: Validate user is active
        const userValidation = await validateActiveUser(userSessionService, socket.id);
        if (!userValidation.valid) {
          emitError(socket, userValidation.error);
          return;
        }
        const { user } = userValidation;

        // CRITICAL: Ensure user.roomId is set from userSessionService
        // This ensures messages are saved to the same room that will be loaded on refresh
        if (!user.roomId) {
          const userEmail = user.email || user.username;
          const activeUserData = await userSessionService.getUserBySocketId(socket.id);
          logger.error('user.roomId is missing', {
            socketId: socket.id.substring(0, 20) + '...',
            hasEmail: !!userEmail,
            hasActiveUserData: !!activeUserData,
            // Don't log email or socket ID - PII
          });
          emitError(socket, 'Room not available. Please rejoin the chat.');
          return;
        }

        // Step 1.5: Verify room membership (security check)
        // Ensures user is actually a member of the room they claim to be in
        // TRUST THE MIDDLEWARE: If we reach here, socket.user exists (connection event only fires after successful auth)
        if (socket.user?.id && dbSafe) {
          const isMember = await verifyRoomMembership(socket.user.id, user.roomId, dbSafe);
          if (!isMember) {
            logger.warn('Room membership verification failed', {
              userId: socket.user.id,
              roomId: user.roomId,
              socketId: socket.id.substring(0, 20) + '...',
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
        logger.debug('User sending message', {
          hasEmail: !!userEmail,
          roomId: user.roomId,
          // Don't log email - PII
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
          // Log service availability for debugging
          logger.debug('Delegating to AI mediation', {
            messageId: message.id,
            hasAiMediator: !!services.aiMediator,
            hasUserSessionService: !!services.userSessionService,
            servicesKeys: Object.keys(services || {}),
          });

          const { handleAiMediation } = require('../aiHelper');
          await handleAiMediation(socket, io, services, {
            user,
            message,
            data,
            addToHistory: (msg, roomId, opts) => addToHistory(msg, roomId, { ...opts, socket, io }),
          });
        } catch (error) {
          logger.error('❌ AI mediation error in sendMessageHandler', error, {
            errorCode: error.code,
            handler: 'send_message:aiMediation',
            errorMessage: error.message,
            errorStack: error.stack?.substring(0, 200),
          });
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
      },
      'send_message',
      { retry: true }
    )
  );
}

module.exports = {
  registerSendMessageHandler,
};
