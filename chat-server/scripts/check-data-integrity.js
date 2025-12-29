#!/usr/bin/env node
/**
 * Data Integrity Check Script
 * 
 * Detects:
 * - Email mismatches between messages.user_email and users.email
 * - Messages with missing user records
 * - Inconsistent naming conventions
 * - Empty/null values in critical fields
 * - Orphaned records
 * - Room membership issues
 * - Pairing inconsistencies
 * 
 * Usage: node scripts/check-data-integrity.js [--production] [--fix]
 */

require('dotenv').config();
const { Pool } = require('pg');

const isProduction = process.argv.includes('--production');
const shouldFix = process.argv.includes('--fix');
const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

// Determine SSL requirement from DATABASE_URL (Railway/Heroku use SSL)
const requiresSSL = DATABASE_URL.includes('railway.app') || 
                    DATABASE_URL.includes('heroku.com') ||
                    DATABASE_URL.includes('amazonaws.com');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
});

const issues = {
  emailMismatches: [],
  missingUserRecords: [],
  emptyCriticalFields: [],
  orphanedMessages: [],
  orphanedRoomMembers: [],
  pairingInconsistencies: [],
  roomMembershipIssues: [],
  namingInconsistencies: [],
};

async function checkEmailMismatches() {
  console.log('\n🔍 Checking email mismatches between messages and users...\n');

  // First, get a count of all mismatches
  const countResult = await pool.query(`
    SELECT COUNT(*) as total
    FROM messages m
    LEFT JOIN users u ON m.user_email IS NOT NULL AND LOWER(TRIM(m.user_email)) = LOWER(TRIM(u.email))
    WHERE m.user_email IS NOT NULL
      AND (m.type IS NULL OR m.type != 'system')
      AND m.text NOT LIKE '%joined the chat%'
      AND m.text NOT LIKE '%left the chat%'
      AND (u.id IS NULL OR LOWER(TRIM(m.user_email)) != LOWER(TRIM(u.email)))
  `);
  const totalMismatches = parseInt(countResult.rows[0]?.total || 0, 10);

  if (totalMismatches === 0) {
    console.log('✅ No email mismatches found');
    return;
  }

  console.log(`⚠️  Found ${totalMismatches} messages with email mismatches (showing first 100):\n`);

  const result = await pool.query(`
    SELECT 
      m.id as message_id,
      m.user_email as message_email,
      m.room_id,
      m.timestamp,
      u.id as user_id,
      u.email as user_table_email,
      CASE 
        WHEN u.id IS NULL THEN 'missing_user'
        WHEN LOWER(TRIM(m.user_email)) != LOWER(TRIM(u.email)) THEN 'case_mismatch'
        ELSE 'match'
      END as issue_type
    FROM messages m
    LEFT JOIN users u ON m.user_email IS NOT NULL AND LOWER(TRIM(m.user_email)) = LOWER(TRIM(u.email))
    WHERE m.user_email IS NOT NULL
      AND (m.type IS NULL OR m.type != 'system')
      AND m.text NOT LIKE '%joined the chat%'
      AND m.text NOT LIKE '%left the chat%'
      AND (u.id IS NULL OR LOWER(TRIM(m.user_email)) != LOWER(TRIM(u.email)))
    ORDER BY m.timestamp DESC
    LIMIT 100
  `);

  if (result.rows.length > 0) {
    console.log(`⚠️  Found ${result.rows.length} messages with email mismatches:\n`);
    
    const byType = {};
    result.rows.forEach(row => {
      if (!byType[row.issue_type]) {
        byType[row.issue_type] = [];
      }
      byType[row.issue_type].push(row);
    });

    Object.entries(byType).forEach(([type, rows]) => {
      console.log(`  ${type}: ${rows.length} messages`);
      rows.slice(0, 5).forEach(row => {
        console.log(`    - Message ${row.message_id}: "${row.message_email}" (User: ${row.user_table_email || 'NULL'})`);
      });
      if (rows.length > 5) {
        console.log(`    ... and ${rows.length - 5} more`);
      }
    });

    issues.emailMismatches = result.rows;
  } else {
    console.log('✅ No email mismatches found');
  }
}

