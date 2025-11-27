/**
 * Pairing Manager Library
 *
 * Unified library for managing co-parent account pairing.
 * Handles pairing creation, validation, acceptance, and mutual detection.
 *
 * Feature: 004-account-pairing-refactor
 * Constitutional Compliance:
 *   - Principle I (Library-First): Standalone module with clear API
 *   - Principle III (Contract-First): Defined interfaces before implementation
 *   - Principle V (Idempotent): Safe to retry operations
 *   - Principle XV (Conflict Reduction): Enables co-parent connections
 *
 * Usage:
 *   const pairingManager = require('./libs/pairing-manager');
 *
 *   // Create a pairing via email
 *   const result = await pairingManager.createEmailPairing({
 *     initiatorId: userId,
 *     inviteeEmail: 'coparent@example.com',
 *     initiatorUsername: 'John',
 *   }, db);
 *
 *   // Validate a code
 *   const validation = await pairingManager.validateCode('LZ-842396', db);
 *
 *   // Accept a pairing
 *   const acceptance = await pairingManager.acceptByCode('LZ-842396', userId, db, roomManager);
 *
 *   // Get pairing status
 *   const status = await pairingManager.getPairingStatus(userId, db);
 */

const pairingCreator = require('./pairingCreator');
const pairingValidator = require('./pairingValidator');
const mutualDetector = require('./mutualDetector');

