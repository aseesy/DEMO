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
 */

const crypto = require('crypto');

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
 * Check if an email belongs to an existing user
 * @param {string} email - Email to check
 * @param {object} db - Database connection
 * @returns {Promise<object|null>} User object or null
 */
async function findExistingUser(email, db) {
  if (!email || !db) return null;

  const normalizedEmail = email.toLowerCase().trim();

  const result = await db.query(
    'SELECT id, username, email FROM users WHERE LOWER(email) = $1',
    [normalizedEmail]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Check if user has already invited this email (active invitation exists)
 * @param {string} inviterId - Inviter's user ID
 * @param {string} inviteeEmail - Invitee's email
 * @param {object} db - Database connection
 * @returns {Promise<object|null>} Existing invitation or null
 */
async function findExistingInvitation(inviterId, inviteeEmail, db) {
  if (!inviterId || !inviteeEmail || !db) return null;

  const normalizedEmail = inviteeEmail.toLowerCase().trim();

  const result = await db.query(
    `SELECT * FROM invitations
     WHERE inviter_id = $1
     AND LOWER(invitee_email) = $2
     AND status = $3
     AND expires_at > CURRENT_TIMESTAMP`,
    [inviterId, normalizedEmail, INVITATION_STATUS.PENDING]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Check if inviter has already reached co-parent limit (1 for MVP)
 * @param {string} inviterId - Inviter's user ID
 * @param {object} db - Database connection
 * @returns {Promise<boolean>} True if limit reached
 */
async function hasReachedCoparentLimit(inviterId, db) {
  if (!inviterId || !db) return false;

  // Count accepted invitations (both sent and received)
  const result = await db.query(
    `SELECT COUNT(*) as count FROM invitations
     WHERE (inviter_id = $1 OR invitee_id = $1)
     AND status = $2
     AND invitation_type = $3`,
    [inviterId, INVITATION_STATUS.ACCEPTED, INVITATION_TYPE.COPARENT]
  );

  return parseInt(result.rows[0].count, 10) >= 1;
}

/**
 * Create a new invitation
 * @param {object} params - Invitation parameters
 * @param {string} params.inviterId - User ID of the person sending the invitation
 * @param {string} params.inviteeEmail - Email of the person being invited
 * @param {string} [params.roomId] - Optional room ID if room is pre-created
 * @param {string} [params.invitationType] - Type of invitation (default: coparent)
 * @param {object} db - Database connection
 * @returns {Promise<object>} Created invitation with raw token
 */
async function createInvitation(params, db) {
  const {
    inviterId,
    inviteeEmail,
    roomId = null,
    invitationType = INVITATION_TYPE.COPARENT,
  } = params;

  // Validation
  if (!inviterId) {
    throw new Error('inviterId is required');
  }
  if (!inviteeEmail) {
    throw new Error('inviteeEmail is required');
  }
  if (!db) {
    throw new Error('database connection is required');
  }

  const normalizedEmail = inviteeEmail.toLowerCase().trim();

  // Check if inviter has reached co-parent limit (MVP: 1)
  if (invitationType === INVITATION_TYPE.COPARENT) {
    const limitReached = await hasReachedCoparentLimit(inviterId, db);
    if (limitReached) {
      throw new Error('Co-parent limit reached. You can only have one co-parent connection.');
    }
  }

  // Check for existing active invitation
  const existingInvitation = await findExistingInvitation(inviterId, normalizedEmail, db);
  if (existingInvitation) {
    throw new Error('An active invitation already exists for this email');
  }

  // Check if invitee is an existing user
  const existingUser = await findExistingUser(normalizedEmail, db);

  // Generate secure token and short code
  const token = generateToken();
  const tokenHash = hashToken(token);
  const shortCode = generateShortCode();
  const expiresAt = calculateExpiration();

  // Insert invitation
  const result = await db.query(
    `INSERT INTO invitations (
      token_hash, inviter_id, invitee_email, invitee_id,
      status, room_id, invitation_type, expires_at, short_code
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      tokenHash,
      inviterId,
      normalizedEmail,
      existingUser?.id || null,
      INVITATION_STATUS.PENDING,
      roomId,
      invitationType,
      expiresAt,
      shortCode,
    ]
  );

  const invitation = result.rows[0];

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
 * @param {number} invitationId - Invitation ID
 * @param {string} inviterId - User ID (must match inviter_id for authorization)
 * @param {object} db - Database connection
 * @returns {Promise<object>} Cancelled invitation
 */
async function cancelInvitation(invitationId, inviterId, db) {
  if (!invitationId || !inviterId || !db) {
    throw new Error('invitationId, inviterId, and db are required');
  }

  const result = await db.query(
    `UPDATE invitations
     SET status = $1
     WHERE id = $2 AND inviter_id = $3 AND status = $4
     RETURNING *`,
    [INVITATION_STATUS.CANCELLED, invitationId, inviterId, INVITATION_STATUS.PENDING]
  );

  if (result.rows.length === 0) {
    throw new Error('Invitation not found or cannot be cancelled');
  }

  return result.rows[0];
}

/**
 * Resend an invitation (generates new token)
 * @param {number} invitationId - Invitation ID
 * @param {string} inviterId - User ID (must match inviter_id)
 * @param {object} db - Database connection
 * @returns {Promise<object>} Updated invitation with new token
 */
async function resendInvitation(invitationId, inviterId, db) {
  if (!invitationId || !inviterId || !db) {
    throw new Error('invitationId, inviterId, and db are required');
  }

  // Generate new token
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = calculateExpiration();

  const result = await db.query(
    `UPDATE invitations
     SET token_hash = $1, expires_at = $2, status = $3
     WHERE id = $4 AND inviter_id = $5 AND status IN ($6, $7)
     RETURNING *`,
    [
      tokenHash,
      expiresAt,
      INVITATION_STATUS.PENDING,
      invitationId,
      inviterId,
      INVITATION_STATUS.PENDING,
      INVITATION_STATUS.EXPIRED,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('Invitation not found or cannot be resent');
  }

  return {
    invitation: result.rows[0],
    token,
  };
}

module.exports = {
  createInvitation,
  cancelInvitation,
  resendInvitation,
  findExistingUser,
  findExistingInvitation,
  hasReachedCoparentLimit,
  generateToken,
  generateShortCode,
  hashToken,
  calculateExpiration,
  INVITATION_STATUS,
  INVITATION_TYPE,
  TOKEN_CONFIG,
};
