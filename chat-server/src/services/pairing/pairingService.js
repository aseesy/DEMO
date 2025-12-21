/**
 * Pairing Service
 *
 * Actor: Product/UX (co-parent connection flows)
 * Responsibility: Pairing session lifecycle management
 *
 * Wraps the pairing-manager library with unified error handling.
 */

const { BaseService } = require('../BaseService');
const { NotFoundError, ValidationError, ConflictError, AuthenticationError } = require('../errors');
const { PostgresUserRepository } = require('../../repositories');
const pairingManager = require('../../../libs/pairing-manager');
const { factory: invitationFactory } = require('../../../libs/pairing-manager/InvitationFactory');
// Note: db is required here for passing to external libraries (pairingManager, invitationFactory)
// These libraries haven't been refactored to use repositories yet
const db = require('../../../dbPostgres');

class PairingService extends BaseService {
  constructor() {
    super('pairing_sessions');
    this.userRepository = new PostgresUserRepository();
    this.roomManager = null;
    this.db = db; // Cache db reference for external library calls
  }

  /**
   * Set the room manager instance (injected from server.js)
   */
  setRoomManager(roomManager) {
    this.roomManager = roomManager;
  }

  /**
   * Create a new pairing invitation
   * @param {number} userId - Initiator user ID
   * @param {string} type - Invitation type (email, link, code)
   * @param {string} inviteeEmail - Optional invitee email (required for email type)
   * @returns {Promise<Object>} Created pairing info
   */
  async createPairing(userId, type, inviteeEmail = null) {
    if (!userId) {
      throw new AuthenticationError('User not authenticated properly');
    }

    if (!type || !['email', 'link', 'code'].includes(type)) {
      throw new ValidationError('Invalid invitation type. Must be email, link, or code.', 'type');
    }

    if (type === 'email' && !inviteeEmail) {
      throw new ValidationError('inviteeEmail is required for email invitations', 'inviteeEmail');
    }

    // Get user info using repository
    const user = await this.userRepository.getUserForPairing(userId);

    if (!user) {
      throw new NotFoundError('User', userId);
    }
    const inviterName = user.first_name || user.display_name || user.username;

    // Check for mutual invitation if email type
    if (type === 'email' && inviteeEmail) {
      const mutualResult = await pairingManager.detectAndCompleteMutual(
        {
          initiatorId: userId,
          initiatorEmail: user.email,
          inviteeEmail: inviteeEmail,
          initiatorName: inviterName,
        },
        this.db,
        this.roomManager
      );

      if (mutualResult) {
        return {
          success: true,
          mutual: true,
          message: 'Mutual invitation detected! You are now paired.',
          pairing: mutualResult.pairing,
          sharedRoomId: mutualResult.sharedRoomId,
        };
      }
    }

    try {
      // Use factory pattern
      const params = {
        initiatorId: userId,
        initiatorUsername: inviterName,
        ...(type === 'email' && { inviteeEmail }),
      };

      const result = await invitationFactory.create(type, params, this.db);

      return {
        success: true,
        pairingCode: result.pairingCode,
        token: result.token,
        expiresAt: result.expiresAt,
        inviteType: type,
      };
    } catch (error) {
      if (error.message.includes('already have an active')) {
        throw new ConflictError(error.message);
      }
      throw error;
    }
  }

  /**
   * Get current user's pairing status
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Pairing status
   */
  async getPairingStatus(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    return pairingManager.getPairingStatus(userId, this.db);
  }

  /**
   * Validate a pairing code
   * @param {string} code - Pairing code
   * @returns {Promise<Object>} Validation result
   */
  async validateCode(code) {
    if (!code) {
      throw new ValidationError('Pairing code is required', 'code');
    }

    const result = await pairingManager.validateCode(code, this.db);

    if (!result.valid) {
      throw new ValidationError(result.error || 'Invalid pairing code', 'code');
    }

    return this._formatValidationResult(result);
  }

