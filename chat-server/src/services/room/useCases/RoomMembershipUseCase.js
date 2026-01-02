/**
 * Room Membership Use Case
 *
 * Single Responsibility: Verify room membership and get member information.
 *
 * Handles:
 * - Checking if user is in a shared room
 * - Getting room member count
 * - Verifying room membership status
 *
 * Architecture: Use Case Pattern - encapsulates business logic for membership operations.
 */

const pairingManager = require('../../../../libs/pairing-manager');

/**
 * Check if room has multiple members
 *
 * @param {Object} params - Use case parameters
 * @param {number} params.userId - User ID
 * @param {string} params.username - Username for logging
 * @param {Object} params.roomManager - Room manager service
 * @param {Object} params.db - Database connection
 * @returns {Promise<Object>} { hasMultipleMembers, memberCount }
 */
async function checkRoomMembers({ userId, username, roomManager, db }) {
  if (!userId) {
    throw new Error('RoomMembershipUseCase: userId is required');
  }
  if (!roomManager) {
    throw new Error('RoomMembershipUseCase: roomManager is required');
  }

  let roomId = null;

  // First check if user has an active pairing with shared_room_id
  // Uses user_pairing_status VIEW internally for consistent pairing-based room lookup
  try {
    const activePairing = await pairingManager.getActivePairing(userId, db);
    if (activePairing && activePairing.shared_room_id) {
      roomId = activePairing.shared_room_id;
      console.log(
        `[RoomMembershipUseCase] User ${username} has active pairing, using shared room: ${roomId}`
      );
    }
  } catch (pairingError) {
    console.error(`[RoomMembershipUseCase] Error checking pairing for ${userId}:`, pairingError);
  }

  // Fallback: get user's room the traditional way
  if (!roomId) {
    try {
      const room = await roomManager.getUserRoom(userId);
      roomId = room?.roomId;
    } catch (roomError) {
      console.error(`[RoomMembershipUseCase] Error getting user room for ${userId}:`, roomError);
      return { hasMultipleMembers: false, memberCount: 0 };
    }
  }

  if (!roomId) {
    return { hasMultipleMembers: false, memberCount: 0 };
  }

  // Get room members
  let members = [];
  try {
    members = await roomManager.getRoomMembers(roomId);
  } catch (membersError) {
    console.error(
      `[RoomMembershipUseCase] Error getting room members for ${roomId}:`,
      membersError
    );
    return { hasMultipleMembers: false, memberCount: 0 };
  }

  return {
    hasMultipleMembers: members && members.length >= 2,
    memberCount: members ? members.length : 0,
  };
}

/**
 * Check if user is in a shared room
 *
 * @param {Object} params - Use case parameters
 * @param {number} params.userId - User ID
 * @param {Object} params.roomRepository - Room repository
 * @returns {Promise<Object>} { isShared: boolean }
 */
async function checkSharedRoom({ userId, roomRepository }) {
  if (!userId) {
    throw new Error('RoomMembershipUseCase: userId is required');
  }
  if (!roomRepository) {
    throw new Error('RoomMembershipUseCase: roomRepository is required');
  }

  const sharedRooms = await roomRepository.findSharedRooms(parseInt(userId));
  return { isShared: sharedRooms.length > 0 };
}

module.exports = {
  checkRoomMembers,
  checkSharedRoom,
};
