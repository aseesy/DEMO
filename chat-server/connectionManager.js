/**
 * Connection Manager - Modular Entry Point
 *
 * Handles pending connection invitations between users.
 * Re-exports from submodules for backward compatibility.
 */

const { CONNECTION_ROLE } = require('./connectionManager/constants');
const { generateInviteToken, validateConnectionToken } = require('./connectionManager/tokenService');
const { validateEmail, emailExists, getUserByEmail } = require('./connectionManager/emailValidation');
const {
  formatConnections,
  createPendingConnection,
  getPendingConnectionsAsInviter,
  getPendingConnectionsAsInvitee,
  getPendingConnections,
} = require('./connectionManager/pendingConnections');
const { acceptPendingConnection } = require('./connectionManager/connectionAcceptance');

module.exports = {
  // Email Validation
  validateEmail,
  emailExists,
  getUserByEmail,

  // Token Service
  generateInviteToken,
  validateConnectionToken,

  // Pending Connections
  formatConnections,
  createPendingConnection,
  getPendingConnectionsAsInviter,
  getPendingConnectionsAsInvitee,
  getPendingConnections,

  // Connection Acceptance
  acceptPendingConnection,

  // Constants
  CONNECTION_ROLE,
};
