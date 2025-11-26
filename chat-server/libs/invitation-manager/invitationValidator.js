/**
 * Invitation Validator
 *
 * Validates and processes invitation tokens for co-parent connections.
 * Handles token verification, expiration checks, and status updates.
 *
 * Feature: 003-account-creation-coparent-invitation
 * Constitutional Compliance:
 *   - Principle I (Library-First): Standalone module
 *   - Principle III (Contract-First): Clear interface definitions
 */

const crypto = require('crypto');
const { INVITATION_STATUS, INVITATION_TYPE, TOKEN_CONFIG } = require('./invitationCreator');

// Re-export INVITATION_TYPE for use in this module
const { COPARENT } = INVITATION_TYPE || { COPARENT: 'coparent' };

/**
 * Hash a token for comparison
 * @param {string} token - Raw token
 * @returns {string} Hashed token
 */
function hashToken(token) {
  return crypto.createHash(TOKEN_CONFIG.algorithm).update(token).digest('hex');
}

/**
 * Validate an invitation token
 * @param {string} token - Raw invitation token
 * @param {object} db - Database connection
 * @returns {Promise<object>} Validation result with invitation details
 */
async function validateToken(token, db) {
  if (!token) {
    return {
      valid: false,
      error: 'Token is required',
      code: 'TOKEN_REQUIRED',
    };
  }

  if (!db) {
    return {
      valid: false,
      error: 'Database connection is required',
      code: 'DB_REQUIRED',
    };
  }

  const tokenHash = hashToken(token);

  // Find invitation by token hash
  const result = await db.query(
    `SELECT i.*, COALESCE(u.display_name, u.username) as inviter_name, u.email as inviter_email
     FROM invitations i
     JOIN users u ON i.inviter_id = u.id
     WHERE i.token_hash = $1`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return {
      valid: false,
      error: 'Invalid invitation token',
      code: 'INVALID_TOKEN',
    };
  }

  const invitation = result.rows[0];

  // Check if already used
  if (invitation.status === INVITATION_STATUS.ACCEPTED) {
    return {
      valid: false,
      error: 'This invitation has already been accepted',
      code: 'ALREADY_ACCEPTED',
      invitation,
    };
  }

  // Check if cancelled
  if (invitation.status === INVITATION_STATUS.CANCELLED) {
    return {
      valid: false,
      error: 'This invitation has been cancelled',
      code: 'CANCELLED',
      invitation,
    };
  }

  // Check if declined
  if (invitation.status === INVITATION_STATUS.DECLINED) {
    return {
      valid: false,
      error: 'This invitation has been declined',
      code: 'DECLINED',
      invitation,
    };
  }

  // Check expiration
  const now = new Date();
  const expiresAt = new Date(invitation.expires_at);
  if (now > expiresAt) {
    // Update status to expired
    await db.query(
      'UPDATE invitations SET status = $1 WHERE id = $2',
      [INVITATION_STATUS.EXPIRED, invitation.id]
    );

    return {
      valid: false,
      error: 'This invitation has expired',
      code: 'EXPIRED',
      invitation: { ...invitation, status: INVITATION_STATUS.EXPIRED },
    };
  }

  return {
    valid: true,
    invitation,
    inviterName: invitation.inviter_name,
    inviterEmail: invitation.inviter_email,
  };
}

/**
 * Accept an invitation
 * @param {string} token - Raw invitation token
 * @param {string} acceptingUserId - User ID of the person accepting
 * @param {object} db - Database connection
 * @returns {Promise<object>} Accepted invitation details
 */