async function checkMissingUserRecords() {
  console.log('\n🔍 Checking for messages with missing user records...\n');

  const result = await pool.query(`
    SELECT 
      m.user_email,
      COUNT(*) as message_count,
      MIN(m.timestamp) as first_message,
      MAX(m.timestamp) as last_message,
      STRING_AGG(DISTINCT m.room_id::text, ', ') as room_ids
    FROM messages m
    LEFT JOIN users u ON m.user_email IS NOT NULL AND LOWER(TRIM(m.user_email)) = LOWER(TRIM(u.email))
    WHERE m.user_email IS NOT NULL
      AND (m.type IS NULL OR m.type != 'system')
      AND m.text NOT LIKE '%joined the chat%'
      AND m.text NOT LIKE '%left the chat%'
      AND u.id IS NULL
    GROUP BY m.user_email
    ORDER BY message_count DESC
  `);

  if (result.rows.length > 0) {
    console.log(`⚠️  Found ${result.rows.length} unique emails with missing user records:\n`);
    result.rows.forEach(row => {
      console.log(`  - ${row.user_email}: ${row.message_count} messages in rooms: ${row.room_ids}`);
    });
    issues.missingUserRecords = result.rows;
  } else {
    console.log('✅ All messages have corresponding user records');
  }
}

async function checkEmptyCriticalFields() {
  console.log('\n🔍 Checking for empty/null critical fields...\n');

  // Check messages
  const messagesResult = await pool.query(`
    SELECT 
      'messages' as table_name,
      COUNT(*) FILTER (WHERE user_email IS NULL OR user_email = '') as null_user_email,
      COUNT(*) FILTER (WHERE text IS NULL OR text = '') as null_text,
      COUNT(*) FILTER (WHERE room_id IS NULL OR room_id = '') as null_room_id,
      COUNT(*) FILTER (WHERE timestamp IS NULL) as null_timestamp
    FROM messages
    WHERE (type IS NULL OR type != 'system')
      AND text NOT LIKE '%joined the chat%'
      AND text NOT LIKE '%left the chat%'
  `);

  const msgIssues = messagesResult.rows[0];
  if (msgIssues.null_user_email > 0 || msgIssues.null_text > 0 || msgIssues.null_room_id > 0 || msgIssues.null_timestamp > 0) {
    console.log(`⚠️  Messages with empty/null fields:`);
    console.log(`    - user_email: ${msgIssues.null_user_email}`);
    console.log(`    - text: ${msgIssues.null_text}`);
    console.log(`    - room_id: ${msgIssues.null_room_id}`);
    console.log(`    - timestamp: ${msgIssues.null_timestamp}`);
    issues.emptyCriticalFields.push(msgIssues);
  } else {
    console.log('✅ All messages have required fields');
  }

  // Check users
  const usersResult = await pool.query(`
    SELECT 
      'users' as table_name,
      COUNT(*) FILTER (WHERE email IS NULL OR email = '') as null_email,
      COUNT(*) FILTER (WHERE id IS NULL) as null_id
    FROM users
  `);

  const userIssues = usersResult.rows[0];
  if (userIssues.null_email > 0 || userIssues.null_id > 0) {
    console.log(`⚠️  Users with empty/null fields:`);
    console.log(`    - email: ${userIssues.null_email}`);
    console.log(`    - id: ${userIssues.null_id}`);
    issues.emptyCriticalFields.push(userIssues);
  }

  // Check room_members
  const roomMembersResult = await pool.query(`
    SELECT 
      'room_members' as table_name,
      COUNT(*) FILTER (WHERE user_id IS NULL) as null_user_id,
      COUNT(*) FILTER (WHERE room_id IS NULL OR room_id = '') as null_room_id
    FROM room_members
  `);

  const rmIssues = roomMembersResult.rows[0];
  if (rmIssues.null_user_id > 0 || rmIssues.null_room_id > 0) {
    console.log(`⚠️  Room members with empty/null fields:`);
    console.log(`    - user_id: ${rmIssues.null_user_id}`);
    console.log(`    - room_id: ${rmIssues.null_room_id}`);
    issues.emptyCriticalFields.push(rmIssues);
  }
}

