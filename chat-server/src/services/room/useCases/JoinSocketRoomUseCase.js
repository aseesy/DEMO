/**
 * Join Socket Room Use Case
 *
 * Single Responsibility: Orchestrate the complete socket room join flow.
 *
 * This use case encapsulates all the business logic for joining a room via socket:
 * - Validates user input
 * - Looks up user
 * - Resolves room
 * - Handles duplicate connections
 * - Registers session
 * - Ensures contacts
 * - Loads message history
 *
 * Architecture: Use Case Pattern - orchestrates multiple services without being a service itself.
 */

const {
  validateUserInput,
  getUserByEmail,
} = require('../../../../socketHandlers/connectionOperations/userLookup');
const {
  resolveOrCreateUserRoom,
} = require('../../../../socketHandlers/connectionOperations/roomResolution');
const {
  getMessageHistory,
} = require('../../../../socketHandlers/connectionOperations/messageHistory');

/**
 * Execute the join socket room use case
 *
 * @param {Object} params - Use case parameters
 * @param {string} params.userIdentifier - Email or username
 * @param {string} params.socketId - Socket ID
 * @param {Object} params.io - Socket.io server instance
 * @param {Object} params.auth - Auth service
 * @param {Object} params.roomManager - Room manager service
 * @param {Object} params.userSessionService - User session service
 * @param {Object} params.db - Database connection
 * @returns {Promise<Object>} Join result with success, error, or room data
 */
async function execute({
  userIdentifier,
  socketId,
  io,
  auth,
  roomManager,
  userSessionService,
  db,
}) {
  // Validate dependencies
  if (!auth) {
    throw new Error('JoinSocketRoomUseCase: auth is required');
  }
  if (!roomManager) {
    throw new Error('JoinSocketRoomUseCase: roomManager is required');
  }
  if (!userSessionService) {
    throw new Error('JoinSocketRoomUseCase: userSessionService is required');
  }
  if (!io) {
    throw new Error('JoinSocketRoomUseCase: io is required');
  }

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
    console.error('[JoinSocketRoomUseCase] getUserByEmail failed:', error.message);
    return { success: false, error: 'Failed to verify user.', errorContext: 'getUserByEmail' };
  }

  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  // Step 3: Resolve room
  let room;
  try {
    room = await resolveOrCreateUserRoom(user, cleanEmail, db, roomManager);
  } catch (error) {
    console.error('[JoinSocketRoomUseCase] resolveOrCreateUserRoom failed:', error.message);
    return { success: false, error: 'Failed to join chat room.', errorContext: 'resolveRoom' };
  }

  if (!room?.roomId || typeof room.roomId !== 'string' || !room.roomId.trim()) {
    console.warn('[JoinSocketRoomUseCase] No valid room for user:', {
      email: cleanEmail,
      userId: user?.id,
    });
    return { success: false, error: 'No room available. You must be connected to a co-parent.' };
  }

  const { roomId, roomName } = room;
  user.room = { roomId, roomName };
  user.roomId = roomId;

  // Step 4: Handle duplicates and register session
  const disconnectedSocketIds = await userSessionService.disconnectDuplicates(
    socketId,
    cleanEmail,
    roomId
  );

  // Disconnect the old sockets via io
  for (const oldSocketId of disconnectedSocketIds) {
    const oldSocket = io.sockets.sockets.get(oldSocketId);
    if (oldSocket) {
      oldSocket.emit('replaced_by_new_connection', {
        message: 'Disconnected by another login.',
      });
      oldSocket.disconnect(true);
    }
  }

  // Register new session
  await userSessionService.registerUser(socketId, cleanEmail, roomId);

  // Step 5: Ensure contacts (non-fatal)
  let roomMembers = [];
  try {
    roomMembers = await roomManager.getRoomMembers(roomId);
    if (roomMembers.length > 1) {
      await roomManager.ensureContactsForRoomMembers(roomId);
    }
  } catch (error) {
    console.error('[JoinSocketRoomUseCase] ensureContacts failed (non-fatal):', error.message);
  }

  // Step 6: Load message history
  let messages = [];
  let hasMore = false;
  try {
    // Use new MessageService for consistent message loading
    const MessageService = require('../../messages/messageService');
    const messageService = new MessageService();
    const history = await messageService.getRoomMessages(
      roomId,
      {
        limit: 500,
        offset: 0,
      },
      cleanEmail
    );
    messages = history.messages;
    hasMore = history.hasMore;
  } catch (error) {
    console.error('[JoinSocketRoomUseCase] MessageService failed:', error.message);
    // Fallback to old method for backward compatibility
    try {
      const history = await getMessageHistory(roomId, db);
      messages = history.messages;
      hasMore = history.hasMore;
    } catch (fallbackError) {
      console.error(
        '[JoinSocketRoomUseCase] Fallback getMessageHistory also failed:',
        fallbackError.message
      );
      return {
        success: false,
        error: 'Failed to load message history.',
        errorContext: 'getMessageHistory',
      };
    }
  }

  // Step 7: Get current room users
  const roomUsers = userSessionService.getUsersInRoom(roomId).map(u => ({
    email: u.email,
    joinedAt: u.joinedAt,
  }));

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

module.exports = {
  execute,
};
