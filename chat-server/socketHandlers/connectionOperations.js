/**
 * Connection Operations - Pure business logic for connection handling
 *
 * These functions contain business logic without error handling.
 * Error handling is done by the caller (connectionHandler.js).
 */

const { sanitizeInput, validateUsername } = require('../utils');
const { buildUserObject } = require('./utils');
const pairingManager = require('../libs/pairing-manager');

/**
 * Validation result type
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string} [error]
 * @property {string} [cleanEmail]
 */

/**
 * Validate and sanitize email
 * @param {string} email - Raw email input
 * @returns {ValidationResult}
 */
function validateUserInput(email) {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email is required.',
    };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      valid: false,
      error: 'Invalid email format.',
    };
  }

  return { valid: true, cleanEmail };
}

/**
 * Get user by email
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 *
 * @param {string} cleanEmail - Sanitized email
 * @param {Object} auth - Auth service
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserByEmail(cleanEmail, auth) {
  return auth.getUser(cleanEmail);
}

// Deprecated: Keep for backward compatibility during migration
async function getUserByUsername(cleanUsername, auth) {
  // Try to get user by email first (if it's an email)
  if (cleanUsername.includes('@')) {
    return auth.getUser(cleanUsername);
  }
  // Fallback: try to find user by old username field (for migration period)
  // This will be removed after migration is complete
  console.warn('[getUserByUsername] Deprecated: Use getUserByEmail with email instead');
  return null;
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
async function getExistingUserRoom(user, cleanEmail, dbPostgres, roomManager) {
  // First check if user has an active pairing with shared_room_id
  const activePairing = await pairingManager.getActivePairing(user.id, dbPostgres);

  if (activePairing && activePairing.shared_room_id) {
    const roomId = activePairing.shared_room_id;
    console.log(`[join] User ${cleanEmail} has active pairing, using shared room: ${roomId}`);

    const roomResult = await dbPostgres.query('SELECT name FROM rooms WHERE id = $1', [roomId]);
    const roomName = roomResult.rows[0]?.name || 'Co-Parenting Room';

    return { roomId, roomName };
  }

  // Check for existing room membership
  const existingRoom = await roomManager.getUserRoom(user.id);

  if (existingRoom) {
    console.log(`[join] User ${cleanEmail} has existing room: ${existingRoom.roomId}`);
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
async function resolveOrCreateUserRoom(user, cleanEmail, dbPostgres, roomManager) {
  // Try to get existing room first (pure lookup)
  const existingRoom = await getExistingUserRoom(user, cleanEmail, dbPostgres, roomManager);

  if (existingRoom) {
    return existingRoom;
  }

  // No room found - users should not have personal rooms
  // They must be connected to a co-parent to have a room
  console.log(`[join] User ${cleanEmail} has no room. Users must be connected to a co-parent.`);
  return null;
}

/**
 * @deprecated Use getExistingUserRoom() for pure lookup or resolveOrCreateUserRoom() for creation
 */
