#!/usr/bin/env node
/**
 * Cleanup iMessage Reaction Messages
 *
 * Removes short messages that are iMessage tapback reactions
 * (e.g., "+", "+5", "+C", "+?") that were imported as regular messages.
 *
 * USAGE:
 *   node scripts/cleanup-reaction-messages.js          # Preview only
 *   node scripts/cleanup-reaction-messages.js --delete # Actually delete
 */

const path = require('path');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = require('pg');

// Patterns that indicate iMessage reactions
const REACTION_PATTERNS = [
  /^\+$/, // Just "+"
  /^\+[0-9]$/, // "+5", "+1", etc.
  /^\+[A-Za-z]$/, // "+C", "+L", etc.
  /^\+[?!]$/, // "+?", "+!"
  /^Liked$/i, // "Liked"
  /^Loved$/i, // "Loved"
  /^Laughed$/i, // "Laughed"
  /^Emphasized$/i, // "Emphasized"
  /^Questioned$/i, // "Questioned"
  /^Disliked$/i, // "Disliked"
];

async function main() {
  const deleteMode = process.argv.includes('--delete');

  console.log('\n🧹 iMessage Reaction Cleanup');
  console.log('════════════════════════════\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  try {
    // Find reaction-like messages
    const result = await pool.query(`
      SELECT id, username, text, timestamp, room_id
      FROM messages
      WHERE LENGTH(text) <= 15
        AND (
          text ~ '^\\+[A-Za-z0-9?!]?$'
          OR text ~* '^(Liked|Loved|Laughed|Emphasized|Questioned|Disliked)$'
          OR text ~ '^\\+[0-9]{1,2}$'
        )
      ORDER BY timestamp
    `);

    if (result.rows.length === 0) {
      console.log('✅ No reaction messages found. Database is clean!\n');
      await pool.end();
      return;
    }

    console.log(`📋 Found ${result.rows.length} reaction-like messages:\n`);

    // Group by text content for summary
    const grouped = {};
    for (const row of result.rows) {
      const key = row.text;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    }

    // Show summary
    console.log('   Content     Count   Sample Username');
    console.log('   ─────────   ─────   ───────────────');
    for (const [text, rows] of Object.entries(grouped)) {
      const displayText = text.padEnd(10);
      const count = String(rows.length).padEnd(6);
      const sampleUser = rows[0].username;
      console.log(`   "${displayText}" ${count}  ${sampleUser}`);
    }

    console.log(`\n   Total: ${result.rows.length} messages\n`);

    if (!deleteMode) {
      console.log('ℹ️  This was a preview. To delete these messages, run:');
      console.log('   node scripts/cleanup-reaction-messages.js --delete\n');
      await pool.end();
      return;
    }

    // Confirm deletion
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const confirmed = await new Promise(resolve => {
      rl.question(`\n⚠️  Delete ${result.rows.length} reaction messages? (yes/no): `, answer => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      });
    });

    if (!confirmed) {
      console.log('\n❌ Deletion cancelled.\n');
      await pool.end();
      return;
    }

    // Delete the messages
    const ids = result.rows.map(r => r.id);
    const deleteResult = await pool.query(`DELETE FROM messages WHERE id = ANY($1)`, [ids]);

    console.log(`\n✅ Deleted ${deleteResult.rowCount} reaction messages.\n`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
