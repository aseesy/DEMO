/**
 * Cleanup Service
 *
 * Actor: Operations
 * Responsibility: Admin cleanup and maintenance operations
 *
 * Methods extracted from routes/admin.js admin endpoints.
 */

const { BaseService } = require('../BaseService');
const { NotFoundError, AuthorizationError, ValidationError } = require('../errors');

const { defaultLogger: defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'cleanupService',
});

class CleanupService extends BaseService {
  constructor() {
    super(null); // Operates on multiple tables
  }

  /**
   * Clean up orphaned data (room_members, rooms, messages)
   * @returns {Promise<Object>} Counts of deleted records
   */
  async cleanupOrphanedData() {
    // Clean up orphaned room_members
    const membersResult = await this.query(`
      DELETE FROM room_members
      WHERE user_id NOT IN (SELECT id FROM users)
      RETURNING id
    `);

    // Clean up orphaned rooms
    const roomsResult = await this.query(`
      DELETE FROM rooms
      WHERE id NOT IN (
        SELECT DISTINCT rm.room_id
        FROM room_members rm
        INNER JOIN users u ON rm.user_id = u.id
        WHERE rm.room_id IS NOT NULL
      )
      RETURNING id
    `);

    // Clean up orphaned messages
    const messagesResult = await this.query(`
      DELETE FROM messages
      WHERE room_id IS NOT NULL
      AND room_id NOT IN (SELECT id FROM rooms)
      RETURNING id
    `);

    const deleted = {
      room_members: membersResult.length,
      rooms: roomsResult.length,
      messages: messagesResult.length,
    };

    logger.debug('✅ Cleanup completed', {
      deleted: deleted,
    });

    return {
      success: true,
      message: 'Cleanup completed successfully',
      deleted,
    };
  }

