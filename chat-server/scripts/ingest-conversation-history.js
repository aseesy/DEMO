#!/usr/bin/env node

/**
 * Ingest Conversation History Script
 *
 * Part of the Dual-Brain AI Mediator architecture.
 * Processes historical conversation data:
 * 1. Generates embeddings for messages (for semantic search)
 * 2. Analyzes user profiles (beliefs, triggers, patterns)
 *
 * Usage:
 *   node scripts/ingest-conversation-history.js --room-id=<roomId> [--dry-run]
 *   node scripts/ingest-conversation-history.js --all-rooms [--dry-run]
 *
 * Options:
 *   --room-id=<id>    Process a specific room
 *   --all-rooms       Process all rooms
 *   --dry-run         Preview what would be done without making changes
 *   --skip-embeddings Skip embedding generation (only run profile analysis)
 *   --skip-profiles   Skip profile analysis (only generate embeddings)
 *   --batch-size=<n>  Number of embeddings to generate per batch (default: 10)
 *   --delay=<ms>      Delay between batches in milliseconds (default: 1000)
 */

require('dotenv').config();

const { query, pool } = require('../dbSafe');
const narrativeMemory = require('../src/core/memory/narrativeMemory');
const profileAnalyzer = require('../src/core/profiles/profileAnalyzer');

// Parse command line arguments
function parseArgs() {
  const args = {
    roomId: null,
    allRooms: false,
    dryRun: false,
    skipEmbeddings: false,
    skipProfiles: false,
    batchSize: 10,
    delay: 1000,
  };

  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--room-id=')) {
      args.roomId = arg.split('=')[1];
    } else if (arg === '--all-rooms') {
      args.allRooms = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--skip-embeddings') {
      args.skipEmbeddings = true;
    } else if (arg === '--skip-profiles') {
      args.skipProfiles = true;
    } else if (arg.startsWith('--batch-size=')) {
      args.batchSize = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--delay=')) {
      args.delay = parseInt(arg.split('=')[1], 10);
    }
  });

  return args;
}

// Get all rooms
async function getAllRooms() {
  const result = await query(`
    SELECT r.id, r.name, COUNT(m.id) as message_count
    FROM rooms r
    LEFT JOIN messages m ON r.id = m.room_id
    GROUP BY r.id, r.name
    HAVING COUNT(m.id) > 0
    ORDER BY message_count DESC
  `);
  return result.rows;
}

// Get messages for a room
async function getRoomMessages(roomId) {
  const result = await query(
    `
    SELECT id, text, timestamp, username
    FROM messages
    WHERE room_id = $1
      AND text IS NOT NULL
      AND text != ''
    ORDER BY timestamp ASC
  `,
    [roomId]
  );
  return result.rows;
}

