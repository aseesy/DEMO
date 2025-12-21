/**
 * Invitation Service
 *
 * Actor: Product/UX (invitation flows)
 * Responsibility: Invitation lifecycle management for co-parent connections
 *
 * Wraps the invitation-manager and pairing-manager libraries,
 * providing unified business logic with proper error handling.
 */

const { BaseService } = require('../BaseService');
const { NotFoundError, ValidationError, ConflictError, ExpiredError } = require('../errors');
const { PostgresUserRepository } = require('../../repositories');
const invitationManager = require('../../../libs/invitation-manager');
const pairingManager = require('../../../libs/pairing-manager');
// Note: db is required here for passing to external libraries (invitationManager, pairingManager)
// These libraries haven't been refactored to use repositories yet
const db = require('../../../dbPostgres');

class InvitationService extends BaseService {
  constructor() {
    super('invitations');
    this.userRepository = new PostgresUserRepository();
    this.invitationManager = invitationManager;
    this.pairingManager = pairingManager;
    this.db = db; // Cache db reference for external library calls
  }

  /**
   * Validate an invitation token (checks both systems)
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Validation result
   */
  async validateToken(token) {
    if (!token) {
      throw new ValidationError('Token is required', 'token');
    }

    // Try invitations table first (legacy system)
    let validation = await this.invitationManager.validateToken(token, this.db);

    // If not found, try pairing_sessions table (new system)
    if (!validation.valid && validation.code === 'INVALID_TOKEN') {
      console.log('Token not found in invitations table, trying pairing_sessions...');
      const pairingValidation = await this.pairingManager.validateToken(token, this.db);

      if (pairingValidation.valid) {
        return this._formatPairingValidation(pairingValidation);
      }

      // Return pairing error if different from INVALID_TOKEN
      if (pairingValidation.code !== 'INVALID_TOKEN') {
        throw this._createValidationError(pairingValidation);
      }
    }

    if (!validation.valid) {
      throw this._createValidationError(validation);
    }

    return this._formatInvitationValidation(validation);
  }

  /**
   * Validate a short invite code (checks both systems)
   * @param {string} code - Short invite code (e.g., LZ-ABC123)
   * @returns {Promise<Object>} Validation result
   */
  async validateCode(code) {
    if (!code) {
      throw new ValidationError('Invite code is required', 'code');
    }

    // Try invitations table first
    let validation = await this.invitationManager.validateByShortCode(code, this.db);

    // If not found, try pairing_sessions table
    if (!validation.valid && validation.code === 'INVALID_CODE') {
      console.log('Code not found in invitations table, trying pairing_sessions...');
      const pairingValidation = await this.pairingManager.validateCode(code, this.db);

      if (pairingValidation.valid) {
        return this._formatPairingValidation(pairingValidation);
      }

      if (pairingValidation.code !== 'INVALID_CODE') {
        throw this._createValidationError(pairingValidation);
      }
    }

    if (!validation.valid) {
      throw this._createValidationError(validation);
    }

    return this._formatInvitationValidation(validation);
  }

  /**
   * Get user's sent and received invitations
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User's invitations
   */
  async getUserInvitations(userId, options = {}) {
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    return this.invitationManager.getUserInvitations(userId, this.db, options);
  }

  /**
   * Create a new invitation
   * @param {number} inviterId - Inviter user ID
   * @param {string} inviteeEmail - Optional invitee email
   * @returns {Promise<Object>} Created invitation with shareable info
   */
  async createInvitation(inviterId, inviteeEmail = null) {
    if (!inviterId) {
      throw new ValidationError('Inviter ID is required', 'inviterId');
    }

    try {
      const result = await this.invitationManager.createInvitation(
        {
          inviterId,
          inviteeEmail: inviteeEmail || `pending-${Date.now()}@placeholder.local`,
        },
        this.db
      );

      // Get inviter info for shareable message using repository
      const inviter = await this.userRepository.getProfile(inviterId);
      const inviterName =
        inviter?.first_name || inviter?.display_name || inviter?.username || 'Your co-parent';

      const frontendUrl = process.env.APP_URL || 'https://coparentliaizen.com';
      const inviteUrl = `${frontendUrl}/accept-invite?token=${result.token}`;

      return {
        success: true,
        invitation: result.invitation,
        token: result.token,
        shortCode: result.shortCode,
        inviteUrl,
        expiresAt: result.invitation.expires_at,
        inviterName,
        shareableMessage: `Hi! I'm using LiaiZen to help us communicate better for our kids. Join me using this link: ${inviteUrl}\n\nOr if you already have an account, use invite code: ${result.shortCode}`,
      };
    } catch (error) {
      if (error.message.includes('limit reached')) {
        throw new ConflictError(error.message);
      }
      if (error.message.includes('already exists')) {
        throw new ConflictError(error.message);
      }
      throw error;
    }
  }

