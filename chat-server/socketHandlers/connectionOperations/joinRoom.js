/**
 * Join Room Use Case
 *
 * Orchestrates the complete room join flow:
 * - Validates user
 * - Resolves room
 * - Handles duplicate connections
 * - Loads message history
 *
 * Returns a result object - handler just emits events.
 */

const { validateUserInput, getUserByEmail } = require('./userLookup');
const { resolveUserRoom } = require('./roomResolution');
const {
  disconnectDuplicateConnections,
  registerActiveUser,
  getRoomUsers,
} = require('./sessionManagement');
const { getMessageHistory } = require('./messageHistory');

/**
 * @typedef {Object} JoinResult
 * @property {boolean} success
 * @property {string} [error] - Error message if !success
 * @property {string} [errorContext] - Error context for logging
 * @property {Object} [user] - User object with room info
 * @property {string} [roomId]
 * @property {string} [roomName]
 * @property {Array} [messages] - Message history
 * @property {boolean} [hasMore] - More messages available
 * @property {Array} [roomUsers] - Currently connected users
 * @property {Array} [roomMembers] - All room members
 */

/**
 * Execute the room join flow
 * @param {string} userIdentifier - Email or username
 * @param {string} socketId - Current socket ID
 * @param {Object} services - Injected dependencies
 * @returns {Promise<JoinResult>}
 */
async function joinRoom(userIdentifier, socketId, services) {
  const { auth, roomManager, dbPostgres, userSessionService, io } = services;

  // Step 1: Validate input
  const validation = validateUserInput(userIdentifier);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  const { cleanEmail } = validation;

  // Step 2: Get user
  let user;
  try {
    user = await getUserByEmail(cleanEmail, auth);
  } catch (error) {
    console.error('[joinRoom] getUserByEmail failed:', error.message);
    return { success: false, error: 'Failed to verify user.', errorContext: 'getUserByEmail' };
  }

  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  // Step 3: Resolve room
  let room;
  try {
    room = await resolveUserRoom(user, cleanEmail, dbPostgres, roomManager);
  } catch (error) {
    console.error('[joinRoom] resolveUserRoom failed:', error.message);
    return { success: false, error: 'Failed to join chat room.', errorContext: 'resolveRoom' };
  }

  if (!room?.roomId || typeof room.roomId !== 'string' || !room.roomId.trim()) {
    console.warn('[joinRoom] No valid room for user:', { email: cleanEmail, userId: user?.id });
    return { success: false, error: 'No room available. You must be connected to a co-parent.' };
  }

  const { roomId, roomName } = room;
  user.room = { roomId, roomName };
  user.roomId = roomId;

  // Step 4: Handle duplicates and register
  await disconnectDuplicateConnections(userSessionService, io, roomId, cleanEmail, socketId);
  registerActiveUser(userSessionService, socketId, cleanEmail, roomId);

  // Step 5: Ensure contacts (non-fatal)
  let roomMembers = [];
  try {
    roomMembers = await roomManager.getRoomMembers(roomId);
    if (roomMembers.length > 1) {
      await roomManager.ensureContactsForRoomMembers(roomId);
    }
  } catch (error) {
    console.error('[joinRoom] ensureContacts failed (non-fatal):', error.message);
  }

  // Step 6: Load message history
  let messages = [];
  let hasMore = false;
  try {
    const history = await getMessageHistory(roomId, dbPostgres);
    messages = history.messages;
    hasMore = history.hasMore;
  } catch (error) {
    console.error('[joinRoom] getMessageHistory failed:', error.message);
    return {
      success: false,
      error: 'Failed to load message history.',
      errorContext: 'getMessageHistory',
    };
  }

  // Step 7: Get current room users
  const roomUsers = getRoomUsers(userSessionService, roomId);

  return {
    success: true,
    user,
    email: cleanEmail,
    roomId,
    roomName: roomName || `${user.displayName || user.firstName || cleanEmail}'s Room`,
    messages,
    hasMore,
    roomUsers,
    roomMembers,
  };
}

module.exports = { joinRoom };
