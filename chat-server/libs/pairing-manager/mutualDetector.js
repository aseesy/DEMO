/**
 * Mutual Invitation Detector
 *
 * Detects and handles cases where both co-parents invite each other,
 * automatically completing the pairing without requiring manual acceptance.
 *
 * Feature: 004-account-pairing-refactor
 * Constitutional Compliance:
 *   - Principle I (Library-First): Standalone module
 *   - Principle XV (Conflict Reduction): Reduces friction in pairing
 */

const { PAIRING_STATUS, logPairingAction } = require('./pairingCreator');

/**
 * Check if a mutual invitation exists
 * Called when User A invites User B - checks if User B already invited User A
 *
 * @param {object} params - Check parameters
 * @param {string} params.initiatorId - User A's ID (creating new invitation)
 * @param {string} params.initiatorEmail - User A's email
 * @param {string} params.inviteeEmail - User B's email (being invited)
 * @param {object} db - Database connection
 * @returns {Promise<object|null>} Mutual invitation if found, null otherwise
 */
async function checkMutualInvitation(params, db) {
  const { initiatorId, initiatorEmail, inviteeEmail } = params;

  if (!initiatorId || !inviteeEmail || !db) {
    return null;
  }

  // Look for a pending invitation FROM the invitee TO the initiator
  // This would mean both parties want to connect
  const result = await db.query(
    `SELECT ps.*, u.username as inviter_username, u.email as inviter_email
     FROM pairing_sessions ps
     JOIN users u ON ps.parent_a_id = u.id
     WHERE ps.status = $1
       AND ps.expires_at > CURRENT_TIMESTAMP
       AND (
         -- Check if invitee (by email) has a pending invite to initiator (by email)
         (LOWER(u.email) = LOWER($2) AND LOWER(ps.parent_b_email) = LOWER($3))
         OR
         -- Check if invitee (by user ID from their email) has invited initiator
         (ps.parent_a_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER($2))
          AND LOWER(ps.parent_b_email) = LOWER($3))
       )`,
    [PAIRING_STATUS.PENDING, inviteeEmail, initiatorEmail]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return null;
}

/**
 * Auto-complete a mutual pairing
 * When both users have invited each other, skip acceptance and pair immediately
 *
 * @param {object} params - Pairing parameters
 * @param {object} params.existingPairing - The existing pending invitation from User B
 * @param {string} params.userAId - User A's ID (the one creating the new invitation)
 * @param {string} params.userBId - User B's ID (from the existing invitation)
 * @param {object} db - Database connection
 * @param {object} roomManager - Room manager for creating shared room
 * @returns {Promise<object>} Completed pairing result
 */
async function autoCompleteMutualPairing(params, db, roomManager) {
  const { existingPairing, userAId, userBId } = params;

  if (!existingPairing || !userAId || !db) {
    throw new Error('existingPairing, userAId, and db are required');
  }

  // Determine actual user IDs
  const parentAId = existingPairing.parent_a_id; // User B (original inviter)
  const parentBId = userAId; // User A (who just tried to invite B)

  // Get user info for both parties
  const [userAResult, userBResult] = await Promise.all([
    db.query('SELECT id, username, email, first_name, display_name FROM users WHERE id = $1', [
      parentBId,
    ]),
    db.query('SELECT id, username, email, first_name, display_name FROM users WHERE id = $1', [
      parentAId,
    ]),
  ]);

  if (userAResult.rows.length === 0 || userBResult.rows.length === 0) {
    throw new Error('Could not find user information for mutual pairing');
  }

  const userA = userAResult.rows[0];
  const userB = userBResult.rows[0];
  const userAName = userA.first_name || userA.display_name || userA.username;
  const userBName = userB.first_name || userB.display_name || userB.username;

  // Create shared room using the correct roomManager function
  let sharedRoomId = null;
  if (roomManager && roomManager.createCoParentRoom) {
    try {
      // createCoParentRoom(inviterId, inviteeId, inviterName, inviteeName)
      // parentAId is the original inviter (User B), parentBId is User A
      const room = await roomManager.createCoParentRoom(
        parentAId, // inviterId (original inviter)
        parentBId, // inviteeId (user who triggered mutual detection)
        userBName, // inviterName
        userAName // inviteeName
      );
      sharedRoomId = room.roomId;
      console.log(`[mutualDetector] Created shared room ${sharedRoomId} for mutual pairing`);
    } catch (error) {
      console.error('Failed to create shared room in mutual pairing:', error);
    }
  }

  // Update the existing pairing to active
  const updateResult = await db.query(
    `UPDATE pairing_sessions
     SET status = $1, parent_b_id = $2, accepted_at = CURRENT_TIMESTAMP, shared_room_id = $3
     WHERE id = $4
     RETURNING *`,
    [PAIRING_STATUS.ACTIVE, parentBId, sharedRoomId, existingPairing.id]
  );

  const updatedPairing = updateResult.rows[0];

  // Create mutual contacts
  try {
    // Add User A as contact for User B
    await db.query(
      `INSERT INTO contacts (user_id, contact_name, contact_email, relationship, created_at)
       VALUES ($1, $2, $3, 'co-parent', CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, contact_email) DO UPDATE SET relationship = 'co-parent', contact_name = $2`,
      [parentAId, userAName, userA.email]
    );

    // Add User B as contact for User A
    await db.query(
      `INSERT INTO contacts (user_id, contact_name, contact_email, relationship, created_at)
       VALUES ($1, $2, $3, 'co-parent', CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, contact_email) DO UPDATE SET relationship = 'co-parent', contact_name = $2`,
      [parentBId, userBName, userB.email]
    );
  } catch (error) {
    console.error('Failed to create mutual contacts:', error);
  }

  // Log to audit trail
  await logPairingAction(db, {
    pairingSessionId: existingPairing.id,
    action: 'accepted',
    actorUserId: parentBId,
    metadata: {
      mutual_detection: true,
      shared_room_id: sharedRoomId,
    },
  });

  return {
    pairing: updatedPairing,
    parentAId,
    parentBId,
    sharedRoomId,
    wasMutualDetection: true,
  };
}

/**
 * Check for mutual invitation and auto-complete if found
 * This is the main entry point - call this before creating a new invitation
 *
 * @param {object} params - Check parameters
 * @param {string} params.initiatorId - User creating the invitation
 * @param {string} params.initiatorEmail - Email of user creating invitation
 * @param {string} params.inviteeEmail - Email of person being invited
 * @param {object} db - Database connection
 * @param {object} roomManager - Room manager (optional)
 * @returns {Promise<object|null>} Completed pairing if mutual, null if not
 */
async function detectAndCompleteMutual(params, db, roomManager) {
  const { initiatorId, initiatorEmail, inviteeEmail } = params;

  // Check for existing mutual invitation
  const mutualInvite = await checkMutualInvitation(
    {
      initiatorId,
      initiatorEmail,
      inviteeEmail,
    },
    db
  );

  if (!mutualInvite) {
    return null; // No mutual invitation found
  }

  // Found mutual invitation - auto-complete it
  console.log(`Mutual invitation detected: ${initiatorEmail} <-> ${inviteeEmail}`);

  return autoCompleteMutualPairing(
    {
      existingPairing: mutualInvite,
      userAId: initiatorId,
      userBId: mutualInvite.parent_a_id,
    },
    db,
    roomManager
  );
}

/**
 * Get potential matches based on shared child data
 * (Future enhancement - detect if two users have similar child profiles)
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 *
 * @param {string} userId - User to find matches for
 * @param {object} db - Database connection
 * @returns {Promise<Array>} Potential matches
 */
async function getPotentialMatches(userId, db) {
  // TODO: Implement child-based matching
  // This would look at shared_children table or child profiles
  // to suggest potential co-parent matches

  // For now, return empty array
  return [];
}

module.exports = {
  checkMutualInvitation,
  autoCompleteMutualPairing,
  detectAndCompleteMutual,
  getPotentialMatches,
  // Deprecated alias - use getPotentialMatches instead
  findPotentialMatches: getPotentialMatches,
};
