#!/usr/bin/env node
/**
 * Data Integrity Fix Script
 * 
 * Automatically fixes common data integrity issues:
 * - Creates missing user records from messages
 * - Fixes email case mismatches
 * - Removes whitespace from emails
 * - Cleans up orphaned records
 * 
 * Usage: node scripts/fix-data-integrity.js [--production] [--dry-run]
 */

require('dotenv').config();
const { Pool } = require('pg');

const isProduction = process.argv.includes('--production');
const isDryRun = process.argv.includes('--dry-run');
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

const fixes = {
  emailsNormalized: 0,
  missingUsersCreated: 0,
  orphanedRecordsRemoved: 0,
  caseMismatchesFixed: 0,
};

async function normalizeEmailCase() {
  console.log('\n🔧 Fixing email case mismatches...\n');

  // Find messages with case mismatches
  const mismatches = await pool.query(`
    SELECT DISTINCT
      m.user_email as message_email,
      u.email as user_email,
      u.id as user_id
    FROM messages m
    JOIN users u ON m.user_email IS NOT NULL 
      AND LOWER(TRIM(m.user_email)) = LOWER(TRIM(u.email))
      AND m.user_email != u.email
    WHERE (m.type IS NULL OR m.type != 'system')
    LIMIT 100
  `);

  if (mismatches.rows.length === 0) {
    console.log('✅ No case mismatches to fix');
    return;
  }

  console.log(`Found ${mismatches.rows.length} case mismatches`);

  for (const row of mismatches.rows) {
    const normalizedEmail = row.user_email.toLowerCase().trim();
    
    if (isDryRun) {
      console.log(`  [DRY RUN] Would update messages.user_email: "${row.message_email}" → "${normalizedEmail}"`);
      fixes.caseMismatchesFixed++;
    } else {
      try {
        const result = await pool.query(
          `UPDATE messages 
           SET user_email = $1 
           WHERE user_email = $2 
             AND (type IS NULL OR type != 'system')`,
          [normalizedEmail, row.message_email]
        );
        if (result.rowCount > 0) {
          console.log(`  ✅ Updated ${result.rowCount} messages: "${row.message_email}" → "${normalizedEmail}"`);
          fixes.caseMismatchesFixed += result.rowCount;
        }
      } catch (error) {
        console.error(`  ❌ Error updating "${row.message_email}":`, error.message);
      }
    }
  }
}

async function removeWhitespaceFromEmails() {
  console.log('\n🔧 Removing whitespace from emails...\n');

  const whitespaceIssues = await pool.query(`
    SELECT DISTINCT user_email
    FROM messages
    WHERE user_email IS NOT NULL
      AND user_email != TRIM(user_email)
      AND (type IS NULL OR type != 'system')
    LIMIT 100
  `);

  if (whitespaceIssues.rows.length === 0) {
    console.log('✅ No whitespace issues to fix');
    return;
  }

  console.log(`Found ${whitespaceIssues.rows.length} emails with whitespace`);

  for (const row of whitespaceIssues.rows) {
    const trimmedEmail = row.user_email.trim();
    
    if (isDryRun) {
      console.log(`  [DRY RUN] Would trim: "${row.user_email}" → "${trimmedEmail}"`);
      fixes.emailsNormalized++;
    } else {
      try {
        const result = await pool.query(
          `UPDATE messages 
           SET user_email = TRIM(user_email) 
           WHERE user_email = $1 
             AND (type IS NULL OR type != 'system')`,
          [row.user_email]
        );
        if (result.rowCount > 0) {
          console.log(`  ✅ Trimmed ${result.rowCount} messages: "${row.user_email}" → "${trimmedEmail}"`);
          fixes.emailsNormalized += result.rowCount;
        }
      } catch (error) {
        console.error(`  ❌ Error trimming "${row.user_email}":`, error.message);
      }
    }
  }
}

