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
    return this.query('SELECT relationship FROM contacts WHERE user_id = $1', [userId]);
  }

  /**
   * Check if a contact exists for a user by email
   */
  async existsByEmail(userId, contactEmail) {
    const results = await this.find({ user_id: userId, contact_email: contactEmail }, { limit: 1 });
    return results.length > 0;
  }

  /**
   * Create a contact, handling duplicate key errors gracefully
   * Returns true if created, false if duplicate (or other non-fatal error)
   */
  async createOrIgnore(contactData) {
    try {
      await this.create(contactData);
      return true;
    } catch (error) {
      // Duplicate key violations are expected (race conditions, concurrent requests)
      if (error?.code === '23505') {
        return false;
      }
      // Other errors (schema issues, etc.) are logged but non-fatal
      console.warn(`Error inserting contact (non-fatal):`, error.message);
      return false;
    }
  }
}

module.exports = { PostgresContactRepository };
