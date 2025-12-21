/**
 * PostgreSQL Pairing Repository Implementation
 *
 * Implements IPairingRepository using PostgreSQL database.
 * Moves pairing-specific SQL queries from libs to repository layer.
 *
 * Supports dependency injection for testability:
 *   - Pass db connection to methods for testing
 *   - Falls back to default dbPostgres when no db provided
 *
 * @module repositories/postgres/PostgresPairingRepository
 */

const defaultDb = require('../../../dbPostgres');

/**
 * PostgreSQL implementation of pairing repository
 */
class PostgresPairingRepository {
  constructor() {
    this.tableName = 'pairing_sessions';
  }

  /**
   * Execute a query with optional db injection
   */
  async query(sql, params = [], db = null) {
    const connection = db || defaultDb;
    const result = await connection.query(sql, params);
    return result;
  }

  /**
   * Execute query and return single row
   */
  async queryOne(sql, params = [], db = null) {
    const result = await this.query(sql, params, db);
    return result.rows[0] || null;
  }

  /**
   * Find active pairing for a user (as either parent)
   */
  async findActiveByUserId(userId, activeStatus, db = null) {
    if (!userId) return null;

    return this.queryOne(
      `SELECT ps.*,
              CASE WHEN ps.parent_a_id = $1 THEN ps.parent_b_id ELSE ps.parent_a_id END as partner_id
       FROM pairing_sessions ps
       WHERE (ps.parent_a_id = $1 OR ps.parent_b_id = $1)
         AND ps.status = $2`,
      [userId, activeStatus],
      db
    );
  }

  /**
   * Find pending pairing for a user (as initiator)
   */
  async findPendingByInitiator(userId, pendingStatus, db = null) {
    if (!userId) return null;

    return this.queryOne(
      `SELECT * FROM pairing_sessions
       WHERE parent_a_id = $1
         AND status = $2
         AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, pendingStatus],
      db
    );
  }

  /**
   * Check if pairing code already exists
   */
  async codeExists(code, db = null) {
    if (!code) return false;

    const result = await this.query(
      'SELECT id FROM pairing_sessions WHERE pairing_code = $1',
      [code],
      db
    );
    return result.rows.length > 0;
  }

  /**
   * Create email pairing session
   */
  async createEmailPairing(data, db = null) {
    const {
      pairingCode,
      initiatorId,
      inviteeEmail,
      status,
      inviteType,
      tokenHash,
      initiatorUsername,
      expiresAt,
    } = data;

    return this.queryOne(
      `INSERT INTO pairing_sessions (
        pairing_code, parent_a_id, parent_b_email, status, invite_type,
        invite_token, invited_by_username, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        pairingCode,
        initiatorId,
        inviteeEmail.toLowerCase().trim(),
        status,
        inviteType,
        tokenHash,
        initiatorUsername || null,
        expiresAt,
      ],
      db
    );
  }

  /**
   * Create link pairing session
   */
  async createLinkPairing(data, db = null) {
    const {
      pairingCode,
      initiatorId,
      status,
      inviteType,
      tokenHash,
      initiatorUsername,
      expiresAt,
    } = data;

    return this.queryOne(
      `INSERT INTO pairing_sessions (
        pairing_code, parent_a_id, status, invite_type,
        invite_token, invited_by_username, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        pairingCode,
        initiatorId,
        status,
        inviteType,
        tokenHash,
        initiatorUsername || null,
        expiresAt,
      ],
      db
    );
  }

  /**
   * Create code pairing session
   */
  async createCodePairing(data, db = null) {
    const {
      pairingCode,
      initiatorId,
      status,
      inviteType,
      initiatorUsername,
      expiresAt,
    } = data;

    return this.queryOne(
      `INSERT INTO pairing_sessions (
        pairing_code, parent_a_id, status, invite_type,
        invited_by_username, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        pairingCode,
        initiatorId,
        status,
        inviteType,
        initiatorUsername || null,
        expiresAt,
      ],
      db
    );
  }

  /**
   * Expire user's code pairings
   */
  async expireUserCodePairings(userId, pendingStatus, expiredStatus, codeType, db = null) {
    const result = await this.query(
      `UPDATE pairing_sessions
       SET status = $1
       WHERE parent_a_id = $2 AND status = $3 AND invite_type = $4`,
      [expiredStatus, userId, pendingStatus, codeType],
      db
    );
    return result.rowCount || 0;
  }

  /**
   * Cancel pairing by initiator
   */
  async cancelByInitiator(id, userId, pendingStatus, canceledStatus, db = null) {
    return this.queryOne(
      `UPDATE pairing_sessions
       SET status = $1
       WHERE id = $2 AND parent_a_id = $3 AND status = $4
       RETURNING *`,
      [canceledStatus, id, userId, pendingStatus],
      db
    );
  }

  /**
   * Find pending pairing by ID and initiator
   */
  async findPendingById(id, userId, pendingStatus, db = null) {
    return this.queryOne(
      `SELECT * FROM pairing_sessions
       WHERE id = $1 AND parent_a_id = $2 AND status = $3`,
      [id, userId, pendingStatus],
      db
    );
  }

  /**
   * Update pairing token and expiration
   */
  async updateTokenAndExpiration(id, tokenHash, expiresAt, db = null) {
    return this.queryOne(
      `UPDATE pairing_sessions
       SET invite_token = $1, expires_at = $2
       WHERE id = $3
       RETURNING *`,
      [tokenHash, expiresAt, id],
      db
    );
  }

  /**
   * Expire old pending pairings
   */
  async expireOldPairings(expiredStatus, pendingStatus, db = null) {
    const result = await this.query(
      `UPDATE pairing_sessions
       SET status = $1
       WHERE status = $2
         AND expires_at < CURRENT_TIMESTAMP`,
      [expiredStatus, pendingStatus],
      db
    );
    return result.rowCount || 0;
  }

  /**
   * Log pairing action to audit trail
   */
  async logAction(params, db = null) {
    const { pairingSessionId, action, actorUserId, ipAddress, userAgent, metadata } = params;

    try {
      await this.query(
        `INSERT INTO pairing_audit_log (
          pairing_session_id, action, actor_user_id, ip_address, user_agent, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          pairingSessionId,
          action,
          actorUserId || null,
          ipAddress || null,
          userAgent || null,
          JSON.stringify(metadata || {}),
        ],
        db
      );
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      console.error('Failed to log pairing action:', error);
    }
  }
}

// Singleton instance
const pairingRepository = new PostgresPairingRepository();

module.exports = { PostgresPairingRepository, pairingRepository };