// Process a single room
async function processRoom(roomId, options) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing room: ${roomId}`);
  console.log('='.repeat(60));

  const messages = await getRoomMessages(roomId);
  console.log(`Found ${messages.length} messages`);

  if (messages.length === 0) {
    console.log('No messages to process, skipping');
    return { embeddings: { success: 0, failed: 0 }, profiles: 0 };
  }

  let embeddingResults = { success: 0, failed: 0 };
  let profileCount = 0;

  // Step 1: Generate embeddings
  if (!options.skipEmbeddings) {
    console.log('\n📊 Step 1: Generating message embeddings...');

    const messagesWithoutEmbeddings = await narrativeMemory.getMessagesWithoutEmbeddings(
      roomId,
      1000
    );

    console.log(`  ${messagesWithoutEmbeddings.length} messages need embeddings`);

    if (messagesWithoutEmbeddings.length > 0) {
      if (options.dryRun) {
        console.log(`  [DRY RUN] Would generate ${messagesWithoutEmbeddings.length} embeddings`);
        embeddingResults = { success: messagesWithoutEmbeddings.length, failed: 0 };
      } else {
        embeddingResults = await narrativeMemory.batchStoreEmbeddings(messagesWithoutEmbeddings, {
          batchSize: options.batchSize,
          delayMs: options.delay,
          onProgress: (processed, total) => {
            const pct = Math.round((processed / total) * 100);
            process.stdout.write(`\r  Progress: ${processed}/${total} (${pct}%)`);
          },
        });
        console.log(
          `\n  ✅ Embeddings: ${embeddingResults.success} success, ${embeddingResults.failed} failed`
        );
      }
    }
  } else {
    console.log('\n📊 Step 1: Skipping embeddings (--skip-embeddings)');
  }

  // Step 2: Analyze user profiles
  if (!options.skipProfiles) {
    console.log('\n🧠 Step 2: Analyzing user profiles...');

    if (options.dryRun) {
      // Count unique users
      const uniqueUsers = new Set(messages.map(m => m.username)).size;
      console.log(`  [DRY RUN] Would analyze ${uniqueUsers} user profiles`);
      profileCount = uniqueUsers;
    } else {
      const profiles = await profileAnalyzer.analyzeRoomParticipants(roomId, messages);
      profileCount = Object.keys(profiles).length;
      console.log(`  ✅ Analyzed ${profileCount} user profiles`);

      // Print summary for each profile
      for (const [userId, profile] of Object.entries(profiles)) {
        console.log(`\n  User ${userId}:`);
        console.log(`    Core values: ${profile.core_values?.slice(0, 3).join(', ') || 'none'}`);
        console.log(`    Triggers: ${profile.known_triggers?.slice(0, 3).join(', ') || 'none'}`);
        console.log(
          `    Complaints: ${profile.recurring_complaints?.slice(0, 2).join(', ') || 'none'}`
        );
      }
    }
  } else {
    console.log('\n🧠 Step 2: Skipping profiles (--skip-profiles)');
  }

  return {
    embeddings: embeddingResults,
    profiles: profileCount,
    messageCount: messages.length,
  };
}

// Main function
async function main() {
  const args = parseArgs();

  console.log('\n🚀 Dual-Brain AI Mediator - Conversation History Ingestion');
  console.log('='.repeat(60));

  if (args.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }

  console.log(`Options:
  Room ID: ${args.roomId || 'N/A'}
  All Rooms: ${args.allRooms}
  Skip Embeddings: ${args.skipEmbeddings}
  Skip Profiles: ${args.skipProfiles}
  Batch Size: ${args.batchSize}
  Delay: ${args.delay}ms
`);

  // Validate arguments
  if (!args.roomId && !args.allRooms) {
    console.error('❌ Error: Must specify --room-id=<id> or --all-rooms');
    console.log('\nUsage:');
    console.log('  node scripts/ingest-conversation-history.js --room-id=<roomId> [--dry-run]');
    console.log('  node scripts/ingest-conversation-history.js --all-rooms [--dry-run]');
    process.exit(1);
  }

  // Get rooms to process
  let rooms;
  if (args.allRooms) {
    rooms = await getAllRooms();
    console.log(`Found ${rooms.length} rooms with messages`);
  } else {
    rooms = [{ id: args.roomId, name: 'specified', message_count: null }];
  }

  // Process each room
  const summary = {
    roomsProcessed: 0,
    totalMessages: 0,
    embeddingsSuccess: 0,
    embeddingsFailed: 0,
    profilesAnalyzed: 0,
  };

  for (const room of rooms) {
    try {
      const result = await processRoom(room.id, args);
      summary.roomsProcessed++;
      summary.totalMessages += result.messageCount || 0;
      summary.embeddingsSuccess += result.embeddings.success;
      summary.embeddingsFailed += result.embeddings.failed;
      summary.profilesAnalyzed += result.profiles;
    } catch (error) {
      console.error(`\n❌ Error processing room ${room.id}:`, error.message);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 INGESTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`
  Rooms Processed: ${summary.roomsProcessed}
  Total Messages: ${summary.totalMessages}
  Embeddings Generated: ${summary.embeddingsSuccess} success, ${summary.embeddingsFailed} failed
  Profiles Analyzed: ${summary.profilesAnalyzed}
  `);

  if (args.dryRun) {
    console.log('🔍 This was a DRY RUN - no changes were made');
  }

  // Close database connection
  await pool.end();
  console.log('\n✅ Done!');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
