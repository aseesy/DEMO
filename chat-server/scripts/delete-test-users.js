/**
 * Delete Test Users Script
 *
 * Removes mom@test.com and dad@test.com and all their associated data
 * from production database.
 *
 * This script:
 * - Deletes all data associated with both users
 * - Cleans up Neo4j nodes and relationships
 * - Handles all foreign key relationships safely
 *
 * Usage: node chat-server/scripts/delete-test-users.js
 */

require('dotenv').config({ override: true });
const { Pool } = require('pg');

const TEST_EMAILS = ['mom@test.com', 'dad@test.com'];

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Neo4j client (optional - will skip if not configured)
let neo4jClient = null;
try {
  neo4jClient = require('../src/infrastructure/database/neo4jClient');
} catch (error) {
  console.log('⚠️  Neo4j client not available - skipping Neo4j cleanup');
}

async function deleteNeo4jUser(userId) {
  if (!neo4jClient || !neo4jClient.isNeo4jConfigured) {
    return;
  }

  try {
    const { _executeCypher } = neo4jClient;
    if (!_executeCypher) {
      console.log(`   ⚠️  Neo4j executeCypher not available`);
      return;
    }

    // Delete user node and all relationships
    const query = `
      MATCH (u:User {userId: $userId})-[r]-()
      DELETE r, u
    `;

    await _executeCypher(query, { userId: parseInt(userId) });
    console.log(`   ✅ Deleted Neo4j node and relationships for user ${userId}`);
  } catch (error) {
    // Log but don't fail - Neo4j cleanup is optional
    console.log(`   ⚠️  Neo4j cleanup failed for user ${userId}: ${error.message}`);
  }
}

