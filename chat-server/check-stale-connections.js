#!/usr/bin/env node
/**
 * Diagnostic script to check for stale connections and cached data
 */

require('dotenv').config({ override: true });
const dbPostgres = require('./dbPostgres');

async function checkStaleData() {
  console.log('🔍 Checking for stale connections and cached data...\n');

  // 1. Check for existing threads
  try {
    const threadsResult = await dbPostgres.query(
      `SELECT COUNT(*) as count, 
              COUNT(CASE WHEN is_archived = 0 THEN 1 END) as active_count,
              COUNT(CASE WHEN is_archived = 1 THEN 1 END) as archived_count
       FROM threads`
    );
    const threads = threadsResult.rows[0];
    console.log('📊 Threads in database:');
    console.log(`   Total: ${threads.count}`);
    console.log(`   Active: ${threads.active_count}`);
    console.log(`   Archived: ${threads.archived_count}`);

    if (threads.active_count > 0) {
      const recentThreads = await dbPostgres.query(
        `SELECT id, title, room_id, created_at, message_count 
         FROM threads 
         WHERE is_archived = 0 
         ORDER BY created_at DESC 
         LIMIT 5`
      );
      console.log('\n   Recent active threads:');
      recentThreads.rows.forEach(t => {
        console.log(
          `   - ${t.title} (${t.message_count} msgs, room: ${t.room_id}, created: ${t.created_at})`
        );
      });
    }
  } catch (err) {
    console.error('❌ Error checking threads:', err.message);
  }

  // 2. Check for messages in the room
  const roomId = process.argv[2] || 'room_1766089147534_c60cb4c1a9d4fb9c';
  console.log(`\n📨 Checking messages for room: ${roomId}`);
  try {
    const messagesResult = await dbPostgres.query(
      `SELECT COUNT(*) as count,
              MIN(timestamp) as oldest,
              MAX(timestamp) as newest
       FROM messages 
       WHERE room_id = $1`,
      [roomId]
    );
    const msg = messagesResult.rows[0];
    console.log(`   Total messages: ${msg.count}`);
    console.log(`   Oldest: ${msg.oldest || 'N/A'}`);
    console.log(`   Newest: ${msg.newest || 'N/A'}`);

    // Check messages without threads
    const unthreadedResult = await dbPostgres.query(
      `SELECT COUNT(*) as count 
       FROM messages 
       WHERE room_id = $1 AND thread_id IS NULL`,
      [roomId]
    );
    console.log(`   Unthreaded messages: ${unthreadedResult.rows[0].count}`);
  } catch (err) {
    console.error('❌ Error checking messages:', err.message);
  }

  // 3. Check if analysis was already run (threads exist for this room)
  console.log(`\n🔍 Checking if analysis was already run for room: ${roomId}`);
  try {
    const roomThreads = await dbPostgres.query(
      `SELECT id, title, category, created_at, message_count 
       FROM threads 
       WHERE room_id = $1 AND is_archived = 0 
       ORDER BY created_at DESC`,
      [roomId]
    );
    if (roomThreads.rows.length > 0) {
      console.log(`   ✅ Analysis already run - found ${roomThreads.rows.length} threads:`);
      roomThreads.rows.forEach(t => {
        console.log(`   - ${t.title} [${t.category}] (${t.message_count} msgs)`);
      });
      console.log('\n   💡 To force re-analysis, you can:');
      console.log('      1. Archive existing threads');
      console.log('      2. Or manually trigger analysis via debug-threading.js');
    } else {
      console.log('   ⚠️  No threads found - analysis should run on next join');
    }
  } catch (error) {
    console.error('❌ Error checking room threads:', error.message);
  }

  // 4. Check server processes
  console.log('\n🖥️  Server processes:');
  const { execSync } = require('child_process');
  try {
    const processes = execSync('ps aux | grep "node server.js" | grep -v grep', {
      encoding: 'utf8',
    });
    const lines = processes
      .trim()
      .split('\n')
      .filter(l => l);
    console.log(`   Found ${lines.length} server process(es):`);
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[1];
      const start = parts[8];
      console.log(`   - PID ${pid} (started: ${start})`);
    });
    if (lines.length > 1) {
      console.log('\n   ⚠️  Multiple server processes detected!');
      console.log('   💡 Kill old processes: kill <old_pid>');
    }
  } catch (err) {
    console.log('   (Could not check processes)');
  }

  console.log('\n✅ Diagnostic complete');
  process.exit(0);
}

checkStaleData().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