  /**
   * Accept an invitation by short code
   * @param {string} code - Short invite code
   * @param {number} userId - Accepting user ID
   * @returns {Promise<Object>} Acceptance result
   */
  async acceptByCode(code, userId) {
    if (!code) {
      throw new ValidationError('Invite code is required', 'code');
    }
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }


    try {
      const result = await this.invitationManager.acceptByShortCode(code, userId, this.db);

      // Create shared room if not exists
      let sharedRoom = null;
      if (result.roomId) {
        sharedRoom = { id: result.roomId };
      } else {
        sharedRoom = await this._createSharedRoom(result.inviterId, userId, this.db);
      }

      return {
        success: true,
        invitation: result.invitation,
        sharedRoom,
      };
    } catch (error) {
      if (error.message.includes('limit reached')) {
        throw new ConflictError(error.message);
      }
      throw error;
    }
  }

  /**
   * Resend an invitation
   * @param {number} invitationId - Invitation ID
   * @param {number} userId - Requesting user ID
   * @returns {Promise<Object>} Updated invitation
   */
  async resendInvitation(invitationId, userId) {
    if (!invitationId) {
      throw new ValidationError('Invitation ID is required', 'invitationId');
    }


    const result = await this.invitationManager.resendInvitation(invitationId, userId, this.db);
    const invitation = await this.invitationManager.getInvitationById(invitationId, this.db);

    return {
      success: true,
      invitation: result.invitation,
      token: result.token,
      expiresAt: result.invitation.expires_at,
      inviteeEmail: invitation?.invitee_email,
      inviterName: invitation?.inviter_name,
    };
  }

  /**
   * Cancel an invitation
   * @param {number} invitationId - Invitation ID
   * @param {number} userId - Requesting user ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelInvitation(invitationId, userId) {
    if (!invitationId) {
      throw new ValidationError('Invitation ID is required', 'invitationId');
    }

    await this.invitationManager.cancelInvitation(invitationId, userId, this.db);

    return {
      success: true,
      message: 'Invitation cancelled',
    };
  }

  /**
   * Get user's active outgoing invitation
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Active invitation or null
   */
  async getActiveInvitation(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    const result = await this.query(
      `SELECT i.*, u.username as invitee_name, u.email as invitee_email_user
       FROM invitations i
       LEFT JOIN users u ON i.invitee_id = u.id
       WHERE i.inviter_id = $1 AND i.status = 'pending'
       ORDER BY i.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.length === 0) {
      return { hasInvite: false };
    }

    const invitation = result[0];
    const frontendUrl = process.env.APP_URL || 'https://coparentliaizen.com';

    return {
      hasInvite: true,
      invitation: {
        id: invitation.id,
        shortCode: invitation.short_code,
        inviteeEmail: invitation.invitee_email,
        status: invitation.status,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
      },
      inviteUrl: `${frontendUrl}/accept-invite?token=${invitation.token_hash}`,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Private Helper Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Format pairing validation to standard format
   */
  _formatPairingValidation(pairingValidation) {
    const inviterEmail =
      pairingValidation.initiatorEmail || pairingValidation.pairing?.initiator_email || '';
    const inviterEmailDomain = inviterEmail ? inviterEmail.split('@')[1] || '' : '';

    return {
      valid: true,
      inviterName:
        pairingValidation.initiatorName || pairingValidation.pairing?.invited_by_username,
      inviterEmail,
      inviterEmailDomain,
      inviteeEmail: pairingValidation.pairing?.parent_b_email,
      expiresAt: pairingValidation.pairing?.expires_at,
      isPairing: true,
      pairingId: pairingValidation.pairing?.id,
    };
  }

  /**
   * Format invitation validation to standard format
   */
  _formatInvitationValidation(validation) {
    const inviterEmailDomain = validation.inviterEmail
      ? validation.inviterEmail.split('@')[1] || ''
      : '';

    return {
      valid: true,
      inviterName: validation.inviterName,
      inviterEmail: validation.inviterEmail,
      inviterEmailDomain,
      inviteeEmail: validation.invitation.invitee_email,
      expiresAt: validation.invitation.expires_at,
      isPairing: false,
    };
  }

  /**
   * Create validation error from validation result
   */
  _createValidationError(validation) {
    if (validation.code === 'EXPIRED') {
      return new ExpiredError('Invitation');
    }
    return new ValidationError(validation.error || 'Invalid invitation', 'token');
  }

  /**
   * Create a shared room for co-parents
   */
  async _createSharedRoom(inviterId, inviteeId, db) {
    const roomId = `room_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    await this.db.query(
      'INSERT INTO rooms (id, name, created_by, is_private) VALUES ($1, $2, $3, 1)',
      [roomId, 'Co-Parent Chat', inviterId]
    );

    await this.db.query(
      'INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, $3), ($1, $4, $3)',
      [roomId, inviterId, 'coparent', inviteeId]
    );

    return { id: roomId, name: 'Co-Parent Chat' };
  }
}

// Export singleton instance
const invitationService = new InvitationService();

module.exports = { invitationService, InvitationService };
