/**
 * Pending Connections
 *
 * Handles creation and querying of pending connection invitations.
 */

const dbModule = require('../dbPostgres');
const dbSafe = require('../dbSafe');
const { validateEmail } = require('./emailValidation');
const { generateInviteToken } = require('./tokenService');
const { CONNECTION_ROLE } = require('./constants');

/**
 * Format raw connection rows into consistent objects
 * @param {Array} rows - Raw database rows
 * @returns {Array} Formatted connection objects
 */
function formatConnections(rows) {
  const uniqueConnections = new Map();
  rows.forEach(conn => {
    if (!uniqueConnections.has(conn.id)) {
      uniqueConnections.set(conn.id, {
        id: conn.id,
        token: conn.token,
        inviterId: conn.inviter_id,
        inviteeEmail: conn.invitee_email,
        status: conn.status,
        expiresAt: conn.expires_at,
        createdAt: conn.created_at,
      });
    }
  });
  return Array.from(uniqueConnections.values());
}

/**
 * Create a pending connection invitation
 * Returns the token and connection record
 * @param {number} inviterId - User ID of the inviter
 * @param {string} inviteeEmail - Email of the person being invited
 * @returns {Promise<Object>} Connection record with token
 */
async function createPendingConnection(inviterId, inviteeEmail) {
  if (!validateEmail(inviteeEmail)) {
    throw new Error('Invalid email format');
  }

  const token = generateInviteToken();
  const now = new Date().toISOString();
  // Token expires in 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const emailLower = inviteeEmail.trim().toLowerCase();

  try {
    // Check if there's already a pending connection from this inviter to this email
    const existingQuery = `SELECT * FROM pending_connections
      WHERE inviter_id = $1
      AND invitee_email = $2
      AND status = 'pending'
      AND expires_at > NOW()
      LIMIT 1`;

    const existingResult = await dbModule.query(existingQuery, [parseInt(inviterId), emailLower]);
    const existing = existingResult.rows;

    if (existing.length > 0) {
      // Return existing pending connection
      const connection = existing[0];

      return {
        id: connection.id,
        token: connection.token,
        inviterId: connection.inviter_id,
        inviteeEmail: connection.invitee_email,
        status: connection.status,
        expiresAt: connection.expires_at,
        createdAt: connection.created_at,
        isNew: false,
      };
    }

    // Create new pending connection using safe insert
    const connectionId = await dbSafe.safeInsert('pending_connections', {
      inviter_id: inviterId,
      invitee_email: emailLower,
      token: token,
      status: 'pending',
      expires_at: expiresAt,
      created_at: now,
    });

    return {
      id: connectionId,
      token,
      inviterId,
      inviteeEmail: emailLower,
      status: 'pending',
      expiresAt,
      createdAt: now,
      isNew: true,
    };
  } catch (error) {
    console.error('Error creating pending connection:', error);
    throw error;
  }
}

/**
 * Get pending connections where user is the inviter
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Connections sent by this user
 */
async function getPendingConnectionsAsInviter(userId) {
  const query = `SELECT * FROM pending_connections
    WHERE inviter_id = $1
    AND status = 'pending'
    AND expires_at > NOW()
    ORDER BY created_at DESC`;

  const result = await dbModule.query(query, [parseInt(userId)]);
  return formatConnections(result.rows);
}

/**
 * Get pending connections where user is the invitee
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Invitations received by this user
 */
async function getPendingConnectionsAsInvitee(userId) {
  // Get user's email first
  const userResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
  const users = dbSafe.parseResult(userResult);

  if (users.length === 0 || !users[0].email) {
    return [];
  }

  const userEmail = users[0].email.toLowerCase();
  const query = `SELECT * FROM pending_connections
    WHERE invitee_email = $1
    AND status = 'pending'
    AND expires_at > NOW()
    ORDER BY created_at DESC`;

  const result = await dbModule.query(query, [userEmail]);
  return formatConnections(result.rows);
}

/**
 * Get pending connections for a user
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @param {string} options.role - Role filter: 'inviter', 'invitee', or 'all' (default: 'all')
 * @returns {Promise<Array>} Matching pending connections
 *
 * @example
 * // Get all pending connections
 * await getPendingConnections(userId);
 *
 * // Get only invitations sent by user
 * await getPendingConnections(userId, { role: CONNECTION_ROLE.INVITER });
 *
 * // Get only invitations received by user
 * await getPendingConnections(userId, { role: CONNECTION_ROLE.INVITEE });
 */
async function getPendingConnections(userId, options = {}) {
  const { role = CONNECTION_ROLE.ALL } = options;

  switch (role) {
    case CONNECTION_ROLE.INVITER:
      return getPendingConnectionsAsInviter(userId);

    case CONNECTION_ROLE.INVITEE:
      return getPendingConnectionsAsInvitee(userId);

    case CONNECTION_ROLE.ALL:
    default: {
      const [asInviter, asInvitee] = await Promise.all([
        getPendingConnectionsAsInviter(userId),
        getPendingConnectionsAsInvitee(userId),
      ]);
      // Merge and deduplicate
      return formatConnections([
        ...asInviter.map(c => ({
          id: c.id,
          inviter_id: c.inviterId,
          invitee_email: c.inviteeEmail,
          token: c.token,
          status: c.status,
          expires_at: c.expiresAt,
          created_at: c.createdAt,
        })),
        ...asInvitee.map(c => ({
          id: c.id,
          inviter_id: c.inviterId,
          invitee_email: c.inviteeEmail,
          token: c.token,
          status: c.status,
          expires_at: c.expiresAt,
          created_at: c.createdAt,
        })),
      ]);
    }
  }
}

module.exports = {
  formatConnections,
  createPendingConnection,
  getPendingConnectionsAsInviter,
  getPendingConnectionsAsInvitee,
  getPendingConnections,
};
