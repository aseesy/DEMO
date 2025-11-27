/**
 * Cryptographic Utilities
 *
 * Generic, stateless crypto functions for token generation,
 * ID creation, and secure random values.
 *
 * @module src/utils/crypto
 */

const crypto = require('crypto');

/**
 * Generate a cryptographically secure random token
 *
 * @param {number} length - Number of random bytes (default: 32 = 256 bits)
 * @param {string} encoding - Output encoding (default: 'hex')
 * @returns {string} Random token string
 *
 * @example
 * generateToken() // 64-character hex string
 * generateToken(16) // 32-character hex string
 * generateToken(32, 'base64url') // URL-safe base64 string
 */
function generateToken(length = 32, encoding = 'hex') {
  return crypto.randomBytes(length).toString(encoding);
}

/**
 * Generate a short, URL-safe code (for invitations, verification, etc.)
 *
 * @param {number} length - Number of characters (default: 6)
 * @returns {string} Alphanumeric code (uppercase letters + digits, no confusing chars)
 *
 * @example
 * generateShortCode() // e.g., 'A3B7K9'
 * generateShortCode(8) // e.g., 'A3B7K9M2'
 */
function generateShortCode(length = 6) {
  // Exclude confusing characters: 0/O, 1/I/L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Generate a unique ID with optional prefix
 * Format: prefix_timestamp_randomhex
 *
 * @param {string} prefix - ID prefix (default: 'id')
 * @param {number} randomBytes - Number of random bytes (default: 8)
 * @returns {string} Unique identifier
 *
 * @example
 * generateId() // 'id_1699999999999_a1b2c3d4e5f6g7h8'
 * generateId('room') // 'room_1699999999999_a1b2c3d4e5f6g7h8'
 * generateId('msg', 4) // 'msg_1699999999999_a1b2c3d4'
 */
function generateId(prefix = 'id', randomBytes = 8) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(randomBytes).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate a simple unique ID (shorter, for non-critical uses)
 * Uses Math.random for speed when crypto security isn't needed
 *
 * @param {string} prefix - ID prefix (default: '')
 * @returns {string} Simple unique ID
 *
 * @example
 * generateSimpleId() // 'kj8f3h2m9p'
 * generateSimpleId('item') // 'item_kj8f3h2m9p'
 */
function generateSimpleId(prefix = '') {
  const random = Math.random().toString(36).substring(2, 12);
  return prefix ? `${prefix}_${random}` : random;
}

/**
 * Generate a room ID with timestamp and random component
 *
 * @returns {string} Room identifier
 *
 * @example
 * generateRoomId() // 'room_1699999999999_a1b2c3d4e5f6g7h8'
 */
function generateRoomId() {
  return generateId('room', 8);
}

/**
 * Generate an invitation ID
 *
 * @returns {string} Invitation identifier
 *
 * @example
 * generateInviteId() // 'invite_1699999999999_a1b2c3d4'
 */
function generateInviteId() {
  return generateId('invite', 4);
}

/**
 * Generate a message ID
 *
 * @returns {string} Message identifier
 *
 * @example
 * generateMessageId() // 'msg_1699999999999_a1b2c3d4e5f6g7h8'
 */
function generateMessageId() {
  return generateId('msg', 8);
}

/**
 * Generate a thread ID
 *
 * @returns {string} Thread identifier
 *
 * @example
 * generateThreadId() // 'thread_1699999999999_a1b2c3d4e5'
 */
function generateThreadId() {
  return generateId('thread', 5);
}

/**
 * Generate a session token (for auth/session management)
 *
 * @returns {string} 64-character hex session token
 */
function generateSessionToken() {
  return generateToken(32, 'hex');
}

/**
 * Hash a string using SHA-256
 *
 * @param {string} input - String to hash
 * @returns {string} Hex-encoded SHA-256 hash
 *
 * @example
 * hashString('password123') // 64-character hex hash
 */
function hashString(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Compare two strings in constant time (timing-attack safe)
 *
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings are equal
 */
function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

module.exports = {
  generateToken,
  generateShortCode,
  generateId,
  generateSimpleId,
  generateRoomId,
  generateInviteId,
  generateMessageId,
  generateThreadId,
  generateSessionToken,
  hashString,
  secureCompare,
};
