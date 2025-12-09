/**
 * Admin & Debug Routes
 *
 * Handles admin operations and debug endpoints.
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();

const dbSafe = require('../dbSafe');
const db = require('../dbPostgres');
const { verifyAuth } = require('../middleware/auth');

// Helper references - set from server.js
let roomManager;

router.setHelpers = function(helpers) {
  roomManager = helpers.roomManager;
};

// ============================================
// Debug Endpoints
// ============================================

/**
 * GET /api/debug/users
 * List all users (for development/debugging)
 */
router.get('/debug/users', async (req, res) => {
  try {
    const dbPostgres = require('../dbPostgres');
    const result = await dbPostgres.query(`
      SELECT
        id,
        username,
        email,
        created_at,
        last_login
      FROM users
      ORDER BY created_at DESC
    `);

    const users = result.rows || [];

    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email || null,
      created_at: user.created_at,
      last_login: user.last_login || null
    }));

    res.json({
      users: formattedUsers,
      count: formattedUsers.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stats/user-count
 * Get total user count (for beta spots calculation)
 */
router.get('/stats/user-count', async (req, res) => {
  try {
    const usePostgres = !!process.env.DATABASE_URL;
    let count = 0;

    if (usePostgres) {
      const dbPostgres = require('../dbPostgres');
      const result = await dbPostgres.query('SELECT COUNT(*) as count FROM users');
      count = parseInt(result.rows[0]?.count || 0, 10);
    } else {
      const dbPostgres = require('../dbPostgres');
      const result = await dbPostgres.query('SELECT COUNT(*) as count FROM users');
      count = parseInt(result.rows[0]?.count || 0, 10);
    }

    res.json({ count });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.json({ count: 0 });
  }
});

/**
 * GET /api/debug/rooms
 * List all rooms
 */
router.get('/debug/rooms', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        r.id,
        r.name,
        r.created_by,
        u.username as created_by_username,
        r.is_private,
        r.created_at,
        COUNT(CASE WHEN u2.id IS NOT NULL THEN 1 END) as member_count
      FROM rooms r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN users u2 ON rm.user_id = u2.id
      GROUP BY r.id, r.name, r.created_by, u.username, r.is_private, r.created_at
      ORDER BY r.created_at DESC
    `);

    const rooms = (result.rows || []).map(room => ({
      id: room.id,
      name: room.name,
      created_by: room.created_by,
      created_by_username: room.created_by_username,
      is_private: room.is_private,
      created_at: room.created_at,
      member_count: parseInt(room.member_count) || 0
    }));

    res.json({
      rooms,
      count: rooms.length
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/debug/tasks/:userId
 * Diagnostic endpoint to check user's tasks
 */
router.get('/debug/tasks/:userId', verifyAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const requestingUserId = req.user.userId || req.user.id;

    if (userId !== requestingUserId) {
      return res.status(403).json({ error: 'You can only check your own tasks' });
    }

    const tasks = await dbSafe.safeSelect('tasks', { user_id: userId }, {
      orderBy: 'created_at',
      orderDirection: 'DESC'
    });

    const users = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });

    res.json({
      userId,
      username: users[0]?.username || 'unknown',
      totalTasks: tasks.length,
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        created_at: t.created_at,
        completed_at: t.completed_at
      })),
      openTasks: tasks.filter(t => t.status === 'open').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      welcomeTaskExists: tasks.some(t => t.title === 'Welcome to LiaiZen'),
      onboardingTasksExist: {
        'Complete Your Profile': tasks.some(t => t.title === 'Complete Your Profile'),
        'Add Your Co-parent': tasks.some(t => t.title === 'Add Your Co-parent'),
        'Add Your Children': tasks.some(t => t.title === 'Add Your Children')
      }
    });
  } catch (error) {
    console.error('Error in debug tasks endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/debug/messages/:roomId
 * Diagnostic endpoint to check room's messages
 */
router.get('/debug/messages/:roomId', verifyAuth, async (req, res) => {
  try {
    const roomId = req.params.roomId;

    const members = await roomManager.getRoomMembers(roomId);
    const requestingUserId = req.user.userId || req.user.id;
    const isMember = members.some(m => m.user_id === requestingUserId || m.id === requestingUserId);

    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this room' });
    }

    const messages = await dbSafe.safeSelect('messages', { room_id: roomId }, {
      orderBy: 'timestamp',
      orderDirection: 'ASC'
    });

    const welcomeMessages = messages.filter(m =>
      m.type === 'ai_comment' &&
      m.username === 'LiaiZen' &&
      (m.id?.startsWith('liaizen_welcome_') || m.text?.includes('LiaiZen'))
    );

    const room = await dbSafe.safeSelect('rooms', { id: roomId }, { limit: 1 });

    res.json({
      roomId,
      roomName: room[0]?.name || 'unknown',
      totalMessages: messages.length,
      welcomeMessages: welcomeMessages.length,
      messages: messages.map(m => ({
        id: m.id,
        type: m.type,
        username: m.username,
        text: m.text?.substring(0, 100) || '',
        timestamp: m.timestamp,
        isWelcome: m.type === 'ai_comment' && m.username === 'LiaiZen'
      })),
      welcomeMessageDetails: welcomeMessages.map(m => ({
        id: m.id,
        text: m.text,
        timestamp: m.timestamp,
        room_id: m.room_id
      }))
    });
  } catch (error) {
    console.error('Error in debug messages endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/debug/pending-connections
 * List all pending connections
 */
router.get('/debug/pending-connections', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        pc.id,
        pc.inviter_id,
        u1.username as inviter_username,
        pc.invitee_email,
        pc.token,
        pc.status,
        pc.room_id,
        pc.created_at,
        pc.expires_at
      FROM pending_connections pc
      LEFT JOIN users u1 ON pc.inviter_id = u1.id
      ORDER BY pc.created_at DESC
    `);

    const connections = (result.rows || []).map(conn => ({
      id: conn.id,
      inviter_id: conn.inviter_id,
      inviter_username: conn.inviter_username,
      invitee_email: conn.invitee_email,
      token: conn.token,
      status: conn.status,
      room_id: conn.room_id,
      created_at: conn.created_at,
      expires_at: conn.expires_at,
      is_expired: conn.expires_at ? new Date(conn.expires_at) < new Date() : false
    }));

    res.json({
      connections,
      count: connections.length
    });
  } catch (error) {
    console.error('Error fetching pending connections:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Admin Endpoints
// ============================================

/**
 * POST /api/admin/cleanup
 * Clean up orphaned data
 */
router.post('/admin/cleanup', async (req, res) => {
  try {
    // Clean up orphaned room_members
    const membersResult = await db.query(`
      DELETE FROM room_members
      WHERE user_id NOT IN (SELECT id FROM users)
    `);

    // Clean up orphaned rooms
    const roomsResult = await db.query(`
      DELETE FROM rooms
      WHERE id NOT IN (
        SELECT DISTINCT rm.room_id
        FROM room_members rm
        INNER JOIN users u ON rm.user_id = u.id
        WHERE rm.room_id IS NOT NULL
      )
    `);

    // Clean up orphaned messages
    const messagesResult = await db.query(`
      DELETE FROM messages
      WHERE room_id IS NOT NULL
      AND room_id NOT IN (SELECT id FROM rooms)
    `);

    console.log('✅ Cleanup completed: orphaned data removed');

    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      deleted: {
        room_members: membersResult.rowCount || 0,
        rooms: roomsResult.rowCount || 0,
        messages: messagesResult.rowCount || 0
      }
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete a user
 */
router.delete('/admin/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const userResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const username = users[0].username;

    // Delete user (CASCADE will handle related records)
    await dbSafe.safeDelete('users', { id: userId });

    // Clean up orphaned data
    await db.query(`DELETE FROM room_members WHERE user_id NOT IN (SELECT id FROM users)`);
    await db.query(`DELETE FROM rooms WHERE id NOT IN (SELECT DISTINCT room_id FROM room_members WHERE room_id IS NOT NULL)`);
    await db.query(`DELETE FROM messages WHERE room_id IS NOT NULL AND room_id NOT IN (SELECT id FROM rooms)`);

    console.log(`✅ User ${username} (ID: ${userId}) deleted successfully`);

    res.json({
      success: true,
      message: `User ${username} deleted successfully`,
      deletedUserId: userId
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/backfill-contacts
 * Backfill co-parent contacts for existing shared rooms
 */
router.post('/admin/backfill-contacts', async (req, res) => {
  try {
    // Find all shared rooms (using STRING_AGG for PostgreSQL)
    const roomsResult = await db.query(`
      SELECT rm.room_id, STRING_AGG(rm.user_id::text, ',') as user_ids, COUNT(rm.user_id) as member_count
      FROM room_members rm
      GROUP BY rm.room_id
      HAVING COUNT(rm.user_id) > 1
    `);

    const rooms = roomsResult.rows || [];

    let createdCount = 0;
    const now = new Date().toISOString();

    for (const room of rooms) {
      const userIds = room.user_ids.split(',').map(id => parseInt(id));

      // Get user info for all members
      const users = [];
      for (const userId of userIds) {
        const userResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
        const userList = dbSafe.parseResult(userResult);
        if (userList.length > 0) {
          users.push(userList[0]);
        }
      }

      // Create contacts for each pair
      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          const user1 = users[i];
          const user2 = users[j];

          // Check if contact already exists (user1 -> user2)
          const check1 = await dbSafe.safeSelect('contacts', {
            user_id: user1.id,
            contact_name: user2.username,
            relationship: 'co-parent'
          }, { limit: 1 });

          if (dbSafe.parseResult(check1).length === 0) {
            await dbSafe.safeInsert('contacts', {
              user_id: user1.id,
              contact_name: user2.username,
              contact_email: user2.email || null,
              relationship: 'co-parent',
              notes: `Connected via shared room`,
              created_at: now,
              updated_at: now
            });
            createdCount++;
          }

          // Check if contact already exists (user2 -> user1)
          const check2 = await dbSafe.safeSelect('contacts', {
            user_id: user2.id,
            contact_name: user1.username,
            relationship: 'co-parent'
          }, { limit: 1 });

          if (dbSafe.parseResult(check2).length === 0) {
            await dbSafe.safeInsert('contacts', {
              user_id: user2.id,
              contact_name: user1.username,
              contact_email: user1.email || null,
              relationship: 'co-parent',
              notes: `Connected via shared room`,
              created_at: now,
              updated_at: now
            });
            createdCount++;
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Backfill completed. Created ${createdCount} co-parent contacts.`,
      roomsProcessed: rooms.length,
      contactsCreated: createdCount
    });
  } catch (error) {
    console.error('Error backfilling contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/cleanup-test-data
 * Cleanup test user and reset pairing sessions
 * Protected by secret key
 */
router.post('/admin/cleanup-test-data', async (req, res) => {
  const { secret } = req.body;
  const ADMIN_SECRET = process.env.ADMIN_CLEANUP_SECRET || 'liaizen-test-cleanup-2024';

  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Invalid secret' });
  }

  const results = {
    usersDeleted: 0,
    contactsDeleted: 0,
    membershipsDeleted: 0,
    tasksDeleted: 0,
    pairingsReset: 0,
    invitationsDeleted: 0
  };

  try {
    // Find test user
    const testUserResult = await db.query(
      "SELECT id, username, email FROM users WHERE email = 'testuser123@example.com'"
    );

    if (testUserResult.rows.length > 0) {
      const testUser = testUserResult.rows[0];
      console.log(`🧹 Cleaning up test user: ${testUser.email}`);

      // Delete contacts owned by test user
      const contactsDeleted = await db.query(
        'DELETE FROM contacts WHERE user_id = $1',
        [testUser.id]
      );
      results.contactsDeleted = contactsDeleted.rowCount;

      // Delete contacts where test user is the co-parent
      const coparentContactsDeleted = await db.query(
        "DELETE FROM contacts WHERE contact_email = 'testuser123@example.com'",
        []
      );
      results.coparentContactsDeleted = coparentContactsDeleted.rowCount;

      // Delete room memberships
      const membershipsDeleted = await db.query(
        'DELETE FROM room_members WHERE user_id = $1',
        [testUser.id]
      );
      results.membershipsDeleted = membershipsDeleted.rowCount;

      // Delete tasks
      const tasksDeleted = await db.query(
        'DELETE FROM tasks WHERE user_id = $1 OR assigned_to = $2',
        [testUser.id, String(testUser.id)]
      );
      results.tasksDeleted = tasksDeleted.rowCount;

      // Delete invitations
      const invitationsDeleted = await db.query(
        'DELETE FROM invitations WHERE inviter_id = $1 OR invitee_id = $1',
        [testUser.id]
      );
      results.invitationsDeleted = invitationsDeleted.rowCount;

      // Delete user
      await db.query('DELETE FROM users WHERE id = $1', [testUser.id]);
      results.usersDeleted = 1;
    }

    // Reset pairing sessions for deleted test user
    if (testUserResult.rows.length > 0) {
      const testUser = testUserResult.rows[0];
      const pairingsReset = await db.query(`
        UPDATE pairing_sessions
        SET status = 'pending',
            parent_b_id = NULL,
            accepted_at = NULL,
            shared_room_id = NULL
        WHERE status = 'active'
          AND parent_b_id = $1
      `, [testUser.id]);
      results.pairingsReset = pairingsReset.rowCount;
    }

    console.log('✅ Cleanup complete:', results);
    res.json({ success: true, results });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/force-connect
 * Force connect two users (for testing/repair)
 */
router.post('/admin/force-connect', async (req, res) => {
  const { secret, userAId, userBId } = req.body;

  if (secret !== 'liaizen-test-cleanup-2024') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!userAId || !userBId) {
    return res.status(400).json({ error: 'userAId and userBId are required' });
  }

  try {
    // Get user info
    const userA = await db.query('SELECT id, username, email FROM users WHERE id = $1', [userAId]);
    const userB = await db.query('SELECT id, username, email FROM users WHERE id = $1', [userBId]);

    if (userA.rows.length === 0 || userB.rows.length === 0) {
      return res.status(404).json({ error: 'One or both users not found' });
    }

    const parentA = userA.rows[0];
    const parentB = userB.rows[0];

    console.log(`🔧 Force connecting ${parentA.username} (${parentA.id}) and ${parentB.username} (${parentB.id})`);

    // Create the shared room
    const room = await roomManager.createCoParentRoom(
      parentA.id,
      parentB.id,
      parentA.username,
      parentB.username
    );

    // Create or update pairing session
    const existingPairing = await db.query(
      `SELECT id FROM pairing_sessions
       WHERE (parent_a_id = $1 AND parent_b_id = $2) OR (parent_a_id = $2 AND parent_b_id = $1)
       LIMIT 1`,
      [parentA.id, parentB.id]
    );

    let pairingId;
    if (existingPairing.rows.length > 0) {
      pairingId = existingPairing.rows[0].id;
      await db.query(
        `UPDATE pairing_sessions SET status = 'active', shared_room_id = $1, accepted_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [room.roomId, pairingId]
      );
    } else {
      const newPairing = await db.query(
        `INSERT INTO pairing_sessions (parent_a_id, parent_b_id, status, shared_room_id, accepted_at, pairing_code, invite_type, invited_by_username, created_at, expires_at)
         VALUES ($1, $2, 'active', $3, CURRENT_TIMESTAMP, $4, 'link', $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days')
         RETURNING id`,
        [parentA.id, parentB.id, room.roomId, `LZ-${Math.floor(Math.random() * 900000) + 100000}`, parentA.username]
      );
      pairingId = newPairing.rows[0].id;
    }

    // Create mutual contacts
    try {
      await db.query(
        `INSERT INTO contacts (user_id, contact_name, contact_email, relationship, created_at)
         VALUES ($1, $2, $3, 'co-parent', CURRENT_TIMESTAMP)
         ON CONFLICT DO NOTHING`,
        [parentA.id, parentB.username, parentB.email]
      );
      await db.query(
        `INSERT INTO contacts (user_id, contact_name, contact_email, relationship, created_at)
         VALUES ($1, $2, $3, 'co-parent', CURRENT_TIMESTAMP)
         ON CONFLICT DO NOTHING`,
        [parentB.id, parentA.username, parentA.email]
      );
    } catch (contactErr) {
      console.warn('Contact creation warning:', contactErr.message);
    }

    res.json({
      success: true,
      room: room,
      pairingId,
      parentA: { id: parentA.id, username: parentA.username },
      parentB: { id: parentB.id, username: parentB.username }
    });
  } catch (error) {
    console.error('Force connect error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/debug-pairings
 * Debug endpoint to check pairing and room status
 */
router.post('/admin/debug-pairings', async (req, res) => {
  const { secret } = req.body;

  if (secret !== 'liaizen-test-cleanup-2024') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // Get all pairings for user 1
    const pairings = await db.query(`
      SELECT ps.*,
             ua.username as parent_a_username, ua.email as parent_a_email,
             ub.username as parent_b_username, ub.email as parent_b_email
      FROM pairing_sessions ps
      JOIN users ua ON ps.parent_a_id = ua.id
      LEFT JOIN users ub ON ps.parent_b_id = ub.id
      WHERE ps.parent_a_id = 1 OR ps.parent_b_id = 1
      ORDER BY ps.created_at DESC
      LIMIT 5
    `);

    // Get room memberships for user 1
    const rooms = await db.query(`
      SELECT r.id, r.name, r.created_by, rm.user_id, rm.role, u.username
      FROM rooms r
      JOIN room_members rm ON r.id = rm.room_id
      JOIN users u ON rm.user_id = u.id
      WHERE r.id IN (SELECT room_id FROM room_members WHERE user_id = 1)
    `);

    // Get all users
    const users = await db.query('SELECT id, username, email FROM users ORDER BY id LIMIT 10');

    res.json({
      pairings: pairings.rows,
      rooms: rooms.rows,
      users: users.rows
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/repair-pairing
 * Repair pairing - create missing room for active pairings
 */
router.post('/admin/repair-pairing', async (req, res) => {
  const { secret } = req.body;

  if (secret !== 'liaizen-test-cleanup-2024') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // Find active pairings without a shared room
    const pairingsWithoutRoom = await db.query(`
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
      pairingsFound: pairingsWithoutRoom.rows.length,
      roomsCreated: 0,
      errors: []
    };

    for (const pairing of pairingsWithoutRoom.rows) {
      try {
        console.log(`🔧 Repairing pairing ${pairing.id}: ${pairing.parent_a_username} & ${pairing.parent_b_username}`);

        // Create the room
        const room = await roomManager.createCoParentRoom(
          pairing.parent_a_id,
          pairing.parent_b_id,
          pairing.parent_a_username,
          pairing.parent_b_username
        );

        // Update the pairing with the room ID
        await db.query(
          'UPDATE pairing_sessions SET shared_room_id = $1 WHERE id = $2',
          [room.roomId, pairing.id]
        );

        results.roomsCreated++;
        console.log(`✅ Created room ${room.roomId} for pairing ${pairing.id}`);
      } catch (error) {
        console.error(`❌ Failed to repair pairing ${pairing.id}:`, error);
        results.errors.push({ pairingId: pairing.id, error: error.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('❌ Repair error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
