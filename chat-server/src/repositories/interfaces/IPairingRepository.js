/**
 * Pairing Repository Interface
 *
 * Abstraction for pairing session data access operations.
 * Implements Dependency Inversion Principle.
 *
 * @module repositories/interfaces/IPairingRepository
 */

const { IGenericRepository } = require('./IGenericRepository');

/**
 * Pairing repository interface
 * Extends generic repository with pairing-specific methods
 */
class IPairingRepository extends IGenericRepository {
  /**
   * Find active pairing for a user
   * @param {string} userId - User ID
   * @param {string} activeStatus - Status considered active
   * @returns {Promise<Object|null>} Active pairing or null
   */
  async findActiveByUserId(userId, activeStatus) {
    throw new Error('findActiveByUserId() must be implemented by subclass');
  }

  /**
   * Find pending pairing for a user (as initiator)
   * @param {string} userId - User ID
   * @param {string} pendingStatus - Status considered pending
   * @returns {Promise<Object|null>} Pending pairing or null
   */
  async findPendingByInitiator(userId, pendingStatus) {
    throw new Error('findPendingByInitiator() must be implemented by subclass');
  }

  /**
   * Check if pairing code exists
   * @param {string} code - Pairing code
   * @returns {Promise<boolean>} True if exists
   */
  async codeExists(code) {
    throw new Error('codeExists() must be implemented by subclass');
  }

  /**
   * Create email pairing session
   * @param {Object} data - Pairing data
   * @returns {Promise<Object>} Created pairing
   */
  async createEmailPairing(data) {
    throw new Error('createEmailPairing() must be implemented by subclass');
  }

  /**
   * Create link pairing session
   * @param {Object} data - Pairing data
   * @returns {Promise<Object>} Created pairing
   */
  async createLinkPairing(data) {
    throw new Error('createLinkPairing() must be implemented by subclass');
  }

  /**
   * Create code pairing session
   * @param {Object} data - Pairing data
   * @returns {Promise<Object>} Created pairing
   */
  async createCodePairing(data) {
    throw new Error('createCodePairing() must be implemented by subclass');
  }

  /**
   * Expire code pairings for user
   * @param {string} userId - User ID
   * @param {string} pendingStatus - Current status
   * @param {string} expiredStatus - New status
   * @param {string} codeType - Invite type for code
   * @returns {Promise<number>} Number of expired
   */
  async expireUserCodePairings(userId, pendingStatus, expiredStatus, codeType) {
    throw new Error('expireUserCodePairings() must be implemented by subclass');
  }

  /**
   * Cancel pairing by initiator
   * @param {number} id - Pairing ID
   * @param {string} userId - Initiator user ID
   * @param {string} pendingStatus - Current status
   * @param {string} canceledStatus - New status
   * @returns {Promise<Object|null>} Cancelled pairing or null
   */
  async cancelByInitiator(id, userId, pendingStatus, canceledStatus) {
    throw new Error('cancelByInitiator() must be implemented by subclass');
  }

  /**
   * Find pending pairing by ID and initiator
   * @param {number} id - Pairing ID
   * @param {string} userId - Initiator user ID
   * @param {string} pendingStatus - Status
   * @returns {Promise<Object|null>} Pairing or null
   */
  async findPendingById(id, userId, pendingStatus) {
    throw new Error('findPendingById() must be implemented by subclass');
  }

  /**
   * Update pairing token and expiration
   * @param {number} id - Pairing ID
   * @param {string} tokenHash - New token hash
   * @param {string} expiresAt - New expiration
   * @returns {Promise<Object|null>} Updated pairing or null
   */
  async updateTokenAndExpiration(id, tokenHash, expiresAt) {
    throw new Error('updateTokenAndExpiration() must be implemented by subclass');
  }

  /**
   * Expire old pending pairings
   * @param {string} expiredStatus - Status to set
   * @param {string} pendingStatus - Current status to match
   * @returns {Promise<number>} Number of expired
   */
  async expireOldPairings(expiredStatus, pendingStatus) {
    throw new Error('expireOldPairings() must be implemented by subclass');
  }

  /**
   * Log pairing action to audit trail
   * @param {Object} params - Audit log data
   * @returns {Promise<void>}
   */
  async logAction(params) {
    throw new Error('logAction() must be implemented by subclass');
  }
}

module.exports = { IPairingRepository };
