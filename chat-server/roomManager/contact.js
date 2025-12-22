/**
 * Room-related Contact Logic
 *
 * Applies Clean Code principles:
 * - Single Responsibility: Each function has one clear purpose
 * - Repository Pattern: Database details hidden behind repository interface
 * - Fail Fast: Optimized to reduce N^2 complexity where possible
 */
const dbPostgres = require('../dbPostgres');
const {
  PostgresContactRepository,
} = require('../src/repositories/postgres/PostgresContactRepository');

// Repository instance - encapsulates all database access
const contactRepo = new PostgresContactRepository();

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
 * Build contact data for a member-other pair
 * @param {Object} member - Member creating the contact
 * @param {Object} other - Other member to create contact for
 * @returns {Object} Contact data object
 */
function buildContactData(member, other) {
  return {
    user_id: member.user_id,
    contact_name: other.first_name || other.display_name || other.username,
    contact_email: other.email,
    relationship: 'co-parent',
    created_at: new Date().toISOString(),
    linked_user_id: other.user_id,
  };
}

/**
 * Sync contacts between two users
 * Creates bidirectional co-parent contacts if they don't already exist
 *
 * This function encapsulates the "sync two users" logic, making it:
 * - Testable in isolation
 * - Reusable
 * - Clear in intent
 *
 * @param {Object} member - First member
 * @param {Object} other - Second member
 * @param {Set<string>} existingContactKeys - Set of existing contact keys (userId:email)
 * @returns {Promise<void>}
 */
async function syncContactsBetweenUsers(member, other, existingContactKeys) {
  // Skip self-referential contacts
  if (member.user_id === other.user_id) return;

  // Check if contact already exists (using pre-fetched set for O(1) lookup)
  const contactKey = `${member.user_id}:${other.email}`;
  if (existingContactKeys.has(contactKey)) return;

  // Create contact (repository handles duplicate key errors gracefully)
  const contactData = buildContactData(member, other);
  await contactRepo.createOrIgnore(contactData);
}

/**
 * Build a set of existing contact keys for efficient lookup
 * Format: "userId:email" -> allows O(1) existence checks
 *
 * This optimizes the N^2 loop by pre-fetching all existing contacts
 * instead of querying for each pair individually.
 *
 * @param {Array} members - Array of room members
 * @returns {Promise<Set<string>>} Set of contact keys
 */
async function buildExistingContactKeys(members) {
  const userIds = members.map(m => m.user_id);
  const existingKeys = new Set();

  // Batch fetch all existing contacts for all members
  // This is O(N) instead of O(N^2) queries
  for (const userId of userIds) {
    const contacts = await contactRepo.findByUserId(userId);
    for (const contact of contacts) {
      if (contact.contact_email) {
        existingKeys.add(`${userId}:${contact.contact_email}`);
      }
    }
  }

  return existingKeys;
}

/**
 * Ensure contacts exist for all room members
 * Creates bidirectional co-parent contacts if they don't already exist
 *
 * Optimizations:
 * - Pre-fetches existing contacts to avoid N^2 queries
 * - Isolates O(N^2) loop to member iteration only (not database queries)
 * - Uses repository pattern to hide database implementation details
 *
 * @param {string} roomId - Room ID
 */
async function ensureContactsForRoomMembers(roomId) {
  try {
    const members = await getRoomMembers(roomId);
    if (members.length < 2) return;

    // Fail fast: Pre-fetch existing contacts to optimize the loop
    // This reduces from O(N^2) database queries to O(N) queries
    const existingContactKeys = await buildExistingContactKeys(members);

    // O(N^2) loop for member pairs, but O(1) contact existence checks
    for (const member of members) {
      for (const other of members) {
        await syncContactsBetweenUsers(member, other, existingContactKeys);
      }
    }
  } catch (error) {
    console.error('Error ensuring contacts:', error);
  }
}

module.exports = { ensureContactsForRoomMembers };
