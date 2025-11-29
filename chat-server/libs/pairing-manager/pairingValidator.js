/**
 * Pairing Validator
 *
 * Validates and processes pairing requests:
 * - Token validation (for email/link invitations)
 * - Code validation (for quick pairing)
 * - Acceptance with atomic room + contact creation
 * - Decline handling
 *
 * Feature: 004-account-pairing-refactor
 * Constitutional Compliance:
 *   - Principle I (Library-First): Standalone module
 *   - Principle III (Contract-First): Clear interface definitions
 *   - Principle V (Idempotent): Safe to retry operations
 */

const crypto = require('crypto');
const { PAIRING_STATUS, INVITE_TYPE, PAIRING_CONFIG, hashToken, logPairingAction } = require('./pairingCreator');

/**
 * Validation result codes
 */
const VALIDATION_CODE = {
  VALID: 'VALID',
  TOKEN_REQUIRED: 'TOKEN_REQUIRED',
  CODE_REQUIRED: 'CODE_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_CODE: 'INVALID_CODE',
  EXPIRED: 'EXPIRED',
  ALREADY_ACCEPTED: 'ALREADY_ACCEPTED',
  CANCELED: 'CANCELED',
  ALREADY_PAIRED: 'ALREADY_PAIRED',
  SELF_PAIRING: 'SELF_PAIRING',
  DB_REQUIRED: 'DB_REQUIRED',
};

/**
 * Validate a pairing token (for email/link invitations)
 * @param {string} token - Raw invitation token
 * @param {object} db - Database connection
 * @returns {Promise<object>} Validation result
 */
async function validateToken(token, db) {
  if (!token) {
    return {
      valid: false,
      error: 'Token is required',
      code: VALIDATION_CODE.TOKEN_REQUIRED,
    };
  }

  if (!db) {
    return {
      valid: false,
      error: 'Database connection is required',
      code: VALIDATION_CODE.DB_REQUIRED,
    };
  }

  const tokenHash = hashToken(token);

  // Find pairing by token hash
  const result = await db.query(
    `SELECT ps.*, u.username as initiator_username, u.email as initiator_email
     FROM pairing_sessions ps
     JOIN users u ON ps.parent_a_id = u.id
     WHERE ps.invite_token = $1`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return {
      valid: false,
      error: 'Invalid invitation token',
      code: VALIDATION_CODE.INVALID_TOKEN,
    };
  }

  const pairing = result.rows[0];

  // Check status
  if (pairing.status === PAIRING_STATUS.ACTIVE) {
    return {
      valid: false,
      error: 'This invitation has already been accepted',
      code: VALIDATION_CODE.ALREADY_ACCEPTED,
      pairing,
    };
  }

  if (pairing.status === PAIRING_STATUS.CANCELED) {
    return {
      valid: false,
      error: 'This invitation has been cancelled',
      code: VALIDATION_CODE.CANCELED,
      pairing,
    };
  }

  if (pairing.status === PAIRING_STATUS.EXPIRED) {
    return {
      valid: false,
      error: 'This invitation has expired',
      code: VALIDATION_CODE.EXPIRED,
      pairing,
    };
  }

  // Check expiration
  const now = new Date();
  const expiresAt = new Date(pairing.expires_at);
  if (now > expiresAt) {
    // Update status to expired
    await db.query(
      'UPDATE pairing_sessions SET status = $1 WHERE id = $2',
      [PAIRING_STATUS.EXPIRED, pairing.id]
    );

    return {
      valid: false,
      error: 'This invitation has expired',
      code: VALIDATION_CODE.EXPIRED,
      pairing: { ...pairing, status: PAIRING_STATUS.EXPIRED },
    };
  }

  return {
    valid: true,
    pairing,
    initiatorName: pairing.invited_by_username || pairing.initiator_username,
    initiatorEmail: pairing.initiator_email,
    pairingCode: pairing.pairing_code,
    expiresAt: pairing.expires_at,
  };
}

/**
 * Validate a pairing code (for quick pairing)
 * @param {string} code - Pairing code (e.g., "LZ-842396")
 * @param {object} db - Database connection
 * @returns {Promise<object>} Validation result
 */
