/**
 * Socket Connection and Presence Handlers
 */
const { sanitizeInput, validateUsername, MAX_MESSAGE_HISTORY } = require('../utils');
const { getUserDisplayName } = require('./utils');

function registerConnectionHandlers(socket, io, services, activeUsers, messageHistory) {
  const { auth, roomManager, dbSafe, dbPostgres } = services;

  // join handler
  socket.on('join', async ({ username }) => {
    try {
      const cleanUsername = sanitizeInput(username);
      if (!validateUsername(cleanUsername)) {
        socket.emit('error', { message: 'Invalid username. Must be 2-20 characters.' });
        return;
      }

      const user = await auth.getUser(cleanUsername);
      if (!user) {
        socket.emit('error', { message: 'User not found.' });
        return;
      }

      let roomId;
      if (!user.room) {
        const newRoom = await roomManager.createPrivateRoom(user.id, cleanUsername);
        roomId = newRoom.roomId;
        user.room = newRoom;
      } else {
        roomId = user.room.roomId;
      }

      // Handle duplicate connections
      for (const [socketId, userData] of activeUsers.entries()) {
        if (userData.roomId === roomId && userData.username.toLowerCase() === cleanUsername.toLowerCase() && socketId !== socket.id) {
          const oldSocket = io.sockets.sockets.get(socketId);
          if (oldSocket) {
            oldSocket.emit('replaced_by_new_connection', { message: 'Disconnected by another login.' });
            oldSocket.disconnect(true);
          }
          activeUsers.delete(socketId);
        }
      }

      socket.join(roomId);
      activeUsers.set(socket.id, {
        username: cleanUsername,
        roomId,
        joinedAt: new Date().toISOString(),
        socketId: socket.id
      });

      const members = await roomManager.getRoomMembers(roomId);
      if (members.length > 1) await roomManager.ensureContactsForRoomMembers(roomId);

      const MESSAGE_LIMIT = 500;

      // Get total count to determine if there are more messages
      const countQuery = `SELECT COUNT(*) as total FROM messages WHERE room_id = $1`;
      const countResult = await dbPostgres.query(countQuery, [roomId]);
      const totalMessages = parseInt(countResult.rows[0]?.total || 0, 10);

      const historyQuery = `
        SELECT m.*, u.display_name, u.first_name
        FROM messages m
        LEFT JOIN users u ON LOWER(m.username) = LOWER(u.username)
        WHERE m.room_id = $1
        ORDER BY m.timestamp ASC
        LIMIT ${MESSAGE_LIMIT}
      `;
      const result = await dbPostgres.query(historyQuery, [roomId]);

      const roomHistory = result.rows.map(msg => ({
        id: msg.id,
        type: msg.type,
        username: msg.username,
        displayName: msg.first_name || msg.display_name || msg.username,
        text: msg.text,
        timestamp: msg.timestamp,
        threadId: msg.thread_id || null,
        edited: msg.edited === 1 || msg.edited === '1',
        reactions: JSON.parse(msg.reactions || '{}'),
        user_flagged_by: JSON.parse(msg.user_flagged_by || '[]')
      }));

      // Send history with hasMore flag
      socket.emit('message_history', { messages: roomHistory, hasMore: totalMessages > MESSAGE_LIMIT });

      const systemMessage = {
        id: `${Date.now()}-${socket.id}`,
        type: 'system',
        username: 'System',
        text: `${cleanUsername} joined the chat`,
        timestamp: new Date().toISOString(),
        roomId
      };

      await dbSafe.safeInsert('messages', {
        id: systemMessage.id,
        type: systemMessage.type,
        username: systemMessage.username,
        text: systemMessage.text,
        timestamp: systemMessage.timestamp,
        room_id: roomId
      });

      const roomUsers = Array.from(activeUsers.values())
        .filter(u => u.roomId === roomId)
        .map(u => ({ username: u.username, joinedAt: u.joinedAt }));

      io.to(roomId).emit('user_joined', { message: systemMessage, users: roomUsers, roomMembers: members });
      socket.emit('join_success', {
        username: cleanUsername,
        roomId,
        roomName: user.room?.roomName || `${cleanUsername}'s Room`,
        users: roomUsers,
        roomMembers: members
      });
    } catch (error) {
      console.error('Error in join handler:', error);
      socket.emit('error', { message: 'Failed to join chat room.' });
    }
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
    const user = activeUsers.get(socket.id);
    if (user) {
      const { roomId, username } = user;
      activeUsers.delete(socket.id);

      const systemMessage = {
        id: `${Date.now()}-${socket.id}`,
        type: 'system',
        username: 'System',
        text: `${username} left the chat`,
        timestamp: new Date().toISOString(),
        roomId
      };

      try {
        await dbPostgres.query(
          `INSERT INTO messages (id, type, username, text, timestamp, room_id) VALUES ($1, $2, $3, $4, $5, $6)`,
          [systemMessage.id, systemMessage.type, systemMessage.username, systemMessage.text, systemMessage.timestamp, roomId]
        );
      } catch (err) {}

      const roomUsers = Array.from(activeUsers.values())
        .filter(u => u.roomId === roomId)
        .map(u => ({ username: u.username, joinedAt: u.joinedAt }));

      io.to(roomId).emit('user_left', { message: systemMessage, users: roomUsers });
    }
  });
}

module.exports = { registerConnectionHandlers };





