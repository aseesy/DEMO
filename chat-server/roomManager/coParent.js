/**
 * Co-Parent Specific Room Logic
 */
const dbSafe = require('../dbSafe');
const neo4jClient = require('../src/utils/neo4jClient');
const { generateRoomId, sendWelcomeMessage } = require('./utils');

async function createCoParentRoom(inviterId, inviteeId, inviterName, inviteeName) {
  const roomId = generateRoomId();
  const roomName = `${inviterName} & ${inviteeName}`;
  const now = new Date().toISOString();

  try {
    await dbSafe.safeInsert('rooms', {
      id: roomId,
      name: roomName,
      created_by: inviterId,
      is_private: 1,
      created_at: now,
    });
    await dbSafe.safeInsert('room_members', {
      room_id: roomId,
      user_id: inviterId,
      role: 'owner',
      joined_at: now,
    });
    await dbSafe.safeInsert('room_members', {
      room_id: roomId,
      user_id: inviteeId,
      role: 'member',
      joined_at: now,
    });

    await sendWelcomeMessage(roomId);
    neo4jClient.createCoParentRelationship(inviterId, inviteeId, roomId, roomName).catch(() => {});

    return { roomId, roomName, members: [inviterId, inviteeId] };
  } catch (error) {
    console.error('Error creating co-parent room:', error);
    throw error;
  }
}

module.exports = { createCoParentRoom };
