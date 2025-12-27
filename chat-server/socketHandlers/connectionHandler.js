/**
 * Socket Connection and Presence Handlers
 *
 * This module handles socket events with clear separation:
 * - Business logic delegated to connectionOperations.js
 * - Error handling consolidated at handler boundaries
 */

const { emitError } = require('./utils');
const {
  validateUserInput,
  getUserByUsername,
  resolveUserRoom,
  disconnectDuplicateConnections,
  registerActiveUser,
  getMessageHistory,
  createSystemMessage,
  saveSystemMessage,
  getRoomUsers,
} = require('./connectionOperations');

function registerConnectionHandlers(socket, io, services) {
  const { auth, roomManager, dbSafe, dbPostgres, userSessionService } = services;

  // join handler
  socket.on('join', async ({ username }) => {
    // Step 1: Validate input
    const validation = validateUserInput(username);
    if (!validation.valid) {
      emitError(socket, validation.error);
      return;
    }
    const { cleanUsername } = validation;

    // Step 2: Get user by username
    let user;
    try {
      user = await getUserByUsername(cleanUsername, auth);
    } catch (error) {
      emitError(socket, 'Failed to verify user.', error, 'join:getUserByUsername');
      return;
    }

    if (!user) {
      emitError(socket, 'User not found.');
      return;
    }

    // Step 3: Resolve room
    let roomId, roomName;
    try {
      const room = await resolveUserRoom(user, cleanUsername, dbPostgres, roomManager);
      if (!room || !room.roomId) {
        emitError(socket, 'No room available. You must be connected to a co-parent.');
        return;
      }
      roomId = room.roomId;
      roomName = room.roomName;
      user.room = { roomId, roomName };
      user.roomId = roomId; // CRITICAL: Set roomId on user object for message handlers
      console.log('[join] Resolved room:', {
        roomId: roomId,
        roomName: roomName,
        username: cleanUsername,
        userId: user.id,
      });
    } catch (error) {
      console.error('[join] Error resolving room:', error);
      emitError(socket, 'Failed to join chat room.', error, 'join:resolveRoom');
      return;
    }

    // Step 4: Handle duplicate connections (no error possible, just cleanup)
    disconnectDuplicateConnections(userSessionService, io, roomId, cleanUsername, socket.id);

    // Step 5: Join room and register
    socket.join(roomId);
    registerActiveUser(userSessionService, socket.id, cleanUsername, roomId);

    // Step 6: Ensure contacts for room members
    let members = [];
    try {
      members = await roomManager.getRoomMembers(roomId);
      if (members.length > 1) {
        await roomManager.ensureContactsForRoomMembers(roomId);
      }
    } catch (error) {
      // Non-fatal: log but continue
      console.error('Error ensuring contacts:', error);
    }

    // Step 7: Get message history
    let historyResult;
    try {
      console.log('[join] Loading message history for room:', roomId, 'user:', cleanUsername);
      historyResult = await getMessageHistory(roomId, dbPostgres);
      console.log('[join] Sending message_history:', {
        messageCount: historyResult.messages.length,
        hasMore: historyResult.hasMore,
        roomId: roomId,
      });
    } catch (error) {
      console.error('[join] Error loading message history:', error);
      emitError(socket, 'Failed to load message history.', error, 'join:getMessageHistory');
      return;
    }

    socket.emit('message_history', {
      messages: historyResult.messages,
      hasMore: historyResult.hasMore,
    });

    // Step 8: Create and save system message
    const systemMessage = createSystemMessage(
      socket.id,
      `${cleanUsername} joined the chat`,
      roomId
    );

    try {
      await saveSystemMessage(systemMessage, dbSafe);
    } catch (error) {
      // Non-fatal: log but continue
      console.error('Error saving join message:', error);
    }

    // Step 9: Broadcast join event
    const roomUsers = getRoomUsers(userSessionService, roomId);

    io.to(roomId).emit('user_joined', {
      message: systemMessage,
      users: roomUsers,
      roomMembers: members,
    });

    socket.emit('join_success', {
      username: cleanUsername,
      roomId,
      roomName: roomName || user.room?.roomName || `${cleanUsername}'s Room`,
      users: roomUsers,
      roomMembers: members,
    });
  });

  // typing handler
  socket.on('typing', ({ isTyping }) => {
    const user = activeUsers.get(socket.id);
    if (user?.roomId) {
      socket.to(user.roomId).emit('user_typing', { username: user.username, isTyping });
    }
  });

  // disconnect handler
  socket.on('disconnect', async () => {
    const user = userSessionService.getUserBySocketId(socket.id);
    if (!user) return;

    const { roomId, username } = user;
    userSessionService.disconnectUser(socket.id);

    const systemMessage = createSystemMessage(socket.id, `${username} left the chat`, roomId);

    // Save disconnect message (non-fatal if fails)
    try {
      await dbPostgres.query(
        `INSERT INTO messages (id, type, username, text, timestamp, room_id) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          systemMessage.id,
          systemMessage.type,
          systemMessage.username,
          systemMessage.text,
          systemMessage.timestamp,
          roomId,
        ]
      );
    } catch (error) {
      // Silently ignore - user is disconnecting anyway
    }

    const roomUsers = getRoomUsers(userSessionService, roomId);
    io.to(roomId).emit('user_left', { message: systemMessage, users: roomUsers });
  });
}

module.exports = { registerConnectionHandlers };

