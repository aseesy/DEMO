/**
 * Cryptographic Utilities
 *
 * Generic, stateless crypto functions for token generation,
 * ID creation, secure random values, and field encryption.
 *
 * @module src/utils/crypto
 */

const crypto = require('crypto');
const { SENSITIVE_FIELDS } = require('../../features/profile/constants/profileConstants');

const { defaultLogger: defaultLogger } = require('../logging/logger');

const logger = defaultLogger.child({
  module: 'crypto',
});

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
 * Generate a human-readable invite code (for sharing)
 *
 * @returns {string} 9-character alphanumeric code (e.g., 'ABC123XYZ')
 *
 * @example
 * generateInviteCode() // 'K7M2P9X4Q'
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const randomBytes = crypto.randomBytes(9);
  for (let i = 0; i < 9; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
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

// ============================================================================
// AES-256-GCM ENCRYPTION (for sensitive profile fields)
// ============================================================================

/**
 * Get encryption key from environment or use default for development.
 * In production, PROFILE_ENCRYPTION_KEY must be set.
 *
 * @returns {Buffer} 32-byte encryption key
 * @throws {Error} If key is missing in production
 */
function getEncryptionKey() {
  const key = process.env.PROFILE_ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PROFILE_ENCRYPTION_KEY must be set in production');
    }
    // Development fallback - NOT SECURE, only for local testing
    logger.warn('Using development encryption key - NOT SECURE for production');
    return crypto.createHash('sha256').update('dev-key-not-secure').digest();
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a single value using AES-256-GCM
 *
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted string in format: iv:authTag:ciphertext
 *
 * @example
 * encrypt('sensitive data') // '0a1b2c...:3d4e5f...:6g7h8i...'
 */
function encrypt(text) {
  if (!text) return text;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Format: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    logger.error('Encryption error', {
      message: error.message,
    });
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt a value encrypted with encrypt()
 *
 * @param {string} encryptedText - Encrypted string in format: iv:authTag:ciphertext
 * @returns {string|null} Decrypted plain text, or null if decryption fails
 *
 * @example
 * decrypt('0a1b2c...:3d4e5f...:6g7h8i...') // 'sensitive data'
 */
function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;

  // Check if this looks like encrypted data
  if (!encryptedText.includes(':')) {
    // Not encrypted, return as-is (for backward compatibility)
    return encryptedText;
  }

  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const ciphertext = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption error', {
      message: error.message,
    });
    // Return null for corrupted/invalid encrypted data
    return null;
  }
}

/**
 * Encrypt sensitive fields in a profile data object
 *
 * @param {Object} data - Profile data with potential sensitive fields
 * @returns {Object} Profile data with sensitive fields encrypted
 *
 * @example
 * encryptSensitiveFields({ health_mental_conditions: 'anxiety' })
 * // { health_mental_conditions: '0a1b2c...:3d4e5f...:6g7h8i...' }
 */
function encryptSensitiveFields(data) {
  if (!data) return data;

  const result = { ...data };

  for (const field of SENSITIVE_FIELDS) {
    if (result[field] && typeof result[field] === 'string' && result[field].trim()) {
      result[field] = encrypt(result[field]);
    }
  }

  return result;
}

/**
 * Decrypt sensitive fields in a profile data object
 *
 * @param {Object} data - Profile data with encrypted sensitive fields
 * @returns {Object} Profile data with sensitive fields decrypted
 *
 * @example
 * decryptSensitiveFields({ health_mental_conditions: '0a1b2c...:3d4e5f...:6g7h8i...' })
 * // { health_mental_conditions: 'anxiety' }
 */
function decryptSensitiveFields(data) {
  if (!data) return data;

  const result = { ...data };

  for (const field of SENSITIVE_FIELDS) {
    if (result[field]) {
      result[field] = decrypt(result[field]);
    }
  }

  return result;
}

module.exports = {
  // Token generation
  generateToken,
  generateShortCode,
  generateId,
  generateSimpleId,
  generateRoomId,
  generateInviteId,
  generateInviteCode,
  generateMessageId,
  generateThreadId,
  generateSessionToken,

  // Hashing & comparison
  hashString,
  secureCompare,

  // AES-256-GCM encryption
  encrypt,
  decrypt,
  encryptSensitiveFields,
  decryptSensitiveFields,
};
