/**
 * Connection Manager Constants
 *
 * Shared constants for connection management.
 */

/**
 * Role options for pending connection queries
 * @enum {string}
 */
const CONNECTION_ROLE = {
  INVITER: 'inviter',
  INVITEE: 'invitee',
  ALL: 'all',
};

module.exports = {
  CONNECTION_ROLE,
};