async function deleteUserData(userId, email) {
  const emailLower = email.toLowerCase().trim();
  console.log(`\n🗑️  Deleting data for user: ${emailLower} (ID: ${userId})`);

  const deleted = {
    messages: 0,
    messageFlags: 0,
    relationshipInsights: 0,
    escalationTracking: 0,
    communicationStats: 0,
    userInterventionPreferences: 0,
    tasks: 0,
    contacts: 0,
    pendingConnections: 0,
    roomInvites: 0,
    invitations: 0,
    roomMembers: 0,
    rooms: 0,
    userContext: 0,
    userDemographics: 0,
    userEmployment: 0,
    userHealthContext: 0,
    userFinancials: 0,
    userBackground: 0,
    communicationProfiles: 0,
    userValuesProfile: 0,
    userNarrativeProfile: 0,
  };

  try {
    // 1. Delete messages sent by user (using user_email)
    const messagesResult = await db.query(
      'DELETE FROM messages WHERE user_email = $1 RETURNING id',
      [emailLower]
    );
    deleted.messages = messagesResult.rowCount;
    if (deleted.messages > 0) {
      console.log(`   ✅ Deleted ${deleted.messages} messages`);
    }

    // 2. Delete message flags (using flagged_by_email)
    const messageFlagsResult = await db.query(
      'DELETE FROM message_flags WHERE flagged_by_email = $1 RETURNING id',
      [emailLower]
    );
    deleted.messageFlags = messageFlagsResult.rowCount;
    if (deleted.messageFlags > 0) {
      console.log(`   ✅ Deleted ${deleted.messageFlags} message flags`);
    }

    // 3. Get room IDs first (needed for relationship_insights and escalation_tracking)
    const roomMembersResult = await db.query(
      'SELECT room_id FROM room_members WHERE user_id = $1',
      [userId]
    );
    const roomIds = roomMembersResult.rows.map(r => r.room_id);

    // 4. Delete relationship insights (uses room_id)
    if (roomIds.length > 0) {
      const relationshipInsightsResult = await db.query(
        'DELETE FROM relationship_insights WHERE room_id = ANY($1::text[]) RETURNING room_id',
        [roomIds]
      );
      deleted.relationshipInsights = relationshipInsightsResult.rowCount;
      if (deleted.relationshipInsights > 0) {
        console.log(`   ✅ Deleted ${deleted.relationshipInsights} relationship insights`);
      }
    }

    // 5. Delete escalation tracking (uses room_id)
    if (roomIds.length > 0) {
      const escalationResult = await db.query(
        'DELETE FROM escalation_tracking WHERE room_id = ANY($1::text[]) RETURNING id',
        [roomIds]
      );
      deleted.escalationTracking = escalationResult.rowCount;
      if (deleted.escalationTracking > 0) {
        console.log(`   ✅ Deleted ${deleted.escalationTracking} escalation records`);
      }
    }

    // 6. Delete communication stats (uses user_id)
    const commStatsResult = await db.query(
      'DELETE FROM communication_stats WHERE user_id = $1 RETURNING id',
      [userId]
    );
    deleted.communicationStats = commStatsResult.rowCount;
    if (deleted.communicationStats > 0) {
      console.log(`   ✅ Deleted ${deleted.communicationStats} communication stats`);
    }

    // 7. Delete user intervention preferences
    const interventionResult = await db.query(
      'DELETE FROM user_intervention_preferences WHERE user_id = $1 RETURNING user_id',
      [userId]
    );
    deleted.userInterventionPreferences = interventionResult.rowCount;
    if (deleted.userInterventionPreferences > 0) {
      console.log(`   ✅ Deleted ${deleted.userInterventionPreferences} intervention preferences`);
    }

    // 8. Delete tasks (assigned_to is TEXT/email, not user_id)
    const tasksResult = await db.query(
      'DELETE FROM tasks WHERE user_id = $1 OR assigned_to = $2 RETURNING id',
      [userId, emailLower]
    );
    deleted.tasks = tasksResult.rowCount;
    if (deleted.tasks > 0) {
      console.log(`   ✅ Deleted ${deleted.tasks} tasks`);
    }

    // 9. Delete contacts (both where user is the owner and where user is the contact)
    const contactsResult = await db.query(
      'DELETE FROM contacts WHERE user_id = $1 OR linked_user_id = $1 RETURNING id',
      [userId]
    );
    deleted.contacts = contactsResult.rowCount;
    if (deleted.contacts > 0) {
      console.log(`   ✅ Deleted ${deleted.contacts} contacts`);
    }

    // 10. Delete pending connections (uses inviter_id and invitee_email)
    const pendingConnectionsResult = await db.query(
      'DELETE FROM pending_connections WHERE inviter_id = $1 OR invitee_email = $2 RETURNING id',
      [userId, emailLower]
    );
    deleted.pendingConnections = pendingConnectionsResult.rowCount;
    if (deleted.pendingConnections > 0) {
      console.log(`   ✅ Deleted ${deleted.pendingConnections} pending connections`);
    }

    // 11. Delete room invites (uses invited_by)
    const roomInvitesResult = await db.query(
      'DELETE FROM room_invites WHERE invited_by = $1 RETURNING id',
      [userId]
    );
    deleted.roomInvites = roomInvitesResult.rowCount;
    if (deleted.roomInvites > 0) {
      console.log(`   ✅ Deleted ${deleted.roomInvites} room invites`);
    }

    // 12. Delete invitations (both sent and received)
    const invitationsResult = await db.query(
      'DELETE FROM invitations WHERE inviter_id = $1 OR invitee_id = $1 RETURNING id',
      [userId]
    );
    deleted.invitations = invitationsResult.rowCount;
    if (deleted.invitations > 0) {
      console.log(`   ✅ Deleted ${deleted.invitations} invitations`);
    }

    // 13. Delete room memberships (roomIds already fetched above)
    const membersResult = await db.query(
      'DELETE FROM room_members WHERE user_id = $1 RETURNING room_id',
      [userId]
    );
    deleted.roomMembers = membersResult.rowCount;
    if (deleted.roomMembers > 0) {
      console.log(`   ✅ Deleted ${deleted.roomMembers} room memberships`);
    }

    // 14. Delete rooms created by this user (if no other members remain)
    if (roomIds.length > 0) {
      for (const roomId of roomIds) {
        const roomMembersCheck = await db.query(
          'SELECT COUNT(*) as count FROM room_members WHERE room_id = $1',
          [roomId]
        );
        if (roomMembersCheck.rows[0].count === '0') {
          const roomsResult = await db.query('DELETE FROM rooms WHERE id = $1 RETURNING id', [
            roomId,
          ]);
          if (roomsResult.rowCount > 0) {
            deleted.rooms++;
            console.log(`   ✅ Deleted empty room: ${roomId}`);
          }
        }
      }
    }

    // Also delete rooms where user is the creator
    const createdRoomsResult = await db.query(
      'DELETE FROM rooms WHERE created_by = $1 RETURNING id',
      [userId]
    );
    deleted.rooms += createdRoomsResult.rowCount;
    if (createdRoomsResult.rowCount > 0) {
      console.log(`   ✅ Deleted ${createdRoomsResult.rowCount} rooms created by user`);
    }

    // 15. Delete user context
    const userContextResult = await db.query(
      'DELETE FROM user_context WHERE user_email = $1 RETURNING user_email',
      [email]
    );
    deleted.userContext = userContextResult.rowCount;
    if (deleted.userContext > 0) {
      console.log(`   ✅ Deleted user context`);
    }

    // 16. Delete user profile tables (if they exist)
    const profileTables = [
      'user_demographics',
      'user_employment',
      'user_health_context',
      'user_financials',
      'user_background',
      'communication_profiles',
      'user_values_profile',
      'user_narrative_profile',
    ];

    for (const table of profileTables) {
      try {
        const result = await db.query(`DELETE FROM ${table} WHERE user_id = $1 RETURNING user_id`, [
          userId,
        ]);
        const count = result.rowCount;
        if (count > 0) {
          deleted[table] = count;
          console.log(`   ✅ Deleted ${count} records from ${table}`);
        }
      } catch (error) {
        // Table might not exist, ignore
        if (!error.message.includes('does not exist')) {
          console.log(`   ⚠️  Error deleting from ${table}: ${error.message}`);
        }
      }
    }

    // 17. Delete Neo4j data
    await deleteNeo4jUser(userId);

    // 18. Finally, delete the user (CASCADE will handle any remaining references)
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log(`   ✅ Deleted user: ${email}`);

    return deleted;
  } catch (error) {
    console.error(`   ❌ Error deleting data for user ${email}:`, error.message);
    throw error;
  }
}

