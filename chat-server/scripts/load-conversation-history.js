#!/usr/bin/env node

/**
 * Load Conversation History Script
 *
 * Parses a text file with conversation history and loads it into the database.
 * Format expected: [YYYY-MM-DD HH:MM:SS] Sender: Message text
 */

require('dotenv').config({ override: true });

const fs = require('fs');
const pool = require('../dbPostgres');

// Configuration
const FILE_PATH = '/Users/athenasees/Desktop/benoit_messages_cleaned.txt';
const ROOM_ID = 'room_1766089147534_c60cb4c1a9d4fb9c';

// Map sender names to emails
const SENDER_MAP = {
  'Me': 'mom1@test.com',
  'Benoit': 'dad1@test.com',
};

// Parse a single line
function parseLine(line) {
  // Format: [2025-02-07 09:40:58] Benoit: Message text
  const match = line.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (Me|Benoit): (.+)$/);
  if (!match) return null;

  const [, timestamp, sender, text] = match;
  const email = SENDER_MAP[sender];

  if (!email) return null;

  return {
    timestamp: new Date(timestamp.replace(' ', 'T') + 'Z'),
    sender,
    email,
    text: text.trim(),
  };
}

// Generate unique message ID
function generateMessageId(timestamp, index) {
  return `imported-${timestamp.getTime()}-${index}`;
}

async function main() {
  console.log('🚀 Loading conversation history...');
  console.log(`📄 File: ${FILE_PATH}`);
  console.log(`🏠 Room: ${ROOM_ID}`);

  // Read file
  const content = fs.readFileSync(FILE_PATH, 'utf8');
  const lines = content.split('\n');

  console.log(`📊 Total lines: ${lines.length}`);

  // Parse messages
  const messages = [];
  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) {
      messages.push(parsed);
    }
  }

  console.log(`✅ Parsed ${messages.length} messages`);

  if (messages.length === 0) {
    console.log('❌ No messages to insert');
    await pool.end();
    return;
  }

  // Show sample
  console.log('\n📝 Sample messages:');
  messages.slice(0, 3).forEach((m, i) => {
    console.log(`  ${i + 1}. [${m.timestamp.toISOString()}] ${m.sender}: ${m.text.substring(0, 50)}...`);
  });

  // Clear existing imported messages (to allow re-runs)
  console.log('\n🧹 Clearing previously imported messages...');
  const deleteResult = await pool.query(
    `DELETE FROM messages WHERE room_id = $1 AND id LIKE 'imported-%'`,
    [ROOM_ID]
  );
  console.log(`   Deleted ${deleteResult.rowCount} old imported messages`);

  // Insert messages in batches
  const BATCH_SIZE = 100;
  let inserted = 0;

  console.log(`\n📥 Inserting ${messages.length} messages in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    // Build bulk insert query
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    for (let j = 0; j < batch.length; j++) {
      const msg = batch[j];
      const msgId = generateMessageId(msg.timestamp, i + j);

      placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6})`);
      values.push(
        msgId,
        ROOM_ID,
        msg.email,  // user_email
        msg.email,  // username (same as email for consistency)
        msg.text,
        msg.timestamp.toISOString(),
        'user'
      );
      paramIndex += 7;
    }

    const query = `
      INSERT INTO messages (id, room_id, user_email, username, text, timestamp, type)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (id) DO NOTHING
    `;

    await pool.query(query, values);
    inserted += batch.length;

    const pct = Math.round((inserted / messages.length) * 100);
    process.stdout.write(`\r   Progress: ${inserted}/${messages.length} (${pct}%)`);
  }

  console.log('\n\n✅ Import complete!');

  // Verify
  const countResult = await pool.query(
    `SELECT COUNT(*) as count FROM messages WHERE room_id = $1`,
    [ROOM_ID]
  );
  console.log(`📊 Total messages in room: ${countResult.rows[0].count}`);

  // Show date range
  const rangeResult = await pool.query(
    `SELECT MIN(timestamp) as first, MAX(timestamp) as last FROM messages WHERE room_id = $1 AND id LIKE 'imported-%'`,
    [ROOM_ID]
  );
  console.log(`📅 Date range: ${rangeResult.rows[0].first} to ${rangeResult.rows[0].last}`);

  await pool.end();
  console.log('\n🎉 Done! Run the ingestion script next to generate embeddings.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
