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
 */

const crypto = require('crypto');

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
  return crypto
    .createHash(PAIRING_CONFIG.TOKEN_ALGORITHM)
    .update(token)
    .digest('hex');
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
 */
function calculateExpiration(inviteType) {
  const now = new Date();

  switch (inviteType) {
    case INVITE_TYPE.EMAIL:
      now.setDate(now.getDate() + PAIRING_CONFIG.EMAIL_EXPIRATION_DAYS);
      break;
    case INVITE_TYPE.LINK:
      now.setDate(now.getDate() + PAIRING_CONFIG.LINK_EXPIRATION_DAYS);
      break;
    case INVITE_TYPE.CODE:
      now.setMinutes(now.getMinutes() + PAIRING_CONFIG.CODE_EXPIRATION_MINUTES);
      break;
    default:
      throw new Error(`Invalid invite type: ${inviteType}`);
  }

  return now;
}

/**
 * Check if user has an active pairing (already paired with someone)
 * @param {string} userId - User ID to check
 * @param {object} db - Database connection
 * @returns {Promise<object|null>} Active pairing or null
 */
async function getActivePairing(userId, db) {
  if (!userId || !db) return null;

  const result = await db.query(
    `SELECT ps.*,
            CASE WHEN ps.parent_a_id = $1 THEN ps.parent_b_id ELSE ps.parent_a_id END as partner_id
     FROM pairing_sessions ps
     WHERE (ps.parent_a_id = $1 OR ps.parent_b_id = $1)
       AND ps.status = $2`,
    [userId, PAIRING_STATUS.ACTIVE]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Check if user has a pending pairing (waiting for acceptance)
 * @param {string} userId - User ID to check
 * @param {object} db - Database connection
 * @returns {Promise<object|null>} Pending pairing or null
 */
async function getPendingPairing(userId, db) {
  if (!userId || !db) return null;

  const result = await db.query(
    `SELECT * FROM pairing_sessions
     WHERE parent_a_id = $1
       AND status = $2
       AND expires_at > CURRENT_TIMESTAMP
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, PAIRING_STATUS.PENDING]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Create a unique pairing code (retries if collision)
 * @param {object} db - Database connection
 * @param {number} maxAttempts - Maximum retry attempts
 * @returns {Promise<string>} Unique pairing code
 */
async function createUniquePairingCode(db, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generatePairingCode();

    // Check if code already exists
    const existing = await db.query(
      'SELECT id FROM pairing_sessions WHERE pairing_code = $1',
      [code]
    );

    if (existing.rows.length === 0) {
      return code;
    }
  }

  throw new Error('Unable to generate unique pairing code after maximum attempts');
}

/**
 * Create a pairing session via email invitation
 * @param {object} params - Pairing parameters
 * @param {string} params.initiatorId - User ID creating the pairing
 * @param {string} params.inviteeEmail - Email of person to invite
 * @param {string} params.initiatorUsername - Display name of initiator
 * @param {object} db - Database connection
 * @returns {Promise<object>} Created pairing session with raw token
 */
async function createEmailPairing(params, db) {
  const { initiatorId, inviteeEmail, initiatorUsername } = params;

  // Validation
  if (!initiatorId) throw new Error('initiatorId is required');
  if (!inviteeEmail) throw new Error('inviteeEmail is required');
  if (!db) throw new Error('database connection is required');

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

  // Insert pairing session
  const result = await db.query(
    `INSERT INTO pairing_sessions (
      pairing_code, parent_a_id, parent_b_email, status, invite_type,
      invite_token, invited_by_username, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      pairingCode,
      initiatorId,
      inviteeEmail.toLowerCase().trim(),
      PAIRING_STATUS.PENDING,
      INVITE_TYPE.EMAIL,
      tokenHash,
      initiatorUsername || null,
      expiresAt.toISOString(),
    ]
  );

  const pairing = result.rows[0];

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
 * @param {object} params - Pairing parameters
 * @param {string} params.initiatorId - User ID creating the pairing
 * @param {string} params.initiatorUsername - Display name of initiator
 * @param {object} db - Database connection
 * @returns {Promise<object>} Created pairing session with raw token
 */
async function createLinkPairing(params, db) {
  const { initiatorId, initiatorUsername } = params;

  // Validation
  if (!initiatorId) throw new Error('initiatorId is required');
  if (!db) throw new Error('database connection is required');

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

  // Insert pairing session
  const result = await db.query(
    `INSERT INTO pairing_sessions (
      pairing_code, parent_a_id, status, invite_type,
      invite_token, invited_by_username, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      pairingCode,
      initiatorId,
      PAIRING_STATUS.PENDING,
      INVITE_TYPE.LINK,
      tokenHash,
      initiatorUsername || null,
      expiresAt.toISOString(),
    ]
  );

  const pairing = result.rows[0];

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
 * @param {object} params - Pairing parameters
 * @param {string} params.initiatorId - User ID creating the pairing
 * @param {string} params.initiatorUsername - Display name of initiator
 * @param {object} db - Database connection
 * @returns {Promise<object>} Created pairing session with code
 */
async function createCodePairing(params, db) {
  const { initiatorId, initiatorUsername } = params;

  // Validation
  if (!initiatorId) throw new Error('initiatorId is required');
  if (!db) throw new Error('database connection is required');

  // Check if already paired
  const activePairing = await getActivePairing(initiatorId, db);
  if (activePairing) {
    throw new Error('You already have an active co-parent connection');
  }

  // Check for existing pending code and expire it
  await db.query(
    `UPDATE pairing_sessions
     SET status = $1
     WHERE parent_a_id = $2 AND status = $3 AND invite_type = $4`,
    [PAIRING_STATUS.EXPIRED, initiatorId, PAIRING_STATUS.PENDING, INVITE_TYPE.CODE]
  );

  // Generate unique code (no token needed for code-based pairing)
  const pairingCode = await createUniquePairingCode(db);
  const expiresAt = calculateExpiration(INVITE_TYPE.CODE);

  // Insert pairing session
  const result = await db.query(
    `INSERT INTO pairing_sessions (
      pairing_code, parent_a_id, status, invite_type,
      invited_by_username, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      pairingCode,
      initiatorId,
      PAIRING_STATUS.PENDING,
      INVITE_TYPE.CODE,
      initiatorUsername || null,
      expiresAt.toISOString(),
    ]
  );

  const pairing = result.rows[0];

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
 * @param {number} pairingId - Pairing session ID
 * @param {string} userId - User requesting cancellation (must be parent_a)
 * @param {object} db - Database connection
 * @returns {Promise<object>} Cancelled pairing session
 */
async function cancelPairing(pairingId, userId, db) {
  if (!pairingId || !userId || !db) {
    throw new Error('pairingId, userId, and db are required');
  }

  const result = await db.query(
    `UPDATE pairing_sessions
     SET status = $1
     WHERE id = $2 AND parent_a_id = $3 AND status = $4
     RETURNING *`,
    [PAIRING_STATUS.CANCELED, pairingId, userId, PAIRING_STATUS.PENDING]
  );

  if (result.rows.length === 0) {
    throw new Error('Pairing not found or cannot be cancelled');
  }

  const pairing = result.rows[0];

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
 * @param {number} pairingId - Pairing session ID
 * @param {string} userId - User requesting resend (must be parent_a)
 * @param {object} db - Database connection
 * @returns {Promise<object>} Updated pairing session with new token
 */
async function resendPairing(pairingId, userId, db) {
  if (!pairingId || !userId || !db) {
    throw new Error('pairingId, userId, and db are required');
  }

  // Get current pairing
  const currentResult = await db.query(
    `SELECT * FROM pairing_sessions
     WHERE id = $1 AND parent_a_id = $2 AND status = $3`,
    [pairingId, userId, PAIRING_STATUS.PENDING]
  );

  if (currentResult.rows.length === 0) {
    throw new Error('Pairing not found or cannot be resent');
  }

  const current = currentResult.rows[0];

  // Generate new token and expiration
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = calculateExpiration(current.invite_type);

  // Update pairing
  const result = await db.query(
    `UPDATE pairing_sessions
     SET invite_token = $1, expires_at = $2
     WHERE id = $3
     RETURNING *`,
    [tokenHash, expiresAt.toISOString(), pairingId]
  );

  const pairing = result.rows[0];

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
 * @param {object} db - Database connection
 * @param {object} params - Audit log parameters
 */
async function logPairingAction(db, params) {
  const { pairingSessionId, action, actorUserId, ipAddress, userAgent, metadata } = params;

  try {
    await db.query(
      `INSERT INTO pairing_audit_log (
        pairing_session_id, action, actor_user_id, ip_address, user_agent, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        pairingSessionId,
        action,
        actorUserId || null,
        ipAddress || null,
        userAgent || null,
        JSON.stringify(metadata || {}),
      ]
    );
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Failed to log pairing action:', error);
  }
}

/**
 * Expire old pending pairings (maintenance function)
 * @param {object} db - Database connection
 * @returns {Promise<number>} Number of expired pairings
 */
async function expireOldPairings(db) {
  if (!db) throw new Error('db is required');

  const result = await db.query(
    `UPDATE pairing_sessions
     SET status = $1
     WHERE status = $2
       AND expires_at < CURRENT_TIMESTAMP`,
    [PAIRING_STATUS.EXPIRED, PAIRING_STATUS.PENDING]
  );

  return result.rowCount || 0;
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
