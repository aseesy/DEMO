/**
 * Room Repository Interface
 *
 * Abstraction for room data access operations.
 * Implements Dependency Inversion Principle.
 *
 * @module repositories/interfaces/IRoomRepository
 */

const { IGenericRepository } = require('./IGenericRepository');

/**
 * Room repository interface
 * Extends generic repository with room-specific methods
 */
class IRoomRepository extends IGenericRepository {
  /**
   * Get room members count
   * @param {string} roomId - Room ID
   * @returns {Promise<number>} Member count
   */
  async getMemberCount(roomId) {
    throw new Error('getMemberCount() must be implemented by subclass');
  }

  /**
   * Get rooms for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of rooms
   */
  async findByUserId(userId) {
    throw new Error('findByUserId() must be implemented by subclass');
  }

  /**
   * Get shared rooms (rooms with multiple members)
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of shared rooms
   */
  async findSharedRooms(userId) {
    throw new Error('findSharedRooms() must be implemented by subclass');
  }

  /**
   * Get room members with user details
   * @param {string} roomId - Room ID
   * @returns {Promise<Array>} Array of member objects with user details
   */
  async getMembersWithDetails(roomId) {
    throw new Error('getMembersWithDetails() must be implemented by subclass');
  }

  /**
   * Get user's primary room (room with most members, or first joined)
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Room object or null
   */
  async getUserPrimaryRoom(userId) {
    throw new Error('getUserPrimaryRoom() must be implemented by subclass');
  }

  /**
   * Add member to room
   * @param {string} roomId - Room ID
   * @param {number} userId - User ID
   * @param {string} role - Member role
   * @returns {Promise<boolean>} True if added, false if already exists
   */
  async addMember(roomId, userId, role) {
    throw new Error('addMember() must be implemented by subclass');
  }

  /**
   * Remove member from room
   * @param {string} roomId - Room ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if removed
   */
  async removeMember(roomId, userId) {
    throw new Error('removeMember() must be implemented by subclass');
  }

  /**
   * Check if member exists in room
   * @param {string} roomId - Room ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if member exists
   */
  async memberExists(roomId, userId) {
    throw new Error('memberExists() must be implemented by subclass');
  }
}

module.exports = { IRoomRepository };
