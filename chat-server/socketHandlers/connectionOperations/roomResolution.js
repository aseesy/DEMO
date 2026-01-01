/**
 * Room Resolution Operations
 *
 * Handles room lookup and resolution for users.
 */

const pairingManager = require('../../libs/pairing-manager');

/**
 * Room resolution result
 * @typedef {Object} RoomResolution
 * @property {string} roomId
 * @property {string} roomName
 */

/**
 * Get user's existing room (pure lookup - no side effects)
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 * Uses user_pairing_status VIEW via pairingManager.getActivePairing() for consistent room lookup.
 *
 * @param {Object} user - User object with id
 * @param {string} cleanEmail - User email for logging
 * @param {Object} dbPostgres - Database connection
 * @param {Object} roomManager - Room manager service
 * @returns {Promise<RoomResolution|null>} Room info or null if no room exists
 */
async function getExistingUserRoom(user, cleanEmail, dbPostgres, roomManager) {
  // First check if user has an active pairing with shared_room_id
  // Uses user_pairing_status VIEW internally for consistent pairing-based room lookup
  const activePairing = await pairingManager.getActivePairing(user.id, dbPostgres);

  if (activePairing && activePairing.shared_room_id) {
    const roomId = activePairing.shared_room_id;
    console.log(`[join] User ${cleanEmail} has active pairing, using shared room: ${roomId}`);

    const roomResult = await dbPostgres.query('SELECT name FROM rooms WHERE id = $1', [roomId]);
    const roomName = roomResult.rows[0]?.name || 'Co-Parenting Room';

    return { roomId, roomName };
  }

  // Check for existing room membership
  const existingRoom = await roomManager.getUserRoom(user.id);

  if (existingRoom) {
    console.log(`[join] User ${cleanEmail} has existing room: ${existingRoom.roomId}`);
    return { roomId: existingRoom.roomId, roomName: existingRoom.roomName };
  }

  return null;
}

/**
 * Resolve or create user's room
 * SIDE EFFECT: May create a new room if none exists
 *
 * @param {Object} user - User object with id
 * @param {string} cleanEmail - Email for logging
 * @param {Object} dbPostgres - Database connection
 * @param {Object} roomManager - Room manager service
 * @returns {Promise<RoomResolution|null>}
 */
async function resolveOrCreateUserRoom(user, cleanEmail, dbPostgres, roomManager) {
  // Try to get existing room first (pure lookup)
  const existingRoom = await getExistingUserRoom(user, cleanEmail, dbPostgres, roomManager);

  if (existingRoom) {
    return existingRoom;
  }

  // No room found - users should not have personal rooms
  // They must be connected to a co-parent to have a room
  console.log(`[join] User ${cleanEmail} has no room. Users must be connected to a co-parent.`);
  return null;
}

/**
 * @deprecated Use getExistingUserRoom() for pure lookup or resolveOrCreateUserRoom() for creation
 */
async function resolveUserRoom(user, cleanEmail, dbPostgres, roomManager) {
  return resolveOrCreateUserRoom(user, cleanEmail, dbPostgres, roomManager);
}

module.exports = {
  getExistingUserRoom,
  resolveOrCreateUserRoom,
  resolveUserRoom,
  // Deprecated alias
  findUserRoom: getExistingUserRoom,
};
