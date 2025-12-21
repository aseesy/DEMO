/**
 * Invitation Creator
 *
 * Creates and sends co-parent invitations with secure token generation.
 * Handles both new user invitations (email) and existing user invitations (in-app).
 *
 * Feature: 003-account-creation-coparent-invitation
 * Constitutional Compliance:
 *   - Principle I (Library-First): Standalone module
 *   - Principle III (Contract-First): Clear interface definitions
 *
 * ARCHITECTURE:
 *   - Business logic only - no direct SQL queries
 *   - Database access via invitationRepository
 */

const crypto = require('crypto');
const { invitationRepository } = require('../../src/repositories/postgres');

/**
 * Token configuration
 */
const TOKEN_CONFIG = {
  length: 32, // bytes
  expirationDays: 7,
  algorithm: 'sha256',
  shortCodeLength: 6, // characters for short code (e.g., LZ-ABC123)
};

/**
 * Generate a short, human-readable invite code
 * Format: LZ-XXXXXX (6 alphanumeric chars, uppercase)
 * @returns {string} Short invite code
 */
function generateShortCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars: 0,O,1,I
  let code = '';
  const bytes = crypto.randomBytes(TOKEN_CONFIG.shortCodeLength);
  for (let i = 0; i < TOKEN_CONFIG.shortCodeLength; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `LZ-${code}`;
}

/**
 * Invitation status constants
 */
const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

/**
 * Invitation types
 */
const INVITATION_TYPE = {
  COPARENT: 'coparent',
};

/**
 * Generate a secure random token
 * @returns {string} Hex-encoded random token
 */
function generateToken() {
  return crypto.randomBytes(TOKEN_CONFIG.length).toString('hex');
}

/**
 * Hash a token for secure storage
 * @param {string} token - Raw token
 * @returns {string} Hashed token
 */
function hashToken(token) {
  return crypto.createHash(TOKEN_CONFIG.algorithm).update(token).digest('hex');
}

/**
 * Calculate expiration date
 * @param {number} days - Number of days until expiration
 * @returns {string} ISO date string
 */
function calculateExpiration(days = TOKEN_CONFIG.expirationDays) {
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + days);
  return expiration.toISOString();
}

/**
 * Get user by email
 *
 * NAMING: Using `get*` + descriptive suffix for consistency with codebase convention.
 *
 * @param {string} email - Email to check
 * @param {object} db - Database connection for dependency injection
 * @returns {Promise<object|null>} User object or null
 */
async function getUserByEmail(email, db) {
  if (!email) return null;

  const normalizedEmail = email.toLowerCase().trim();

  // Use injected db if provided (for testing), otherwise use repository
  if (db) {
    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [normalizedEmail]
    );
    return result.rows[0] || null;
  }

  // Fall back to repository for production
  const { PostgresUserRepository } = require('../../src/repositories/postgres');
  const userRepo = new PostgresUserRepository();
  return userRepo.findByEmail(email);
}

/**
 * Get active invitation by inviter and email
 *
 * NAMING: Using `get*` + descriptive suffix for consistency with codebase convention.
 *
 * @param {string} inviterId - Inviter's user ID
 * @param {string} inviteeEmail - Invitee's email
 * @param {object} db - Database connection for dependency injection
 * @returns {Promise<object|null>} Existing invitation or null
 */
async function getActiveInvitationByEmail(inviterId, inviteeEmail, db) {
  if (!inviterId || !inviteeEmail) return null;

  // Use repository for database access
  return invitationRepository.findActiveByInviterAndEmail(
    inviterId,
    inviteeEmail,
    INVITATION_STATUS.PENDING,
    db
  );
}

/**
 * Check if inviter has already reached co-parent limit (1 for MVP)
 * @param {string} inviterId - Inviter's user ID
 * @param {object} db - Database connection for dependency injection
 * @returns {Promise<boolean>} True if limit reached
 */
async function hasReachedCoparentLimit(inviterId, db) {
  if (!inviterId) return false;

  // Use repository for database access
  const count = await invitationRepository.countAcceptedForUser(
    inviterId,
    INVITATION_TYPE.COPARENT,
    db
  );

  return count >= 1;
}

/**
 * Create a new invitation
 *
 * CQS NOTE: This function returns generated data (token, shortCode) that cannot be
 * retrieved later since only hashes are stored. This is an intentional exception
 * to Command Query Separation - the returned token is ephemeral, not a database read.
 *
 * @param {object} params - Invitation parameters
 * @param {string} params.inviterId - User ID of the person sending the invitation
 * @param {string} params.inviteeEmail - Email of the person being invited
 * @param {string} [params.roomId] - Optional room ID if room is pre-created
 * @param {string} [params.invitationType] - Type of invitation (default: coparent)
 * @param {object} db - Database connection (kept for backward compatibility)
 * @returns {Promise<object>} Created invitation with raw token (ephemeral - cannot be retrieved later)
 */
