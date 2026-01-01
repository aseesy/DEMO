/**
 * Connection Acceptance
 *
 * Handles accepting pending connections and creating co-parent relationships.
 */

const dbPostgres = require('../dbPostgres');
const dbSafe = require('../dbSafe');
const roomManager = require('../roomManager');
const { validateConnectionToken } = require('./tokenService');

/**
 * Accept a pending connection and create the co-parent relationship
 * This creates a connection by adding both users to each other's rooms
 * @param {string} token - Connection token
 * @param {number} userId - User ID of the person accepting
 * @returns {Promise<Object>} Success result with room IDs
 */
async function acceptPendingConnection(token, userId) {
  const connection = await validateConnectionToken(token);
  if (!connection) {
    throw new Error('Invalid or expired invitation token');
  }

  const now = new Date().toISOString();

  try {
    // Get inviter's room
    const inviterRoom = await roomManager.getUserRoom(connection.inviterId);
    if (!inviterRoom) {
      throw new Error('Inviter does not have a room');
    }

    // Get invitee's room (may not exist yet for new users)
    let inviteeRoom = await roomManager.getUserRoom(userId);

    // Add invitee to inviter's room (if not already a member) using safe queries
    const existingMember = await dbSafe.safeSelect(
      'room_members',
      {
        room_id: inviterRoom.roomId,
        user_id: userId,
      },
      { limit: 1 }
    );

    if (dbSafe.parseResult(existingMember).length === 0) {
      await dbSafe.safeInsert('room_members', {
        room_id: inviterRoom.roomId,
        user_id: userId,
        role: 'member',
        joined_at: now,
      });
    }

    // If invitee has a room, add inviter to invitee's room
    if (inviteeRoom) {
      const inviterExisting = await dbSafe.safeSelect(
        'room_members',
        {
          room_id: inviteeRoom.roomId,
          user_id: connection.inviterId,
        },
        { limit: 1 }
      );

      if (dbSafe.parseResult(inviterExisting).length === 0) {
        await dbSafe.safeInsert('room_members', {
          room_id: inviteeRoom.roomId,
          user_id: connection.inviterId,
          role: 'member',
          joined_at: now,
        });
      }
    }

    // Mark connection as accepted using safe update
    await dbSafe.safeUpdate(
      'pending_connections',
      {
        status: 'accepted',
        accepted_at: now,
      },
      { token: token }
    );

    // Create co-parent contacts for both users
    await createCoParentContacts(connection, userId, now);

    return {
      success: true,
      inviterRoom: inviterRoom.roomId,
      inviteeRoom: inviteeRoom ? inviteeRoom.roomId : null,
    };
  } catch (error) {
    console.error('Error accepting pending connection:', error);
    throw error;
  }
}

/**
 * Create co-parent contacts for both users in a connection
 * @param {Object} connection - Connection object with inviterId and inviteeEmail
 * @param {number} inviteeUserId - User ID of the invitee
 * @param {string} now - Current timestamp
 */
async function createCoParentContacts(connection, inviteeUserId, now) {
  try {
    // Get inviter user info (include first_name for contact name)
    const inviterResult = await dbPostgres.query(
      'SELECT id, email, username, first_name, last_name, display_name FROM users WHERE id = $1 LIMIT 1',
      [connection.inviterId]
    );
    const inviterUsers = inviterResult.rows;

    // Get invitee user info (include first_name for contact name)
    const inviteeResult = await dbPostgres.query(
      'SELECT id, email, username, first_name, last_name, display_name FROM users WHERE id = $1 LIMIT 1',
      [inviteeUserId]
    );
    const inviteeUsers = inviteeResult.rows;

    if (inviterUsers.length > 0 && inviteeUsers.length > 0) {
      const inviter = inviterUsers[0];
      const invitee = inviteeUsers[0];

      // Get display name: first_name preferred, fallback to display_name, then email
      const inviteeDisplayName =
        invitee.first_name || invitee.display_name || invitee.email?.split('@')[0] || 'Unknown';
      const inviterDisplayName =
        inviter.first_name || inviter.display_name || inviter.email?.split('@')[0] || 'Unknown';

      // Create contact for inviter (invitee is their co-parent)
      await createContactIfNotExists(
        connection.inviterId,
        inviteeUserId,
        inviteeDisplayName,
        invitee.email || connection.inviteeEmail,
        now
      );

      // Create contact for invitee (inviter is their co-parent)
      await createContactIfNotExists(
        inviteeUserId,
        connection.inviterId,
        inviterDisplayName,
        inviter.email,
        now
      );
    }
  } catch (contactError) {
    // Log error but don't fail the connection if contact creation fails
    console.error('Error creating co-parent contacts:', contactError);
  }
}

/**
 * Create a co-parent contact if one doesn't already exist
 * @param {number} userId - User who will own the contact
 * @param {number} linkedUserId - User being linked as contact
 * @param {string} displayName - Display name for the contact
 * @param {string} email - Email for the contact
 * @param {string} now - Current timestamp
 */
async function createContactIfNotExists(userId, linkedUserId, displayName, email, now) {
  // Check if contact already exists for user (by name)
  const contactCheck = await dbSafe.safeSelect(
    'contacts',
    {
      user_id: userId,
      contact_name: displayName,
    },
    { limit: 1 }
  );

  const contacts = dbSafe.parseResult(contactCheck);
  const hasContact = contacts.length > 0 && contacts.some(c => c.relationship === 'co-parent');

  if (!hasContact) {
    await dbSafe.safeInsert('contacts', {
      user_id: userId,
      contact_name: displayName,
      contact_email: email || null,
      relationship: 'co-parent',
      linked_user_id: linkedUserId, // Link to actual user for AI context
      notes: `Connected via invitation on ${new Date().toLocaleDateString()}`,
      separation_date: null,
      address: null,
      difficult_aspects: null,
      friction_situations: null,
      legal_matters: null,
      safety_concerns: null,
      substance_mental_health: null,
      neglect_abuse_concerns: null,
      additional_thoughts: null,
      created_at: now,
      updated_at: now,
    });
    console.log(
      `[ConnectionManager] Created co-parent contact for user ${userId}: ${displayName} (linked_user_id: ${linkedUserId})`
    );
  }
}

module.exports = {
  acceptPendingConnection,
  createCoParentContacts,
  createContactIfNotExists,
};
