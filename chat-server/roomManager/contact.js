/**
 * Room-related Contact Logic
 */
const dbSafe = require('../dbSafe');
const dbPostgres = require('../dbPostgres');

/**
 * Ensure contacts exist for all room members
 * Creates bidirectional co-parent contacts if they don't already exist
 *
 * @param {string} roomId - Room ID
 */
async function ensureContactsForRoomMembers(roomId) {
  try {
    const query = `
      SELECT rm.user_id, u.username, u.display_name, u.first_name, u.email
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = $1
    `;
    const result = await dbPostgres.query(query, [roomId]);
    const members = result.rows;

    if (members.length < 2) return;

    for (const member of members) {
      for (const other of members) {
        if (member.user_id === other.user_id) continue;

        // Check if contact already exists by email (unique constraint is on user_id + contact_email)
        const existing = await dbSafe.safeSelect(
          'contacts',
          { user_id: member.user_id, contact_email: other.email },
          { limit: 1 }
        );

        // Only insert if contact doesn't exist
        if (existing.length === 0) {
          const contactData = {
            user_id: member.user_id,
            contact_name: other.first_name || other.display_name || other.username,
            contact_email: other.email,
            relationship: 'co-parent',
            created_at: new Date().toISOString(),
          };

          // Add linked_user_id if available (migration 021 adds this column)
          // If column doesn't exist yet, dbSafe will handle it gracefully
          contactData.linked_user_id = other.user_id;

          try {
            await dbSafe.safeInsert('contacts', contactData);
          } catch (err) {
            // Handle duplicate key violation (race condition or concurrent requests)
            if (err.code === '23505' && err.constraint === 'contacts_user_email_unique') {
              // Contact already exists - this is fine, just skip
              // This can happen due to race conditions or concurrent requests
            } else {
              // For other errors (like missing column), log but don't throw
              // Migration 021 will add linked_user_id column, but until then this is non-fatal
              console.warn(`Error inserting contact (non-fatal):`, err.message);
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
