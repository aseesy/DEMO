/**
 * Core Room Management Logic
 *
 * Applies Clean Code principles:
 * - Single Responsibility: Each function has one clear purpose
 * - Repository Pattern: Database details hidden behind repository interface
 * - Separation of Concerns: Policy (welcome message) separated from implementation
 */
const { PostgresRoomRepository } = require('../src/repositories/postgres/PostgresRoomRepository');
const { generateRoomId, sendWelcomeMessage } = require('./utils');

// Repository instance - encapsulates all database access
const roomRepo = new PostgresRoomRepository();

/**
 * Check if welcome message already exists in room
 * Uses repository to hide SQL implementation details
 * @param {string} roomId - Room ID
 * @returns {Promise<boolean>} True if welcome message exists
 */
async function welcomeMessageExists(roomId) {
  try {
    const {
      PostgresGenericRepository,
    } = require('../src/repositories/postgres/PostgresGenericRepository');
    const messageRepo = new PostgresGenericRepository('messages');
    const existing = await messageRepo.find(
      { room_id: roomId, username: 'LiaiZen', type: 'ai_comment' },
      { limit: 1 }
    );
    return existing.length > 0;
  } catch (error) {
    // If message repository fails, assume no welcome message (safe default)
    return false;
  }
}

/**
 * Create a private room for a user
 * @param {number} userId - User ID
 * @param {string} username - Username
 * @param {boolean} sendWelcome - Whether to send welcome message
 * @returns {Promise<Object>} Created room information
 */
async function createPrivateRoom(userId, username, sendWelcome = true) {
  const roomId = generateRoomId();
  const roomName = `${username}'s Co-Parenting Room`;
  const now = new Date().toISOString();

  try {
    // Create room (repository handles SQL details)
    await roomRepo.create({
      id: roomId,
      name: roomName,
      created_by: userId,
      is_private: 1,
      created_at: now,
    });

    // Add user as owner (repository handles SQL details)
    await roomRepo.addMember(roomId, userId, 'owner');

    // Send welcome message if requested and not already sent
    if (sendWelcome && !(await welcomeMessageExists(roomId))) {
      await sendWelcomeMessage(roomId);
    }

    return { roomId, roomName, createdBy: userId, isPrivate: true };
  } catch (error) {
    console.error('Error creating private room:', error);
    throw error;
  }
}

/**
 * Get user's primary room
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Room object or null
 */
async function getUserRoom(userId) {
  try {
    return await roomRepo.getUserPrimaryRoom(userId);
  } catch (error) {
    console.error('Error getting user room:', error);
    return null;
  }
}

/**
 * Get room by ID
 * @param {string} roomId - Room ID
 * @returns {Promise<Object|null>} Room object or null
 */
async function getRoom(roomId) {
  try {
    const room = await roomRepo.findById(roomId);
    if (!room) return null;
    return {
      roomId: room.id,
      roomName: room.name,
      isPrivate: room.is_private === 1,
    };
  } catch (error) {
    console.error('Error getting room:', error);
    return null;
  }
}

module.exports = {
  createPrivateRoom,
  getUserRoom,
  getRoom,
};
