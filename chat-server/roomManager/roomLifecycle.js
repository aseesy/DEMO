/**
 * Room Lifecycle Operations
 *
 * Handles room lifecycle events like creation, initialization, and cleanup.
 * Separates persistence logic from content/messaging concerns.
 *
 * ACTOR: Operations Team
 * REASON TO CHANGE: Database schema changes, performance optimization
 */

const dbPostgres = require('../dbPostgres');
const { SYSTEM_IDENTITY, WELCOME_MESSAGE } = require('../content/systemMessages');
const { generateMessageId } = require('../src/utils/crypto');

/**
 * Send the welcome message to a newly created room
 *
 * @param {string} roomId - The room to send the welcome message to
 * @returns {Promise<boolean>} Success status
 */
async function sendWelcomeMessage(roomId) {
  const messageId = generateMessageId();
  const now = new Date();
  // Backdate by 1 minute so it appears before any user messages
  const backdatedTime = new Date(now.getTime() - 60000).toISOString();

  try {
    await dbPostgres.query(
      `INSERT INTO messages (id, type, username, text, timestamp, room_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        messageId,
        WELCOME_MESSAGE.type,
        SYSTEM_IDENTITY.username,
        WELCOME_MESSAGE.text,
        backdatedTime,
        roomId,
      ]
    );
    console.log(`✅ Welcome message sent to room ${roomId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send welcome message to room ${roomId}:`, error.message);
    return false;
  }
}

/**
 * Initialize a room with default state
 *
 * @param {string} roomId - The room to initialize
 * @returns {Promise<boolean>} Success status
 */
async function initializeRoom(roomId) {
  // Send welcome message as part of initialization
  return sendWelcomeMessage(roomId);
}

module.exports = {
  sendWelcomeMessage,
  initializeRoom,
};
