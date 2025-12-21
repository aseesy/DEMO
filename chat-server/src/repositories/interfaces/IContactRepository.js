/**
 * Contact Repository Interface
 *
 * Abstraction for contact data access operations.
 * Implements Dependency Inversion Principle.
 *
 * @module repositories/interfaces/IContactRepository
 */

const { IGenericRepository } = require('./IGenericRepository');

/**
 * Contact repository interface
 * Extends generic repository with contact-specific methods
 */
class IContactRepository extends IGenericRepository {
  /**
   * Find contacts for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of contacts
   */
  async findByUserId(userId) {
    throw new Error('findByUserId() must be implemented by subclass');
  }

  /**
   * Find contact by relationship
   * @param {number} userId - User ID
   * @param {string} relationship - Relationship type (e.g., 'co-parent', 'child')
   * @returns {Promise<Object|null>} Contact or null
   */
  async findByRelationship(userId, relationship) {
    throw new Error('findByRelationship() must be implemented by subclass');
  }

  /**
   * Find contact by name and relationship
   * @param {number} userId - User ID
   * @param {string} contactName - Contact name
   * @param {string} relationship - Relationship type
   * @returns {Promise<Object|null>} Contact or null
   */
  async findByNameAndRelationship(userId, contactName, relationship) {
    throw new Error('findByNameAndRelationship() must be implemented by subclass');
  }
}

module.exports = { IContactRepository };

