#!/usr/bin/env node
/**
 * Fix Messages with +digit Prefix
 *
 * Removes accidental "+1", "+7", etc. prefixes from messages
 * that were incorrectly imported from CSV (phone number column merged with text).
 *
 * USAGE:
 *   node scripts/fix-plus-prefix-messages.js          # Preview only
 *   node scripts/fix-plus-prefix-messages.js --fix    # Actually fix
 *
 * Run this with the production DATABASE_URL:
 *   DATABASE_URL="postgresql://..." node scripts/fix-plus-prefix-messages.js --fix
 */

const path = require('path');
const readline = require('readline');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = require('pg');

async function main() {
  const fixMode = process.argv.includes('--fix');

  console.log('\n🔧 Fix +digit Prefix Messages');
  console.log('══════════════════════════════\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set');
    console.log('\nTo fix production database, run with:');
    console.log('  DATABASE_URL="postgresql://..." node scripts/fix-plus-prefix-messages.js --fix');
    process.exit(1);
  }

  // Show which database we're connecting to
  if (databaseUrl.includes('localhost')) {
    console.log('📍 Database: LOCAL');
  } else if (databaseUrl.includes('railway')) {
    console.log('📍 Database: RAILWAY PRODUCTION');
  } else {
    console.log('📍 Database: REMOTE');
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  try {
    // Find messages with +digit prefix pattern
    // Pattern: starts with + followed by 1-2 digits, then a letter or space
    const result = await pool.query(`
      SELECT id, username, text, timestamp
      FROM messages
      WHERE text ~ '^\\+[0-9]{1,2}[A-Za-z ]'
      ORDER BY timestamp
    `);

    if (result.rows.length === 0) {
      console.log('✅ No messages with +digit prefix found!\n');
      await pool.end();
      return;
    }

    console.log(`📋 Found ${result.rows.length} messages with +digit prefix:\n`);

    // Show samples
    const samples = result.rows.slice(0, 10);
    console.log('   Username     Before → After');
    console.log('   ──────────   ─────────────────────────────────────');

    for (const row of samples) {
      const fixed = row.text.replace(/^\+[0-9]{1,2}/, '');
      const before = row.text.substring(0, 35).padEnd(35);
      const after = fixed.substring(0, 35);
      console.log(`   ${row.username.padEnd(12)} "${before}" → "${after}"`);
    }

    if (result.rows.length > 10) {
      console.log(`   ... and ${result.rows.length - 10} more`);
    }

    console.log(`\n   Total: ${result.rows.length} messages to fix\n`);

    if (!fixMode) {
      console.log('ℹ️  This was a preview. To fix these messages, run:');
      console.log(
        '   DATABASE_URL="your-connection-string" node scripts/fix-plus-prefix-messages.js --fix\n'
      );
      await pool.end();
      return;
    }

    // Confirm fix
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const confirmed = await new Promise(resolve => {
      rl.question(
        `\n⚠️  Fix ${result.rows.length} messages by removing +digit prefix? (yes/no): `,
        answer => {
          rl.close();
          resolve(answer.toLowerCase() === 'yes');
        }
      );
    });

    if (!confirmed) {
      console.log('\n❌ Fix cancelled.\n');
      await pool.end();
      return;
    }

    // Fix the messages
    const updateResult = await pool.query(`
      UPDATE messages
      SET text = regexp_replace(text, '^\\+[0-9]{1,2}', '')
      WHERE text ~ '^\\+[0-9]{1,2}[A-Za-z ]'
    `);

    console.log(`\n✅ Fixed ${updateResult.rowCount} messages.\n`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