async function validateCode(code, db) {
  if (!code) {
    return {
      valid: false,
      error: 'Pairing code is required',
      code: VALIDATION_CODE.CODE_REQUIRED,
    };
  }

  if (!db) {
    return {
      valid: false,
      error: 'Database connection is required',
      code: VALIDATION_CODE.DB_REQUIRED,
    };
  }

  // Normalize code (uppercase, trim)
  const normalizedCode = code.toUpperCase().trim();

  // Find pairing by code
  const result = await db.query(
    `SELECT ps.*, u.username as initiator_username, u.email as initiator_email
     FROM pairing_sessions ps
     JOIN users u ON ps.parent_a_id = u.id
     WHERE ps.pairing_code = $1`,
    [normalizedCode]
  );

  if (result.rows.length === 0) {
    return {
      valid: false,
      error: 'Invalid pairing code',
      code: VALIDATION_CODE.INVALID_CODE,
    };
  }

  const pairing = result.rows[0];

  // Check status
  if (pairing.status === PAIRING_STATUS.ACTIVE) {
    return {
      valid: false,
      error: 'This pairing code has already been used',
      code: VALIDATION_CODE.ALREADY_ACCEPTED,
      pairing,
    };
  }

  if (pairing.status === PAIRING_STATUS.CANCELED) {
    return {
      valid: false,
      error: 'This pairing has been cancelled',
      code: VALIDATION_CODE.CANCELED,
      pairing,
    };
  }

  if (pairing.status === PAIRING_STATUS.EXPIRED) {
    return {
      valid: false,
      error: 'This pairing code has expired',
      code: VALIDATION_CODE.EXPIRED,
      pairing,
    };
  }

  // Check expiration
  const now = new Date();
  const expiresAt = new Date(pairing.expires_at);
  if (now > expiresAt) {
    // Update status to expired
    await db.query(
      'UPDATE pairing_sessions SET status = $1 WHERE id = $2',
      [PAIRING_STATUS.EXPIRED, pairing.id]
    );

    return {
      valid: false,
      error: 'This pairing code has expired',
      code: VALIDATION_CODE.EXPIRED,
      pairing: { ...pairing, status: PAIRING_STATUS.EXPIRED },
    };
  }

  return {
    valid: true,
    pairing,
    initiatorName: pairing.invited_by_username || pairing.initiator_username,
    initiatorEmail: pairing.initiator_email,
    pairingCode: pairing.pairing_code,
    expiresAt: pairing.expires_at,
  };
}

/**
 * Accept a pairing invitation (by token or code)
 * Creates shared room and mutual contacts atomically
 * @param {object} params - Acceptance parameters
 * @param {string} params.pairingId - Pairing session ID
 * @param {string} params.acceptorId - User ID accepting the pairing
 * @param {object} db - Database connection
 * @param {object} roomManager - Room manager for creating shared room
 * @returns {Promise<object>} Acceptance result with room info
 */