async function checkOrphanedMessages() {
  console.log('\n🔍 Checking for orphaned messages (messages without rooms)...\n');

  const result = await pool.query(`
    SELECT 
      m.id,
      m.user_email,
      m.room_id,
      m.timestamp,
      COUNT(*) OVER (PARTITION BY m.room_id) as messages_in_room
    FROM messages m
    LEFT JOIN rooms r ON m.room_id = r.id
    WHERE m.room_id IS NOT NULL
      AND r.id IS NULL
      AND (m.type IS NULL OR m.type != 'system')
    ORDER BY m.timestamp DESC
    LIMIT 50
  `);

  if (result.rows.length > 0) {
    console.log(`⚠️  Found ${result.rows.length} orphaned messages (room doesn't exist):\n`);
    result.rows.slice(0, 10).forEach(row => {
      console.log(`  - Message ${row.id} in room ${row.room_id} (${row.messages_in_room} messages in this room)`);
    });
    issues.orphanedMessages = result.rows;
  } else {
    console.log('✅ No orphaned messages found');
  }
}

async function checkOrphanedRoomMembers() {
  console.log('\n🔍 Checking for orphaned room members...\n');

  const result = await pool.query(`
    SELECT 
      rm.room_id,
      rm.user_id,
      u.email,
      CASE 
        WHEN r.id IS NULL THEN 'missing_room'
        WHEN u.id IS NULL THEN 'missing_user'
        ELSE 'ok'
      END as issue_type
    FROM room_members rm
    LEFT JOIN rooms r ON rm.room_id = r.id
    LEFT JOIN users u ON rm.user_id = u.id
    WHERE r.id IS NULL OR u.id IS NULL
    ORDER BY rm.room_id
  `);

  if (result.rows.length > 0) {
    console.log(`⚠️  Found ${result.rows.length} orphaned room members:\n`);
    const byType = {};
    result.rows.forEach(row => {
      if (!byType[row.issue_type]) {
        byType[row.issue_type] = [];
      }
      byType[row.issue_type].push(row);
    });

    Object.entries(byType).forEach(([type, rows]) => {
      console.log(`  ${type}: ${rows.length} records`);
      rows.slice(0, 5).forEach(row => {
        console.log(`    - Room ${row.room_id}, User ${row.user_id} (${row.email || 'NULL'})`);
      });
    });
    issues.orphanedRoomMembers = result.rows;
  } else {
    console.log('✅ No orphaned room members found');
  }
}

