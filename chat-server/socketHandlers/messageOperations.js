/**
 * Message Operations - Pure business logic for message handling
 *
 * These functions contain business logic without error handling.
 * Error handling is done by the caller (messageHandler.js).
 */

const { sanitizeInput, MAX_MESSAGE_LENGTH } = require('../utils');
const { buildUserObject, getReceiverForMessage } = require('./utils');

/**
 * Validation result type
 * @typedef {Object} MessageValidation
 * @property {boolean} valid
 * @property {string} [error]
 * @property {string} [cleanText]
 */

/**
 * Validate and sanitize message text
 * @param {string} text - Raw message text
 * @returns {MessageValidation}
 */
function validateMessageText(text) {
  const cleanText = sanitizeInput(text);

  if (!cleanText || cleanText.length === 0) {
    return { valid: false, empty: true };
  }

  if (cleanText.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters).`,
    };
  }

  return { valid: true, cleanText };
}

/**
 * Validate that user is active
 * @param {Object} userSessionService - User session service
 * @param {string} socketId - Socket ID
 * @returns {Promise<{ valid: boolean, user?: Object, error?: string }>}
 */
async function validateActiveUser(userSessionService, socketId) {
  const user = await userSessionService.getUserBySocketId(socketId);

  if (!user) {
    return {
      valid: false,
      error: 'You must join before sending messages.',
    };
  }

  return { valid: true, user };
}

/**
 * Create a user message object with sender/receiver structure
 * @param {string} socketId - Socket ID
 * @param {Object} user - User data
 * @param {string} cleanText - Sanitized message text
 * @param {string} displayName - User's display name (legacy, kept for backward compatibility)
 * @param {string} [optimisticId] - Client's optimistic message ID for matching
 * @param {Object} [dbSafe] - Database connection for receiver lookup
 * @returns {Promise<Object>} Message object
 */
async function createUserMessage(
  socketId,
  user,
  cleanText,
  displayName,
  optimisticId = null,
  dbSafe = null
) {
  const userEmail = user.email || user.username;

  // Build sender object from current user data
  const senderData = {
    id: user.id || null,
    email: userEmail,
    first_name: user.first_name || null,
    last_name: user.last_name || null,
  };
  const sender = buildUserObject(senderData);

  // Get receiver (other participant in room) - async operation
  let receiver = null;
  if (dbSafe && user.roomId) {
    receiver = await getReceiverForMessage(userEmail, user.roomId, dbSafe);
  }

  const message = {
    id: `${Date.now()}-${socketId}`,
    type: 'user',

    // ✅ NEW STRUCTURE (primary)
    sender,
    receiver, // May be null for group chats or if lookup fails

    // Database field (keep for database column mapping)
    user_email: userEmail,

    // Legacy field (required by AI mediator for profile lookups and caching)
    username: userEmail,

    // Core fields
    text: cleanText,
    timestamp: new Date().toISOString(),
    socketId,
    roomId: user.roomId,
  };

  // Include optimisticId so client can match this server message with its optimistic version
  if (optimisticId) {
    message.optimisticId = optimisticId;
  }

  return message;
}

/**
 * Verify message ownership for editing/deleting
 * @param {string} messageId - Message ID
 * @param {string} username - Username claiming ownership
 * @param {string} roomId - Room ID
 * @param {Object} dbPostgres - Database connection
 * @returns {Promise<{ valid: boolean, message?: Object, error?: string }>}
 */
async function verifyMessageOwnership(messageId, email, roomId, dbPostgres) {
  // Support both user_email and username for backward compatibility
  const query = `SELECT * FROM messages WHERE id = $1 AND (user_email = $2 OR username = $2) AND room_id = $3 LIMIT 1`;
  const result = await dbPostgres.query(query, [messageId, email, roomId]);

  if (result.rows.length === 0) {
    return {
      valid: false,
      error: 'Message not found or you do not have permission to modify it.',
    };
  }

  return { valid: true, message: result.rows[0] };
}

/**
 * Create an edited message object for broadcast
 * @param {Object} originalMessage - Original message from database
 * @param {string} cleanText - New sanitized text
 * @param {string} roomId - Room ID
 * @returns {Object} Edited message object
 */
function createEditedMessage(originalMessage, cleanText, roomId) {
  return {
    id: originalMessage.id,
    type: originalMessage.type,

    // ✅ Preserve sender/receiver structure if present
    sender: originalMessage.sender || null,
    receiver: originalMessage.receiver || null,

    // Database field (keep for database column mapping)
    user_email: originalMessage.user_email || originalMessage.sender?.email || null,

    // Core fields
    text: cleanText,
    timestamp: originalMessage.timestamp,
    edited: true,
    editedAt: new Date().toISOString(),
    roomId,
  };
}

/**
 * Parse reactions JSON safely
 * @param {string} reactionsJson - JSON string of reactions
 * @returns {Object} Reactions object
 */
function parseReactions(reactionsJson) {
  try {
    return JSON.parse(reactionsJson || '{}');
  } catch {
    return {};
  }
}

/**
 * Toggle a user's reaction on a message
 * @param {Object} reactions - Current reactions object
 * @param {string} emoji - Emoji to toggle
 * @param {string} userEmail - Email of user toggling the reaction
 * @returns {Object} Updated reactions object (new object, doesn't mutate original)
 */
function toggleReaction(reactions, emoji, userEmail) {
  // Deep copy to avoid mutating original arrays
  const updated = {};
  for (const key of Object.keys(reactions)) {
    updated[key] = [...reactions[key]];
  }

  if (!updated[emoji]) {
    updated[emoji] = [];
  }

  const userIndex = updated[emoji].indexOf(userEmail);

  if (userIndex > -1) {
    // Remove reaction
    updated[emoji].splice(userIndex, 1);
    if (updated[emoji].length === 0) {
      delete updated[emoji];
    }
  } else {
    // Add reaction
    updated[emoji].push(userEmail);
  }

  return updated;
}

module.exports = {
  validateMessageText,
  validateActiveUser,
  createUserMessage,
  verifyMessageOwnership,
  createEditedMessage,
  parseReactions,
  toggleReaction,
};