module.exports = {
  // ============================================================================
  // PAIRING CREATION
  // ============================================================================

  /**
   * Create a pairing via email invitation (7-day expiration)
   * @param {object} params - { initiatorId, inviteeEmail, initiatorUsername }
   * @param {object} db - Database connection
   * @returns {Promise<object>} { pairing, pairingCode, token, expiresAt }
   */
  createEmailPairing: pairingCreator.createEmailPairing,

  /**
   * Create a pairing via shareable link (7-day expiration)
   * @param {object} params - { initiatorId, initiatorUsername }
   * @param {object} db - Database connection
   * @returns {Promise<object>} { pairing, pairingCode, token, expiresAt }
   */
  createLinkPairing: pairingCreator.createLinkPairing,

  /**
   * Create a pairing via quick code (15-minute expiration)
   * @param {object} params - { initiatorId, initiatorUsername }
   * @param {object} db - Database connection
   * @returns {Promise<object>} { pairing, pairingCode, expiresAt }
   */
  createCodePairing: pairingCreator.createCodePairing,

  /**
   * Cancel a pending pairing
   * @param {number} pairingId - Pairing session ID
   * @param {string} userId - User requesting cancellation
   * @param {object} db - Database connection
   * @returns {Promise<object>} Cancelled pairing
   */
  cancelPairing: pairingCreator.cancelPairing,

  /**
   * Resend a pairing invitation (generates new token)
   * @param {number} pairingId - Pairing session ID
   * @param {string} userId - User requesting resend
   * @param {object} db - Database connection
   * @returns {Promise<object>} { pairing, token, expiresAt }
   */
  resendPairing: pairingCreator.resendPairing,

  // ============================================================================
  // PAIRING VALIDATION
  // ============================================================================

  /**
   * Validate a pairing token (for email/link invitations)
   * @param {string} token - Raw invitation token
   * @param {object} db - Database connection
   * @returns {Promise<object>} { valid, pairing?, error?, code? }
   */
  validateToken: pairingValidator.validateToken,

  /**
   * Validate a pairing code (for quick pairing)
   * @param {string} code - Pairing code (e.g., "LZ-842396")
   * @param {object} db - Database connection
   * @returns {Promise<object>} { valid, pairing?, error?, code? }
   */
  validateCode: pairingValidator.validateCode,

  // ============================================================================
  // PAIRING ACCEPTANCE
  // ============================================================================

  /**
   * Accept a pairing invitation (creates room + contacts)
   * @param {object} params - { pairingId, acceptorId }
   * @param {object} db - Database connection
   * @param {object} roomManager - Room manager for creating shared room
   * @returns {Promise<object>} { pairing, initiatorId, acceptorId, sharedRoomId }
   */
  acceptPairing: pairingValidator.acceptPairing,

  /**
   * Accept a pairing by token
   * @param {string} token - Raw invitation token
   * @param {string} acceptorId - User ID accepting
   * @param {object} db - Database connection
   * @param {object} roomManager - Room manager
   * @returns {Promise<object>} Acceptance result
   */
  acceptByToken: pairingValidator.acceptByToken,

  /**
   * Accept a pairing by code
   * @param {string} code - Pairing code
   * @param {string} acceptorId - User ID accepting
   * @param {object} db - Database connection
   * @param {object} roomManager - Room manager
   * @returns {Promise<object>} Acceptance result
   */
  acceptByCode: pairingValidator.acceptByCode,

  /**
   * Decline a pairing invitation
   * @param {number} pairingId - Pairing session ID
   * @param {string} declinerId - User ID declining
   * @param {object} db - Database connection
   * @returns {Promise<object>} Declined pairing
   */
  declinePairing: pairingValidator.declinePairing,

  // ============================================================================
  // PAIRING QUERIES
  // ============================================================================

  /**
   * Get pairing by ID
   * @param {number} pairingId - Pairing session ID
   * @param {object} db - Database connection
   * @returns {Promise<object|null>} Pairing or null
   */
  getPairingById: pairingValidator.getPairingById,

  /**
   * Get comprehensive pairing status for a user
   * @param {string} userId - User ID
   * @param {object} db - Database connection
   * @returns {Promise<object>} { status: 'unpaired'|'pending_sent'|'pending_received'|'paired', ... }
   */
  getPairingStatus: pairingValidator.getPairingStatus,

  /**
   * Get active pairing for a user
   * @param {string} userId - User ID
   * @param {object} db - Database connection
   * @returns {Promise<object|null>} Active pairing or null
   */
  getActivePairing: pairingCreator.getActivePairing,

  /**
   * Get pending pairing for a user (as initiator)
   * @param {string} userId - User ID
   * @param {object} db - Database connection
   * @returns {Promise<object|null>} Pending pairing or null
   */
  getPendingPairing: pairingCreator.getPendingPairing,

  // ============================================================================
  // MUTUAL DETECTION
  // ============================================================================

  /**
   * Check if a mutual invitation exists
   * @param {object} params - { initiatorId, initiatorEmail, inviteeEmail }
   * @param {object} db - Database connection
   * @returns {Promise<object|null>} Mutual invitation if found
   */
  checkMutualInvitation: mutualDetector.checkMutualInvitation,

  /**
   * Detect and auto-complete mutual invitation
   * Call this before creating a new invitation
   * @param {object} params - { initiatorId, initiatorEmail, inviteeEmail }
   * @param {object} db - Database connection
   * @param {object} roomManager - Room manager
   * @returns {Promise<object|null>} Completed pairing if mutual, null if not
   */
  detectAndCompleteMutual: mutualDetector.detectAndCompleteMutual,

  /**
   * Find potential matches based on shared child data
   * @param {string} userId - User to find matches for
   * @param {object} db - Database connection
   * @returns {Promise<Array>} Potential matches
   */
  findPotentialMatches: mutualDetector.findPotentialMatches,

  // ============================================================================
  // MAINTENANCE
  // ============================================================================

  /**
   * Expire old pending pairings
   * @param {object} db - Database connection
   * @returns {Promise<number>} Number of expired pairings
   */
  expireOldPairings: pairingCreator.expireOldPairings,

  /**
   * Log a pairing action to audit trail
   * @param {object} db - Database connection
   * @param {object} params - Audit log parameters
   */
  logPairingAction: pairingCreator.logPairingAction,

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Generate a secure random token
   * @returns {string} Hex-encoded token (64 characters)
   */
  generateToken: pairingCreator.generateToken,

  /**
   * Hash a token for secure storage
   * @param {string} token - Raw token
   * @returns {string} SHA-256 hash (64 characters)
   */
  hashToken: pairingCreator.hashToken,

  /**
   * Generate a human-readable pairing code
   * @returns {string} Pairing code (e.g., "LZ-842396")
   */
  generatePairingCode: pairingCreator.generatePairingCode,

  /**
   * Calculate expiration timestamp
   * @param {string} inviteType - 'email', 'link', or 'code'
   * @returns {Date} Expiration date
   */
  calculateExpiration: pairingCreator.calculateExpiration,

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  /** Pairing status values: PENDING, ACTIVE, CANCELED, EXPIRED */
  PAIRING_STATUS: pairingCreator.PAIRING_STATUS,

  /** Invitation type values: EMAIL, LINK, CODE */
  INVITE_TYPE: pairingCreator.INVITE_TYPE,

  /** Configuration constants */
  PAIRING_CONFIG: pairingCreator.PAIRING_CONFIG,

  /** Validation result codes */
  VALIDATION_CODE: pairingValidator.VALIDATION_CODE,
};
