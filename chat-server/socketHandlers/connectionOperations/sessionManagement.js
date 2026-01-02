/**
 * Session Management Operations
 *
 * Handles user session registration and duplicate connection handling.
 */

/**
 * Handle duplicate connections for same user in same room
 *
 * SIDE EFFECTS (explicit):
 *   1. Emits 'replaced_by_new_connection' to old sockets
 *   2. Disconnects old sockets
 *   3. Deletes entries from activeUsers Map
 *
 * @param {Object} userSessionService - User session service
 * @param {Object} io - Socket.io server
 * @param {string} roomId - Room ID
 * @param {string} cleanEmail - Email to check
 * @param {string} currentSocketId - Current socket ID to exclude
 */
async function disconnectDuplicateConnections(
  userSessionService,
  io,
  roomId,
  cleanEmail,
  currentSocketId
) {
  // Use service to disconnect duplicates
  const disconnectedSocketIds = await userSessionService.disconnectDuplicates(
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
 * @param {string} cleanEmail - Email
 * @param {string} roomId - Room ID
 * @returns {Object} User data object
 */
async function registerActiveUser(userSessionService, socketId, cleanEmail, roomId) {
  return await userSessionService.registerUser(socketId, cleanEmail, roomId);
}

/**
 * Get list of active users in a room
 * @param {Object} userSessionService - User session service
 * @param {string} roomId - Room ID
 * @returns {Array} List of users with email and joinedAt
 */
function getRoomUsers(userSessionService, roomId) {
  const users = userSessionService.getUsersInRoom(roomId);
  return users.map(u => ({
    email: u.email,
    joinedAt: u.joinedAt,
  }));
}

module.exports = {
  disconnectDuplicateConnections,
  registerActiveUser,
  getRoomUsers,
};
