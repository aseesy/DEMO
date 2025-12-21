/**
 * Room Management Utilities
 */
const crypto = require('crypto');
const dbPostgres = require('../dbPostgres');

const LIAIZEN_WELCOME_MESSAGE =
  'Hello, I am LiaiZen - your personal communication coach. I am here to help you improve your interpersonal skills through personalized guidance, feedback, and practice. Try saying something rude to your co-parent to see how it works.';

function generateRoomId() {
  return `room_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const randomBytes = crypto.randomBytes(9);
  for (let i = 0; i < 9; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

async function sendWelcomeMessage(roomId) {
  const messageId = `welcome_${Date.now()}`;
  const now = new Date();
  const backdatedTime = new Date(now.getTime() - 60000).toISOString();

  try {
    await dbPostgres.query(
      `INSERT INTO messages (id, type, username, text, timestamp, room_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      [messageId, 'ai_comment', 'LiaiZen', LIAIZEN_WELCOME_MESSAGE, backdatedTime, roomId]
    );
    console.log(`✅ Welcome message sent to room ${roomId}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome message to room ${roomId}:`, error.message);
  }
}

module.exports = {
  LIAIZEN_WELCOME_MESSAGE,
  generateRoomId,
  generateInviteCode,
  sendWelcomeMessage,
};
