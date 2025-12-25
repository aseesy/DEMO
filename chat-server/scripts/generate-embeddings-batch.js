#!/usr/bin/env node
/**
 * Batch Embedding Generation for Historical Messages
 *
 * This script:
 * 1. Generates embeddings for all existing threads
 * 2. Processes historical messages to generate embeddings
 * 3. Auto-assigns messages to threads based on semantic similarity
 *
 * Usage: DATABASE_URL="..." node scripts/generate-embeddings-batch.js [roomId] [--threads-only] [--limit N]
 */

require('dotenv').config();

const neo4jClient = require('../src/infrastructure/database/neo4jClient');
const threadManager = require('../threadManager');
const autoThreading = require('../services/autoThreading');

// Default room ID (can be overridden via command line)
const DEFAULT_ROOM_ID = 'room_1765827298745_878fce74a53e7';

// Parse command line arguments
const args = process.argv.slice(2);
const roomId = args.find(a => a.startsWith('room_')) || DEFAULT_ROOM_ID;
const threadsOnly = args.includes('--threads-only');
const limitArg = args.find(a => a.startsWith('--limit'));
const messageLimit = limitArg
  ? parseInt(limitArg.split('=')[1] || args[args.indexOf('--limit') + 1])
  : null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateThreadEmbeddings(roomId) {
  console.log('\n📊 Step 1: Generating embeddings for existing threads...\n');

  const dbPostgres = require('../dbPostgres');

  // Get all threads without embeddings
  const threads = await dbPostgres.query('SELECT id, title FROM threads WHERE room_id = $1', [
    roomId,
  ]);

  console.log(`Found ${threads.rows.length} threads to process\n`);

  let processed = 0;
  let errors = 0;

  for (const thread of threads.rows) {
    try {
      await neo4jClient.createOrUpdateThreadNode(thread.id, roomId, thread.title);
      processed++;
      console.log(`  ✅ ${thread.title}`);

      // Rate limiting - avoid hammering OpenAI API
      await sleep(200);
    } catch (error) {
      errors++;
      console.log(`  ❌ ${thread.title}: ${error.message}`);
    }
  }

  console.log(`\n📊 Thread embedding results:`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Errors: ${errors}`);

  return { processed, errors };
}

async function generateMessageEmbeddings(roomId, limit = null) {
  console.log('\n📊 Step 2: Generating embeddings for messages...\n');

  const dbPostgres = require('../dbPostgres');

  // Get messages without thread assignments
  // Process oldest first to maintain chronological order
  let query = `
    SELECT id, text, username, timestamp, thread_id
    FROM messages
    WHERE room_id = $1
      AND type != 'system'
      AND (thread_id IS NULL OR thread_id = '')
      AND text IS NOT NULL
      AND LENGTH(text) > 10
    ORDER BY timestamp ASC
  `;

  if (limit) {
    query += ` LIMIT ${limit}`;
  }

  const messages = await dbPostgres.query(query, [roomId]);
  console.log(`Found ${messages.rows.length} messages to process\n`);

  const stats = {
    total: messages.rows.length,
    processed: 0,
    assigned: 0,
    skipped: 0,
    errors: 0,
  };

  const BATCH_SIZE = 50;
  const batches = Math.ceil(messages.rows.length / BATCH_SIZE);

  for (let batch = 0; batch < batches; batch++) {
    const start = batch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, messages.rows.length);
    const batchMessages = messages.rows.slice(start, end);

    console.log(`\nProcessing batch ${batch + 1}/${batches} (messages ${start + 1}-${end})...`);

    for (const msg of batchMessages) {
      try {
        // Check if message should be processed
        if (!autoThreading.shouldProcessMessage(msg.text)) {
          stats.skipped++;
          continue;
        }

        // Process message for threading
        const result = await autoThreading.processMessageForThreading({
          id: msg.id,
          text: msg.text,
          username: msg.username,
          roomId: roomId,
          timestamp: msg.timestamp,
        });

        if (result === null) {
          stats.skipped++;
        } else if (result.assigned) {
          stats.assigned++;
          stats.processed++;
          process.stdout.write('✓');
        } else {
          stats.processed++;
          process.stdout.write('.');
        }

        // Rate limiting
        await sleep(100);
      } catch (error) {
        stats.errors++;
        process.stdout.write('✗');
      }
    }

    // Progress report after each batch
    console.log(`\n  Batch complete: ${stats.assigned} assigned, ${stats.processed} processed`);

    // Longer pause between batches
    if (batch < batches - 1) {
      await sleep(1000);
    }
  }

  return stats;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Batch Embedding Generation for Semantic Threading');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\nRoom ID: ${roomId}`);
  console.log(`Mode: ${threadsOnly ? 'Threads only' : 'Full processing'}`);
  if (messageLimit) console.log(`Message limit: ${messageLimit}`);
  console.log('');

  // Check Neo4j availability
  if (!neo4jClient.isAvailable()) {
    console.error('❌ Neo4j is not available. Check NEO4J_URI and NEO4J_PASSWORD.');
    process.exit(1);
  }
  console.log('✅ Neo4j connection available\n');

  // Check OpenAI availability
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is not set.');
    process.exit(1);
  }
  console.log('✅ OpenAI API key configured\n');

  const startTime = Date.now();

  // Step 1: Generate thread embeddings
  const threadStats = await generateThreadEmbeddings(roomId);

  if (threadsOnly) {
    console.log('\n✅ Thread embedding generation complete (--threads-only mode)');
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nTotal time: ${elapsed}s`);
    process.exit(0);
  }

  // Step 2: Generate message embeddings and auto-assign
  const messageStats = await generateMessageEmbeddings(roomId, messageLimit);

  // Final summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\nThreads:`);
  console.log(`  Embeddings generated: ${threadStats.processed}`);
  console.log(`  Errors: ${threadStats.errors}`);
  console.log(`\nMessages:`);
  console.log(`  Total processed: ${messageStats.processed}`);
  console.log(`  Auto-assigned to threads: ${messageStats.assigned}`);
  console.log(`  Skipped (too short/common): ${messageStats.skipped}`);
  console.log(`  Errors: ${messageStats.errors}`);
  console.log(`\nTotal time: ${elapsed}s`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
