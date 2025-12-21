/**
 * User Repository Interface
 *
 * Abstraction for user data access operations.
 * Implements Dependency Inversion Principle.
 *
 * @module repositories/interfaces/IUserRepository
 */

const { IGenericRepository } = require('./IGenericRepository');

/**
 * User repository interface
 * Extends generic repository with user-specific methods
 */
class IUserRepository extends IGenericRepository {
  /**
   * Find user by username (case-insensitive)
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User or null
   */
  async findByUsername(username) {
    throw new Error('findByUsername() must be implemented by subclass');
  }

  /**
   * Find user by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmail(email) {
    throw new Error('findByEmail() must be implemented by subclass');
  }

  /**
   * Find users by IDs
   * @param {Array<number>} ids - Array of user IDs
   * @returns {Promise<Array>} Array of users
   */
  async findByIds(ids) {
    throw new Error('findByIds() must be implemented by subclass');
  }

  /**
   * Get user profile information
   * @param {number} id - User ID
   * @returns {Promise<Object>} User with profile fields
   */
  async getProfile(id) {
    throw new Error('getProfile() must be implemented by subclass');
  }

  /**
   * Update user password hash
   * @param {number} id - User ID
   * @param {string} passwordHash - Hashed password
   * @returns {Promise<Object>} Updated user
   */
  async updatePassword(id, passwordHash) {
    throw new Error('updatePassword() must be implemented by subclass');
  }
}

module.exports = { IUserRepository };

