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
  getUserByEmail,
  getUserByUsername, // Deprecated - for backward compatibility
  resolveUserRoom,
  disconnectDuplicateConnections,
  registerActiveUser,
  getMessageHistory,
  createSystemMessage,
  saveSystemMessage,
  getRoomUsers,
} = require('./connectionOperations');
const { maybeAnalyzeRoomOnJoin } = require('./threadHandler');

function registerConnectionHandlers(socket, io, services) {
  const { auth, roomManager, dbSafe, dbPostgres, userSessionService } = services;

  // join handler - now accepts email instead of username
  socket.on('join', async ({ email, username }) => {
    console.log('[join] Received join event:', { email, username, socketId: socket.id });
    // Support both email and username for backward compatibility during migration
    const userIdentifier = email || username;
    if (!userIdentifier) {
      console.log('[join] No email or username provided');
      emitError(socket, 'Email is required.');
      return;
    }

    // Step 1: Validate input
    const validation = validateUserInput(userIdentifier);
    if (!validation.valid) {
      emitError(socket, validation.error);
      return;
    }
    const { cleanEmail } = validation;

    // Step 2: Get user by email
    let user;
    try {
      user = await getUserByEmail(cleanEmail, auth);
    } catch (error) {
      emitError(socket, 'Failed to verify user.', error, 'join:getUserByEmail');
      return;
    }

    if (!user) {
      console.log('[join] User not found for email:', cleanEmail);
      emitError(socket, 'User not found.');
      return;
    }

    // Step 3: Resolve room
    let roomId, roomName;
    try {
      const room = await resolveUserRoom(user, cleanEmail, dbPostgres, roomManager);
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
        email: cleanEmail,
        userId: user.id,
      });
    } catch (error) {
      console.error('[join] Error resolving room:', error);
      emitError(socket, 'Failed to join chat room.', error, 'join:resolveRoom');
      return;
    }

    // Step 4: Handle duplicate connections (no error possible, just cleanup)
    disconnectDuplicateConnections(userSessionService, io, roomId, cleanEmail, socket.id);

    // Step 5: Join room and register
    socket.join(roomId);
    registerActiveUser(userSessionService, socket.id, cleanEmail, roomId);

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
      console.log('[join] Loading message history for room:', roomId, 'user:', cleanEmail);
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
    const displayName = user.displayName || user.firstName || cleanEmail;
    const systemMessage = createSystemMessage(
      socket.id,
      `${displayName} joined the chat`,
      roomId,
      cleanEmail
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
      email: cleanEmail,
      username: cleanEmail, // Backward compatibility
      roomId,
      roomName: roomName || user.room?.roomName || `${displayName}'s Room`,
      users: roomUsers,
      roomMembers: members,
    });

    // Server-side thread analysis trigger
    // Checks if room needs analysis and triggers it automatically (non-blocking)
    if (services.threadManager) {
      maybeAnalyzeRoomOnJoin(io, roomId, services.threadManager);
    }
  });

  // typing handler
  socket.on('typing', ({ isTyping }) => {
    const user = userSessionService.getUserBySocketId(socket.id);
    if (user?.roomId) {
      const userEmail = user.email || user.username;
      socket
        .to(user.roomId)
        .emit('user_typing', { email: userEmail, username: userEmail, isTyping });
    }
  });

  // disconnect handler
  socket.on('disconnect', async () => {
    const user = userSessionService.getUserBySocketId(socket.id);
    if (!user) return;

    const { roomId } = user;
    const userEmail = user.email || user.username;
    userSessionService.disconnectUser(socket.id);

    const displayName = user.displayName || user.firstName || userEmail;
    const systemMessage = createSystemMessage(
      socket.id,
      `${displayName} left the chat`,
      roomId,
      userEmail
    );

    // Save disconnect message (non-fatal if fails)
    try {
      await dbPostgres.query(
        `INSERT INTO messages (id, type, user_email, text, timestamp, room_id) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          systemMessage.id,
          systemMessage.type,
          systemMessage.user_email || 'system@liaizen.app',
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
