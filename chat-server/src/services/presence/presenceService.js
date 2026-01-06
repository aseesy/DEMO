/**
 * Presence Service
 *
 * Manages user online/offline status using Redis.
 * Tracks which users are online and in which rooms.
 *
 * @module liaizen/services/presence/presenceService
 */

const { setPresence, removePresence, isUserOnline, getOnlineUsersInRoom } = require('../../infrastructure/database/redisClient');

class PresenceService {
  /**
   * Mark user as online
   * @param {string} userId - User identifier (email)
   * @param {string} socketId - Socket ID
   * @param {string} roomId - Room ID
   * @returns {Promise<boolean>} True if set successfully
   */
  async setOnline(userId, socketId, roomId) {
    return await setPresence(userId, socketId, { roomId }, 300); // 5 minutes TTL
  }

  /**
   * Mark user as offline
   * @param {string} userId - User identifier (email)
   * @param {string} socketId - Socket ID
   * @returns {Promise<boolean>} True if removed successfully
   */
  async setOffline(userId, socketId) {
    return await removePresence(userId, socketId);
  }

  /**
   * Check if user is online
   * @param {string} userId - User identifier
   * @returns {Promise<boolean>} True if user is online
   */
  async isOnline(userId) {
    return await isUserOnline(userId);
  }

  /**
   * Get all online users in a room
   * @param {string} roomId - Room ID
   * @returns {Promise<Array<string>>} Array of user IDs
   */
  async getOnlineUsers(roomId) {
    return await getOnlineUsersInRoom(roomId);
  }

  /**
   * Refresh presence TTL (call periodically to keep user online)
   * @param {string} userId - User identifier
   * @param {string} socketId - Socket ID
   * @param {string} roomId - Room ID
   * @returns {Promise<boolean>} True if refreshed successfully
   */
  async refreshPresence(userId, socketId, roomId) {
    return await this.setOnline(userId, socketId, roomId);
  }
}

module.exports = { PresenceService };

