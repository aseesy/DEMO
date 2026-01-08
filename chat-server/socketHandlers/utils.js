/**
 * Shared Socket Helper Functions
 */

const { defaultLogger } = require('../src/infrastructure/logging/logger');

/**
 * Emit error to socket with consistent logging and standardized format
 * @param {Object} socket - Socket.io socket instance
 * @param {string} message - User-facing error message (never includes internal details)
 * @param {Error|null} error - Optional error for logging (internal details hidden from client)
 * @param {string} context - Context string for logging
 */
function emitError(socket, message, error = null, context = '') {
  const logger = defaultLogger.child({ function: 'emitError', context: context || 'SocketHandler' });
  
  // Log error details server-side (never log PII or internal details to client)
  if (error) {
    logger.error('Socket error occurred', error, {
      errorCode: error.code || 'UNKNOWN',
      context,
      // Never log: email, userId, socketId, internal error messages
    });
  } else {
    logger.warn('Socket error (no error object)', {
      message,
      context,
    });
  }
  
  // Emit standardized error format to client
  // NEVER leak: error.message (may contain DB details), stack traces, internal codes
  const errorCode = error?.code || 'GENERIC_ERROR';
  
  // Map internal error codes to user-friendly codes
  const clientCode = mapErrorCodeToClient(errorCode);
  
  socket.emit('error', {
    code: clientCode,
    message: message, // User-friendly message only (already sanitized by caller)
    timestamp: new Date().toISOString(),
  });
}

/**
 * Map internal error codes to client-safe error codes
 * Prevents leaking internal database error codes (e.g., 23505) to clients
 * @param {string} internalCode - Internal error code
 * @returns {string} Client-safe error code
 */
function mapErrorCodeToClient(internalCode) {
  // Map PostgreSQL error codes to generic client codes
  const errorCodeMap = {
    // Database errors
    '23505': 'DUPLICATE_ERROR', // Unique constraint violation
    '23503': 'REFERENCE_ERROR', // Foreign key violation
    '23502': 'REQUIRED_FIELD_ERROR', // Not null violation
    '42P01': 'DATABASE_ERROR', // Table does not exist
    '08P01': 'DATABASE_ERROR', // Protocol violation
    
    // Custom error codes
    'EMAIL_EXISTS': 'REG_001',
    'ROOM_NOT_AVAILABLE': 'ROOM_ERROR',
    'AUTH_REQUIRED': 'AUTH_REQUIRED',
    'AUTH_INVALID': 'AUTH_INVALID',
  };
  
  return errorCodeMap[internalCode] || 'GENERIC_ERROR';
}

/**
 * Get user display name: first_name + last_name > first_name > display_name > email
 * Supports both email lookup (legacy) and user object (new)
 */
async function getUserDisplayName(emailOrUser, dbSafe = null) {
  // If it's already a user object (new structure)
  if (typeof emailOrUser === 'object' && emailOrUser !== null) {
    if (emailOrUser.first_name && emailOrUser.last_name) {
      return `${emailOrUser.first_name} ${emailOrUser.last_name}`;
    }
    return emailOrUser.first_name || emailOrUser.display_name || emailOrUser.email || 'Co-parent';
  }

  // Legacy: email string lookup
  if (typeof emailOrUser === 'string' && dbSafe) {
    try {
      const emailLower = emailOrUser.trim().toLowerCase();
      const userResult = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
      const users = dbSafe.parseResult(userResult);
      if (users.length > 0) {
        const user = users[0];
        // Prefer first_name + last_name, then first_name, then display_name, then email
        if (user.first_name && user.last_name) {
          return `${user.first_name} ${user.last_name}`;
        }
        return user.first_name || user.display_name || emailOrUser;
      }
    } catch (err) {
      const logger = defaultLogger.child({ function: 'getUserDisplayName' });
      logger.warn('Error getting display name', {
        error: err.message,
        errorCode: err.code,
        // Don't log email - PII
      });
    }
    return emailOrUser;
  }

  return 'Co-parent';
}

/**
 * Build sender/receiver object from user data (normalized)
 * @param {Object} userData - User data from database JOIN
 * @param {boolean} includeEmail - Whether to include email (privacy consideration)
 * @returns {Object|null} User object with uuid, first_name, last_name, email (optional)
 * 
 * NOTE: If userData.id is null but userData.email exists, returns minimal object with uuid: null.
 * This handles cases where messages exist but user record is missing (e.g., deleted users).
 */
function buildUserObject(userData, includeEmail = true) {
  if (!userData) {
    return null;
  }

  // If we have an ID, return full user object
  if (userData.id) {
    return {
      uuid: userData.id, // Use users.id as UUID
      first_name: userData.first_name || null,
      last_name: userData.last_name || null,
      email: includeEmail ? userData.email || null : null, // Privacy-aware
    };
  }

  // If no ID but we have email, return minimal object (for messages where user lookup failed)
  // This ensures messages are still displayed even if user record is missing
  if (userData.email) {
    return {
      uuid: null, // No user_id available
      first_name: userData.first_name || null,
      last_name: userData.last_name || null,
      email: includeEmail ? userData.email : null,
    };
  }

  // No ID and no email - return null
  return null;
}

/**
 * Get receiver for a message (other participant in room)
 * @param {string} senderEmail - Sender's email
 * @param {string} roomId - Room ID
 * @param {Object} dbSafe - Database connection
 * @returns {Promise<Object|null>} Receiver user object or null
 */
async function getReceiverForMessage(senderEmail, roomId, dbSafe) {
  if (!dbSafe || !roomId || !senderEmail) {
    return null;
  }

  try {
    // Get room members
    const roomMembersResult = await dbSafe.safeSelect('room_members', { room_id: roomId }, {});
    const roomMembers = dbSafe.parseResult(roomMembersResult);

    if (roomMembers.length === 0) {
      return null;
    }

    // Get user IDs for room members
    const userIds = roomMembers.map(rm => rm.user_id);

    // Get user details for all room members
    const usersResult = await dbSafe.safeSelect('users', { id: userIds }, {});
    const users = dbSafe.parseResult(usersResult);

    // Find the other participant (not the sender)
    const senderEmailLower = senderEmail.toLowerCase();
    const otherUser = users.find(u => u.email && u.email.toLowerCase() !== senderEmailLower);

    if (!otherUser) {
      return null;
    }

    return buildUserObject(otherUser);
  } catch (err) {
    const logger = defaultLogger.child({ function: 'getReceiverForMessage' });
    logger.warn('Error getting receiver', {
      error: err.message,
      errorCode: err.code,
      // Don't log senderEmail - PII
    });
    return null;
  }
}

module.exports = {
  emitError,
  getUserDisplayName,
  buildUserObject,
  getReceiverForMessage,
};
