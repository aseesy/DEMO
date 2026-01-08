/**
 * Room Membership Verification
 *
 * Verifies user is a member of a room.
 */

const { defaultLogger } = require('../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'roomMembership',
});

/**
 * Verify user is a member of the room they're trying to interact with
 * @param {string} userId - User ID
 * @param {string} roomId - Room ID
 * @param {Object} dbSafe - Database connection
 * @returns {Promise<boolean>}
 */
async function verifyRoomMembership(userId, roomId, dbSafe) {
  if (!userId || !roomId || !dbSafe) {
    return false;
  }

  try {
    const result = await dbSafe.safeSelect(
      'room_members',
      { user_id: userId, room_id: roomId },
      { limit: 1 }
    );
    const members = dbSafe.parseResult(result);
    return members.length > 0;
  } catch (err) {
    logger.error('[Room Membership] Verification error', {
      err: err,
    });
    return false;
  }
}

module.exports = {
  verifyRoomMembership,
};
