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
}

module.exports = { IRoomRepository };

