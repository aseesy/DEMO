/**
 * Token Service
 *
 * Handles token generation and validation for connection invitations.
 */

const crypto = require('crypto');
const dbModule = require('../dbPostgres');

/**
 * Generate a secure, unique token for invitations
 * @returns {string} 64-character hex token
 */
function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate a connection token
 * @param {string} token - Token to validate
 * @returns {Promise<Object|null>} Connection object if valid, null otherwise
 */
async function validateConnectionToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  // Use parameterized query for security and PostgreSQL compatibility
  const query = `SELECT * FROM pending_connections
    WHERE token = $1
    AND status = 'pending'
    AND expires_at > NOW()
    LIMIT 1`;

  const result = await dbModule.query(query, [token]);
  const connections = result.rows;

  if (connections.length === 0) {
    return null;
  }

  const connection = connections[0];

  return {
    id: connection.id,
    token: connection.token,
    inviterId: connection.inviter_id,
    inviteeEmail: connection.invitee_email,
    status: connection.status,
    expiresAt: connection.expires_at,
    createdAt: connection.created_at,
  };
}

module.exports = {
  generateInviteToken,
  validateConnectionToken,
};
