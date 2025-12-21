/**
 * Room-related Contact Logic
 */
const dbSafe = require('../dbSafe');

async function ensureContactsForRoomMembers(roomId) {
  try {
    const query = `
      SELECT rm.user_id, u.username, u.display_name, u.first_name, u.email
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = $1
    `;
    const result = await require('../dbPostgres').query(query, [roomId]);
    const members = result.rows;

    if (members.length < 2) return;

    for (const member of members) {
      for (const other of members) {
        if (member.user_id === other.user_id) continue;

        const existing = await dbSafe.safeSelect(
          'contacts',
          { user_id: member.user_id, linked_user_id: other.user_id },
          { limit: 1 }
        );
        if (existing.length === 0) {
          await dbSafe.safeInsert('contacts', {
            user_id: member.user_id,
            contact_name: other.first_name || other.display_name || other.username,
            contact_email: other.email,
            relationship: 'co-parent',
            linked_user_id: other.user_id,
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring contacts:', error);
  }
}

module.exports = { ensureContactsForRoomMembers };
