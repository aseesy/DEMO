/**
 * System Messages Operations
 *
 * Handles creation and persistence of system messages.
 */

/**
 * Create a system message object
 * @param {string} socketId - Socket ID
 * @param {string} text - Message text
 * @param {string} roomId - Room ID
 * @param {string} userEmail - User email (defaults to system email)
 * @returns {Object} System message
 */
function createSystemMessage(socketId, text, roomId, userEmail = 'system@liaizen.app') {
  return {
    id: `${Date.now()}-${socketId}`,
    type: 'system',
    user_email: userEmail,
    username: 'System', // Backward compatibility
    text,
    timestamp: new Date().toISOString(),
    roomId,
  };
}

/**
 * Save system message to database
 * SIDE EFFECT: Inserts record into messages table
 *
 * @param {Object} systemMessage - System message object
 * @param {Object} dbSafe - Safe database wrapper
 */
async function saveSystemMessage(systemMessage, dbSafe) {
  await dbSafe.safeInsert('messages', {
    id: systemMessage.id,
    type: systemMessage.type,
    user_email: systemMessage.user_email || 'system@liaizen.app',
    text: systemMessage.text,
    timestamp: systemMessage.timestamp,
    room_id: systemMessage.roomId,
  });
}

module.exports = {
  createSystemMessage,
  saveSystemMessage,
};
