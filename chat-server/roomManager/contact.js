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

        // Check if contact already exists by email (unique constraint is on user_id + contact_email)
        // Also check by linked_user_id if column exists
        let existing = [];

        // First check by email (this is what the unique constraint is on)
        if (other.email) {
          try {
            existing = await dbSafe.safeSelect(
              'contacts',
              { user_id: member.user_id, contact_email: other.email },
              { limit: 1 }
            );
          } catch (err) {
            // If contact_email column doesn't exist (shouldn't happen, but be safe)
            console.warn('Error checking contact by email:', err.message);
          }
        }

        // If not found by email, check by linked_user_id if column exists
        if (existing.length === 0) {
          try {
            existing = await dbSafe.safeSelect(
              'contacts',
              { user_id: member.user_id, linked_user_id: other.user_id },
              { limit: 1 }
            );
          } catch (err) {
            // Fallback if linked_user_id column doesn't exist yet
            if (err.message && err.message.includes('linked_user_id')) {
              // Try by name and relationship as last resort
              existing = await dbSafe.safeSelect(
                'contacts',
                {
                  user_id: member.user_id,
                  contact_name: other.first_name || other.display_name || other.username,
                  relationship: 'co-parent',
                },
                { limit: 1 }
              );
            }
            // Ignore other errors - we'll handle duplicate on insert
          }
        }

        // Only insert if contact doesn't exist
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
            // Handle different error cases
            if (err.message && err.message.includes('linked_user_id')) {
              // linked_user_id column doesn't exist, try without it
              delete contactData.linked_user_id;
              await dbSafe.safeInsert('contacts', contactData);
            } else if (err.code === '23505' && err.constraint === 'contacts_user_email_unique') {
              // Duplicate key - contact already exists, this is fine
              console.log(
                `Contact already exists for user ${member.user_id} with email ${other.email}, skipping insert`
              );
            } else {
              // Other error - log but don't throw (non-fatal)
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
