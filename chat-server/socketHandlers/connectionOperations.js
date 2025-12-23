/**
 * Connection Operations - Pure business logic for connection handling
 *
 * These functions contain business logic without error handling.
 * Error handling is done by the caller (connectionHandler.js).
 */

const { sanitizeInput, validateUsername } = require('../utils');
const pairingManager = require('../libs/pairing-manager');

/**
 * Validation result type
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string} [error]
 * @property {string} [cleanUsername]
 */

/**
 * Validate and sanitize username
 * @param {string} username - Raw username input
 * @returns {ValidationResult}
 */
function validateUserInput(username) {
  const cleanUsername = sanitizeInput(username);

  if (!validateUsername(cleanUsername)) {
    return {
      valid: false,
      error: 'Invalid username. Must be 2-20 characters.',
    };
  }

  return { valid: true, cleanUsername };
}

/**
 * Get user by username
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 *
 * @param {string} cleanUsername - Sanitized username
 * @param {Object} auth - Auth service
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserByUsername(cleanUsername, auth) {
  return auth.getUser(cleanUsername);
}

/**
 * Room resolution result
 * @typedef {Object} RoomResolution
 * @property {string} roomId
 * @property {string} roomName
 */

/**
 * Get user's existing room (pure lookup - no side effects)
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 *
 * @param {Object} user - User object with id
 * @param {string} cleanUsername - Username for logging
 * @param {Object} dbPostgres - Database connection
 * @param {Object} roomManager - Room manager service
 * @returns {Promise<RoomResolution|null>} Room info or null if no room exists
 */
async function getExistingUserRoom(user, cleanUsername, dbPostgres, roomManager) {
  // First check if user has an active pairing with shared_room_id
  const activePairing = await pairingManager.getActivePairing(user.id, dbPostgres);

  if (activePairing && activePairing.shared_room_id) {
    const roomId = activePairing.shared_room_id;
    console.log(`[join] User ${cleanUsername} has active pairing, using shared room: ${roomId}`);

    const roomResult = await dbPostgres.query('SELECT name FROM rooms WHERE id = $1', [roomId]);
    const roomName = roomResult.rows[0]?.name || 'Co-Parenting Room';

    return { roomId, roomName };
  }

  // Check for existing room membership
  const existingRoom = await roomManager.getUserRoom(user.id);

  if (existingRoom) {
    console.log(`[join] User ${cleanUsername} has existing room: ${existingRoom.roomId}`);
    return { roomId: existingRoom.roomId, roomName: existingRoom.roomName };
  }

  return null;
}

/**
 * Resolve or create user's room
 * SIDE EFFECT: May create a new room if none exists
 *
 * @param {Object} user - User object with id
 * @param {string} cleanUsername - Username for logging
 * @param {Object} dbPostgres - Database connection
 * @param {Object} roomManager - Room manager service
 * @returns {Promise<RoomResolution>}
 */
async function resolveOrCreateUserRoom(user, cleanUsername, dbPostgres, roomManager) {
  // Try to get existing room first (pure lookup)
  const existingRoom = await getExistingUserRoom(user, cleanUsername, dbPostgres, roomManager);

  if (existingRoom) {
    return existingRoom;
  }

  // No room found - users should not have personal rooms
  // They must be connected to a co-parent to have a room
  console.log(`[join] User ${cleanUsername} has no room. Users must be connected to a co-parent.`);
  return null;
}

/**
 * @deprecated Use getExistingUserRoom() for pure lookup or resolveOrCreateUserRoom() for creation
 */
async function resolveUserRoom(user, cleanUsername, dbPostgres, roomManager) {
  return resolveOrCreateUserRoom(user, cleanUsername, dbPostgres, roomManager);
}

/**
 * Handle duplicate connections for same user in same room
 *
 * SIDE EFFECTS (explicit):
 *   1. Emits 'replaced_by_new_connection' to old sockets
 *   2. Disconnects old sockets
 *   3. Deletes entries from activeUsers Map
 *
 * @param {Map} activeUsers - Active users map (will be mutated)
 * @param {Object} io - Socket.io server
 * @param {string} roomId - Room ID
 * @param {string} cleanUsername - Username to check
 * @param {string} currentSocketId - Current socket ID to exclude
 */
function disconnectDuplicateConnections(activeUsers, io, roomId, cleanUsername, currentSocketId) {
  for (const [socketId, userData] of activeUsers.entries()) {
    if (
      userData.roomId === roomId &&
      userData.username.toLowerCase() === cleanUsername.toLowerCase() &&
      socketId !== currentSocketId
    ) {
      const oldSocket = io.sockets.sockets.get(socketId);
      if (oldSocket) {
        oldSocket.emit('replaced_by_new_connection', {
          message: 'Disconnected by another login.',
        });
        oldSocket.disconnect(true);
      }
      activeUsers.delete(socketId);
    }
  }
}

