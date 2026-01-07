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
const { ValidationError, ConflictError, ExpiredError } = require('../errors');
const { PostgresUserRepository } = require('../../repositories');
const invitationManager = require('../../../libs/invitation-manager');
const pairingManager = require('../../../libs/pairing-manager');
// Note: db is required here for passing to external libraries (invitationManager, pairingManager)
// These libraries haven't been refactored to use repositories yet
const db = require('../../../dbPostgres');
const { createCoParentRoom } = require('../../../roomManager/coParent');

// Lazy load invitationEmailService to avoid circular dependency
let invitationEmailService = null;
function getInvitationEmailService() {
  if (!invitationEmailService) {
    invitationEmailService = require('./invitationEmailService').invitationEmailService;
  }
  return invitationEmailService;
}

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
    return this._validateWithFallback(
      () => this.invitationManager.validateToken(token, this.db),
      () => this.pairingManager.validateToken(token, this.db),
      'INVALID_TOKEN',
      'Token'
    );
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
    return this._validateWithFallback(
      () => this.invitationManager.validateByShortCode(code, this.db),
      () => this.pairingManager.validateCode(code, this.db),
      'INVALID_CODE',
      'Code'
    );
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

      // Create shared room if not exists (also sends welcome message and creates contacts)
      let sharedRoom = null;
      if (result.roomId) {
        sharedRoom = { id: result.roomId };
      } else {
        // Get user names for room creation
        const inviter = await this.userRepository.getProfile(result.inviterId);
        const invitee = await this.userRepository.getProfile(userId);
        const inviterName = inviter?.first_name || inviter?.display_name || 'Co-Parent';
        const inviteeName = invitee?.first_name || invitee?.display_name || 'Co-Parent';

        // Use existing createCoParentRoom which handles welcome message, contacts, etc.
        const roomResult = await createCoParentRoom(
          result.inviterId,
          userId,
          inviterName,
          inviteeName
        );
        sharedRoom = { id: roomResult.roomId, name: roomResult.roomName };
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
   * Accept an invitation by token (for existing users)
   * @param {string} token - Invitation token
   * @param {number} userId - Accepting user ID
   * @returns {Promise<Object>} Acceptance result
   */
  async acceptByToken(token, userId) {
    if (!token) {
      throw new ValidationError('Invitation token is required', 'token');
    }
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    try {
      const result = await this.invitationManager.acceptInvitation(token, userId, this.db);

      // Create shared room if not exists (also sends welcome message and creates contacts)
      let sharedRoom = null;
      if (result.roomId) {
        sharedRoom = { id: result.roomId };
      } else {
        // Get user names for room creation
        const inviter = await this.userRepository.getProfile(result.inviterId);
        const invitee = await this.userRepository.getProfile(userId);
        const inviterName = inviter?.first_name || inviter?.display_name || 'Co-Parent';
        const inviteeName = invitee?.first_name || invitee?.display_name || 'Co-Parent';

        // Use existing createCoParentRoom which handles welcome message, contacts, etc.
        const roomResult = await createCoParentRoom(
          result.inviterId,
          userId,
          inviterName,
          inviteeName
        );
        sharedRoom = { id: roomResult.roomId, name: roomResult.roomName };
      }

      return {
        success: true,
        invitation: result.invitation,
        sharedRoom,
        inviterId: result.inviterId,
        inviteeId: result.inviteeId,
      };
    } catch (error) {
      if (error.message.includes('limit reached')) {
        throw new ConflictError(error.message);
      }
      throw error;
    }
  }

  /**
   * Decline an invitation by token
   * @param {string} token - Invitation token
   * @param {number} userId - Declining user ID
   * @returns {Promise<Object>} Decline result
   */
  async declineByToken(token, userId) {
    if (!token) {
      throw new ValidationError('Invitation token is required', 'token');
    }
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    const result = await this.invitationManager.declineInvitation(token, userId, this.db);
    return {
      success: true,
      invitation: result.invitation,
      inviterId: result.inviterId,
    };
  }

  /**
   * Create invitation and send email if provided
   * @param {number} inviterId - Inviter user ID
   * @param {string} inviteeEmail - Optional invitee email
   * @returns {Promise<Object>} Created invitation with email status
   */
  async createInvitationWithEmail(inviterId, inviteeEmail = null) {
    const result = await this.createInvitation(inviterId, inviteeEmail);

    // Send email if address was provided
    let emailSent = false;
    if (inviteeEmail && inviteeEmail.includes('@')) {
      try {
        const emailService = getInvitationEmailService();
        const emailResult = await emailService.sendNewUserInvite({
          inviteeEmail,
          inviterName: result.inviterName,
          token: result.token,
        });
        emailSent = emailResult.emailSent;
      } catch (error) {
        console.error('[InvitationService] Failed to send email:', error);
        // Don't fail invitation creation if email fails
      }
    }

    return {
      ...result,
      emailSent,
    };
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
   * Resend invitation and send email if applicable
   * @param {number} invitationId - Invitation ID
   * @param {number} userId - Requesting user ID
   * @returns {Promise<Object>} Updated invitation with email status
   */
  async resendInvitationWithEmail(invitationId, userId) {
    const result = await this.resendInvitation(invitationId, userId);

    // Send email if there's an invitee email
    if (result.inviteeEmail && !result.inviteeEmail.includes('placeholder')) {
      try {
        const emailService = getInvitationEmailService();
        await emailService.resendInvitationEmail({
          inviteeEmail: result.inviteeEmail,
          inviterName: result.inviterName,
          token: result.token,
        });
      } catch (error) {
        console.error('[InvitationService] Failed to resend email:', error);
        // Don't fail resend if email fails
      }
    }

    return result;
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
   * Validate using primary system, fall back to secondary if not found
   * @param {Function} primaryFn - Primary validation function
   * @param {Function} fallbackFn - Fallback validation function
   * @param {string} notFoundCode - Error code indicating "not found"
   * @param {string} type - Type label for logging
   * @returns {Promise<Object>} Formatted validation result
   */
  async _validateWithFallback(primaryFn, fallbackFn, notFoundCode, type) {
    const validation = await primaryFn();

    if (!validation.valid && validation.code === notFoundCode) {
      console.log(`${type} not found in invitations table, trying pairing_sessions...`);
      const pairingValidation = await fallbackFn();

      if (pairingValidation.valid) {
        return this._formatPairingValidation(pairingValidation);
      }
      if (pairingValidation.code !== notFoundCode) {
        throw this._createValidationError(pairingValidation);
      }
    }

    if (!validation.valid) {
      throw this._createValidationError(validation);
    }

    return this._formatInvitationValidation(validation);
  }

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
}

// Export singleton instance
const invitationService = new InvitationService();

module.exports = { invitationService, InvitationService };