async function checkPairingInconsistencies() {
  console.log('\n🔍 Checking pairing inconsistencies...\n');

  // Check for pairings with missing users
  const missingUsersResult = await pool.query(`
    SELECT 
      ps.id as pairing_id,
      ps.parent_a_id,
      ps.parent_b_id,
      ps.shared_room_id,
      ps.status,
      CASE 
        WHEN ua.id IS NULL THEN 'missing_parent_a'
        WHEN ub.id IS NULL AND ps.parent_b_id IS NOT NULL THEN 'missing_parent_b'
        ELSE 'ok'
      END as issue_type
    FROM pairing_sessions ps
    LEFT JOIN users ua ON ps.parent_a_id = ua.id
    LEFT JOIN users ub ON ps.parent_b_id = ub.id
    WHERE ua.id IS NULL OR (ps.parent_b_id IS NOT NULL AND ub.id IS NULL)
  `);

  if (missingUsersResult.rows.length > 0) {
    console.log(`⚠️  Found ${missingUsersResult.rows.length} pairings with missing users:\n`);
    missingUsersResult.rows.forEach(row => {
      console.log(`  - Pairing ${row.pairing_id}: ${row.issue_type} (Room: ${row.shared_room_id || 'NULL'})`);
    });
    issues.pairingInconsistencies.push(...missingUsersResult.rows);
  }

  // Check for pairings with missing rooms
  const missingRoomsResult = await pool.query(`
    SELECT 
      ps.id as pairing_id,
      ps.shared_room_id,
      ps.status,
      r.id as room_exists
    FROM pairing_sessions ps
    LEFT JOIN rooms r ON ps.shared_room_id = r.id
    WHERE ps.shared_room_id IS NOT NULL
      AND ps.status = 'active'
      AND r.id IS NULL
  `);

  if (missingRoomsResult.rows.length > 0) {
    console.log(`⚠️  Found ${missingRoomsResult.rows.length} active pairings with missing rooms:\n`);
    missingRoomsResult.rows.forEach(row => {
      console.log(`  - Pairing ${row.pairing_id}: Room ${row.shared_room_id} doesn't exist`);
    });
    issues.pairingInconsistencies.push(...missingRoomsResult.rows);
  }

  if (missingUsersResult.rows.length === 0 && missingRoomsResult.rows.length === 0) {
    console.log('✅ No pairing inconsistencies found');
  }
}

async function checkRoomMembershipIssues() {
  console.log('\n🔍 Checking room membership issues...\n');

  // Check for rooms with no members
  const noMembersResult = await pool.query(`
    SELECT 
      r.id,
      r.name,
      COUNT(rm.user_id) as member_count
    FROM rooms r
    LEFT JOIN room_members rm ON r.id = rm.room_id
    GROUP BY r.id, r.name
    HAVING COUNT(rm.user_id) = 0
    ORDER BY r.created_at DESC
  `);

  if (noMembersResult.rows.length > 0) {
    console.log(`⚠️  Found ${noMembersResult.rows.length} rooms with no members:\n`);
    noMembersResult.rows.slice(0, 10).forEach(row => {
      console.log(`  - ${row.name || row.id}`);
    });
    issues.roomMembershipIssues.push(...noMembersResult.rows);
  }

  // Check for rooms with only one member (should have 2 for co-parenting)
  const singleMemberResult = await pool.query(`
    SELECT 
      r.id,
      r.name,
      COUNT(DISTINCT rm.user_id) as member_count,
      STRING_AGG(DISTINCT u.email, ', ') as member_emails
    FROM rooms r
    LEFT JOIN room_members rm ON r.id = rm.room_id
    LEFT JOIN users u ON rm.user_id = u.id
    GROUP BY r.id, r.name
    HAVING COUNT(DISTINCT rm.user_id) = 1
    ORDER BY r.created_at DESC
  `);

  if (singleMemberResult.rows.length > 0) {
    console.log(`⚠️  Found ${singleMemberResult.rows.length} rooms with only one member:\n`);
    singleMemberResult.rows.slice(0, 10).forEach(row => {
      console.log(`  - ${row.name || row.id}: ${row.member_emails}`);
    });
    issues.roomMembershipIssues.push(...singleMemberResult.rows);
  }

  if (noMembersResult.rows.length === 0 && singleMemberResult.rows.length === 0) {
    console.log('✅ No room membership issues found');
  }
}

