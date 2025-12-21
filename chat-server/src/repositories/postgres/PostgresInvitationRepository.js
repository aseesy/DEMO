/**
 * PostgreSQL Invitation Repository Implementation
 *
 * Implements IInvitationRepository using PostgreSQL database.
 * Moves invitation-specific SQL queries from libs to repository layer.
 *
 * Supports dependency injection for testability:
 *   - Pass db connection to methods for testing
 *   - Falls back to default dbPostgres when no db provided
 *
 * @module repositories/postgres/PostgresInvitationRepository
 */

const defaultDb = require('../../../dbPostgres');

/**
 * PostgreSQL implementation of invitation repository
 * Note: Does not extend PostgresGenericRepository to support db injection per method
 */
class PostgresInvitationRepository {
  constructor() {
    this.tableName = 'invitations';
  }

  /**
   * Execute a query with optional db injection
   */
  async query(sql, params = [], db = null) {
    const connection = db || defaultDb;
    const result = await connection.query(sql, params);
    return result.rows;
  }

  /**
   * Execute query and return single row
   */
  async queryOne(sql, params = [], db = null) {
    const rows = await this.query(sql, params, db);
    return rows[0] || null;
  }

  /**
   * Find active invitation by inviter and invitee email
   */
  async findActiveByInviterAndEmail(inviterId, inviteeEmail, status, db = null) {
    if (!inviterId || !inviteeEmail) {
      return null;
    }
    const normalizedEmail = inviteeEmail.toLowerCase().trim();
    return this.queryOne(
      `SELECT * FROM invitations
       WHERE inviter_id = $1
       AND LOWER(invitee_email) = $2
       AND status = $3
       AND expires_at > CURRENT_TIMESTAMP`,
      [inviterId, normalizedEmail, status],
      db
    );
  }

  /**
   * Count accepted invitations for a user (sent or received)
   */
  async countAcceptedForUser(userId, invitationType, db = null) {
    if (!userId) {
      return 0;
    }
    const result = await this.queryOne(
      `SELECT COUNT(*) as count FROM invitations
       WHERE (inviter_id = $1 OR invitee_id = $1)
       AND status = 'accepted'
       AND invitation_type = $2`,
      [userId, invitationType],
      db
    );
    return parseInt(result.count, 10);
  }

  /**
   * Find invitation by token hash
   */
  async findByTokenHash(tokenHash, db = null) {
    if (!tokenHash) {
      return null;
    }
    return this.queryOne(
      'SELECT * FROM invitations WHERE token_hash = $1',
      [tokenHash],
      db
    );
  }

  /**
   * Find invitation by short code (active only)
   */
  async findByShortCode(shortCode, db = null) {
    if (!shortCode) {
      return null;
    }
    return this.queryOne(
      `SELECT * FROM invitations
       WHERE short_code = $1
       AND status = 'pending'
       AND expires_at > CURRENT_TIMESTAMP`,
      [shortCode.toUpperCase()],
      db
    );
  }

  /**
   * Find all invitations for a user with inviter details
   */
  async findByUserId(userId, db = null) {
    if (!userId) {
      return [];
    }
    return this.query(
      `SELECT i.*, u.username as inviter_username, u.display_name as inviter_display_name
       FROM invitations i
       LEFT JOIN users u ON i.inviter_id = u.id
       WHERE i.inviter_id = $1 OR i.invitee_id = $1
       ORDER BY i.created_at DESC`,
      [userId],
      db
    );
  }

  /**
   * Update invitation status with authorization check
   */
  async updateStatusByInviter(id, inviterId, currentStatus, newStatus, db = null) {
    return this.queryOne(
      `UPDATE invitations
       SET status = $1
       WHERE id = $2 AND inviter_id = $3 AND status = $4
       RETURNING *`,
      [newStatus, id, inviterId, currentStatus],
      db
    );
  }

  /**
   * Update token and reset expiration
   */
  async updateTokenAndExpiration(id, inviterId, tokenHash, expiresAt, newStatus, allowedStatuses, db = null) {
    return this.queryOne(
      `UPDATE invitations
       SET token_hash = $1, expires_at = $2, status = $3
       WHERE id = $4 AND inviter_id = $5 AND status = ANY($6)
       RETURNING *`,
      [tokenHash, expiresAt, newStatus, id, inviterId, allowedStatuses],
      db
    );
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(id, inviteeId, roomId, db = null) {
    return this.queryOne(
      `UPDATE invitations
       SET status = 'accepted', invitee_id = $1, room_id = $2, accepted_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP
       RETURNING *`,
      [inviteeId, roomId, id],
      db
    );
  }

  /**
   * Create invitation with all fields
   */
  async createInvitation(data, db = null) {
    const {
      tokenHash,
      inviterId,
      inviteeEmail,
      inviteeId,
      status,
      roomId,
      invitationType,
      expiresAt,
      shortCode,
    } = data;

    return this.queryOne(
      `INSERT INTO invitations (
        token_hash, inviter_id, invitee_email, invitee_id,
        status, room_id, invitation_type, expires_at, short_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        tokenHash,
        inviterId,
        inviteeEmail.toLowerCase().trim(),
        inviteeId,
        status,
        roomId,
        invitationType,
        expiresAt,
        shortCode,
      ],
      db
    );
  }
}

// Singleton instance
const invitationRepository = new PostgresInvitationRepository();

module.exports = { PostgresInvitationRepository, invitationRepository };