async function acceptInvitation(token, acceptingUserId, db) {
  if (!token || !acceptingUserId || !db) {
    throw new Error('token, acceptingUserId, and db are required');
  }

  // First validate the token
  const validation = await validateToken(token, db);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const invitation = validation.invitation;

  // Check co-parent limit for accepting user
  const limitResult = await db.query(
    `SELECT COUNT(*) as count FROM invitations
     WHERE (inviter_id = $1 OR invitee_id = $1)
     AND status = $2
     AND invitation_type = $3`,
    [acceptingUserId, INVITATION_STATUS.ACCEPTED, INVITATION_TYPE.COPARENT]
  );

  if (parseInt(limitResult.rows[0].count, 10) >= 1) {
    throw new Error('Co-parent limit reached. You already have a co-parent connection.');
  }

  // Update invitation status
  const result = await db.query(
    `UPDATE invitations
     SET status = $1, invitee_id = $2, accepted_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [INVITATION_STATUS.ACCEPTED, acceptingUserId, invitation.id]
  );

  return {
    invitation: result.rows[0],
    inviterId: invitation.inviter_id,
    inviteeId: acceptingUserId,
    roomId: invitation.room_id,
  };
}

/**
 * Decline an invitation
 * @param {string} token - Raw invitation token
 * @param {string} decliningUserId - User ID of the person declining
 * @param {object} db - Database connection
 * @returns {Promise<object>} Declined invitation details
 */
async function declineInvitation(token, decliningUserId, db) {
  if (!token || !decliningUserId || !db) {
    throw new Error('token, decliningUserId, and db are required');
  }

  // First validate the token
  const validation = await validateToken(token, db);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const invitation = validation.invitation;

  // Update invitation status
  const result = await db.query(
    `UPDATE invitations
     SET status = $1, invitee_id = $2
     WHERE id = $3
     RETURNING *`,
    [INVITATION_STATUS.DECLINED, decliningUserId, invitation.id]
  );

  return {
    invitation: result.rows[0],
    inviterId: invitation.inviter_id,
  };
}

/**
 * Get invitation by ID
 * @param {number} invitationId - Invitation ID
 * @param {object} db - Database connection
 * @returns {Promise<object|null>} Invitation or null
 */
async function getInvitationById(invitationId, db) {
  if (!invitationId || !db) return null;

  const result = await db.query(
    `SELECT i.*, COALESCE(u.display_name, u.username) as inviter_name, u.email as inviter_email
     FROM invitations i
     JOIN users u ON i.inviter_id = u.id
     WHERE i.id = $1`,
    [invitationId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get all invitations for a user (sent and received)
 * @param {string} userId - User ID
 * @param {object} db - Database connection
 * @param {object} options - Query options
 * @returns {Promise<object>} Object with sent and received invitations
 */
async function getUserInvitations(userId, db, options = {}) {
  if (!userId || !db) {
    throw new Error('userId and db are required');
  }

  const { status = null, limit = 50 } = options;

  let sentQuery = `
    SELECT i.*, u.username as invitee_name
    FROM invitations i
    LEFT JOIN users u ON i.invitee_id = u.id
    WHERE i.inviter_id = $1
  `;

  let receivedQuery = `
    SELECT i.*, COALESCE(u.display_name, u.username) as inviter_name, u.email as inviter_email
    FROM invitations i
    JOIN users u ON i.inviter_id = u.id
    WHERE i.invitee_id = $1 OR LOWER(i.invitee_email) = (
      SELECT LOWER(email) FROM users WHERE id = $1
    )
  `;

  const params = [userId];

  if (status) {
    sentQuery += ' AND i.status = $2';
    receivedQuery += ' AND i.status = $2';
    params.push(status);
  }

  sentQuery += ' ORDER BY i.created_at DESC LIMIT $' + (params.length + 1);
  receivedQuery += ' ORDER BY i.created_at DESC LIMIT $' + (params.length + 1);
  params.push(limit);

  const [sentResult, receivedResult] = await Promise.all([
    db.query(sentQuery, params),
    db.query(receivedQuery, params),
  ]);

  return {
    sent: sentResult.rows,
    received: receivedResult.rows,
  };
}

/**
 * Expire old invitations (maintenance function)
 * @param {object} db - Database connection
 * @returns {Promise<number>} Number of expired invitations
 */
async function expireOldInvitations(db) {
  if (!db) {
    throw new Error('db is required');
  }

  const result = await db.query(
    `UPDATE invitations
     SET status = $1
     WHERE status = $2
     AND expires_at < CURRENT_TIMESTAMP`,
    [INVITATION_STATUS.EXPIRED, INVITATION_STATUS.PENDING]
  );

  return result.rowCount || 0;
}

/**
 * Validate an invitation by short code (e.g., LZ-ABC123)
 * @param {string} shortCode - Short invite code
 * @param {object} db - Database connection
 * @returns {Promise<object>} Validation result with invitation details
 */
async function validateByShortCode(shortCode, db) {
  if (!shortCode) {
    return {
      valid: false,
      error: 'Short code is required',
      code: 'CODE_REQUIRED',
    };
  }

  if (!db) {
    return {
      valid: false,
      error: 'Database connection is required',
      code: 'DB_REQUIRED',
    };
  }

  // Normalize short code (uppercase, trim)
  const normalizedCode = shortCode.toUpperCase().trim();

  // Find invitation by short code
  const result = await db.query(
    `SELECT i.*, COALESCE(u.display_name, u.username) as inviter_name, u.email as inviter_email
     FROM invitations i
     JOIN users u ON i.inviter_id = u.id
     WHERE i.short_code = $1`,
    [normalizedCode]
  );

  if (result.rows.length === 0) {
    return {
      valid: false,
      error: 'Invalid invite code',
      code: 'INVALID_CODE',
    };
  }

  const invitation = result.rows[0];

  // Check if already used
  if (invitation.status === INVITATION_STATUS.ACCEPTED) {
    return {
      valid: false,
      error: 'This invitation has already been accepted',
      code: 'ALREADY_ACCEPTED',
      invitation,
    };
  }

  // Check if cancelled
  if (invitation.status === INVITATION_STATUS.CANCELLED) {
    return {
      valid: false,
      error: 'This invitation has been cancelled',
      code: 'CANCELLED',
      invitation,
    };
  }

  // Check if declined
  if (invitation.status === INVITATION_STATUS.DECLINED) {
    return {
      valid: false,
      error: 'This invitation has been declined',
      code: 'DECLINED',
      invitation,
    };
  }

  // Check expiration
  const now = new Date();
  const expiresAt = new Date(invitation.expires_at);
  if (now > expiresAt) {
    // Update status to expired
    await db.query(
      'UPDATE invitations SET status = $1 WHERE id = $2',
      [INVITATION_STATUS.EXPIRED, invitation.id]
    );

    return {
      valid: false,
      error: 'This invitation has expired',
      code: 'EXPIRED',
      invitation: { ...invitation, status: INVITATION_STATUS.EXPIRED },
    };
  }

  return {
    valid: true,
    invitation,
    inviterName: invitation.inviter_name,
    inviterEmail: invitation.inviter_email,
  };
}

/**
 * Accept an invitation by short code
 * @param {string} shortCode - Short invite code
 * @param {string} acceptingUserId - User ID of the person accepting
 * @param {object} db - Database connection
 * @returns {Promise<object>} Accepted invitation details
 */
async function acceptByShortCode(shortCode, acceptingUserId, db) {
  if (!shortCode || !acceptingUserId || !db) {
    throw new Error('shortCode, acceptingUserId, and db are required');
  }

  // First validate the short code
  const validation = await validateByShortCode(shortCode, db);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const invitation = validation.invitation;

  // Check co-parent limit for accepting user
  const limitResult = await db.query(
    `SELECT COUNT(*) as count FROM invitations
     WHERE (inviter_id = $1 OR invitee_id = $1)
     AND status = $2
     AND invitation_type = $3`,
    [acceptingUserId, INVITATION_STATUS.ACCEPTED, INVITATION_TYPE.COPARENT]
  );

  if (parseInt(limitResult.rows[0].count, 10) >= 1) {
    throw new Error('Co-parent limit reached. You already have a co-parent connection.');
  }

  // Update invitation status
  const result = await db.query(
    `UPDATE invitations
     SET status = $1, invitee_id = $2, accepted_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [INVITATION_STATUS.ACCEPTED, acceptingUserId, invitation.id]
  );

  return {
    invitation: result.rows[0],
    inviterId: invitation.inviter_id,
    inviteeId: acceptingUserId,
    roomId: invitation.room_id,
  };
}

module.exports = {
  validateToken,
  validateByShortCode,
  acceptInvitation,
  acceptByShortCode,
  declineInvitation,
  getInvitationById,
  getUserInvitations,
  expireOldInvitations,
  hashToken,
  INVITATION_STATUS,
};
