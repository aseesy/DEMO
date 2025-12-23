/**
 * Co-Parent Specific Room Logic
 *
 * Applies Clean Code principles:
 * - Single Responsibility: Each function has one clear purpose
 * - Repository Pattern: Database details hidden behind repository interface
 * - Proper Error Handling: Neo4j sync is awaited and errors are logged (not silently ignored)
 * - Data Consistency: All operations are properly tracked, even if Neo4j is optional
 */
const { PostgresRoomRepository } = require('../src/repositories/postgres/PostgresRoomRepository');
const neo4jClient = require('../src/infrastructure/database/neo4jClient');
const { generateRoomId, sendWelcomeMessage } = require('./utils');

// Repository instance - encapsulates all database access
const roomRepo = new PostgresRoomRepository();

/**
 * Sync co-parent relationship to Neo4j graph database
 * This is optional (Neo4j may not be configured), but we await it to ensure:
 * - Errors are logged (not silently ignored)
 * - We have visibility into data consistency issues
 * - The operation completes before returning
 *
 * @param {number} inviterId - Inviter user ID
 * @param {number} inviteeId - Invitee user ID
 * @param {string} roomId - Room ID
 * @param {string} roomName - Room name
 * @returns {Promise<void>}
 */
async function syncCoParentRelationshipToNeo4j(inviterId, inviteeId, roomId, roomName) {
  try {
    const result = await neo4jClient.createCoParentRelationship(
      inviterId,
      inviteeId,
      roomId,
      roomName
    );

    if (result === null) {
      // Neo4j not configured - this is expected and fine
      return;
    }

    // Success - relationship created in Neo4j
    // Logging is handled by createCoParentRelationship itself
  } catch (error) {
    // Neo4j sync failed - log but don't fail the entire operation
    // This ensures PostgreSQL remains the source of truth
    console.warn(`⚠️  Failed to sync co-parent relationship to Neo4j (non-fatal):`, error.message);
    // Don't throw - Neo4j is optional, PostgreSQL is the source of truth
  }
}

/**
 * Create room and member records
 * Uses repository to hide SQL implementation details
 * @param {string} roomId - Room ID
 * @param {string} roomName - Room name
 * @param {number} inviterId - Inviter user ID
 * @param {number} inviteeId - Invitee user ID
 * @param {string} now - ISO timestamp
 * @returns {Promise<void>}
 */
async function createRoomAndMembers(roomId, roomName, inviterId, inviteeId, now) {
  // Create room (repository handles SQL)
  await roomRepo.create({
    id: roomId,
    name: roomName,
    created_by: inviterId,
    is_private: 1,
    created_at: now,
  });

  // Add members (repository handles SQL)
  await roomRepo.addMember(roomId, inviterId, 'owner');
  await roomRepo.addMember(roomId, inviteeId, 'member');
}

/**
 * Create a co-parent room with all necessary setup
 * Creates room, members, welcome message, and syncs to Neo4j
 *
 * IDEMPOTENT: If a room already exists between these users, returns the existing room.
 * This prevents duplicate rooms from being created by multiple code paths.
 *
 * @param {number} inviterId - Inviter user ID
 * @param {number} inviteeId - Invitee user ID
 * @param {string} inviterName - Inviter display name
 * @param {string} inviteeName - Invitee display name
 * @returns {Promise<Object>} Created or existing room information
 */
async function createCoParentRoom(inviterId, inviteeId, inviterName, inviteeName) {
  // Check if room already exists between these users (prevents duplicates)
  const existingRoom = await roomRepo.findRoomBetweenUsers(inviterId, inviteeId);
  if (existingRoom) {
    console.log(`📋 Room already exists between users ${inviterId} and ${inviteeId}: ${existingRoom.id}`);
    return {
      roomId: existingRoom.id,
      roomName: existingRoom.name,
      members: [inviterId, inviteeId],
      alreadyExisted: true,
    };
  }

  const roomId = generateRoomId();
  const roomName = `${inviterName} & ${inviteeName}`;
  const now = new Date().toISOString();

  try {
    // Create room and members in PostgreSQL (source of truth)
    await createRoomAndMembers(roomId, roomName, inviterId, inviteeId, now);

    // Send welcome message
    await sendWelcomeMessage(roomId);

    // Sync to Neo4j (optional, but we await it to ensure visibility)
    // This ensures data consistency and proper error logging
    await syncCoParentRelationshipToNeo4j(inviterId, inviteeId, roomId, roomName);

    return { roomId, roomName, members: [inviterId, inviteeId], alreadyExisted: false };
  } catch (error) {
    console.error('Error creating co-parent room:', error);
    throw error;
  }
}

module.exports = { createCoParentRoom };