  /**
   * Delete a user and clean up related data
   * @param {number} userId - User ID to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteUser(userId) {
    if (!userId || isNaN(userId)) {
      throw new ValidationError('Invalid user ID', 'userId');
    }

    // Check if user exists
    const user = await this.queryOne(`SELECT id, username FROM users WHERE id = $1`, [userId]);

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const username = user.username;

    // Delete user (CASCADE should handle related records)
    await this.query(`DELETE FROM users WHERE id = $1`, [userId]);

    // Clean up any orphaned data
    await this.query(`DELETE FROM room_members WHERE user_id NOT IN (SELECT id FROM users)`);
    await this.query(
      `DELETE FROM rooms WHERE id NOT IN (SELECT DISTINCT room_id FROM room_members WHERE room_id IS NOT NULL)`
    );
    await this.query(
      `DELETE FROM messages WHERE room_id IS NOT NULL AND room_id NOT IN (SELECT id FROM rooms)`
    );

    logger.debug('Log message', {
      value: `✅ User ${username} (ID: ${userId}) deleted successfully`,
    });

    return {
      success: true,
      message: `User ${username} deleted successfully`,
      deletedUserId: userId,
    };
  }

  /**
   * Backfill co-parent contacts for existing shared rooms
   * @returns {Promise<Object>} Backfill results
   */
  async backfillContacts() {
    // Find all shared rooms
    const rooms = await this.query(`
      SELECT rm.room_id, STRING_AGG(rm.user_id::text, ',') as user_ids, COUNT(rm.user_id) as member_count
      FROM room_members rm
      GROUP BY rm.room_id
      HAVING COUNT(rm.user_id) > 1
    `);

    let createdCount = 0;
    const now = new Date().toISOString();

    for (const room of rooms) {
      const userIds = room.user_ids.split(',').map(id => parseInt(id));

      // Get user info for all members
      const users = await this.query(`SELECT id, username, email FROM users WHERE id = ANY($1)`, [
        userIds,
      ]);

      // Create contacts for each pair
      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          const user1 = users[i];
          const user2 = users[j];

          // Check and create contact (user1 -> user2)
          const exists1 = await this.queryOne(
            `SELECT id FROM contacts WHERE user_id = $1 AND contact_name = $2 AND relationship = 'co-parent'`,
            [user1.id, user2.username]
          );

          if (!exists1) {
            await this.query(
              `INSERT INTO contacts (user_id, contact_name, contact_email, relationship, notes, created_at, updated_at)
               VALUES ($1, $2, $3, 'co-parent', 'Connected via shared room', $4, $4)`,
              [user1.id, user2.username, user2.email || null, now]
            );
            createdCount++;
          }

          // Check and create contact (user2 -> user1)
          const exists2 = await this.queryOne(
            `SELECT id FROM contacts WHERE user_id = $1 AND contact_name = $2 AND relationship = 'co-parent'`,
            [user2.id, user1.username]
          );

          if (!exists2) {
            await this.query(
              `INSERT INTO contacts (user_id, contact_name, contact_email, relationship, notes, created_at, updated_at)
               VALUES ($1, $2, $3, 'co-parent', 'Connected via shared room', $4, $4)`,
              [user2.id, user1.username, user1.email || null, now]
            );
            createdCount++;
          }
        }
      }
    }

    return {
      success: true,
      message: `Backfill completed. Created ${createdCount} co-parent contacts.`,
      roomsProcessed: rooms.length,
      contactsCreated: createdCount,
    };
  }

  /**
   * Clean up test data (test users and related records)
   * @param {string} testEmail - Email of test user to clean up
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupTestData(testEmail = 'testuser123@example.com') {
    const results = {
      usersDeleted: 0,
      contactsDeleted: 0,
      coparentContactsDeleted: 0,
      membershipsDeleted: 0,
      tasksDeleted: 0,
      pairingsReset: 0,
      invitationsDeleted: 0,
    };

    // Find test user
    const testUser = await this.queryOne(`SELECT id, username, email FROM users WHERE email = $1`, [
      testEmail,
    ]);

    if (testUser) {
      logger.debug('Log message', {
        value: `🧹 Cleaning up test user: ${testUser.email}`,
      });

      // Delete contacts owned by test user
      const contactsDeleted = await this.query(
        `DELETE FROM contacts WHERE user_id = $1 RETURNING id`,
        [testUser.id]
      );
      results.contactsDeleted = contactsDeleted.length;

      // Delete contacts where test user is the co-parent
      const coparentContactsDeleted = await this.query(
        `DELETE FROM contacts WHERE contact_email = $1 RETURNING id`,
        [testEmail]
      );
      results.coparentContactsDeleted = coparentContactsDeleted.length;

      // Delete room memberships
      const membershipsDeleted = await this.query(
        `DELETE FROM room_members WHERE user_id = $1 RETURNING id`,
        [testUser.id]
      );
      results.membershipsDeleted = membershipsDeleted.length;

      // Delete tasks
      const tasksDeleted = await this.query(
        `DELETE FROM tasks WHERE user_id = $1 OR assigned_to = $2 RETURNING id`,
        [testUser.id, String(testUser.id)]
      );
      results.tasksDeleted = tasksDeleted.length;

      // Delete invitations
      const invitationsDeleted = await this.query(
        `DELETE FROM invitations WHERE inviter_id = $1 OR invitee_id = $1 RETURNING id`,
        [testUser.id]
      );
      results.invitationsDeleted = invitationsDeleted.length;

      // Reset pairing sessions
      const pairingsReset = await this.query(
        `UPDATE pairing_sessions
         SET status = 'pending', parent_b_id = NULL, accepted_at = NULL, shared_room_id = NULL
         WHERE status = 'active' AND parent_b_id = $1
         RETURNING id`,
        [testUser.id]
      );
      results.pairingsReset = pairingsReset.length;

      // Delete user
      await this.query(`DELETE FROM users WHERE id = $1`, [testUser.id]);
      results.usersDeleted = 1;
    }

    logger.debug('✅ Test cleanup complete', {
      results: results,
    });
    return { success: true, results };
  }

  /**
   * Force connect two users (create room and pairing)
   * @param {number} userAId - First user ID
   * @param {number} userBId - Second user ID
   * @param {Function} createCoParentRoom - Room creation function (injected)
   * @returns {Promise<Object>} Connection result
   */
  async forceConnect(userAId, userBId, createCoParentRoom) {
    if (!userAId || !userBId) {
      throw new ValidationError('userAId and userBId are required');
    }

    // Get user info
    const parentA = await this.queryOne(`SELECT id, username, email FROM users WHERE id = $1`, [
      userAId,
    ]);
    const parentB = await this.queryOne(`SELECT id, username, email FROM users WHERE id = $1`, [
      userBId,
    ]);

    if (!parentA || !parentB) {
      throw new NotFoundError('One or both users');
    }

    logger.debug('Log message', {
      value: `🔧 Force connecting ${parentA.username} (${parentA.id}) and ${parentB.username} (${parentB.id})`,
    });

    // Create the shared room
    const room = await createCoParentRoom(
      parentA.id,
      parentB.id,
      parentA.username,
      parentB.username
    );

    // Create or update pairing session
    const existingPairing = await this.queryOne(
      `SELECT id FROM pairing_sessions
       WHERE (parent_a_id = $1 AND parent_b_id = $2) OR (parent_a_id = $2 AND parent_b_id = $1)`,
      [parentA.id, parentB.id]
    );

    let pairingId;
    if (existingPairing) {
      pairingId = existingPairing.id;
      await this.query(
        `UPDATE pairing_sessions SET status = 'active', shared_room_id = $1, accepted_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [room.roomId, pairingId]
      );
    } else {
      const pairingCode = `LZ-${Math.floor(Math.random() * 900000) + 100000}`;
      const newPairing = await this.query(
        `INSERT INTO pairing_sessions (parent_a_id, parent_b_id, status, shared_room_id, accepted_at, pairing_code, invite_type, invited_by_username, created_at, expires_at)
         VALUES ($1, $2, 'active', $3, CURRENT_TIMESTAMP, $4, 'link', $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days')
         RETURNING id`,
        [parentA.id, parentB.id, room.roomId, pairingCode, parentA.username]
      );
      pairingId = newPairing[0].id;
    }

    // Create mutual contacts (ignore conflicts)
    await this.query(
      `INSERT INTO contacts (user_id, contact_name, contact_email, relationship, created_at)
       VALUES ($1, $2, $3, 'co-parent', CURRENT_TIMESTAMP)
       ON CONFLICT DO NOTHING`,
      [parentA.id, parentB.username, parentB.email]
    );
    await this.query(
      `INSERT INTO contacts (user_id, contact_name, contact_email, relationship, created_at)
       VALUES ($1, $2, $3, 'co-parent', CURRENT_TIMESTAMP)
       ON CONFLICT DO NOTHING`,
      [parentB.id, parentA.username, parentA.email]
    );

    return {
      success: true,
      room,
      pairingId,
      parentA: { id: parentA.id, username: parentA.username },
      parentB: { id: parentB.id, username: parentB.username },
    };
  }

  /**
   * Repair pairings that are active but missing rooms
   * @param {Function} createCoParentRoom - Room creation function (injected)
   * @returns {Promise<Object>} Repair results
   */
  async repairPairings(createCoParentRoom) {
    // Find active pairings without a shared room
    const pairingsWithoutRoom = await this.query(`
      SELECT ps.*,
             ua.username as parent_a_username,
             ub.username as parent_b_username
      FROM pairing_sessions ps
      JOIN users ua ON ps.parent_a_id = ua.id
      JOIN users ub ON ps.parent_b_id = ub.id
      WHERE ps.status = 'active'
        AND (ps.shared_room_id IS NULL OR ps.shared_room_id = '')
    `);

    const results = {
      pairingsFound: pairingsWithoutRoom.length,
      roomsCreated: 0,
      errors: [],
    };

    for (const pairing of pairingsWithoutRoom) {
      try {
        logger.debug('Log message', {
          value: `🔧 Repairing pairing ${pairing.id}: ${pairing.parent_a_username} & ${pairing.parent_b_username}`,
        });

        // Create the room
        const room = await createCoParentRoom(
          pairing.parent_a_id,
          pairing.parent_b_id,
          pairing.parent_a_username,
          pairing.parent_b_username
        );

        // Update the pairing with the room ID
        await this.query(`UPDATE pairing_sessions SET shared_room_id = $1 WHERE id = $2`, [
          room.roomId,
          pairing.id,
        ]);

        results.roomsCreated++;
        logger.debug('Log message', {
          value: `✅ Created room ${room.roomId} for pairing ${pairing.id}`,
        });
      } catch (error) {
        logger.error('Log message', {
          arg0: `❌ Failed to repair pairing ${pairing.id}:`,
          error: error,
        });
        results.errors.push({ pairingId: pairing.id, error: error.message });
      }
    }

    return { success: true, results };
  }
}

// Export singleton instance
const cleanupService = new CleanupService();

module.exports = { cleanupService, CleanupService };
