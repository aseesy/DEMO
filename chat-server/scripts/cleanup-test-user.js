/**
 * Cleanup Test User Script
 *
 * Removes test user created during invitation flow testing
 * and resets the pairing session to allow new invitations.
 *
 * Usage: node scripts/cleanup-test-user.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function cleanup() {
  console.log('🧹 Starting cleanup...\n');

  try {
    // 1. Find the test user
    const testUserResult = await db.query(
      "SELECT id, username, email FROM users WHERE email = 'testuser123@example.com'"
    );

    if (testUserResult.rows.length === 0) {
      console.log('ℹ️  Test user not found - may have already been cleaned up');
    } else {
      const testUser = testUserResult.rows[0];
      console.log(`Found test user: ${testUser.username} (ID: ${testUser.id})`);

      // 2. Delete contacts involving test user
      const contactsDeleted = await db.query(
        'DELETE FROM contacts WHERE user_id = $1 OR contact_user_id = $1 RETURNING id',
        [testUser.id]
      );
      console.log(`✅ Deleted ${contactsDeleted.rowCount} contacts`);

      // 3. Delete room memberships involving test user
      const membershipsDeleted = await db.query(
        'DELETE FROM room_members WHERE user_id = $1 RETURNING room_id',
        [testUser.id]
      );
      console.log(`✅ Deleted ${membershipsDeleted.rowCount} room memberships`);

      // 4. Delete messages from test user
      const messagesDeleted = await db.query(
        'DELETE FROM messages WHERE sender_id = $1 RETURNING id',
        [testUser.id]
      );
      console.log(`✅ Deleted ${messagesDeleted.rowCount} messages`);

      // 5. Delete tasks assigned to test user
      const tasksDeleted = await db.query(
        'DELETE FROM tasks WHERE user_id = $1 OR assigned_to = $1 RETURNING id',
        [testUser.id]
      );
      console.log(`✅ Deleted ${tasksDeleted.rowCount} tasks`);

      // 6. Delete invitations involving test user
      const invitationsDeleted = await db.query(
        'DELETE FROM invitations WHERE inviter_id = $1 OR invitee_id = $1 RETURNING id',
        [testUser.id]
      );
      console.log(`✅ Deleted ${invitationsDeleted.rowCount} invitations`);

      // 7. Delete the test user
      await db.query('DELETE FROM users WHERE id = $1', [testUser.id]);
      console.log(`✅ Deleted test user: ${testUser.email}`);
    }

    // 8. Reset pairing sessions that were accepted
    const pairingsReset = await db.query(`
      UPDATE pairing_sessions
      SET status = 'pending',
          parent_b_id = NULL,
          accepted_at = NULL
      WHERE status = 'active'
        AND parent_a_id = 1
      RETURNING id, pairing_code
    `);

    if (pairingsReset.rowCount > 0) {
      console.log(`✅ Reset ${pairingsReset.rowCount} pairing sessions:`);
      pairingsReset.rows.forEach(p => console.log(`   - Pairing ${p.id} (${p.pairing_code})`));
    } else {
      console.log('ℹ️  No pairing sessions to reset');
    }

    // 9. Check mom's co-parent status
    const momCoparents = await db.query(`
      SELECT COUNT(*) as count
      FROM invitations
      WHERE (inviter_id = 1 OR invitee_id = 1)
        AND status = 'accepted'
        AND invitation_type = 'coparent'
    `);
    console.log(`\nℹ️  Mom's accepted co-parent invitations: ${momCoparents.rows[0].count}`);

    // 10. Show current pairing sessions for mom
    const momPairings = await db.query(`
      SELECT id, pairing_code, status, parent_b_email, created_at
      FROM pairing_sessions
      WHERE parent_a_id = 1
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log("\n📋 Mom's recent pairing sessions:");
    if (momPairings.rows.length === 0) {
      console.log('   No pairing sessions found');
    } else {
      momPairings.rows.forEach(p => {
        console.log(`   - ${p.pairing_code}: ${p.status} (created: ${p.created_at})`);
      });
    }

    console.log('\n✅ Cleanup complete! Mom should now be able to create new invitations.');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    throw error;
  } finally {
    await db.end();
  }
}

cleanup().catch(err => {
  console.error(err);
  process.exit(1);
});
