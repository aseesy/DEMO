/**
 * Pairing Creator
 *
 * Creates and manages co-parent pairing sessions with multiple invitation methods:
 * - Email: Send invitation to specific email (7-day expiration)
 * - Link: Generate shareable link for any channel (7-day expiration)
 * - Code: Quick 6-digit code for existing users (15-minute expiration)
 *
 * Feature: 004-account-pairing-refactor
 * Constitutional Compliance:
 *   - Principle I (Library-First): Standalone module with clear API
 *   - Principle III (Contract-First): Defined interfaces before implementation
 *   - Principle XV (Conflict Reduction): Enables co-parent connections
 *
 * ARCHITECTURE:
 *   - Business logic only - no direct SQL queries
 *   - Database access via pairingRepository
 */

const crypto = require('crypto');
const { pairingRepository } = require('../../src/repositories/postgres');

/**
 * Configuration for pairing sessions
 */
const PAIRING_CONFIG = {
  // Expiration times
  EMAIL_EXPIRATION_DAYS: 7,
  LINK_EXPIRATION_DAYS: 7,
  CODE_EXPIRATION_MINUTES: 15,

  // Token configuration
  TOKEN_BYTES: 32, // 64 hex characters
  TOKEN_ALGORITHM: 'sha256',

  // Code format: LZ-NNNNNN (6 digits)
  CODE_PREFIX: 'LZ-',
  CODE_LENGTH: 6,
};

/**
 * Pairing status constants
 */
const PAIRING_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  CANCELED: 'canceled',
  EXPIRED: 'expired',
};

/**
 * Invitation type constants
 */
const INVITE_TYPE = {
  EMAIL: 'email',
  LINK: 'link',
  CODE: 'code',
};

/**
 * Generate a secure random token
 * @returns {string} Hex-encoded random token (64 characters)
 */
function generateToken() {
  return crypto.randomBytes(PAIRING_CONFIG.TOKEN_BYTES).toString('hex');
}

/**
 * Hash a token for secure storage
 * @param {string} token - Raw token
 * @returns {string} SHA-256 hash of token (64 characters)
 */
function hashToken(token) {
  return crypto.createHash(PAIRING_CONFIG.TOKEN_ALGORITHM).update(token).digest('hex');
}

/**
 * Generate a human-readable pairing code
 * Format: LZ-NNNNNN (6 random digits)
 * @returns {string} Pairing code (e.g., "LZ-842396")
 */
function generatePairingCode() {
  const digits = crypto.randomInt(100000, 999999).toString();
  return `${PAIRING_CONFIG.CODE_PREFIX}${digits}`;
}

/**
 * Calculate expiration timestamp
 * @param {string} inviteType - 'email', 'link', or 'code'
 * @returns {Date} Expiration date
 * @deprecated Use invitationConfig.calculateExpiration() instead
 */
function calculateExpiration(inviteType) {
  // Delegate to configuration-driven implementation
  const { calculateExpiration: configCalculateExpiration } = require('./config/invitationConfig');
  return configCalculateExpiration(inviteType);
}

/**
 * Check if user has an active pairing (already paired with someone)
 * @param {string} userId - User ID to check
 * @param {object} db - Database connection for dependency injection
 * @returns {Promise<object|null>} Active pairing or null
 */
async function getActivePairing(userId, db) {
  if (!userId) return null;

  return pairingRepository.findActiveByUserId(userId, PAIRING_STATUS.ACTIVE, db);
}

/**
 * Check if user has a pending pairing (waiting for acceptance)
 * @param {string} userId - User ID to check
 * @param {object} db - Database connection for dependency injection
 * @returns {Promise<object|null>} Pending pairing or null
 */
async function getPendingPairing(userId, db) {
  if (!userId) return null;

  return pairingRepository.findPendingByInitiator(userId, PAIRING_STATUS.PENDING, db);
}

/**
 * Create a unique pairing code (retries if collision)
 * @param {object} db - Database connection for dependency injection
 * @param {number} maxAttempts - Maximum retry attempts
 * @returns {Promise<string>} Unique pairing code
 */
async function createUniquePairingCode(db, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generatePairingCode();

    // Check if code already exists
    const exists = await pairingRepository.codeExists(code, db);

    if (!exists) {
      return code;
    }
  }

  throw new Error('Unable to generate unique pairing code after maximum attempts');
}

