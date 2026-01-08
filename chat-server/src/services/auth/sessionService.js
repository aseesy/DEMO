/**
 * Session Service
 *
 * Manages server-side sessions for authentication.
 * Enables session revocation and tracking.
 *
 * Part of Phase 2: Data Model & Session Management
 */

const { BaseService } = require('../BaseService');
const { NotFoundError, ValidationError } = require('../errors');
const { PostgresGenericRepository } = require('../../repositories/postgres/PostgresGenericRepository');

class SessionService extends BaseService {
  constructor() {
    super(null, new PostgresGenericRepository('sessions'));
    this.sessionRepository = this.repository;
  }

  /**
   * Create a new session
   * @param {Object} params
   * @param {number} params.userId - User ID
   * @param {string} params.sessionToken - JWT token (or identifier)
   * @param {Date} params.expiresAt - Expiration date
   * @param {string} [params.ipAddress] - Client IP address
   * @param {string} [params.userAgent] - Client user agent
   * @returns {Promise<Object>} Created session
   */
  async createSession({ userId, sessionToken, expiresAt, ipAddress = null, userAgent = null }) {
    if (!userId || !sessionToken || !expiresAt) {
      throw new ValidationError('userId, sessionToken, and expiresAt are required');
    }

    return await this.sessionRepository.create({
      user_id: userId,
      session_token: sessionToken,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      last_seen_at: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Find session by token
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object|null>} Session or null if not found
   */
  async findByToken(sessionToken) {
    if (!sessionToken) {
      return null;
    }

    const session = await this.sessionRepository.findOne({
      session_token: sessionToken,
    });

    if (!session) {
      return null;
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      return null;
    }

    // Check if revoked
    if (session.revoked_at) {
      return null;
    }

    return session;
  }

  /**
   * Update last seen timestamp
   * @param {number} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async updateLastSeen(sessionId) {
    await this.sessionRepository.updateById(sessionId, {
      last_seen_at: new Date().toISOString(),
    });
  }

  /**
   * Revoke a session
   * @param {number} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async revokeSession(sessionId) {
    await this.sessionRepository.updateById(sessionId, {
      revoked_at: new Date().toISOString(),
    });
  }

  /**
   * Revoke all sessions for a user (logout from all devices)
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of sessions revoked
   */
  async revokeAllUserSessions(userId) {
    const result = await this.query(
      `UPDATE sessions 
       SET revoked_at = $1 
       WHERE user_id = $2 AND revoked_at IS NULL`,
      [new Date().toISOString(), userId]
    );
    return result.rowCount || 0;
  }

  /**
   * Get all active sessions for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of active sessions
   */
  async getUserSessions(userId) {
    return await this.query(
      `SELECT * FROM sessions 
       WHERE user_id = $1 
         AND revoked_at IS NULL 
         AND expires_at > $2
       ORDER BY last_seen_at DESC`,
      [userId, new Date().toISOString()]
    );
  }

  /**
   * Clean up expired sessions (called periodically)
   * @returns {Promise<number>} Number of sessions deleted
   */
  async cleanupExpiredSessions() {
    const result = await this.query(
      `DELETE FROM sessions 
       WHERE expires_at < $1 
          OR (revoked_at IS NOT NULL AND revoked_at < $2)`,
      [
        new Date().toISOString(),
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      ]
    );
    return result.rowCount || 0;
  }
}

module.exports = { SessionService };

