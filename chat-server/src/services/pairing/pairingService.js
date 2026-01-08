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

const { defaultLogger: defaultLogger } = require('../../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'pairingService',
});

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
   * @returns {Promise<Object>} Validation result (includes error info if invalid)
   */
  async validateToken(token) {
    if (!token || token.trim().length === 0) {
      return {
        valid: false,
        error: 'Pairing token is required',
        code: 'TOKEN_REQUIRED',
      };
    }

    try {
      const result = await pairingManager.validateToken(token, this.db);

      if (!result.valid) {
        // Preserve error code and details from validator
        return {
          valid: false,
          error: result.error || 'Invalid pairing token',
          code: result.code || 'INVALID_TOKEN',
          pairing: result.pairing, // Include pairing info if available for debugging
          needsExpiration: result.needsExpiration, // Flag if token needs to be marked expired
        };
      }

      // Mark expired if needed (side effect)
      if (result.needsExpiration && result.pairing) {
        try {
          const { markSessionExpired } = require('../../../libs/pairing-manager/pairingValidator');
          await markSessionExpired(this.db, result.pairing.id);
          logger.debug('Log message', {
            value: `[PairingService] Marked expired pairing session ${result.pairing.id}`,
          });
        } catch (expireError) {
          logger.error('[PairingService] Failed to mark session as expired', {
            expireError: expireError,
          });
          // Continue - validation result is still correct
        }
      }

      return this._formatValidationResult(result);
    } catch (error) {
      // Handle database errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        logger.error('[PairingService] Database connection error during token validation', {
          error: error,
        });
        return {
          valid: false,
          error: 'Database connection failed',
          code: 'DATABASE_ERROR',
        };
      }

      // Re-throw unexpected errors
      throw error;
    }
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
      code: result.code || 'VALID', // Include the validation code
      inviterName:
        result.initiatorName ||
        result.pairing.invited_by_username ||
        result.pairing.initiator_username,
      inviterUsername: result.pairing.invited_by_username || result.pairing.initiator_username,
      inviterEmailDomain,
      inviteType: result.pairing.invite_type,
      expiresAt: result.pairing.expires_at,
      parentBEmail: result.pairing.parent_b_email || null, // Include email restriction if set
    };
  }
}

// Export singleton instance
const pairingService = new PairingService();

module.exports = { pairingService, PairingService };