  /**
   * Validate a pairing token
   * @param {string} token - Pairing token
   * @returns {Promise<Object>} Validation result
   */
  async validateToken(token) {
    if (!token) {
      throw new ValidationError('Pairing token is required', 'token');
    }

    const result = await pairingManager.validateToken(token, this.db);

    if (!result.valid) {
      throw new ValidationError(result.error || 'Invalid pairing token', 'token');
    }

    return this._formatValidationResult(result);
  }

  /**
   * Accept a pairing invitation
   * @param {number} userId - Accepting user ID
   * @param {Object} options - { code?: string, token?: string }
   * @returns {Promise<Object>} Acceptance result
   */
  async acceptPairing(userId, { code, token }) {
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    if (!code && !token) {
      throw new ValidationError('Either code or token is required', 'code');
    }

    try {
      let result;
      if (code) {
        result = await pairingManager.acceptByCode(code, userId, this.db, this.roomManager);
      } else {
        result = await pairingManager.acceptByToken(token, userId, this.db, this.roomManager);
      }

      return {
        success: true,
        message: 'Pairing accepted! You are now connected with your co-parent.',
        pairing: result.pairing,
        sharedRoomId: result.sharedRoomId,
        partnerId: result.initiatorId,
      };
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('expired')) {
        throw new ValidationError(error.message, 'code');
      }
      if (error.message.includes('cannot accept your own')) {
        throw new ValidationError(error.message, 'code');
      }
      throw error;
    }
  }

  /**
   * Decline a pairing invitation
   * @param {number} pairingId - Pairing ID
   * @param {number} userId - Declining user ID
   * @returns {Promise<Object>} Decline result
   */
  async declinePairing(pairingId, userId) {
    if (!pairingId) {
      throw new ValidationError('Pairing ID is required', 'pairingId');
    }

    try {
      await pairingManager.declinePairing(pairingId, userId, this.db);
      return {
        success: true,
        message: 'Pairing invitation declined.',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundError('Pairing', pairingId);
      }
      throw error;
    }
  }

  /**
   * Cancel a pending pairing (initiator only)
   * @param {number} pairingId - Pairing ID
   * @param {number} userId - Initiator user ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelPairing(pairingId, userId) {
    if (!pairingId) {
      throw new ValidationError('Pairing ID is required', 'pairingId');
    }

    try {
      await pairingManager.cancelPairing(pairingId, userId, this.db);
      return {
        success: true,
        message: 'Pairing invitation cancelled.',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundError('Pairing', pairingId);
      }
      throw error;
    }
  }

  /**
   * Resend a pairing invitation
   * @param {number} pairingId - Pairing ID
   * @param {number} userId - Initiator user ID
   * @returns {Promise<Object>} Resend result
   */
  async resendPairing(pairingId, userId) {
    if (!pairingId) {
      throw new ValidationError('Pairing ID is required', 'pairingId');
    }

    try {
      const result = await pairingManager.resendPairing(pairingId, userId, this.db);
      return {
        success: true,
        message: 'Invitation resent with new expiration.',
        token: result.token,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundError('Pairing', pairingId);
      }
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Private Helper Methods
  // ─────────────────────────────────────────────────────────────

  _formatValidationResult(result) {
    const inviterEmail = result.initiatorEmail || result.pairing.initiator_email || '';
    const inviterEmailDomain = inviterEmail.split('@')[1] || '';

    return {
      valid: true,
      inviterName:
        result.initiatorName ||
        result.pairing.invited_by_username ||
        result.pairing.initiator_username,
      inviterUsername: result.pairing.invited_by_username || result.pairing.initiator_username,
      inviterEmailDomain,
      inviteType: result.pairing.invite_type,
      expiresAt: result.pairing.expires_at,
    };
  }
}

// Export singleton instance
const pairingService = new PairingService();

module.exports = { pairingService, PairingService };
