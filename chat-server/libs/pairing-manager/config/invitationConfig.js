/**
 * Invitation Configuration
 *
 * Configuration-driven expiration settings for invitation types.
 * Enables extensibility without modifying code (Open-Closed Principle).
 *
 * @module pairing-manager/config/invitationConfig
 */

/**
 * Invitation type constants (duplicated here to avoid circular dependency)
 * Must stay in sync with INVITE_TYPE in pairingCreator.js
 */
const INVITE_TYPES = {
  EMAIL: 'email',
  LINK: 'link',
  CODE: 'code',
};

/**
 * Configuration mapping invitation types to expiration settings
 * Adding new types only requires adding entries here, no code modification needed
 */
const INVITATION_CONFIG = {
  [INVITE_TYPES.EMAIL]: {
    expirationDays: 7,
  },
  [INVITE_TYPES.LINK]: {
    expirationDays: 7,
  },
  [INVITE_TYPES.CODE]: {
    expirationMinutes: 15,
  },
};

/**
 * Calculate expiration timestamp based on invitation type
 *
 * @param {string} inviteType - Invitation type ('email', 'link', or 'code')
 * @returns {Date} Expiration date
 */
function calculateExpiration(inviteType) {
  const config = INVITATION_CONFIG[inviteType];
  if (!config) {
    throw new Error(
      `Invalid invite type: ${inviteType}. Valid types: ${Object.keys(INVITATION_CONFIG).join(', ')}`
    );
  }

  const now = new Date();

  if (config.expirationDays) {
    now.setDate(now.getDate() + config.expirationDays);
  } else if (config.expirationMinutes) {
    now.setMinutes(now.getMinutes() + config.expirationMinutes);
  } else {
    throw new Error(`Invalid expiration configuration for type: ${inviteType}`);
  }

  return now;
}

/**
 * Get configuration for an invitation type
 *
 * @param {string} inviteType - Invitation type
 * @returns {Object|null} Configuration object or null if not found
 */
function getConfig(inviteType) {
  return INVITATION_CONFIG[inviteType] || null;
}

/**
 * Get all configured invitation types
 *
 * @returns {string[]} Array of invitation types
 */
function getConfiguredTypes() {
  return Object.keys(INVITATION_CONFIG);
}

module.exports = {
  INVITATION_CONFIG,
  calculateExpiration,
  getConfig,
  getConfiguredTypes,
};
