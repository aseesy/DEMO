/**
 * Input Validation
 *
 * Validates and sanitizes user input for Socket.io events.
 */

// Stricter email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Room ID format (UUID or custom format)
const ROOM_ID_REGEX = /^room_[0-9]+_[a-f0-9]+$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false; // RFC 5321
  return EMAIL_REGEX.test(email);
}

/**
 * Validate room ID format
 * @param {string} roomId - Room ID to validate
 * @returns {boolean}
 */
function isValidRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') return false;
  if (roomId.length > 100) return false;
  return ROOM_ID_REGEX.test(roomId);
}

/**
 * Sanitize and validate user input
 * @param {string} input - Input to validate
 * @param {string} type - Type of input ('text', 'email', 'roomId')
 * @param {number} maxLength - Maximum allowed length
 * @returns {Object} Validation result
 */
function validateAndSanitize(input, type = 'text', maxLength = 500) {
  if (input === null || input === undefined) {
    return { valid: false, error: 'Input is required' };
  }

  if (typeof input !== 'string') {
    return { valid: false, error: 'Input must be a string' };
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Input cannot be empty', empty: true };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Input exceeds maximum length of ${maxLength}` };
  }

  // Type-specific validation
  if (type === 'email' && !isValidEmail(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (type === 'roomId' && !isValidRoomId(trimmed)) {
    return { valid: false, error: 'Invalid room ID format' };
  }

  return { valid: true, value: trimmed };
}

module.exports = {
  EMAIL_REGEX,
  ROOM_ID_REGEX,
  isValidEmail,
  isValidRoomId,
  validateAndSanitize,
};
