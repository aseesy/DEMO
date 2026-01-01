/**
 * Socket.io Middleware - Modular Entry Point
 *
 * Provides:
 * - JWT authentication on connection
 * - Per-socket, per-event rate limiting
 * - Payload size validation
 * - Error codes for client retry logic
 *
 * Re-exports from submodules for backward compatibility.
 */

const { SocketErrorCodes, emitSocketError } = require('./socketMiddleware/errorCodes');
const { RATE_LIMITS, isRateLimited, rateLimitMiddleware } = require('./socketMiddleware/rateLimiting');
const { authMiddleware } = require('./socketMiddleware/authMiddleware');
const { MAX_PAYLOAD_SIZE, payloadValidationMiddleware } = require('./socketMiddleware/payloadValidation');
const { verifyRoomMembership } = require('./socketMiddleware/roomMembership');
const { isValidEmail, isValidRoomId, validateAndSanitize } = require('./socketMiddleware/inputValidation');

module.exports = {
  // Authentication
  authMiddleware,

  // Rate Limiting
  rateLimitMiddleware,
  isRateLimited,
  RATE_LIMITS,

  // Payload Validation
  payloadValidationMiddleware,
  MAX_PAYLOAD_SIZE,

  // Room Membership
  verifyRoomMembership,

  // Input Validation
  validateAndSanitize,
  isValidEmail,
  isValidRoomId,

  // Error Handling
  emitSocketError,
  SocketErrorCodes,
};
