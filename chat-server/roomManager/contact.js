/**
 * Room-related Contact Logic
 */
const dbSafe = require('../dbSafe');
const dbPostgres = require('../dbPostgres');

/**
 * Get all members of a room with their user details
 * @param {string} roomId - Room ID
 * @returns {Promise<Array>} Array of member objects
 */
async function getRoomMembers(roomId) {
  const query = `
    SELECT rm.user_id, u.username, u.display_name, u.first_name, u.email
    FROM room_members rm
    JOIN users u ON rm.user_id = u.id
    WHERE rm.room_id = $1
  `;
  const result = await dbPostgres.query(query, [roomId]);
  return result.rows;
}

/**
 * Check if a contact already exists for a user
 * @param {number} userId - User ID
 * @param {string} contactEmail - Contact email
 * @returns {Promise<boolean>} True if contact exists
 */
async function contactExists(userId, contactEmail) {
  const existing = await dbSafe.safeSelect(
    'contacts',
    { user_id: userId, contact_email: contactEmail },
    { limit: 1 }
  );
  return existing.length > 0;
}

/**
 * Check if an error is a duplicate key violation
 * @param {Error} error - Database error
 * @returns {boolean} True if error is a duplicate key violation
 */
function isDuplicateKeyError(error) {
  return error?.code === '23505';
}

/**
 * Create a contact between two users
 * Handles errors gracefully - duplicate keys are ignored, other errors are logged
 * @param {Object} member - Member creating the contact
 * @param {Object} other - Other member to create contact for
 * @returns {Promise<boolean>} True if contact was created, false otherwise
 */
async function createContact(member, other) {
  const contactData = {
    user_id: member.user_id,
    contact_name: other.first_name || other.display_name || other.username,
    contact_email: other.email,
    relationship: 'co-parent',
    created_at: new Date().toISOString(),
    linked_user_id: other.user_id,
  };

  try {
    await dbSafe.safeInsert('contacts', contactData);
    return true;
  } catch (error) {
    // Duplicate key violations are expected (race conditions, concurrent requests)
    if (isDuplicateKeyError(error)) {
      return false;
    }
    // Other errors (schema issues, etc.) are logged but non-fatal
    console.warn(`Error inserting contact (non-fatal):`, error.message);
    return false;
  }
}

/**
 * Ensure contacts exist for all room members
 * Creates bidirectional co-parent contacts if they don't already exist
 *
 * @param {string} roomId - Room ID
 */
async function ensureContactsForRoomMembers(roomId) {
  try {
    const members = await getRoomMembers(roomId);
    if (members.length < 2) return;

    for (const member of members) {
      for (const other of members) {
        if (member.user_id === other.user_id) continue;
        if (await contactExists(member.user_id, other.email)) continue;

        await createContact(member, other);
      }
    }
  } catch (error) {
    console.error('Error ensuring contacts:', error);
  }
}

module.exports = { ensureContactsForRoomMembers };
