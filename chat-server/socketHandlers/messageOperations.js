/**
 * Message Operations - Pure business logic for message handling
 *
 * These functions contain business logic without error handling.
 * Error handling is done by the caller (messageHandler.js).
 */

const { sanitizeInput, MAX_MESSAGE_LENGTH } = require('../utils');

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
 * @param {Map} activeUsers - Active users map
 * @param {string} socketId - Socket ID
 * @returns {{ valid: boolean, user?: Object, error?: string }}
 */
function validateActiveUser(activeUsers, socketId) {
  const user = activeUsers.get(socketId);

  if (!user) {
    return {
      valid: false,
      error: 'You must join before sending messages.',
    };
  }

  return { valid: true, user };
}

/**
 * Create a user message object
 * @param {string} socketId - Socket ID
 * @param {Object} user - User data
 * @param {string} cleanText - Sanitized message text
 * @param {string} displayName - User's display name
 * @param {string} [optimisticId] - Client's optimistic message ID for matching
 * @returns {Object} Message object
 */
function createUserMessage(socketId, user, cleanText, displayName, optimisticId = null) {
  const message = {
    id: `${Date.now()}-${socketId}`,
    type: 'user',
    username: user.username,
    displayName,
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
async function verifyMessageOwnership(messageId, username, roomId, dbPostgres) {
  const query = `SELECT * FROM messages WHERE id = $1 AND username = $2 AND room_id = $3 LIMIT 1`;
  const result = await dbPostgres.query(query, [messageId, username, roomId]);

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
    username: originalMessage.username,
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
 * @param {string} username - Username toggling the reaction
 * @returns {Object} Updated reactions object (new object, doesn't mutate original)
 */
function toggleReaction(reactions, emoji, username) {
  // Deep copy to avoid mutating original arrays
  const updated = {};
  for (const key of Object.keys(reactions)) {
    updated[key] = [...reactions[key]];
  }

  if (!updated[emoji]) {
    updated[emoji] = [];
  }

  const userIndex = updated[emoji].indexOf(username);

  if (userIndex > -1) {
    // Remove reaction
    updated[emoji].splice(userIndex, 1);
    if (updated[emoji].length === 0) {
      delete updated[emoji];
    }
  } else {
    // Add reaction
    updated[emoji].push(username);
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
