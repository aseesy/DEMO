/**
 * Socket Connection and Presence Handlers
 *
 * Thin handler layer - delegates to use cases, emits events based on results.
 */

const { emitError } = require('./utils');
const { joinRoom } = require('./connectionOperations/joinRoom');
const { getRoomUsers } = require('./connectionOperations/sessionManagement');
const { maybeAnalyzeRoomOnJoin } = require('./threadHandler');
const { defaultLogger } = require('../src/infrastructure/logging/logger');

function registerConnectionHandlers(socket, io, services) {
  // Phase 2: No longer receives activeUsers/messageHistory
  // Services manage their own state via UserSessionService
  const { userSessionService } = services;
  const logger = defaultLogger.child({ handler: 'connection' });

  // Initialize presence service if available
  let presenceService = null;
  try {
    const { PresenceService } = require('../src/services/presence/presenceService');
    presenceService = new PresenceService();
  } catch (error) {
    // Presence service is optional - graceful degradation
    logger.warn('Presence service not available', { error: error.message });
  }

  socket.on('join', async ({ email, username }) => {
    const userIdentifier = email || username;
    if (!userIdentifier) {
      emitError(socket, 'Email is required.');
      return;
    }

    const result = await joinRoom(userIdentifier, socket.id, { ...services, io });

    if (!result.success) {
      emitError(socket, result.error, null, result.errorContext);
      return;
    }

    // Join socket room
    socket.join(result.roomId);

    // Emit events
    // DEBUG: Log first message format to diagnose ownership issue (dev only)
    if (result.messages?.length > 0) {
      const firstMsg = result.messages[0];
      logger.debug('First message format in history', {
        messageId: firstMsg.id,
        hasSender: !!firstMsg.sender,
        hasUserEmail: !!firstMsg.user_email,
        hasReceiver: !!firstMsg.receiver,
        // Don't log email or sender details - PII
      });
    }
    socket.emit('message_history', {
      messages: result.messages,
      hasMore: result.hasMore,
    });

    io.to(result.roomId).emit('user_joined', {
      users: result.roomUsers,
      roomMembers: result.roomMembers,
    });

    socket.emit('join_success', {
      email: result.email,
      username: result.email,
      roomId: result.roomId,
      roomName: result.roomName,
      users: result.roomUsers,
      roomMembers: result.roomMembers,
    });

    // Update presence (non-blocking)
    if (presenceService && result.email) {
      presenceService.setOnline(result.email, socket.id, result.roomId).catch(err => {
        logger.warn('Failed to set presence', {
          error: err.message,
          errorCode: err.code,
          roomId: result.roomId,
          // Don't log email - PII
        });
      });
    }

    // Note: Thread analysis is now triggered automatically in JoinSocketRoomUseCase
    // when the room is resolved. This ensures analysis runs even if join event is not explicitly emitted.
    // REMOVED: The fallback call to maybeAnalyzeRoomOnJoin was causing duplicate analysis complete events.
    // The use case already handles this, so we don't need the fallback anymore.
    if (services.threadManager) {
      logger.debug('Analysis triggered in use case - skipping fallback to prevent duplicates', {
        roomId: result.roomId,
      });
    }
  });

  socket.on('typing', async ({ isTyping }) => {
    const user = await userSessionService.getUserBySocketId(socket.id);
    if (user?.roomId) {
      socket.to(user.roomId).emit('user_typing', {
        email: user.email || user.username,
        username: user.email || user.username,
        isTyping,
      });
    }
  });

  socket.on('disconnect', async () => {
    const user = await userSessionService.getUserBySocketId(socket.id);
    if (!user) return;

    const { roomId, email } = user;

    // Update presence (non-blocking)
    if (presenceService && email) {
      presenceService.setOffline(email, socket.id).catch(err => {
        logger.warn('Failed to remove presence', {
          error: err.message,
          errorCode: err.code,
          // Don't log email - PII
        });
      });
    }

    await userSessionService.disconnectUser(socket.id);

    const roomUsers = getRoomUsers(userSessionService, roomId);
    io.to(roomId).emit('user_left', { users: roomUsers });
  });
}

module.exports = { registerConnectionHandlers };
