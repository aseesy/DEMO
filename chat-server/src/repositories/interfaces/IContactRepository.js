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
  async findByUserId(_userId) {
    throw new Error('findByUserId() must be implemented by subclass');
  }

  /**
   * Find contact by relationship
   * @param {number} userId - User ID
   * @param {string} relationship - Relationship type (e.g., 'co-parent', 'child')
   * @returns {Promise<Object|null>} Contact or null
   */
  async findByRelationship(_userId, _relationship) {
    throw new Error('findByRelationship() must be implemented by subclass');
  }

  /**
   * Find contact by name and relationship
   * @param {number} userId - User ID
   * @param {string} contactName - Contact name
   * @param {string} relationship - Relationship type
   * @returns {Promise<Object|null>} Contact or null
   */
  async findByNameAndRelationship(_userId, _contactName, _relationship) {
    throw new Error('findByNameAndRelationship() must be implemented by subclass');
  }

  /**
   * Check if a contact exists for a user by email
   * @param {number} userId - User ID
   * @param {string} contactEmail - Contact email
   * @returns {Promise<boolean>} True if contact exists
   */
  async existsByEmail(_userId, _contactEmail) {
    throw new Error('existsByEmail() must be implemented by subclass');
  }

  /**
   * Create a contact, handling duplicate key errors gracefully
   * @param {Object} contactData - Contact data
   * @returns {Promise<boolean>} True if created, false if duplicate
   */
  async createOrIgnore(_contactData) {
    throw new Error('createOrIgnore() must be implemented by subclass');
  }
}

module.exports = { IContactRepository };
