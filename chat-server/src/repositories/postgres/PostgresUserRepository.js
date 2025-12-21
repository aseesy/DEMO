/**
 * PostgreSQL User Repository Implementation
 *
 * Implements IUserRepository using PostgreSQL database.
 * Moves user-specific SQL queries from services to repository layer.
 *
 * @module repositories/postgres/PostgresUserRepository
 */

const { IUserRepository } = require('../interfaces/IUserRepository');
const { PostgresGenericRepository } = require('./PostgresGenericRepository');

/**
 * PostgreSQL implementation of user repository
 */
class PostgresUserRepository extends PostgresGenericRepository {
  constructor() {
    super('users');
  }

  /**
   * Find user by username (case-insensitive)
   */
  async findByUsername(username) {
    if (!username) {
      return null;
    }
    return this.queryOne(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1',
      [username]
    );
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    if (!email) {
      return null;
    }
    return this.findOne({ email: email.toLowerCase().trim() });
  }

  /**
   * Find users by IDs
   */
  async findByIds(ids) {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.query(
      'SELECT * FROM users WHERE id = ANY($1)',
      [ids]
    );
  }

  /**
   * Get user profile information
   * Includes all user fields (same as findById for now, but can be extended)
   */
  async getProfile(id) {
    return this.findById(id);
  }

  /**
   * Update user password hash
   */
  async updatePassword(id, passwordHash) {
    return this.updateById(id, { password_hash: passwordHash });
  }

  /**
   * Get user by ID with specific fields (for pairing service)
   */
  async getUserForPairing(id) {
    return this.queryOne(
      'SELECT username, email, first_name, display_name FROM users WHERE id = $1',
      [id]
    );
  }
}

module.exports = { PostgresUserRepository };

