/**
 * Import iMessage history into LiaiZen database
 *
 * Usage: DATABASE_URL="..." node scripts/import-imessage-history.js
 */

const fs = require('fs');
const { Pool } = require('pg');

const IMESSAGE_FILE = '/Users/athenasees/Desktop/yashir_imessage_history.txt';
const ROOM_ID = 'room_1765827298745_878fce74a53e7';

// Map iMessage names to LiaiZen usernames
const USERNAME_MAP = {
  Me: 'athenasees',
  Yashir: 'yashir91lora',
};

async function parseMessages(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const messages = [];

  // Regex to match message lines: [YYYY-MM-DD HH:MM:SS] Sender: message
  const messageRegex = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (Me|Yashir): (.*)$/;

  let currentMessage = null;

  for (const line of lines) {
    const match = line.match(messageRegex);

    if (match) {
      // Save previous message if exists
      if (currentMessage) {
        messages.push(currentMessage);
      }

      const [, timestamp, sender, text] = match;
      currentMessage = {
        timestamp: new Date(timestamp.replace(' ', 'T') + 'Z'),
        username: USERNAME_MAP[sender] || sender.toLowerCase(),
        text: text.trim(),
      };
    } else if (currentMessage && line.trim()) {
      // Multi-line message - append to current
      currentMessage.text += '\n' + line;
    }
  }

  // Don't forget the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}

async function importMessages(messages, pool) {
  console.log(`\nImporting ${messages.length} messages...`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Get existing message timestamps to avoid duplicates
  const existingResult = await pool.query(`SELECT timestamp FROM messages WHERE room_id = $1`, [
    ROOM_ID,
  ]);
  const existingTimestamps = new Set(existingResult.rows.map(r => r.timestamp?.toISOString()));

  console.log(`Found ${existingTimestamps.size} existing messages in room`);

  // Import in batches
  const BATCH_SIZE = 100;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    for (const msg of batch) {
      // Skip if message with same timestamp exists
      if (existingTimestamps.has(msg.timestamp.toISOString())) {
        skipped++;
        continue;
      }

      // Skip "Liked" reactions and empty messages
      if (!msg.text || msg.text.startsWith('Liked "') || msg.text.startsWith('Loved "')) {
        skipped++;
        continue;
      }

      try {
        const id = `imsg_${msg.timestamp.getTime()}_${Math.random().toString(36).substr(2, 6)}`;

        await pool.query(
          `INSERT INTO messages (id, type, username, text, timestamp, room_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [id, 'message', msg.username, msg.text, msg.timestamp, ROOM_ID]
        );

        imported++;
      } catch (err) {
        errors++;
        if (errors < 10) {
          console.error(`Error importing message: ${err.message}`);
        }
      }
    }

    // Progress update
    if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= messages.length) {
      console.log(
        `Progress: ${Math.min(i + BATCH_SIZE, messages.length)}/${messages.length} (imported: ${imported}, skipped: ${skipped})`
      );
    }
  }

  return { imported, skipped, errors };
}

async function main() {
  console.log('=== iMessage History Import ===\n');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    console.log('\nUsage:');
    console.log('  DATABASE_URL="postgresql://..." node scripts/import-imessage-history.js');
    process.exit(1);
  }

  // Parse messages
  console.log(`Reading ${IMESSAGE_FILE}...`);
  const messages = await parseMessages(IMESSAGE_FILE);
  console.log(`Parsed ${messages.length} messages`);

  // Show sample
  console.log('\nSample messages:');
  messages.slice(0, 3).forEach(m => {
    console.log(`  [${m.timestamp.toISOString()}] ${m.username}: ${m.text.substring(0, 50)}...`);
  });
  console.log('  ...');
  messages.slice(-3).forEach(m => {
    console.log(`  [${m.timestamp.toISOString()}] ${m.username}: ${m.text.substring(0, 50)}...`);
  });

  // Connect to database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false,
  });

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('\nConnected to database');

    // Import
    const result = await importMessages(messages, pool);

    console.log('\n=== Import Complete ===');
    console.log(`  Imported: ${result.imported}`);
    console.log(`  Skipped:  ${result.skipped}`);
    console.log(`  Errors:   ${result.errors}`);

    // Verify
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM messages WHERE room_id = $1 AND type != 'system'`,
      [ROOM_ID]
    );
    console.log(`\nTotal user messages in room: ${countResult.rows[0].count}`);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
