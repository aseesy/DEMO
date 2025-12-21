/**
 * Core Room Management Logic
 */
const dbSafe = require('../dbSafe');
const { generateRoomId, sendWelcomeMessage } = require('./utils');

async function createPrivateRoom(userId, username, sendWelcome = true) {
  const roomId = generateRoomId();
  const roomName = `${username}'s Co-Parenting Room`;
  const now = new Date().toISOString();

  try {
    await dbSafe.safeInsert('rooms', {
      id: roomId,
      name: roomName,
      created_by: userId,
      is_private: 1,
      created_at: now,
    });
    await dbSafe.safeInsert('room_members', {
      room_id: roomId,
      user_id: userId,
      role: 'owner',
      joined_at: now,
    });

    if (sendWelcome) {
      const existing = await dbSafe.safeSelect(
        'messages',
        { room_id: roomId, username: 'LiaiZen', type: 'ai_comment' },
        { limit: 1 }
      );
      if (existing.length === 0) await sendWelcomeMessage(roomId);
    }

    return { roomId, roomName, createdBy: userId, isPrivate: true };
  } catch (error) {
    console.error('Error creating private room:', error);
    throw error;
  }
}

async function getUserRoom(userId) {
  try {
    const query = `
      SELECT rm.room_id, r.name as room_name, 
             (SELECT COUNT(*) FROM room_members rm2 WHERE rm2.room_id = rm.room_id) as member_count
      FROM room_members rm
      JOIN rooms r ON rm.room_id = r.id
      WHERE rm.user_id = $1
      ORDER BY member_count DESC, rm.joined_at ASC
      LIMIT 1
    `;
    const result = await require('../dbPostgres').query(query, [userId]);
    if (result.rows.length === 0) return null;
    return {
      roomId: result.rows[0].room_id,
      roomName: result.rows[0].room_name,
      memberCount: parseInt(result.rows[0].member_count),
    };
  } catch (error) {
    console.error('Error getting user room:', error);
    return null;
  }
}

async function getRoom(roomId) {
  const result = await dbSafe.safeSelect('rooms', { id: roomId }, { limit: 1 });
  if (result.length === 0) return null;
  return { roomId: result[0].id, roomName: result[0].name, isPrivate: result[0].is_private === 1 };
}

module.exports = {
  createPrivateRoom,
  getUserRoom,
  getRoom,
};
