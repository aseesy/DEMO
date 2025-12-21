/**
 * PostgreSQL Contact Repository Implementation
 *
 * Implements IContactRepository using PostgreSQL database.
 * Moves contact-specific SQL queries from services to repository layer.
 *
 * @module repositories/postgres/PostgresContactRepository
 */

const { IContactRepository } = require('../interfaces/IContactRepository');
const { PostgresGenericRepository } = require('./PostgresGenericRepository');

/**
 * PostgreSQL implementation of contact repository
 */
class PostgresContactRepository extends PostgresGenericRepository {
  constructor() {
    super('contacts');
  }

  /**
   * Find contacts for a user
   */
  async findByUserId(userId) {
    return this.find({ user_id: userId });
  }

  /**
   * Find contact by relationship
   */
  async findByRelationship(userId, relationship) {
    return this.queryOne(
      'SELECT id FROM contacts WHERE user_id = $1 AND relationship = $2 LIMIT 1',
      [userId, relationship]
    );
  }

  /**
   * Find contact by name and relationship
   */
  async findByNameAndRelationship(userId, contactName, relationship) {
    return this.queryOne(
      'SELECT id FROM contacts WHERE user_id = $1 AND contact_name = $2 AND relationship = $3',
      [userId, contactName, relationship]
    );
  }

  /**
   * Get all relationships for a user
   */
  async getRelationships(userId) {
    return this.query(
      'SELECT relationship FROM contacts WHERE user_id = $1',
      [userId]
    );
  }
}

module.exports = { PostgresContactRepository };

