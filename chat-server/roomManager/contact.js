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

        // Check if linked_user_id column exists before using it
        let existing;
        try {
          existing = await dbSafe.safeSelect(
            'contacts',
            { user_id: member.user_id, linked_user_id: other.user_id },
            { limit: 1 }
          );
        } catch (err) {
          // Fallback if linked_user_id column doesn't exist yet
          if (err.message && err.message.includes('linked_user_id')) {
            existing = await dbSafe.safeSelect(
              'contacts',
              {
                user_id: member.user_id,
                contact_name: other.first_name || other.display_name || other.username,
                relationship: 'co-parent',
              },
              { limit: 1 }
            );
          } else {
            throw err;
          }
        }

        if (existing.length === 0) {
          const contactData = {
            user_id: member.user_id,
            contact_name: other.first_name || other.display_name || other.username,
            contact_email: other.email,
            relationship: 'co-parent',
            created_at: new Date().toISOString(),
          };

          // Only add linked_user_id if column exists
          try {
            // Try to insert with linked_user_id
            contactData.linked_user_id = other.user_id;
            await dbSafe.safeInsert('contacts', contactData);
          } catch (err) {
            // If linked_user_id column doesn't exist, insert without it
            if (err.message && err.message.includes('linked_user_id')) {
              delete contactData.linked_user_id;
              await dbSafe.safeInsert('contacts', contactData);
            } else {
              throw err;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring contacts:', error);
  }
}

module.exports = { ensureContactsForRoomMembers };