/**
 * Register user in active users map
 * SIDE EFFECT: Mutates activeUsers Map
 *
 * @param {Map} activeUsers - Active users map (will be mutated)
 * @param {string} socketId - Socket ID
 * @param {string} cleanUsername - Username
 * @param {string} roomId - Room ID
 */
function registerActiveUser(activeUsers, socketId, cleanUsername, roomId) {
  activeUsers.set(socketId, {
    username: cleanUsername,
    roomId,
    joinedAt: new Date().toISOString(),
    socketId,
  });
}

/**
 * Message history result
 * @typedef {Object} MessageHistoryResult
 * @property {Array} messages
 * @property {boolean} hasMore
 */

/**
 * Get room message history
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 *
 * @param {string} roomId - Room ID
 * @param {Object} dbPostgres - Database connection
 * @param {number} limit - Maximum messages to fetch
 * @returns {Promise<MessageHistoryResult>}
 */
async function getMessageHistory(roomId, dbPostgres, limit = 500) {
  // Get total count
  const countResult = await dbPostgres.query(
    'SELECT COUNT(*) as total FROM messages WHERE room_id = $1',
    [roomId]
  );
  const totalMessages = parseInt(countResult.rows[0]?.total || 0, 10);

  // Get messages
  const historyQuery = `
    SELECT m.*, u.display_name, u.first_name
    FROM messages m
    LEFT JOIN users u ON LOWER(m.username) = LOWER(u.username)
    WHERE m.room_id = $1
    ORDER BY m.timestamp ASC
    LIMIT ${limit}
  `;
  const result = await dbPostgres.query(historyQuery, [roomId]);

  const messages = result.rows.map(msg => ({
    id: msg.id,
    type: msg.type,
    username: msg.username,
    displayName: msg.first_name || msg.display_name || msg.username,
    text: msg.text,
    timestamp: msg.timestamp,
    threadId: msg.thread_id || null,
    edited: msg.edited === 1 || msg.edited === '1',
    reactions: JSON.parse(msg.reactions || '{}'),
    user_flagged_by: JSON.parse(msg.user_flagged_by || '[]'),
  }));

  return {
    messages,
    hasMore: totalMessages > limit,
  };
}

/**
 * Create a system message object
 * @param {string} socketId - Socket ID
 * @param {string} text - Message text
 * @param {string} roomId - Room ID
 * @returns {Object} System message
 */
function createSystemMessage(socketId, text, roomId) {
  return {
    id: `${Date.now()}-${socketId}`,
    type: 'system',
    username: 'System',
    text,
    timestamp: new Date().toISOString(),
    roomId,
  };
}

/**
 * Save system message to database
 * SIDE EFFECT: Inserts record into messages table
 *
 * @param {Object} systemMessage - System message object
 * @param {Object} dbSafe - Safe database wrapper
 */
async function saveSystemMessage(systemMessage, dbSafe) {
  await dbSafe.safeInsert('messages', {
    id: systemMessage.id,
    type: systemMessage.type,
    username: systemMessage.username,
    text: systemMessage.text,
    timestamp: systemMessage.timestamp,
    room_id: systemMessage.roomId,
  });
}

/**
 * Get list of active users in a room
 * @param {Map} activeUsers - Active users map
 * @param {string} roomId - Room ID
 * @returns {Array} List of users with username and joinedAt
 */
function getRoomUsers(activeUsers, roomId) {
  return Array.from(activeUsers.values())
    .filter(u => u.roomId === roomId)
    .map(u => ({ username: u.username, joinedAt: u.joinedAt }));
}

module.exports = {
  validateUserInput,
  getUserByUsername,
  // Deprecated alias - use getUserByUsername instead
  lookupUser: getUserByUsername,

  // Room resolution - pure lookup
  getExistingUserRoom,
  // Deprecated alias - use getExistingUserRoom instead
  findUserRoom: getExistingUserRoom,

  // Room resolution - may create (side effect explicit in name)
  resolveOrCreateUserRoom,

  // Deprecated - use getExistingUserRoom or resolveOrCreateUserRoom
  resolveUserRoom,

  disconnectDuplicateConnections,
  registerActiveUser,
  getMessageHistory,
  // Deprecated alias - use getMessageHistory instead
  fetchMessageHistory: getMessageHistory,
  createSystemMessage,
  saveSystemMessage,
  getRoomUsers,
};