/**
 * Create a pairing session via email invitation
 *
 * CQS NOTE: Returns ephemeral token that cannot be retrieved later (only hash stored).
 * This is an intentional exception to Command Query Separation.
 *
 * @param {object} params - Pairing parameters
 * @param {string} params.initiatorId - User ID creating the pairing
 * @param {string} params.inviteeEmail - Email of person to invite
 * @param {string} params.initiatorUsername - Display name of initiator
 * @param {object} db - Database connection for dependency injection
 * @returns {Promise<object>} Created pairing session with raw token (ephemeral)
 */
async function createEmailPairing(params, db) {
  const { initiatorId, inviteeEmail, initiatorUsername } = params;

  // Validation
  if (!initiatorId) throw new Error('initiatorId is required');
  if (!inviteeEmail) throw new Error('inviteeEmail is required');

  // Check if already paired
  const activePairing = await getActivePairing(initiatorId, db);
  if (activePairing) {
    throw new Error('You already have an active co-parent connection');
  }

  // Generate unique code and token
  const pairingCode = await createUniquePairingCode(db);
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = calculateExpiration(INVITE_TYPE.EMAIL);

  // Insert pairing session via repository
  const pairing = await pairingRepository.createEmailPairing({
    pairingCode,
    initiatorId,
    inviteeEmail,
    status: PAIRING_STATUS.PENDING,
    inviteType: INVITE_TYPE.EMAIL,
    tokenHash,
    initiatorUsername,
    expiresAt: expiresAt.toISOString(),
  }, db);

  // Log to audit trail
  await logPairingAction(db, {
    pairingSessionId: pairing.id,
    action: 'created',
    actorUserId: initiatorId,
    metadata: { invite_type: INVITE_TYPE.EMAIL, invitee_email: inviteeEmail },
  });

  return {
    pairing,
    pairingCode,
    token: rawToken, // Raw token for URL (not the hash)
    expiresAt,
  };
}

/**
 * Create a pairing session via shareable link
 *
 * CQS NOTE: Returns ephemeral token that cannot be retrieved later (only hash stored).
 * This is an intentional exception to Command Query Separation.
 *
 * @param {object} params - Pairing parameters
 * @param {string} params.initiatorId - User ID creating the pairing
 * @param {string} params.initiatorUsername - Display name of initiator
 * @param {object} db - Database connection for dependency injection
 * @returns {Promise<object>} Created pairing session with raw token (ephemeral)
 */
async function createLinkPairing(params, db) {
  const { initiatorId, initiatorUsername } = params;

  // Validation
  if (!initiatorId) throw new Error('initiatorId is required');

  // Check if already paired
  const activePairing = await getActivePairing(initiatorId, db);
  if (activePairing) {
    throw new Error('You already have an active co-parent connection');
  }

  // Generate unique code and token
  const pairingCode = await createUniquePairingCode(db);
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = calculateExpiration(INVITE_TYPE.LINK);

  // Insert pairing session via repository
  const pairing = await pairingRepository.createLinkPairing({
    pairingCode,
    initiatorId,
    status: PAIRING_STATUS.PENDING,
    inviteType: INVITE_TYPE.LINK,
    tokenHash,
    initiatorUsername,
    expiresAt: expiresAt.toISOString(),
  }, db);

  // Log to audit trail
  await logPairingAction(db, {
    pairingSessionId: pairing.id,
    action: 'created',
    actorUserId: initiatorId,
    metadata: { invite_type: INVITE_TYPE.LINK },
  });

  return {
    pairing,
    pairingCode,
    token: rawToken, // Raw token for URL (not the hash)
    expiresAt,
  };
}

/**
 * Create a pairing session via quick code (for existing users)
 *
 * CQS NOTE: Returns the generated pairing code. Unlike email/link tokens, the code
 * IS stored in plain text for lookup, so this could be queried separately.
 * However, returning it here is convenient and matches the other create functions.
 *
 * @param {object} params - Pairing parameters
 * @param {string} params.initiatorId - User ID creating the pairing
 * @param {string} params.initiatorUsername - Display name of initiator
 * @param {object} db - Database connection for dependency injection
 * @returns {Promise<object>} Created pairing session with code
 */
