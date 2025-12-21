/**
 * Delete All Users and Their Data
 *
 * WARNING: This script permanently deletes ALL users and ALL their associated data:
 * - User accounts (name, email, password, profile)
 * - Chat messages
 * - Contacts
 * - Tasks
 * - Rooms and room memberships
 * - Invitations
 * - Communication stats
 * - Profile data
 * - All other user-related data
 *
 * This action CANNOT be undone!
 *
 * Usage: node chat-server/scripts/delete-all-users.js [--confirm]
 */

const path = require('path');
// Load .env from chat-server directory (where script is located)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function getTableCounts() {
  const tables = [
    'users',
    'user_context',
    'contacts',
    'tasks',
    'messages',
    'rooms',
    'room_members',
    'room_invites',
    'pending_connections',
    'communication_stats',
    'user_intervention_preferences',
    'relationship_insights',
    'message_flags',
    'escalation_tracking',
  ];

  const counts = {};

  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = parseInt(result.rows[0].count, 10);
    } catch (error) {
      // Table might not exist
      counts[table] = 0;
    }
  }

  return counts;
}

async function deleteAllUsers() {
  console.log('🗑️  Starting deletion of all users and their data...\n');

  try {
    // Get counts before deletion
    console.log('📊 Current data counts:');
    const beforeCounts = await getTableCounts();
    for (const [table, count] of Object.entries(beforeCounts)) {
      if (count > 0) {
        console.log(`   ${table}: ${count} records`);
      }
    }
    console.log('');

    // Start transaction
    await pool.query('BEGIN');

    // Delete in order (respecting foreign key constraints)
    // Tables with CASCADE will be deleted automatically, but we'll be explicit

    console.log('🗑️  Deleting data...');

    // 1. Delete messages (may reference rooms/users)
    try {
      const result = await pool.query('DELETE FROM messages');
      console.log(`   ✅ Deleted ${result.rowCount} messages`);
    } catch (error) {
      console.log(`   ⚠️  Messages: ${error.message}`);
    }

    // 2. Delete message flags
    try {
      const result = await pool.query('DELETE FROM message_flags');
      console.log(`   ✅ Deleted ${result.rowCount} message flags`);
    } catch (error) {
      console.log(`   ⚠️  Message flags: ${error.message}`);
    }

    // 3. Delete relationship insights
    try {
      const result = await pool.query('DELETE FROM relationship_insights');
      console.log(`   ✅ Deleted ${result.rowCount} relationship insights`);
    } catch (error) {
      console.log(`   ⚠️  Relationship insights: ${error.message}`);
    }

    // 4. Delete escalation tracking
    try {
      const result = await pool.query('DELETE FROM escalation_tracking');
      console.log(`   ✅ Deleted ${result.rowCount} escalation records`);
    } catch (error) {
      console.log(`   ⚠️  Escalation tracking: ${error.message}`);
    }

    // 5. Delete communication stats (references users and rooms)
    try {
      const result = await pool.query('DELETE FROM communication_stats');
      console.log(`   ✅ Deleted ${result.rowCount} communication stats`);
    } catch (error) {
      console.log(`   ⚠️  Communication stats: ${error.message}`);
    }

    // 6. Delete user intervention preferences (references users)
    try {
      const result = await pool.query('DELETE FROM user_intervention_preferences');
      console.log(`   ✅ Deleted ${result.rowCount} user intervention preferences`);
    } catch (error) {
      console.log(`   ⚠️  User intervention preferences: ${error.message}`);
    }

    // 7. Delete tasks (references users via CASCADE)
    try {
      const result = await pool.query('DELETE FROM tasks');
      console.log(`   ✅ Deleted ${result.rowCount} tasks`);
    } catch (error) {
      console.log(`   ⚠️  Tasks: ${error.message}`);
    }

    // 8. Delete contacts (references users via CASCADE)
    try {
      const result = await pool.query('DELETE FROM contacts');
      console.log(`   ✅ Deleted ${result.rowCount} contacts`);
    } catch (error) {
      console.log(`   ⚠️  Contacts: ${error.message}`);
    }

    // 9. Delete pending connections (references users via CASCADE)
    try {
      const result = await pool.query('DELETE FROM pending_connections');
      console.log(`   ✅ Deleted ${result.rowCount} pending connections`);
    } catch (error) {
      console.log(`   ⚠️  Pending connections: ${error.message}`);
    }

    // 10. Delete room invites (references users and rooms via CASCADE)
    try {
      const result = await pool.query('DELETE FROM room_invites');
      console.log(`   ✅ Deleted ${result.rowCount} room invites`);
    } catch (error) {
      console.log(`   ⚠️  Room invites: ${error.message}`);
    }

    // 11. Delete room members (references users and rooms via CASCADE)
    try {
      const result = await pool.query('DELETE FROM room_members');
      console.log(`   ✅ Deleted ${result.rowCount} room members`);
    } catch (error) {
      console.log(`   ⚠️  Room members: ${error.message}`);
    }

    // 12. Delete rooms (references users via CASCADE)
    try {
      const result = await pool.query('DELETE FROM rooms');
      console.log(`   ✅ Deleted ${result.rowCount} rooms`);
    } catch (error) {
      console.log(`   ⚠️  Rooms: ${error.message}`);
    }

    // 13. Delete user context (references users via CASCADE)
    try {
      const result = await pool.query('DELETE FROM user_context');
      console.log(`   ✅ Deleted ${result.rowCount} user context records`);
    } catch (error) {
      console.log(`   ⚠️  User context: ${error.message}`);
    }

    // 14. Finally, delete all users (this will cascade to any remaining references)
    try {
      const result = await pool.query('DELETE FROM users');
      console.log(`   ✅ Deleted ${result.rowCount} users`);
    } catch (error) {
      console.log(`   ❌ Error deleting users: ${error.message}`);
      throw error;
    }

    // Commit transaction
    await pool.query('COMMIT');
    console.log('\n✅ All users and their data have been deleted successfully!');

    // Get counts after deletion
    console.log('\n📊 Data counts after deletion:');
    const afterCounts = await getTableCounts();
    for (const [table, count] of Object.entries(afterCounts)) {
      if (count > 0) {
        console.log(`   ⚠️  ${table}: ${count} records (should be 0)`);
      }
    }

    const totalDeleted = beforeCounts.users || 0;
    console.log(`\n✅ Deletion complete. Removed ${totalDeleted} user(s) and all associated data.`);
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    console.error('\n❌ Error during deletion:', error.message);
    console.error('   Transaction rolled back. No data was deleted.');
    throw error;
  } finally {
    await pool.end();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes('--confirm');

  if (!confirmed) {
    console.log('⚠️  WARNING: This will delete ALL users and ALL their data!');
    console.log('⚠️  This includes:');
    console.log('   - User accounts (name, email, password, profile)');
    console.log('   - All chat messages');
    console.log('   - All contacts');
    console.log('   - All tasks');
    console.log('   - All rooms and memberships');
    console.log('   - All invitations');
    console.log('   - All communication stats');
    console.log('   - All profile data');
    console.log('   - ALL other user-related data');
    console.log('\n⚠️  This action CANNOT be undone!\n');
    console.log('To confirm deletion, run:');
    console.log('   node chat-server/scripts/delete-all-users.js --confirm\n');
    process.exit(1);
  }

  try {
    await deleteAllUsers();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
