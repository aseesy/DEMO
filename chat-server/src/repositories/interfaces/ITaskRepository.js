/**
 * Task Repository Interface
 *
 * Abstraction for task data access operations.
 * Implements Dependency Inversion Principle.
 *
 * @module repositories/interfaces/ITaskRepository
 */

const { IGenericRepository } = require('./IGenericRepository');

/**
 * Task repository interface
 * Extends generic repository with task-specific methods
 */
class ITaskRepository extends IGenericRepository {
  /**
   * Find tasks for a user
   * @param {number} userId - User ID
   * @param {Object} options - Query options (status, limit, offset)
   * @returns {Promise<Array>} Array of tasks
   */
  async findByUserId(userId, options = {}) {
    throw new Error('findByUserId() must be implemented by subclass');
  }

  /**
   * Find tasks assigned to a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of tasks
   */
  async findAssignedTo(userId) {
    throw new Error('findAssignedTo() must be implemented by subclass');
  }
}

module.exports = { ITaskRepository };