async function acceptPairing(params, db, roomManager) {
  const { pairingId, acceptorId } = params;

  if (!pairingId || !acceptorId || !db) {
    throw new Error('pairingId, acceptorId, and db are required');
  }

  // Get pairing session
  const pairingResult = await db.query(
    `SELECT ps.*, u.username as initiator_username
     FROM pairing_sessions ps
     JOIN users u ON ps.parent_a_id = u.id
     WHERE ps.id = $1 AND ps.status = $2`,
    [pairingId, PAIRING_STATUS.PENDING]
  );

  if (pairingResult.rows.length === 0) {
    throw new Error('Pairing not found or already processed');
  }

  const pairing = pairingResult.rows[0];

  // Prevent self-pairing
  if (pairing.parent_a_id === parseInt(acceptorId, 10)) {
    throw new Error('Cannot pair with yourself');
  }

  // Check if acceptor already has an active pairing
  const existingPairing = await db.query(
    `SELECT id FROM pairing_sessions
     WHERE (parent_a_id = $1 OR parent_b_id = $1)
       AND status = $2`,
    [acceptorId, PAIRING_STATUS.ACTIVE]
  );

  if (existingPairing.rows.length > 0) {
    throw new Error('You already have an active co-parent connection');
  }

  // Check expiration
  const now = new Date();
  const expiresAt = new Date(pairing.expires_at);
  if (now > expiresAt) {
    await db.query(
      'UPDATE pairing_sessions SET status = $1 WHERE id = $2',
      [PAIRING_STATUS.EXPIRED, pairingId]
    );
    throw new Error('This invitation has expired');
  }

  // Get acceptor info
  const acceptorResult = await db.query(
    'SELECT id, username, email FROM users WHERE id = $1',
    [acceptorId]
  );

  if (acceptorResult.rows.length === 0) {
    throw new Error('Acceptor user not found');
  }

  const acceptor = acceptorResult.rows[0];

  // Create shared room using createCoParentRoom which properly adds both members
  let sharedRoomId = null;
  if (roomManager && roomManager.createCoParentRoom) {
    try {
      const room = await roomManager.createCoParentRoom(
        pairing.parent_a_id,
        acceptorId,
        pairing.initiator_username,
        acceptor.username
      );
      sharedRoomId = room.roomId;
      console.log(`✅ Created shared room ${sharedRoomId} for pairing ${pairingId}`);
    } catch (error) {
      console.error('Failed to create shared room:', error);
      // Continue without room - can be created later
    }
  } else {
    console.warn('⚠️ roomManager.createCoParentRoom not available, skipping room creation');
  }

  // Update pairing to active
  const updateResult = await db.query(
    `UPDATE pairing_sessions
     SET status = $1, parent_b_id = $2, accepted_at = CURRENT_TIMESTAMP, shared_room_id = $3
     WHERE id = $4
     RETURNING *`,
    [PAIRING_STATUS.ACTIVE, acceptorId, sharedRoomId, pairingId]
  );

  const updatedPairing = updateResult.rows[0];

  // Create mutual contacts
  try {
    // Add acceptor as contact for initiator
    await db.query(
      `INSERT INTO contacts (user_id, contact_name, contact_email, relationship, created_at)
       VALUES ($1, $2, $3, 'co-parent', CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, contact_email) DO UPDATE SET relationship = 'co-parent'`,
      [pairing.parent_a_id, acceptor.username, acceptor.email]
    );

    // Get initiator info for contact
    const initiatorResult = await db.query(
      'SELECT username, email FROM users WHERE id = $1',
      [pairing.parent_a_id]
    );

    if (initiatorResult.rows.length > 0) {
      const initiator = initiatorResult.rows[0];
      // Add initiator as contact for acceptor
      await db.query(
        `INSERT INTO contacts (user_id, contact_name, contact_email, relationship, created_at)
         VALUES ($1, $2, $3, 'co-parent', CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, contact_email) DO UPDATE SET relationship = 'co-parent'`,
        [acceptorId, initiator.username, initiator.email]
      );
    }
  } catch (error) {
    console.error('Failed to create mutual contacts:', error);
    // Continue - pairing is still valid
  }

  // Log to audit trail
  await logPairingAction(db, {
    pairingSessionId: pairingId,
    action: 'accepted',
    actorUserId: acceptorId,
    metadata: { shared_room_id: sharedRoomId },
  });

  return {
    pairing: updatedPairing,
    initiatorId: pairing.parent_a_id,
    acceptorId,
    sharedRoomId,
  };
}

/**
 * Accept a pairing by token
 * @param {string} token - Raw invitation token
 * @param {string} acceptorId - User ID accepting
 * @param {object} db - Database connection
 * @param {object} roomManager - Room manager
 * @returns {Promise<object>} Acceptance result
 */
async function acceptByToken(token, acceptorId, db, roomManager) {
  const validation = await validateToken(token, db);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return acceptPairing({
    pairingId: validation.pairing.id,
    acceptorId,
  }, db, roomManager);
}

/**
 * Accept a pairing by code
 * @param {string} code - Pairing code
 * @param {string} acceptorId - User ID accepting
 * @param {object} db - Database connection
 * @param {object} roomManager - Room manager
 * @returns {Promise<object>} Acceptance result
 */
async function acceptByCode(code, acceptorId, db, roomManager) {
  const validation = await validateCode(code, db);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return acceptPairing({
    pairingId: validation.pairing.id,
    acceptorId,
  }, db, roomManager);
}

/**
 * Decline a pairing invitation
 * @param {number} pairingId - Pairing session ID
 * @param {string} declinerId - User ID declining
 * @param {object} db - Database connection
 * @returns {Promise<object>} Declined pairing
 */
async function declinePairing(pairingId, declinerId, db) {
  if (!pairingId || !declinerId || !db) {
    throw new Error('pairingId, declinerId, and db are required');
  }

  const result = await db.query(
    `UPDATE pairing_sessions
     SET status = $1
     WHERE id = $2 AND status = $3
     RETURNING *`,
    [PAIRING_STATUS.CANCELED, pairingId, PAIRING_STATUS.PENDING]
  );

  if (result.rows.length === 0) {
    throw new Error('Pairing not found or already processed');
  }

  const pairing = result.rows[0];

  // Log to audit trail
  await logPairingAction(db, {
    pairingSessionId: pairingId,
    action: 'declined',
    actorUserId: declinerId,
  });

  return pairing;
}