async function checkNamingInconsistencies() {
  console.log('\n🔍 Checking naming convention inconsistencies...\n');

  // Check for case mismatches in emails
  const caseMismatchResult = await pool.query(`
    SELECT 
      m.user_email as message_email,
      u.email as user_email,
      COUNT(*) as message_count
    FROM messages m
    JOIN users u ON m.user_email IS NOT NULL 
      AND LOWER(TRIM(m.user_email)) = LOWER(TRIM(u.email))
      AND m.user_email != u.email
    WHERE (m.type IS NULL OR m.type != 'system')
    GROUP BY m.user_email, u.email
    ORDER BY message_count DESC
    LIMIT 20
  `);

  if (caseMismatchResult.rows.length > 0) {
    console.log(`⚠️  Found ${caseMismatchResult.rows.length} case mismatches in emails:\n`);
    caseMismatchResult.rows.forEach(row => {
      console.log(`  - Message: "${row.message_email}" vs User: "${row.user_email}" (${row.message_count} messages)`);
    });
    issues.namingInconsistencies.push(...caseMismatchResult.rows);
  }

  // Check for whitespace issues
  const whitespaceResult = await pool.query(`
    SELECT 
      m.user_email,
      LENGTH(m.user_email) as original_length,
      LENGTH(TRIM(m.user_email)) as trimmed_length,
      COUNT(*) as message_count
    FROM messages m
    WHERE m.user_email IS NOT NULL
      AND m.user_email != TRIM(m.user_email)
      AND (m.type IS NULL OR m.type != 'system')
    GROUP BY m.user_email, LENGTH(m.user_email), LENGTH(TRIM(m.user_email))
    ORDER BY message_count DESC
    LIMIT 20
  `);

  if (whitespaceResult.rows.length > 0) {
    console.log(`⚠️  Found ${whitespaceResult.rows.length} emails with whitespace issues:\n`);
    whitespaceResult.rows.forEach(row => {
      console.log(`  - "${row.user_email}" (${row.message_count} messages, ${row.original_length - row.trimmed_length} extra spaces)`);
    });
    issues.namingInconsistencies.push(...whitespaceResult.rows);
  }

  if (caseMismatchResult.rows.length === 0 && whitespaceResult.rows.length === 0) {
    console.log('✅ No naming inconsistencies found');
  }
}

async function generateSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DATA INTEGRITY SUMMARY');
  console.log('='.repeat(60) + '\n');

  const totalIssues = 
    issues.emailMismatches.length +
    issues.missingUserRecords.length +
    issues.emptyCriticalFields.length +
    issues.orphanedMessages.length +
    issues.orphanedRoomMembers.length +
    issues.pairingInconsistencies.length +
    issues.roomMembershipIssues.length +
    issues.namingInconsistencies.length;

  console.log(`Total Issues Found: ${totalIssues}\n`);

  console.log('Breakdown:');
  console.log(`  - Email mismatches: ${issues.emailMismatches.length}`);
  console.log(`  - Missing user records: ${issues.missingUserRecords.length}`);
  console.log(`  - Empty critical fields: ${issues.emptyCriticalFields.length}`);
  console.log(`  - Orphaned messages: ${issues.orphanedMessages.length}`);
  console.log(`  - Orphaned room members: ${issues.orphanedRoomMembers.length}`);
  console.log(`  - Pairing inconsistencies: ${issues.pairingInconsistencies.length}`);
  console.log(`  - Room membership issues: ${issues.roomMembershipIssues.length}`);
  console.log(`  - Naming inconsistencies: ${issues.namingInconsistencies.length}`);

  if (totalIssues === 0) {
    console.log('\n✅ No data integrity issues found!');
  } else {
    console.log('\n⚠️  Issues detected. Review the details above.');
    if (shouldFix) {
      console.log('\n💡 Use --fix flag to attempt automatic fixes (not implemented yet)');
    }
  }
}

async function main() {
  try {
    console.log(`\n🔍 Data Integrity Check (${isProduction ? 'PRODUCTION' : 'LOCAL'})\n`);

    await checkEmailMismatches();
    await checkMissingUserRecords();
    await checkEmptyCriticalFields();
    await checkOrphanedMessages();
    await checkOrphanedRoomMembers();
    await checkPairingInconsistencies();
    await checkRoomMembershipIssues();
    await checkNamingInconsistencies();

    await generateSummary();

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    await pool.end();
    process.exit(1);
  }
}

main();

