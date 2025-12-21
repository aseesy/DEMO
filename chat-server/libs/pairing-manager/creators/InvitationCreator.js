/**
 * Invitation Creator Base Class
 *
 * Base class for all invitation creators in the pairing system.
 * Implements Strategy Pattern for Open-Closed Principle compliance.
 *
 * @module pairing-manager/creators/InvitationCreator
 */

/**
 * Base class for invitation creators
 * All invitation creators must extend this class and implement create()
 */
class InvitationCreator {
  /**
   * Create a pairing invitation
   *
   * @param {Object} params - Creation parameters
   * @param {string} params.initiatorId - User ID creating the pairing
   * @param {string} [params.inviteeEmail] - Email of person to invite (for email type)
   * @param {string} [params.initiatorUsername] - Display name of initiator
   * @param {Object} db - Database connection
   * @returns {Promise<Object>} Created pairing session with raw token/code
   */
  async create(params, db) {
    throw new Error('create() must be implemented by subclass');
  }

  /**
   * Get the invitation type this creator handles
   *
   * @returns {string} Invitation type (e.g., 'email', 'link', 'code')
   */
  getType() {
    throw new Error('getType() must be implemented by subclass');
  }
}

module.exports = { InvitationCreator };