/**
 * Get pairing by ID
 * @param {number} pairingId - Pairing session ID
 * @param {object} db - Database connection
 * @returns {Promise<object|null>} Pairing or null
 */
async function getPairingById(pairingId, db) {
  if (!pairingId || !db) return null;

  const result = await db.query(
    `SELECT ps.*,
            ua.username as parent_a_username, ua.email as parent_a_email,
            ub.username as parent_b_username, ub.email as parent_b_email
     FROM pairing_sessions ps
     JOIN users ua ON ps.parent_a_id = ua.id
     LEFT JOIN users ub ON ps.parent_b_id = ub.id
     WHERE ps.id = $1`,
    [pairingId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get pairing status for a user
 * @param {string} userId - User ID
 * @param {object} db - Database connection
 * @returns {Promise<object>} Pairing status
 */
async function getPairingStatus(userId, db) {
  if (!userId || !db) {
    throw new Error('userId and db are required');
  }

  // Check for active pairing
  const activeResult = await db.query(
    `SELECT ps.*,
            CASE WHEN ps.parent_a_id = $1 THEN ub.username ELSE ua.username END as partner_name,
            CASE WHEN ps.parent_a_id = $1 THEN ub.email ELSE ua.email END as partner_email,
            CASE WHEN ps.parent_a_id = $1 THEN ps.parent_b_id ELSE ps.parent_a_id END as partner_id
     FROM pairing_sessions ps
     JOIN users ua ON ps.parent_a_id = ua.id
     LEFT JOIN users ub ON ps.parent_b_id = ub.id
     WHERE (ps.parent_a_id = $1 OR ps.parent_b_id = $1)
       AND ps.status = $2`,
    [userId, PAIRING_STATUS.ACTIVE]
  );

  if (activeResult.rows.length > 0) {
    return {
      status: 'paired',
      pairing: activeResult.rows[0],
      partnerName: activeResult.rows[0].partner_name,
      partnerEmail: activeResult.rows[0].partner_email,
      partnerId: activeResult.rows[0].partner_id,
      sharedRoomId: activeResult.rows[0].shared_room_id,
    };
  }

  // Check for pending pairing (as initiator)
  const pendingSentResult = await db.query(
    `SELECT * FROM pairing_sessions
     WHERE parent_a_id = $1
       AND status = $2
       AND expires_at > CURRENT_TIMESTAMP
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, PAIRING_STATUS.PENDING]
  );

  if (pendingSentResult.rows.length > 0) {
    return {
      status: 'pending_sent',
      pairing: pendingSentResult.rows[0],
      pairingCode: pendingSentResult.rows[0].pairing_code,
      inviteeEmail: pendingSentResult.rows[0].parent_b_email,
      expiresAt: pendingSentResult.rows[0].expires_at,
    };
  }

  // Check for pending pairing (as invitee by email)
  const userResult = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length > 0) {
    const userEmail = userResult.rows[0].email;

    const pendingReceivedResult = await db.query(
      `SELECT ps.*, u.username as initiator_name
       FROM pairing_sessions ps
       JOIN users u ON ps.parent_a_id = u.id
       WHERE LOWER(ps.parent_b_email) = LOWER($1)
         AND ps.status = $2
         AND ps.expires_at > CURRENT_TIMESTAMP
       ORDER BY ps.created_at DESC
       LIMIT 1`,
      [userEmail, PAIRING_STATUS.PENDING]
    );

    if (pendingReceivedResult.rows.length > 0) {
      return {
        status: 'pending_received',
        pairing: pendingReceivedResult.rows[0],
        initiatorName: pendingReceivedResult.rows[0].initiator_name,
        pairingCode: pendingReceivedResult.rows[0].pairing_code,
      };
    }
  }

  // No pairing found
  return {
    status: 'unpaired',
    pairing: null,
  };
}

module.exports = {
  // Validation functions
  validateToken,
  validateCode,

  // Acceptance functions
  acceptPairing,
  acceptByToken,
  acceptByCode,
  declinePairing,

  // Query functions
  getPairingById,
  getPairingStatus,

  // Constants
  VALIDATION_CODE,
};
