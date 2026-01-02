/**
 * Join Room Use Case
 *
 * Thin use case layer - delegates to RoomService.joinSocketRoom().
 * Handler just calls this and emits events based on result.
 */

const { roomService } = require('../../src/services');

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
 * Delegates to RoomService.joinSocketRoom() which handles all orchestration.
 *
 * @param {string} userIdentifier - Email or username
 * @param {string} socketId - Current socket ID
 * @param {Object} services - Injected dependencies (must include io)
 * @returns {Promise<JoinResult>}
 */
async function joinRoom(userIdentifier, socketId, services) {
  const { io } = services;

  if (!io) {
    return { success: false, error: 'IO server instance required', errorContext: 'missingIO' };
  }

  // Delegate to service - all orchestration happens there
  return roomService.joinSocketRoom(userIdentifier, socketId, io);
}

module.exports = { joinRoom };
