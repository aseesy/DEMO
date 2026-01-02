/**
 * Profile Encryption Module
 *
 * Single Responsibility: Encrypt and decrypt sensitive profile fields.
 *
 * Provides an abstraction over encryption implementation details.
 * Callers don't need to know about encryption format, algorithms, or key management.
 */

const crypto = require('crypto');
const { SENSITIVE_FIELDS } = require('./constants');

/**
 * Get encryption key from environment or use default for development.
 * In production, PROFILE_ENCRYPTION_KEY must be set.
 *
 * @private - Internal implementation detail
 */
function getEncryptionKey() {
  const key = process.env.PROFILE_ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PROFILE_ENCRYPTION_KEY must be set in production');
    }
    // Development fallback - NOT SECURE, only for local testing
    console.warn('⚠️ Using development encryption key - NOT SECURE for production');
    return crypto.createHash('sha256').update('dev-key-not-secure').digest();
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a single value using AES-256-GCM
 *
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted string (opaque format - implementation detail hidden)
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

    // Format: iv:authTag:ciphertext (internal format - opaque to callers)
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt a value encrypted with encrypt()
 *
 * @param {string} encryptedText - Encrypted string (opaque format)
 * @returns {string} Decrypted plain text
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
    console.error('Decryption error:', error.message);
    // Return null for corrupted/invalid encrypted data
    return null;
  }
}

/**
 * Encrypt sensitive fields in a profile data object
 *
 * @param {Object} data - Profile data with potential sensitive fields
 * @returns {Object} Profile data with sensitive fields encrypted
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
  encrypt,
  decrypt,
  encryptSensitiveFields,
  decryptSensitiveFields,
};
