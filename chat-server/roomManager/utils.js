/**
 * Room Management Utilities
 *
 * Re-exports ID generation from centralized crypto module.
 * Re-exports lifecycle operations from roomLifecycle module.
 *
 * This file maintains backward compatibility for existing imports.
 *
 * ACTOR: Infrastructure
 * REASON TO CHANGE: Consolidating utilities, removing duplicates
 */

// ID generation - delegated to centralized crypto utilities
const { generateRoomId, generateInviteCode } = require('../src/infrastructure/security/crypto');

// Room lifecycle - delegated to roomLifecycle module
const { sendWelcomeMessage } = require('./roomLifecycle');

// Content - for backward compatibility (prefer importing from content/ directly)
const { WELCOME_MESSAGE } = require('../content/systemMessages');
const LIAIZEN_WELCOME_MESSAGE = WELCOME_MESSAGE.text;

module.exports = {
  // ID generation (from crypto.js)
  generateRoomId,
  generateInviteCode,

  // Room lifecycle (from roomLifecycle.js)
  sendWelcomeMessage,

  // Content - deprecated, import from content/systemMessages.js instead
  LIAIZEN_WELCOME_MESSAGE,
};
