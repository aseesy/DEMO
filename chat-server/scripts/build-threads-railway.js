#!/usr/bin/env node
/**
 * Build threads for athena-yashir conversation
 * Designed to run on Railway infrastructure
 */

// Don't load .env - use Railway's environment variables directly
// require('dotenv').config(); // Commented out to use Railway env vars

const ROOM_ID = 'room_1765827298745_878fce74a53e7';

async function main() {
  try {
    console.log('\n🔍 Building threads for athena-yashir conversation...\n');
    console.log(`Room ID: ${ROOM_ID}\n`);
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}\n`);

    // Wait for database connection
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Load modules after ensuring env is set
    const dbPostgres = require('../dbPostgres');
    const threadManager = require('../threadManager');

    // Check current state
    const threadCount = await dbPostgres.query('SELECT COUNT(*) as count FROM threads WHERE room_id = $1', [ROOM_ID]);
    const messageCount = await dbPostgres.query('SELECT COUNT(*) as count FROM messages WHERE room_id = $1', [ROOM_ID]);
    
    console.log(`Current state:`);
    console.log(`  Threads: ${threadCount.rows[0].count}`);
    console.log(`  Messages: ${messageCount.rows[0].count}\n`);

    // Analyze conversation
    console.log('📊 Analyzing conversation history (this may take a minute)...\n');
    const analysis = await threadManager.analyzeConversationHistory(ROOM_ID, 1094);

    console.log(`\n✅ Analysis complete:`);
    console.log(`  Suggestions: ${analysis.suggestions?.length || 0}`);
    console.log(`  Created threads: ${analysis.createdThreads?.length || 0}\n`);

    if (analysis.createdThreads && analysis.createdThreads.length > 0) {
      console.log('📋 Created threads:');
      analysis.createdThreads.forEach((thread, i) => {
        console.log(`  ${i + 1}. ${thread.title} (${thread.messageCount} messages)`);
      });
    }

    // Final summary
    const finalThreadCount = await dbPostgres.query('SELECT COUNT(*) as count FROM threads WHERE room_id = $1', [ROOM_ID]);
    const threadsWithMessages = await dbPostgres.query(
      `SELECT t.id, t.title, t.message_count, COUNT(m.id) as actual_count
       FROM threads t
       LEFT JOIN messages m ON m.thread_id = t.id
       WHERE t.room_id = $1
       GROUP BY t.id, t.title, t.message_count
       ORDER BY t.created_at DESC`,
      [ROOM_ID]
    );

    console.log(`\n📊 Final state:`);
    console.log(`  Total threads: ${finalThreadCount.rows[0].count}`);
    if (threadsWithMessages.rows.length > 0) {
      console.log(`\n  Thread details:`);
      threadsWithMessages.rows.forEach(t => {
        console.log(`    - ${t.title}: ${t.actual_count} messages`);
      });
    }

    const unthreaded = await dbPostgres.query(
      `SELECT COUNT(*) as count 
       FROM messages 
       WHERE room_id = $1 
         AND (thread_id IS NULL OR thread_id = '')
         AND type != 'system'
         AND (private = 0 OR private IS NULL)
         AND (flagged = 0 OR flagged IS NULL)`,
      [ROOM_ID]
    );
    console.log(`\n  Unthreaded messages: ${unthreaded.rows[0].count}`);
    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