async function createCodePairing(params, db) {
  const { initiatorId, initiatorUsername } = params;

  // Validation
  if (!initiatorId) throw new Error('initiatorId is required');

  // Check if already paired
  const activePairing = await getActivePairing(initiatorId, db);
  if (activePairing) {
    throw new Error('You already have an active co-parent connection');
  }

  // Check for existing pending code and expire it
  await pairingRepository.expireUserCodePairings(
    initiatorId,
    PAIRING_STATUS.PENDING,
    PAIRING_STATUS.EXPIRED,
    INVITE_TYPE.CODE,
    db
  );

  // Generate unique code (no token needed for code-based pairing)
  const pairingCode = await createUniquePairingCode(db);
  const expiresAt = calculateExpiration(INVITE_TYPE.CODE);

  // Insert pairing session via repository
  const pairing = await pairingRepository.createCodePairing({
    pairingCode,
    initiatorId,
    status: PAIRING_STATUS.PENDING,
    inviteType: INVITE_TYPE.CODE,
    initiatorUsername,
    expiresAt: expiresAt.toISOString(),
  }, db);

  // Log to audit trail
  await logPairingAction(db, {
    pairingSessionId: pairing.id,
    action: 'created',
    actorUserId: initiatorId,
    metadata: { invite_type: INVITE_TYPE.CODE },
  });

  return {
    pairing,
    pairingCode,
    expiresAt,
  };
}

/**
 * Cancel a pending pairing session
 *
 * CQS NOTE: Returns cancelled pairing for convenience. Use getPendingPairing()
 * or pairingRepository.findById() to query separately if needed.
 *
 * @param {number} pairingId - Pairing session ID
 * @param {string} userId - User requesting cancellation (must be parent_a)
 * @param {object} db - Database connection for dependency injection
 * @returns {Promise<object>} Cancelled pairing session (for convenience)
 */
async function cancelPairing(pairingId, userId, db) {
  if (!pairingId || !userId) {
    throw new Error('pairingId and userId are required');
  }

  const pairing = await pairingRepository.cancelByInitiator(
    pairingId,
    userId,
    PAIRING_STATUS.PENDING,
    PAIRING_STATUS.CANCELED,
    db
  );

  if (!pairing) {
    throw new Error('Pairing not found or cannot be cancelled');
  }

  // Log to audit trail
  await logPairingAction(db, {
    pairingSessionId: pairing.id,
    action: 'canceled',
    actorUserId: userId,
  });

  return pairing;
}

/**
 * Resend a pairing invitation (generates new token, resets expiration)
 *
 * CQS NOTE: Returns ephemeral token that cannot be retrieved later (only hash stored).
 * This is an intentional exception to Command Query Separation.
 *
 * @param {number} pairingId - Pairing session ID
 * @param {string} userId - User requesting resend (must be parent_a)
 * @param {object} db - Database connection for dependency injection
 * @returns {Promise<object>} Updated pairing session with new token (ephemeral)
 */
async function resendPairing(pairingId, userId, db) {
  if (!pairingId || !userId) {
    throw new Error('pairingId and userId are required');
  }

  // Get current pairing
  const current = await pairingRepository.findPendingById(
    pairingId,
    userId,
    PAIRING_STATUS.PENDING,
    db
  );

  if (!current) {
    throw new Error('Pairing not found or cannot be resent');
  }

  // Generate new token and expiration
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = calculateExpiration(current.invite_type);

  // Update pairing
  const pairing = await pairingRepository.updateTokenAndExpiration(
    pairingId,
    tokenHash,
    expiresAt.toISOString(),
    db
  );

  // Log to audit trail
  await logPairingAction(db, {
    pairingSessionId: pairing.id,
    action: 'resent',
    actorUserId: userId,
  });

  return {
    pairing,
    token: current.invite_type !== INVITE_TYPE.CODE ? rawToken : null,
    expiresAt,
  };
}

/**
 * Log a pairing action to the audit trail
 * @param {object} db - Database connection for dependency injection
 * @param {object} params - Audit log parameters
 */
async function logPairingAction(db, params) {
  await pairingRepository.logAction(params, db);
}

/**
 * Expire old pending pairings (maintenance function)
 * @param {object} db - Database connection for dependency injection
 * @returns {Promise<number>} Number of expired pairings
 */
async function expireOldPairings(db) {
  return pairingRepository.expireOldPairings(
    PAIRING_STATUS.EXPIRED,
    PAIRING_STATUS.PENDING,
    db
  );
}

module.exports = {
  // Creation functions
  createEmailPairing,
  createLinkPairing,
  createCodePairing,

  // Management functions
  cancelPairing,
  resendPairing,
  expireOldPairings,

  // Query functions
  getActivePairing,
  getPendingPairing,

  // Utility functions
  generateToken,
  hashToken,
  generatePairingCode,
  calculateExpiration,
  createUniquePairingCode,
  logPairingAction,

  // Constants
  PAIRING_STATUS,
  INVITE_TYPE,
  PAIRING_CONFIG,
};
