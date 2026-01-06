/**
 * Socket Connection and Presence Handlers
 *
 * Thin handler layer - delegates to use cases, emits events based on results.
 */

const { emitError } = require('./utils');
const { joinRoom } = require('./connectionOperations/joinRoom');
const { getRoomUsers } = require('./connectionOperations/sessionManagement');
const { maybeAnalyzeRoomOnJoin } = require('./threadHandler');

function registerConnectionHandlers(socket, io, services) {
  // Phase 2: No longer receives activeUsers/messageHistory
  // Services manage their own state via UserSessionService
  const { userSessionService } = services;
  
  // Initialize presence service if available
  let presenceService = null;
  try {
    const { PresenceService } = require('../src/services/presence/presenceService');
    presenceService = new PresenceService();
  } catch (error) {
    // Presence service is optional - graceful degradation
    console.warn('[ConnectionHandler] Presence service not available:', error.message);
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
    // DEBUG: Log first message format to diagnose ownership issue
    if (result.messages?.length > 0) {
      const firstMsg = result.messages[0];
      console.log('[ConnectionHandler] DEBUG: First message format:', {
        id: firstMsg.id,
        sender: firstMsg.sender, // Full sender object with uuid, first_name
        user_email: firstMsg.user_email,
        hasReceiver: !!firstMsg.receiver,
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
        console.warn('[ConnectionHandler] Failed to set presence:', err.message);
      });
    }

    // Note: Thread analysis is now triggered automatically in JoinSocketRoomUseCase
    // when the room is resolved. This ensures analysis runs even if join event is not explicitly emitted.
    // Keeping this as a fallback for backwards compatibility, but it should be redundant now.
    if (services.threadManager) {
      console.log(
        `[ConnectionHandler] 🔍 DEBUG: Analysis should already be triggered in use case, but keeping fallback for room ${result.roomId}`
      );
      // Analysis is now automatic in JoinSocketRoomUseCase - this is just a fallback
      maybeAnalyzeRoomOnJoin(io, result.roomId, services.threadManager).catch(err => {
        console.error('[ConnectionHandler] Fallback analysis failed (non-fatal):', err.message);
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
        console.warn('[ConnectionHandler] Failed to remove presence:', err.message);
      });
    }
    
    await userSessionService.disconnectUser(socket.id);

    const roomUsers = getRoomUsers(userSessionService, roomId);
    io.to(roomId).emit('user_left', { users: roomUsers });
  });
}

module.exports = { registerConnectionHandlers };