async function createInvitation(params, db) {
  const {
    inviterId,
    inviteeEmail,
    roomId = null,
    invitationType = INVITATION_TYPE.COPARENT,
  } = params;

  // Validation (business rules)
  if (!inviterId) {
    throw new Error('inviterId is required');
  }
  if (!inviteeEmail) {
    throw new Error('inviteeEmail is required');
  }

  const normalizedEmail = inviteeEmail.toLowerCase().trim();

  // Business rule: Check if inviter has reached co-parent limit (MVP: 1)
  if (invitationType === INVITATION_TYPE.COPARENT) {
    const limitReached = await hasReachedCoparentLimit(inviterId, db);
    if (limitReached) {
      throw new Error('Co-parent limit reached. You can only have one co-parent connection.');
    }
  }

  // Business rule: Check for existing active invitation
  const existingInvitation = await getActiveInvitationByEmail(inviterId, normalizedEmail, db);
  if (existingInvitation) {
    throw new Error('An active invitation already exists for this email');
  }

  // Check if invitee is an existing user
  const existingUser = await getUserByEmail(normalizedEmail, db);

  // Generate secure token and short code
  const token = generateToken();
  const tokenHash = hashToken(token);
  const shortCode = generateShortCode();
  const expiresAt = calculateExpiration();

  // Use repository for database insert
  const invitation = await invitationRepository.createInvitation({
    tokenHash,
    inviterId,
    inviteeEmail: normalizedEmail,
    inviteeId: existingUser?.id || null,
    status: INVITATION_STATUS.PENDING,
    roomId,
    invitationType,
    expiresAt,
    shortCode,
  }, db);

  return {
    invitation,
    token, // Raw token to be sent in email/notification
    shortCode, // Human-readable code for sharing
    isExistingUser: !!existingUser,
    existingUser,
  };
}

/**
 * Cancel an invitation
 *
 * CQS NOTE: Returns the cancelled invitation for convenience. Use getInvitationById()
 * from invitationValidator if you need to query the invitation separately.
 *
 * @param {number} invitationId - Invitation ID
 * @param {string} inviterId - User ID (must match inviter_id for authorization)
 * @param {object} db - Database connection for dependency injection
 * @returns {Promise<object>} Cancelled invitation (for convenience)
 */
async function cancelInvitation(invitationId, inviterId, db) {
  if (!invitationId || !inviterId) {
    throw new Error('invitationId and inviterId are required');
  }

  // Use repository for database update
  const invitation = await invitationRepository.updateStatusByInviter(
    invitationId,
    inviterId,
    INVITATION_STATUS.PENDING,
    INVITATION_STATUS.CANCELLED,
    db
  );

  if (!invitation) {
    throw new Error('Invitation not found or cannot be cancelled');
  }

  return invitation;
}

/**
 * Resend an invitation (generates new token)
 *
 * CQS NOTE: Returns the new token which is ephemeral (only hash stored).
 * This is an intentional exception to Command Query Separation.
 *
 * @param {number} invitationId - Invitation ID
 * @param {string} inviterId - User ID (must match inviter_id)
 * @param {object} db - Database connection for dependency injection
 * @returns {Promise<object>} Updated invitation with new token (ephemeral)
 */
async function resendInvitation(invitationId, inviterId, db) {
  if (!invitationId || !inviterId) {
    throw new Error('invitationId and inviterId are required');
  }

  // Generate new token
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = calculateExpiration();

  // Use repository for database update
  const invitation = await invitationRepository.updateTokenAndExpiration(
    invitationId,
    inviterId,
    tokenHash,
    expiresAt,
    INVITATION_STATUS.PENDING,
    [INVITATION_STATUS.PENDING, INVITATION_STATUS.EXPIRED],
    db
  );

  if (!invitation) {
    throw new Error('Invitation not found or cannot be resent');
  }

  return {
    invitation,
    token,
  };
}

module.exports = {
  createInvitation,
  cancelInvitation,
  resendInvitation,
  getUserByEmail,
  getActiveInvitationByEmail,
  // Deprecated aliases - use getUserByEmail/getActiveInvitationByEmail instead
  findExistingUser: getUserByEmail,
  findExistingInvitation: getActiveInvitationByEmail,
  hasReachedCoparentLimit,
  generateToken,
  generateShortCode,
  hashToken,
  calculateExpiration,
  INVITATION_STATUS,
  INVITATION_TYPE,
  TOKEN_CONFIG,
};
