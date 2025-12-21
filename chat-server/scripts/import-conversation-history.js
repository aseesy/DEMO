#!/usr/bin/env node
/**
 * Private Conversation History Import Script
 *
 * PRIVACY GUARANTEES:
 * - Runs locally only - no cloud transmission of raw conversation data
 * - Connects directly to PostgreSQL - data goes straight to database
 * - No message content is logged - only progress indicators
 * - File stays on your local machine
 *
 * USAGE:
 *   node scripts/import-conversation-history.js <path-to-txt-file>
 *
 * EXPECTED FORMAT (flexible - will auto-detect):
 *   [timestamp] sender: message
 *   sender: message
 *   sender (timestamp): message
 *   etc.
 *
 * The script will prompt for confirmation before importing.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

// Generate message ID in same format as server.js
function generateMessageId() {
  // Use timestamp + random suffix (similar to server's Date.now()-socketId pattern)
  return `${Date.now()}-import-${crypto.randomBytes(4).toString('hex')}`;
}

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database connection
const { Pool } = require('pg');

// Configuration - EDIT THESE VALUES
const CONFIG = {
  // Users to import for (by email)
  user1Email: 'athenasees@gmail.com',
  user2Email: 'yashir91lora@gmail.com',

  // How sender names appear in the text file (case-insensitive matching)
  // "Me" is mapped to user1 (athenasees@gmail.com)
  user1Names: ['me', 'athena', 'athenasees', 'athena sees'],
  user2Names: ['yashir', 'yashir91lora', 'yashir lora'],

  // Default timestamp for messages without dates (will increment)
  defaultStartDate: new Date('2024-01-01T09:00:00Z'),

  // Time gap between messages without timestamps (in minutes)
  messageGapMinutes: 5,
};

// Database connection (uses Railway DATABASE_URL from env or prompts)
let pool;

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set in environment');
    console.log('\nTo connect to Railway production database, run:');
    console.log(
      '  DATABASE_URL="postgresql://..." node scripts/import-conversation-history.js <file>'
    );
    process.exit(1);
  }

  // Check if using local DB
  if (databaseUrl.includes('localhost')) {
    console.log('⚠️  Using LOCAL database (localhost)');
    console.log('   To use production, set DATABASE_URL to Railway connection string');
  } else {
    console.log('🔒 Connecting to production database...');
  }

  pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  // Test connection
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function getUsers() {
  const result = await pool.query(
    `SELECT id, email, username, display_name
     FROM users
     WHERE email IN ($1, $2)`,
    [CONFIG.user1Email, CONFIG.user2Email]
  );

  if (result.rows.length !== 2) {
    console.error('❌ Could not find both users in database');
    console.log('Found:', result.rows.map(r => r.email).join(', ') || 'none');
    return null;
  }

  const user1 = result.rows.find(r => r.email === CONFIG.user1Email);
  const user2 = result.rows.find(r => r.email === CONFIG.user2Email);

  return { user1, user2 };
}

async function getSharedRoom(user1Id, user2Id) {
  // Find room where both users are members
  const result = await pool.query(
    `SELECT r.id, r.name
     FROM rooms r
     JOIN room_members rm1 ON r.id = rm1.room_id AND rm1.user_id = $1
     JOIN room_members rm2 ON r.id = rm2.room_id AND rm2.user_id = $2
     LIMIT 1`,
    [user1Id, user2Id]
  );

  if (result.rows.length === 0) {
    console.error('❌ No shared room found between the two users');
    return null;
  }

  return result.rows[0];
}

function parseConversationFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Check if it's a CSV file
  const firstLine = lines[0];
  if (
    firstLine.includes('message_id') &&
    firstLine.includes('timestamp') &&
    firstLine.includes('sender_name')
  ) {
    return parseCSVFormat(lines);
  }

  // Otherwise use the text format parser
  return parseTextFormat(lines);
}

function parseCSVFormat(lines) {
  const messages = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSV format: message_id,timestamp,sender_id,sender_name,receiver_id,receiver_name,message
    // Handle quoted fields that may contain commas
    const fields = parseCSVLine(line);

    if (fields.length >= 7) {
      const timestamp = new Date(fields[1].replace(' ', 'T') + 'Z');
      const sender = fields[3]; // sender_name
      const text = fields[6]; // message

      if (text && text.trim()) {
        messages.push({
          sender: sender,
          text: text.trim(),
          timestamp: timestamp,
        });
      }
    }
  }

  return messages;
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current); // Don't forget the last field

  return fields;
}

function parseTextFormat(lines) {
  const messages = [];
  let currentMessage = null;

  // iMessage export format: [2020-07-24 18:04:21] Sender: message
  const iMessagePattern = /^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\]\s*([^:]+):\s*(.*)$/;

  for (const line of lines) {
    // Skip header lines
    if (line.startsWith('iMessage Conversation') || line.startsWith('===') || !line.trim()) {
      // If we have a current message, save it before skipping
      if (currentMessage && currentMessage.text.trim()) {
        messages.push(currentMessage);
        currentMessage = null;
      }
      continue;
    }

    const match = line.match(iMessagePattern);

    if (match) {
      // Save previous message if exists
      if (currentMessage && currentMessage.text.trim()) {
        messages.push(currentMessage);
      }

      // Start new message
      const timestamp = new Date(match[1].replace(' ', 'T') + 'Z');
      currentMessage = {
        sender: match[2].trim(),
        text: match[3].trim(),
        timestamp: timestamp,
      };
    } else if (currentMessage) {
      // This is a continuation line (multi-line message)
      // Append to current message with newline
      currentMessage.text += '\n' + line;
    }
  }

  // Don't forget the last message
  if (currentMessage && currentMessage.text.trim()) {
    messages.push(currentMessage);
  }

  return messages;
}

function parseTimestamp(str) {
  if (!str) return null;

  // Try direct parsing
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Try common formats
  const formats = [
    // Jan 15, 2024 10:30 AM
    /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4}),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)?$/i,
    // 15 Jan 2024 10:30
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s+(\d{1,2}):(\d{2})$/,
  ];

  for (const format of formats) {
    const match = str.match(format);
    if (match) {
      try {
        return new Date(str);
      } catch (e) {
        continue;
      }
    }
  }

  return null;
}

function identifySender(senderName, user1, user2) {
  const normalized = senderName.toLowerCase().trim();

  // Check user1 names
  for (const name of CONFIG.user1Names) {
    if (normalized.includes(name.toLowerCase())) {
      return user1;
    }
  }

  // Check user2 names
  for (const name of CONFIG.user2Names) {
    if (normalized.includes(name.toLowerCase())) {
      return user2;
    }
  }

  // Try matching against display names or usernames
  if (user1.display_name && normalized.includes(user1.display_name.toLowerCase())) {
    return user1;
  }
  if (user2.display_name && normalized.includes(user2.display_name.toLowerCase())) {
    return user2;
  }
  if (normalized.includes(user1.username.toLowerCase())) {
    return user1;
  }
  if (normalized.includes(user2.username.toLowerCase())) {
    return user2;
  }

  return null;
}

async function importMessages(messages, users, room) {
  const { user1, user2 } = users;

  let imported = 0;
  let skipped = 0;
  const stats = {
    user1Messages: 0,
    user2Messages: 0,
    unknownSender: [],
  };

  console.log('\n📥 Importing messages...\n');

  for (const msg of messages) {
    const sender = identifySender(msg.sender, user1, user2);

    if (!sender) {
      stats.unknownSender.push(msg.sender);
      skipped++;
      continue;
    }

    const messageId = generateMessageId();

    try {
      await pool.query(
        `INSERT INTO messages (id, type, username, text, timestamp, room_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [messageId, 'message', sender.username, msg.text, msg.timestamp.toISOString(), room.id]
      );

      imported++;
      if (sender.id === user1.id) stats.user1Messages++;
      else stats.user2Messages++;

      // Progress indicator (no message content logged)
      if (imported % 50 === 0) {
        process.stdout.write(`\r   Imported ${imported} messages...`);
      }
    } catch (error) {
      console.error(`\n❌ Error importing message:`, error.message);
      skipped++;
    }
  }

  console.log(`\r   Imported ${imported} messages.     \n`);

  return { imported, skipped, stats };
}

async function updateCommunicationStats(users, room, stats) {
  const { user1, user2 } = users;

  console.log('📊 Updating communication stats...');

  // Update or insert stats for user1
  await pool.query(
    `INSERT INTO communication_stats (user_id, room_id, total_messages, last_message_date, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (user_id, room_id) DO UPDATE SET
       total_messages = communication_stats.total_messages + $3,
       last_message_date = NOW(),
       updated_at = NOW()`,
    [user1.id, room.id, stats.user1Messages]
  );

  // Update or insert stats for user2
  await pool.query(
    `INSERT INTO communication_stats (user_id, room_id, total_messages, last_message_date, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (user_id, room_id) DO UPDATE SET
       total_messages = communication_stats.total_messages + $3,
       last_message_date = NOW(),
       updated_at = NOW()`,
    [user2.id, room.id, stats.user2Messages]
  );

  console.log('✅ Communication stats updated');
}

async function updateNeo4jMetadata(users, room, totalMessages) {
  // Check if Neo4j is configured
  if (!process.env.NEO4J_URI || !process.env.NEO4J_PASSWORD) {
    console.log('ℹ️  Neo4j not configured - skipping graph update');
    return;
  }

  console.log('🔗 Updating Neo4j relationship metadata...');

  try {
    const neo4jClient = require('../src/utils/neo4jClient');

    if (!neo4jClient.isAvailable()) {
      console.log('ℹ️  Neo4j not available - skipping graph update');
      return;
    }

    // Get current message count from PostgreSQL
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE room_id = $1',
      [room.id]
    );
    const totalInRoom = parseInt(countResult.rows[0].count, 10);

    // Update relationship metadata
    await neo4jClient.updateRelationshipMetadata(users.user1.id, users.user2.id, room.id, {
      messageCount: totalInRoom,
      lastInteraction: new Date(),
    });

    // Update reverse direction too
    await neo4jClient.updateRelationshipMetadata(users.user2.id, users.user1.id, room.id, {
      messageCount: totalInRoom,
      lastInteraction: new Date(),
    });

    console.log('✅ Neo4j metadata updated');
  } catch (error) {
    console.log('⚠️  Neo4j update failed (non-critical):', error.message);
  }
}

async function promptConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

async function main() {
  console.log('\n🔐 LiaiZen Private Conversation Import');
  console.log('═══════════════════════════════════════\n');

  // Get file path from arguments
  const filePath = process.argv[2];

  if (!filePath) {
    console.log('Usage: node scripts/import-conversation-history.js <path-to-txt-file>\n');
    console.log(
      'Example: node scripts/import-conversation-history.js ~/Desktop/conversation.txt\n'
    );
    process.exit(1);
  }

  // Check file exists
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File not found: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`📄 File: ${absolutePath}`);

  // Initialize database
  await initDatabase();

  // Get users
  console.log('\n👥 Looking up users...');
  const users = await getUsers();
  if (!users) {
    process.exit(1);
  }

  console.log(
    `   User 1: ${users.user1.display_name || users.user1.username} (${users.user1.email})`
  );
  console.log(
    `   User 2: ${users.user2.display_name || users.user2.username} (${users.user2.email})`
  );

  // Get shared room
  console.log('\n🏠 Finding shared room...');
  const room = await getSharedRoom(users.user1.id, users.user2.id);
  if (!room) {
    process.exit(1);
  }
  console.log(`   Room: ${room.name || room.id}`);

  // Parse conversation file
  console.log('\n📝 Parsing conversation file...');
  const messages = parseConversationFile(absolutePath);
  console.log(`   Found ${messages.length} messages`);

  if (messages.length === 0) {
    console.log('\n⚠️  No messages parsed from file. Check the file format.');
    console.log('Expected formats:');
    console.log('  - [timestamp] sender: message');
    console.log('  - sender: message');
    console.log('  - sender (timestamp): message');
    process.exit(1);
  }

  // Show sample
  console.log('\n📋 Sample of parsed messages:');
  const sample = messages.slice(0, 3);
  for (const msg of sample) {
    const senderMatch = identifySender(msg.sender, users.user1, users.user2);
    const senderStatus = senderMatch
      ? `✓ ${senderMatch.display_name || senderMatch.username}`
      : '? Unknown';
    console.log(`   [${msg.timestamp.toISOString()}] ${msg.sender} (${senderStatus})`);
    console.log(`   "${msg.text.substring(0, 50)}${msg.text.length > 50 ? '...' : ''}"\n`);
  }

  // Confirm import
  console.log('═══════════════════════════════════════');
  console.log(`\n🔒 PRIVACY: This data will be imported directly to the database.`);
  console.log(`   No message content will be logged or transmitted externally.\n`);

  const confirmed = await promptConfirmation('Proceed with import? (y/n): ');

  if (!confirmed) {
    console.log('\n❌ Import cancelled.');
    process.exit(0);
  }

  // Import messages
  const { imported, skipped, stats } = await importMessages(messages, users, room);

  // Update stats
  await updateCommunicationStats(users, room, stats);

  // Update Neo4j
  await updateNeo4jMetadata(users, room, imported);

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('📊 Import Summary:');
  console.log(`   Total parsed: ${messages.length}`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(
    `   ${users.user1.display_name || users.user1.username}: ${stats.user1Messages} messages`
  );
  console.log(
    `   ${users.user2.display_name || users.user2.username}: ${stats.user2Messages} messages`
  );

  if (stats.unknownSender.length > 0) {
    const uniqueUnknown = [...new Set(stats.unknownSender)];
    console.log(`\n⚠️  Unknown senders (update CONFIG.user1Names/user2Names):`);
    for (const name of uniqueUnknown.slice(0, 5)) {
      console.log(`   - "${name}"`);
    }
  }

  console.log('\n✅ Import complete!\n');

  await pool.end();
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
