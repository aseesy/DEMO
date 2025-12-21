/**
 * Invitation Repository Interface
 *
 * Abstraction for invitation data access operations.
 * Implements Dependency Inversion Principle.
 *
 * @module repositories/interfaces/IInvitationRepository
 */

const { IGenericRepository } = require('./IGenericRepository');

/**
 * Invitation repository interface
 * Extends generic repository with invitation-specific methods
 */
class IInvitationRepository extends IGenericRepository {
  /**
   * Find active invitation by inviter and invitee email
   * @param {string} inviterId - Inviter's user ID
   * @param {string} inviteeEmail - Invitee's email
   * @param {string} status - Status to match
   * @returns {Promise<Object|null>} Invitation or null
   */
  async findActiveByInviterAndEmail(inviterId, inviteeEmail, status) {
    throw new Error('findActiveByInviterAndEmail() must be implemented by subclass');
  }

  /**
   * Count accepted invitations for a user
   * @param {string} userId - User ID
   * @param {string} invitationType - Type of invitation
   * @returns {Promise<number>} Count
   */
  async countAcceptedForUser(userId, invitationType) {
    throw new Error('countAcceptedForUser() must be implemented by subclass');
  }

  /**
   * Find invitation by token hash
   * @param {string} tokenHash - Hashed token
   * @returns {Promise<Object|null>} Invitation or null
   */
  async findByTokenHash(tokenHash) {
    throw new Error('findByTokenHash() must be implemented by subclass');
  }

  /**
   * Find invitation by short code
   * @param {string} shortCode - Short invite code
   * @returns {Promise<Object|null>} Invitation or null
   */
  async findByShortCode(shortCode) {
    throw new Error('findByShortCode() must be implemented by subclass');
  }

  /**
   * Find all invitations for a user (sent or received)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of invitations
   */
  async findByUserId(userId) {
    throw new Error('findByUserId() must be implemented by subclass');
  }

  /**
   * Update invitation status with authorization check
   * @param {number} id - Invitation ID
   * @param {string} inviterId - Inviter ID for authorization
   * @param {string} currentStatus - Required current status
   * @param {string} newStatus - New status
   * @returns {Promise<Object|null>} Updated invitation or null
   */
  async updateStatusByInviter(id, inviterId, currentStatus, newStatus) {
    throw new Error('updateStatusByInviter() must be implemented by subclass');
  }

  /**
   * Update token and reset expiration
   * @param {number} id - Invitation ID
   * @param {string} inviterId - Inviter ID for authorization
   * @param {string} tokenHash - New token hash
   * @param {string} expiresAt - New expiration
   * @param {string} newStatus - Status to set
   * @param {string[]} allowedStatuses - Allowed current statuses
   * @returns {Promise<Object|null>} Updated invitation or null
   */
  async updateTokenAndExpiration(id, inviterId, tokenHash, expiresAt, newStatus, allowedStatuses) {
    throw new Error('updateTokenAndExpiration() must be implemented by subclass');
  }

  /**
   * Accept an invitation
   * @param {number} id - Invitation ID
   * @param {string} inviteeId - Invitee user ID
   * @param {string} roomId - Room ID to associate
   * @returns {Promise<Object|null>} Updated invitation or null
   */
  async acceptInvitation(id, inviteeId, roomId) {
    throw new Error('acceptInvitation() must be implemented by subclass');
  }
}

module.exports = { IInvitationRepository };
