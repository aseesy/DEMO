/**
 * Room Member Management Logic
 */
const dbSafe = require('../dbSafe');
const neo4jClient = require('../src/utils/neo4jClient');

async function getRoomMembers(roomId) {
  try {
    const query = `
      SELECT rm.user_id, u.username, u.display_name, u.first_name, rm.role, rm.joined_at
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = $1
    `;
    const result = await require('../dbPostgres').query(query, [roomId]);
    return result.rows.map(row => ({
      userId: row.user_id,
      username: row.username,
      displayName: row.first_name || row.display_name || row.username,
      role: row.role,
      joinedAt: row.joined_at,
    }));
  } catch (error) {
    console.error('Error getting room members:', error);
    return [];
  }
}

async function addUserToRoom(roomId, userId, role = 'member') {
  const now = new Date().toISOString();
  try {
    const existing = await dbSafe.safeSelect(
      'room_members',
      { room_id: roomId, user_id: userId },
      { limit: 1 }
    );
    if (existing.length > 0) return;

    const membersBefore = await getRoomMembers(roomId);
    await dbSafe.safeInsert('room_members', {
      room_id: roomId,
      user_id: userId,
      role,
      joined_at: now,
    });

    if (membersBefore.length === 1) {
      const room = await dbSafe.safeSelect('rooms', { id: roomId }, { limit: 1 });
      if (room.length > 0) {
        neo4jClient
          .createCoParentRelationship(membersBefore[0].userId, userId, roomId, room[0].name)
          .catch(() => {});
      }
    }
  } catch (error) {
    console.error('Error adding user to room:', error);
    throw error;
  }
}

async function removeUserFromRoom(roomId, userId) {
  try {
    await require('../dbPostgres').query(
      'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );
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
