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

    // Trigger thread analysis (non-blocking)
    if (services.threadManager) {
      maybeAnalyzeRoomOnJoin(io, result.roomId, services.threadManager);
    }
  });

  socket.on('typing', ({ isTyping }) => {
    const user = userSessionService.getUserBySocketId(socket.id);
    if (user?.roomId) {
      socket.to(user.roomId).emit('user_typing', {
        email: user.email || user.username,
        username: user.email || user.username,
        isTyping,
      });
    }
  });

  socket.on('disconnect', async () => {
    const user = userSessionService.getUserBySocketId(socket.id);
    if (!user) return;

    const { roomId } = user;
    await userSessionService.disconnectUser(socket.id);

    const roomUsers = getRoomUsers(userSessionService, roomId);
    io.to(roomId).emit('user_left', { users: roomUsers });
  });
}

module.exports = { registerConnectionHandlers };
