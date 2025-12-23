/**
 * Room Member Management Logic
 *
 * Applies Clean Code principles:
 * - Single Responsibility: Each function has one clear purpose
 * - Repository Pattern: Database details hidden behind repository interface
 * - Proper Error Handling: Neo4j sync is awaited and errors are logged
 */
const { PostgresRoomRepository } = require('../src/repositories/postgres/PostgresRoomRepository');
const neo4jClient = require('../src/infrastructure/database/neo4jClient');

// Repository instance - encapsulates all database access
const roomRepo = new PostgresRoomRepository();

/**
 * Sync co-parent relationship to Neo4j when second member joins
 * @param {Array} membersBefore - Members before adding new user
 * @param {number} newUserId - New user ID being added
 * @param {string} roomId - Room ID
 * @returns {Promise<void>}
 */
async function syncCoParentRelationshipToNeo4j(membersBefore, newUserId, roomId) {
  // Only sync if this is the second member (creating a co-parent relationship)
  if (membersBefore.length !== 1) return;

  try {
    const room = await roomRepo.findById(roomId);
    if (!room) return;

    const result = await neo4jClient.createCoParentRelationship(
      membersBefore[0].userId,
      newUserId,
      roomId,
      room.name
    );

    if (result === null) {
      // Neo4j not configured - this is expected and fine
      return;
    }

    // Success - relationship created in Neo4j
    // Logging is handled by createCoParentRelationship itself
  } catch (error) {
    // Neo4j sync failed - log but don't fail the entire operation
    console.warn(`⚠️  Failed to sync co-parent relationship to Neo4j (non-fatal):`, error.message);
    // Don't throw - Neo4j is optional, PostgreSQL is the source of truth
  }
}

/**
 * Get room members with user details
 * @param {string} roomId - Room ID
 * @returns {Promise<Array>} Array of member objects
 */
async function getRoomMembers(roomId) {
  try {
    return await roomRepo.getMembersWithDetails(roomId);
  } catch (error) {
    console.error('Error getting room members:', error);
    return [];
  }
}

/**
 * Add user to room
 * @param {string} roomId - Room ID
 * @param {number} userId - User ID
 * @param {string} role - Member role
 * @returns {Promise<void>}
 */
async function addUserToRoom(roomId, userId, role = 'member') {
  try {
    // Check if member already exists (repository handles SQL)
    const exists = await roomRepo.memberExists(roomId, userId);
    if (exists) return;

    // Get members before adding (to check if this creates a co-parent relationship)
    const membersBefore = await getRoomMembers(roomId);

    // Add member (repository handles SQL)
    await roomRepo.addMember(roomId, userId, role);

    // Sync to Neo4j if this creates a co-parent relationship
    await syncCoParentRelationshipToNeo4j(membersBefore, userId, roomId);
  } catch (error) {
    console.error('Error adding user to room:', error);
    throw error;
  }
}

/**
 * Remove user from room
 * @param {string} roomId - Room ID
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function removeUserFromRoom(roomId, userId) {
  try {
    await roomRepo.removeMember(roomId, userId);
  } catch (error) {
    console.error('Error removing user from room:', error);
    throw error;
  }
}

module.exports = {
  getRoomMembers,
  addUserToRoom,
  removeUserFromRoom,
};