async function createMissingUserRecords() {
  console.log('\n🔧 Creating missing user records from messages...\n');

  const missingUsers = await pool.query(`
    SELECT 
      m.user_email,
      COUNT(*) as message_count,
      MIN(m.timestamp) as first_message,
      MAX(m.timestamp) as last_message
    FROM messages m
    LEFT JOIN users u ON m.user_email IS NOT NULL AND LOWER(TRIM(m.user_email)) = LOWER(TRIM(u.email))
    WHERE m.user_email IS NOT NULL
      AND (m.type IS NULL OR m.type != 'system')
      AND m.text NOT LIKE '%joined the chat%'
      AND m.text NOT LIKE '%left the chat%'
      AND u.id IS NULL
      AND m.user_email NOT LIKE '%@migration.placeholder%'
      AND m.user_email NOT LIKE '%@test.com%'
    GROUP BY m.user_email
    ORDER BY message_count DESC
    LIMIT 50
  `);

  if (missingUsers.rows.length === 0) {
    console.log('✅ No missing user records to create (excluding placeholders)');
    return;
  }

  console.log(`Found ${missingUsers.rows.length} missing user records`);

  for (const row of missingUsers.rows) {
    const email = row.user_email.toLowerCase().trim();
    const emailParts = email.split('@');
    const username = emailParts[0] || 'user';
    
    if (isDryRun) {
      console.log(`  [DRY RUN] Would create user: ${email} (${row.message_count} messages)`);
      fixes.missingUsersCreated++;
    } else {
      try {
        // Check if user was created between query and now
        const existingCheck = await pool.query(
          'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
          [email]
        );

        if (existingCheck.rows.length > 0) {
          console.log(`  ⚠️  User already exists: ${email}`);
          continue;
        }

        const result = await pool.query(
          `INSERT INTO users (email, username, created_at, updated_at)
           VALUES ($1, $2, $3, $3)
           RETURNING id, email`,
          [email, username, row.first_message || new Date()]
        );

        if (result.rows.length > 0) {
          console.log(`  ✅ Created user: ${email} (ID: ${result.rows[0].id}, ${row.message_count} messages)`);
          fixes.missingUsersCreated++;
        }
      } catch (error) {
        console.error(`  ❌ Error creating user "${email}":`, error.message);
      }
    }
  }
}

async function removeOrphanedRoomMembers() {
  console.log('\n🔧 Removing orphaned room members...\n');

  const orphaned = await pool.query(`
    SELECT rm.room_id, rm.user_id
    FROM room_members rm
    LEFT JOIN rooms r ON rm.room_id = r.id
    LEFT JOIN users u ON rm.user_id = u.id
    WHERE r.id IS NULL OR u.id IS NULL
  `);

  if (orphaned.rows.length === 0) {
    console.log('✅ No orphaned room members to remove');
    return;
  }

  console.log(`Found ${orphaned.rows.length} orphaned room members`);

  if (isDryRun) {
    orphaned.rows.forEach(row => {
      console.log(`  [DRY RUN] Would remove: Room ${row.room_id}, User ${row.user_id}`);
    });
    fixes.orphanedRecordsRemoved = orphaned.rows.length;
  } else {
    for (const row of orphaned.rows) {
      try {
        const result = await pool.query(
          'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
          [row.room_id, row.user_id]
        );
        if (result.rowCount > 0) {
          console.log(`  ✅ Removed orphaned member: Room ${row.room_id}, User ${row.user_id}`);
          fixes.orphanedRecordsRemoved++;
        }
      } catch (error) {
        console.error(`  ❌ Error removing orphaned member:`, error.message);
      }
    }
  }
}

async function generateSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 FIX SUMMARY');
  console.log('='.repeat(60) + '\n');

  const totalFixes = 
    fixes.emailsNormalized +
    fixes.missingUsersCreated +
    fixes.orphanedRecordsRemoved +
    fixes.caseMismatchesFixed;

  if (isDryRun) {
    console.log(`[DRY RUN] Would apply ${totalFixes} fixes:\n`);
  } else {
    console.log(`Applied ${totalFixes} fixes:\n`);
  }

  console.log('Breakdown:');
  console.log(`  - Emails normalized: ${fixes.emailsNormalized}`);
  console.log(`  - Missing users created: ${fixes.missingUsersCreated}`);
  console.log(`  - Orphaned records removed: ${fixes.orphanedRecordsRemoved}`);
  console.log(`  - Case mismatches fixed: ${fixes.caseMismatchesFixed}`);

  if (totalFixes === 0) {
    console.log('\n✅ No fixes needed!');
  } else if (isDryRun) {
    console.log('\n💡 Run without --dry-run to apply these fixes');
  } else {
    console.log('\n✅ Fixes applied successfully!');
  }
}

async function main() {
  try {
    console.log(`\n🔧 Data Integrity Fix (${isProduction ? 'PRODUCTION' : 'LOCAL'})`);
    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    } else {
      console.log('⚠️  LIVE MODE - Changes will be applied\n');
    }

    await normalizeEmailCase();
    await removeWhitespaceFromEmails();
    await createMissingUserRecords();
    await removeOrphanedRoomMembers();

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