async function resolveUserRoom(user, cleanEmail, dbPostgres, roomManager) {
  return resolveOrCreateUserRoom(user, cleanEmail, dbPostgres, roomManager);
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
function disconnectDuplicateConnections(
  userSessionService,
  io,
  roomId,
  cleanEmail,
  currentSocketId
) {
  // Use service to disconnect duplicates
  const disconnectedSocketIds = userSessionService.disconnectDuplicates(
    currentSocketId,
    cleanEmail,
    roomId
  );

  // Disconnect the sockets
  for (const socketId of disconnectedSocketIds) {
    const oldSocket = io.sockets.sockets.get(socketId);
    if (oldSocket) {
      oldSocket.emit('replaced_by_new_connection', {
        message: 'Disconnected by another login.',
      });
      oldSocket.disconnect(true);
    }
  }
}

/**
 * Register user in active users map
 * Uses UserSessionService for proper encapsulation
 *
 * @param {Object} userSessionService - User session service
 * @param {string} socketId - Socket ID
 * @param {string} cleanUsername - Username
 * @param {string} roomId - Room ID
 * @returns {Object} User data object
 */
function registerActiveUser(userSessionService, socketId, cleanEmail, roomId) {
  return userSessionService.registerUser(socketId, cleanEmail, roomId);
}

/**
 * Message history result
 * @typedef {Object} MessageHistoryResult
 * @property {Array} messages
 * @property {boolean} hasMore
 * @property {number} total
 * @property {number} offset
 */

/**
 * Get room message history with pagination support
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 *
 * @param {string} roomId - Room ID
 * @param {Object} dbPostgres - Database connection
 * @param {number} limit - Maximum messages to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<MessageHistoryResult>}
 */
async function getMessageHistory(roomId, dbPostgres, limit = 500, offset = 0) {
  console.log(
    '[getMessageHistory] Loading messages for room:',
    roomId,
    'limit:',
    limit,
    'offset:',
    offset
  );

  // Get total count of user messages (exclude system messages)
  const countResult = await dbPostgres.query(
    `SELECT COUNT(*) as total FROM messages
     WHERE room_id = $1
     AND (type IS NULL OR type != 'system')
     AND text NOT LIKE '%joined the chat%'
     AND text NOT LIKE '%left the chat%'`,
    [roomId]
  );
  const totalMessages = parseInt(countResult.rows[0]?.total || 0, 10);
  console.log('[getMessageHistory] Total user messages in room:', totalMessages);

  // Get messages with JOIN to users table (normalized)
  // Also get receiver info by joining with room_members and users
  const historyQuery = `
    SELECT m.*, 
           u.id as user_id, u.first_name, u.last_name, u.email,
           rm_receiver.user_id as receiver_user_id,
           u_receiver.first_name as receiver_first_name,
           u_receiver.last_name as receiver_last_name,
           u_receiver.email as receiver_email
    FROM messages m
    LEFT JOIN users u ON LOWER(m.user_email) = LOWER(u.email)
    LEFT JOIN room_members rm_receiver ON rm_receiver.room_id = m.room_id AND rm_receiver.user_id != u.id
    LEFT JOIN users u_receiver ON rm_receiver.user_id = u_receiver.id
    WHERE m.room_id = $1
      AND (m.type IS NULL OR m.type != 'system')
      AND m.text NOT LIKE '%joined the chat%'
      AND m.text NOT LIKE '%left the chat%'
    ORDER BY m.timestamp DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await dbPostgres.query(historyQuery, [roomId, limit, offset]);

  console.log('[getMessageHistory] Retrieved', result.rows.length, 'messages from database');

  // Reverse to chronological order (oldest first) for frontend display
  const messages = result.rows.reverse().map(msg => {
    // Build sender object from message data
    const senderData = {
      id: msg.user_id,
      email: msg.user_email || msg.email,
      first_name: msg.first_name,
      last_name: msg.last_name,
    };
    const sender = buildUserObject(senderData);

    // Build receiver object if available
    let receiver = null;
    if (msg.receiver_user_id) {
      const receiverData = {
        id: msg.receiver_user_id,
        email: msg.receiver_email,
        first_name: msg.receiver_first_name,
        last_name: msg.receiver_last_name,
      };
      receiver = buildUserObject(receiverData);
    }

    // Ensure all required fields are present
    const message = {
      id: msg.id,
      type: msg.type || 'user_message',

      // ✅ NEW STRUCTURE (primary)
      sender,
      receiver,

      // Database field (keep for database column mapping)
      user_email: msg.user_email || msg.email || msg.username,

      // Core fields
      text: msg.text,
      timestamp: msg.timestamp || msg.created_at,
      threadId: msg.thread_id || null,
      edited: msg.edited === 1 || msg.edited === '1',
      reactions: msg.reactions
        ? typeof msg.reactions === 'string'
          ? JSON.parse(msg.reactions)
          : msg.reactions
        : {},
      user_flagged_by: msg.user_flagged_by
        ? typeof msg.user_flagged_by === 'string'
          ? JSON.parse(msg.user_flagged_by)
          : msg.user_flagged_by
        : [],
    };

    // Log if message is missing critical fields
    if (!message.id || !message.user_email || !message.text) {
      console.warn('[getMessageHistory] Message missing critical fields:', {
        id: message.id,
        user_email: message.user_email,
        hasText: !!message.text,
        raw: msg,
      });
    }

    return message;
  });

  // Log sample of messages being returned
  if (messages.length > 0) {
    console.log('[getMessageHistory] Sample messages:', {
      first: messages[0]?.text?.substring(0, 30),
      last: messages[messages.length - 1]?.text?.substring(0, 30),
      count: messages.length,
    });
  }

  return {
    messages,
    hasMore: totalMessages > offset + limit,
    total: totalMessages,
    offset,
    limit,
  };
}

/**
 * Create a system message object
 * @param {string} socketId - Socket ID
 * @param {string} text - Message text
 * @param {string} roomId - Room ID
 * @returns {Object} System message
 */
function createSystemMessage(socketId, text, roomId, userEmail = 'system@liaizen.app') {
  return {
    id: `${Date.now()}-${socketId}`,
    type: 'system',
    user_email: userEmail,
    username: 'System', // Backward compatibility
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
    user_email: systemMessage.user_email || 'system@liaizen.app', // System messages use special email
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
function getRoomUsers(userSessionService, roomId) {
  const users = userSessionService.getUsersInRoom(roomId);
  return users.map(u => ({
    email: u.email,
    joinedAt: u.joinedAt,
  }));
}

module.exports = {
  validateUserInput,
  getUserByEmail,
  getUserByUsername, // Deprecated - use getUserByEmail instead
  // Deprecated alias - use getUserByEmail instead
  lookupUser: getUserByEmail,

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