async function deleteTestUsers() {
  console.log('🧹 Starting deletion of test users...\n');
  console.log(`📋 Target emails: ${TEST_EMAILS.join(', ')}\n`);

  try {
    await db.query('BEGIN');

    const results = [];

    for (const email of TEST_EMAILS) {
      const emailLower = email.toLowerCase().trim();

      // Find the user
      const userResult = await db.query('SELECT id, email FROM users WHERE email = $1', [
        emailLower,
      ]);

      if (userResult.rows.length === 0) {
        console.log(`ℹ️  User not found: ${emailLower}`);
        results.push({ email: emailLower, found: false });
        continue;
      }

      const user = userResult.rows[0];
      console.log(`\n👤 Found user: ${user.email} (ID: ${user.id})`);

      const deleted = await deleteUserData(user.id, emailLower);
      results.push({ email: emailLower, found: true, userId: user.id, deleted });
    }

    // Clean up any orphaned data
    console.log('\n🧹 Cleaning up orphaned data...');

    // Delete orphaned room members
    const orphanedMembers = await db.query(
      'DELETE FROM room_members WHERE user_id NOT IN (SELECT id FROM users) RETURNING id'
    );
    if (orphanedMembers.rowCount > 0) {
      console.log(`   ✅ Deleted ${orphanedMembers.rowCount} orphaned room members`);
    }

    // Delete empty rooms
    const emptyRooms = await db.query(
      `DELETE FROM rooms 
       WHERE id NOT IN (
         SELECT DISTINCT room_id FROM room_members WHERE room_id IS NOT NULL
       ) RETURNING id`
    );
    if (emptyRooms.rowCount > 0) {
      console.log(`   ✅ Deleted ${emptyRooms.rowCount} empty rooms`);
    }

    // Delete orphaned messages
    const orphanedMessages = await db.query(
      `DELETE FROM messages 
       WHERE room_id IS NOT NULL 
       AND room_id NOT IN (SELECT id FROM rooms) RETURNING id`
    );
    if (orphanedMessages.rowCount > 0) {
      console.log(`   ✅ Deleted ${orphanedMessages.rowCount} orphaned messages`);
    }

    // Commit transaction
    await db.query('COMMIT');
    console.log('\n✅ Deletion complete!');

    // Summary
    console.log('\n📊 Deletion Summary:');
    for (const result of results) {
      if (result.found) {
        console.log(`\n   ${result.email} (ID: ${result.userId}):`);
        const total = Object.values(result.deleted || {}).reduce((a, b) => a + b, 0);
        console.log(`      Total records deleted: ${total}`);
      } else {
        console.log(`\n   ${result.email}: Not found`);
      }
    }
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('\n❌ Deletion failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await db.end();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes('--confirm');

  if (!confirmed) {
    console.log('⚠️  WARNING: This will delete test users and ALL their data!');
    console.log('⚠️  This includes:');
    console.log('   - User accounts (email, password, profile)');
    console.log('   - All chat messages');
    console.log('   - All contacts');
    console.log('   - All tasks');
    console.log('   - All rooms and memberships');
    console.log('   - All invitations');
    console.log('   - All communication stats');
    console.log('   - All profile data');
    console.log('   - Neo4j nodes and relationships');
    console.log('   - ALL other user-related data');
    console.log('\n⚠️  This action CANNOT be undone!\n');
    console.log('Target emails:', TEST_EMAILS.join(', '));
    console.log('\nTo confirm deletion, run:');
    console.log('   node chat-server/scripts/delete-test-users.js --confirm\n');
    process.exit(1);
  }

  try {
    await deleteTestUsers();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
