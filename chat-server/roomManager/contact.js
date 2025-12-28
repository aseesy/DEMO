/**
 * Room-related Contact Logic
 *
 * Applies Clean Code principles:
 * - Single Responsibility: Each function has one clear purpose
 * - Repository Pattern: Database details hidden behind repository interface
 * - Fail Fast: Optimized to reduce N^2 complexity where possible
 *
 * Child Contact Sharing:
 * When one co-parent adds a child contact, it is automatically shared with
 * their co-parent in any connected room. This ensures both parents have
 * access to important child information.
 */
const {
  PostgresContactRepository,
} = require('../src/repositories/postgres/PostgresContactRepository');
const { PostgresRoomRepository } = require('../src/repositories/postgres/PostgresRoomRepository');
const dbSafe = require('../dbSafe');

// Repository instances - encapsulate all database access
const contactRepo = new PostgresContactRepository();
const roomRepo = new PostgresRoomRepository();

/**
 * Get all members of a room with their user details
 * Uses repository to hide SQL implementation details
 * @param {string} roomId - Room ID
 * @returns {Promise<Array>} Array of member objects with user details
 */
async function getRoomMembers(roomId) {
  const members = await roomRepo.getMembersWithDetails(roomId);
  // Map to format expected by contact creation logic
  // Note: displayName from repository already prioritizes first_name
  return members.map(member => ({
    user_id: member.userId,
    username: member.username,
    display_name: member.displayName,
    first_name: member.displayName, // displayName already uses first_name || display_name || username
    email: member.email,
  }));
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

// ============================================================================
// CHILD CONTACT SHARING
// ============================================================================

/**
 * Relationship types that should be shared between co-parents
 */
const SHAREABLE_RELATIONSHIPS = [
  'child',
  'my child',
  'our child',
  'son',
  'daughter',
  'stepchild',
  'step child',
];

/**
 * Check if a relationship type should be shared with co-parents
 * @param {string} relationship - The relationship type
 * @returns {boolean} True if shareable
 */
function isShareableRelationship(relationship) {
  if (!relationship) return false;
  const normalized = relationship.toLowerCase().trim();
  return SHAREABLE_RELATIONSHIPS.some(r => normalized === r || normalized.includes(r));
}

/**
 * Get all rooms where a user is a member (co-parent rooms)
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of room objects
 */
async function getRoomsForUser(userId) {
  try {
    const result = await dbSafe.query(
      `SELECT r.id, r.name
       FROM rooms r
       JOIN room_members rm ON r.id = rm.room_id
       WHERE rm.user_id = $1`,
      [userId]
    );
    return result.rows || [];
  } catch (error) {
    console.error('[Contact] Error getting rooms for user:', error);
    return [];
  }
}

/**
 * Share a child contact with all co-parents in the user's rooms
 *
 * When a parent adds a child contact, this function ensures the contact
 * is also created for their co-parent(s) in any shared rooms.
 *
 * @param {number} userId - User who created the contact
 * @param {Object} childContact - The child contact data
 * @returns {Promise<Array>} Array of created contact IDs for co-parents
 */
async function shareChildContactWithCoParents(userId, childContact) {
  // Validate this is a shareable relationship
  if (!isShareableRelationship(childContact.relationship)) {
    return [];
  }

  const sharedContactIds = [];

  try {
    // Get all rooms the user is in
    const rooms = await getRoomsForUser(userId);

    for (const room of rooms) {
      // Get all members of this room
      const members = await getRoomMembers(room.id);

      // Share with each co-parent (other members in the room)
      for (const member of members) {
        if (member.user_id === userId) continue; // Skip self

        // Check if this co-parent already has this child contact
        // Use contact_name + relationship to identify duplicates
        const existingContacts = await contactRepo.findByUserId(member.user_id);
        const alreadyExists = existingContacts.some(
          c =>
            c.contact_name?.toLowerCase() === childContact.contact_name?.toLowerCase() &&
            isShareableRelationship(c.relationship)
        );

        if (alreadyExists) {
          console.log('[Contact] Child contact already exists for co-parent', {
            coParentId: member.user_id,
            childName: childContact.contact_name,
          });
          continue;
        }

        // Create the shared child contact for co-parent
        const sharedContactData = {
          user_id: member.user_id,
          contact_name: childContact.contact_name,
          contact_email: childContact.contact_email || null,
          relationship: childContact.relationship,
          phone: childContact.phone || null,
          child_age: childContact.child_age || null,
          child_birthdate: childContact.child_birthdate || null,
          school: childContact.school || null,
          custody_arrangement: childContact.custody_arrangement || null,
          shared_from_user_id: userId,
          shared_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          const contactId = await dbSafe.safeInsert('contacts', sharedContactData);
          sharedContactIds.push(contactId);

          console.log('[Contact] ✅ Shared child contact with co-parent', {
            sharedContactId: contactId,
            fromUserId: userId,
            toUserId: member.user_id,
            childName: childContact.contact_name,
            roomId: room.id,
          });
        } catch (insertError) {
          // Handle duplicate key error gracefully
          if (insertError.code === '23505') {
            console.log('[Contact] Contact already exists (duplicate key), skipping');
          } else {
            console.error('[Contact] Error sharing contact:', insertError);
          }
        }
      }
    }
  } catch (error) {
    console.error('[Contact] Error sharing child contact with co-parents:', error);
  }

  return sharedContactIds;
}

/**
 * Sync existing child contacts when a new room is created
 *
 * When co-parents are paired (room created), this function ensures
 * any existing child contacts are shared between them.
 *
 * @param {string} roomId - The newly created room ID
 */
async function syncChildContactsForRoom(roomId) {
  try {
    const members = await getRoomMembers(roomId);
    if (members.length < 2) return;

    console.log('[Contact] Syncing child contacts for room', {
      roomId,
      memberCount: members.length,
    });

    // For each member, share their child contacts with other members
    for (const member of members) {
      const contacts = await contactRepo.findByUserId(member.user_id);
      const childContacts = contacts.filter(c => isShareableRelationship(c.relationship));

      for (const childContact of childContacts) {
        // Share with other room members
        for (const otherMember of members) {
          if (otherMember.user_id === member.user_id) continue;

          // Check if already shared
          const otherContacts = await contactRepo.findByUserId(otherMember.user_id);
          const alreadyExists = otherContacts.some(
            c =>
              c.contact_name?.toLowerCase() === childContact.contact_name?.toLowerCase() &&
              isShareableRelationship(c.relationship)
          );

          if (alreadyExists) continue;

          // Create shared contact
          const sharedContactData = {
            user_id: otherMember.user_id,
            contact_name: childContact.contact_name,
            contact_email: childContact.contact_email || null,
            relationship: childContact.relationship,
            phone: childContact.phone || null,
            child_age: childContact.child_age || null,
            child_birthdate: childContact.child_birthdate || null,
            school: childContact.school || null,
            custody_arrangement: childContact.custody_arrangement || null,
            shared_from_user_id: member.user_id,
            shared_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          try {
            await dbSafe.safeInsert('contacts', sharedContactData);
            console.log('[Contact] ✅ Synced child contact on room creation', {
              childName: childContact.contact_name,
              fromUser: member.user_id,
              toUser: otherMember.user_id,
            });
          } catch (insertError) {
            if (insertError.code !== '23505') {
              console.error('[Contact] Error syncing child contact:', insertError);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[Contact] Error syncing child contacts for room:', error);
  }
}

module.exports = {
  ensureContactsForRoomMembers,
  shareChildContactWithCoParents,
  syncChildContactsForRoom,
  isShareableRelationship,
};
