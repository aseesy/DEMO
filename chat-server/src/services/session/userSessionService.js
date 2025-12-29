/**
 * User Session Service
 *
 * Actor: Socket Connection Management
 * Responsibility: Manage active user sessions for WebSocket connections
 *
 * Encapsulates active user state management:
 * - Register/disconnect users
 * - Query users by socket ID, room ID, email
 * - Prevent direct mutation of internal state
 * - Thread-safe operations
 */

const { BaseService } = require('../BaseService');
const { NotFoundError, ValidationError } = require('../errors');

class UserSessionService extends BaseService {
  constructor() {
    super(); // No default table - manages in-memory state
    // Private: Use Map for O(1) lookups
    this._activeUsers = new Map(); // socketId -> user data
  }

  /**
   * Register a user session
   * @param {string} socketId - Socket ID
   * @param {string} email - User email (primary identifier)
   * @param {string} roomId - Room ID
   * @returns {Object} User data object
   * @throws {ValidationError} If required parameters missing
   */
  registerUser(socketId, email, roomId) {
    if (!socketId) {
      throw new ValidationError('Socket ID is required', 'socketId');
    }
    if (!email) {
      throw new ValidationError('Email is required', 'email');
    }
    if (!roomId) {
      throw new ValidationError('Room ID is required', 'roomId');
    }

    const userData = {
      email: email.toLowerCase().trim(),
      roomId: roomId,
      joinedAt: new Date().toISOString(),
      socketId: socketId,
    };

    this._activeUsers.set(socketId, userData);
    console.log('[UserSessionService] Registered user:', {
      socketId: socketId.substring(0, 20) + '...',
      email: email,
      roomId: roomId,
    });

    return userData;
  }

  /**
   * Get user by socket ID
   * @param {string} socketId - Socket ID
   * @returns {Object|null} User data or null if not found
   */
  getUserBySocketId(socketId) {
    if (!socketId) {
      return null;
    }
    return this._activeUsers.get(socketId) || null;
  }

  /**
   * Check if user is active
   * @param {string} socketId - Socket ID
   * @returns {boolean} True if user is active
   */
  isUserActive(socketId) {
    return this._activeUsers.has(socketId);
  }

  /**
   * Disconnect user (remove from active sessions)
   * @param {string} socketId - Socket ID
   * @returns {boolean} True if user was removed, false if not found
   */
  disconnectUser(socketId) {
    if (!socketId) {
      return false;
    }

    const user = this._activeUsers.get(socketId);
    if (user) {
      this._activeUsers.delete(socketId);
      console.log('[UserSessionService] Disconnected user:', {
        socketId: socketId.substring(0, 20) + '...',
        email: user.email,
        roomId: user.roomId,
      });
      return true;
    }

    return false;
  }

  /**
   * Disconnect duplicate connections for a user
   * Keeps the current socketId, removes others with same email/roomId
   * @param {string} currentSocketId - Socket ID to keep
   * @param {string} email - User email
   * @param {string} roomId - Room ID
   * @returns {Array<string>} Array of disconnected socket IDs
   */
  disconnectDuplicates(currentSocketId, email, roomId) {
    const disconnected = [];
    const emailLower = email.toLowerCase().trim();

    for (const [socketId, userData] of this._activeUsers.entries()) {
      if (
        socketId !== currentSocketId &&
        userData.email === emailLower &&
        userData.roomId === roomId
      ) {
        this._activeUsers.delete(socketId);
        disconnected.push(socketId);
      }
    }

    if (disconnected.length > 0) {
      console.log('[UserSessionService] Disconnected duplicate connections:', {
        email: emailLower,
        roomId,
        count: disconnected.length,
      });
    }

    return disconnected;
  }

  /**
   * Get all users in a room
   * @param {string} roomId - Room ID
   * @returns {Array<Object>} Array of user data objects
   */
  getUsersInRoom(roomId) {
    if (!roomId) {
      return [];
    }

    const users = [];
    for (const userData of this._activeUsers.values()) {
      if (userData.roomId === roomId) {
        users.push(userData);
      }
    }

    return users;
  }

  /**
   * Get all active users (for debugging/admin)
   * @returns {Array<Object>} Array of all user data objects
   */
  getAllUsers() {
    return Array.from(this._activeUsers.values());
  }

  /**
   * Get count of active users
   * @returns {number} Number of active users
   */
  getActiveUserCount() {
    return this._activeUsers.size;
  }

  /**
   * Get count of users in a room
   * @param {string} roomId - Room ID
   * @returns {number} Number of users in room
   */
  getRoomUserCount(roomId) {
    return this.getUsersInRoom(roomId).length;
  }

  /**
   * Clear all active users (use with caution - for testing/cleanup only)
   * @returns {number} Number of users cleared
   */
  clearAll() {
    const count = this._activeUsers.size;
    this._activeUsers.clear();
    console.warn('[UserSessionService] Cleared all active users:', count);
    return count;
  }
}

// Export singleton instance
const userSessionService = new UserSessionService();

module.exports = { userSessionService, UserSessionService };

