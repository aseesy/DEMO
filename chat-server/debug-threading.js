/**
 * Debug Script for Threading Analysis
 *
 * Run this to check why message history is not being threaded
 * Usage: node debug-threading.js <roomId>
 */

const threadManager = require('./threadManager');
const messageStore = require('./messageStore');
const dbPostgres = require('./dbPostgres');

async function debugThreading(roomId) {
  console.log('\n=== THREADING DEBUG ANALYSIS ===\n');
  console.log(`Room ID: ${roomId}\n`);

  // 1. Check OpenAI API Key
  console.log('1. Checking OpenAI API Key...');
  if (!process.env.OPENAI_API_KEY) {
    console.log('   ❌ OPENAI_API_KEY not set - analysis will be skipped');
  } else {
    console.log(`   ✅ OPENAI_API_KEY is set (length: ${process.env.OPENAI_API_KEY.length})`);
  }

  // 2. Check existing threads
  console.log('\n2. Checking existing threads...');
  try {
    const existingThreads = await threadManager.getThreadsForRoom(roomId, false);
    console.log(`   Found ${existingThreads.length} existing threads`);
    if (existingThreads.length > 0) {
      console.log('   Threads:');
      existingThreads.forEach(t => {
        console.log(`     - ${t.title} (${t.message_count} messages, category: ${t.category})`);
      });
      console.log('   ⚠️  Analysis will be skipped because threads already exist');
      return;
    }
  } catch (error) {
    console.error('   ❌ Error checking threads:', error.message);
  }

  // 3. Check messages
  console.log('\n3. Checking messages...');
  try {
    const allMessages = await messageStore.getMessagesByRoom(roomId, 1000);
    console.log(`   Total messages in room: ${allMessages.length}`);

    // Filter like the analyzer does
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filteredMessages = allMessages.filter(m => {
      if (!m.text || m.type === 'system' || m.private || m.flagged || !m.username) {
        return false;
      }
      const msgDate = new Date(m.timestamp);
      return msgDate >= thirtyDaysAgo;
    });

    console.log(
      `   Messages after filtering (last 30 days, no system/private/flagged): ${filteredMessages.length}`
    );

    if (filteredMessages.length < 5) {
      console.log('   ⚠️  Not enough messages to analyze (needs 5+)');
      return;
    }

    console.log('   Sample messages:');
    filteredMessages.slice(0, 5).forEach((m, i) => {
      console.log(`     ${i + 1}. [${m.username}] ${m.text?.substring(0, 50)}... (${m.timestamp})`);
    });
  } catch (error) {
    console.error('   ❌ Error checking messages:', error.message);
    return;
  }

  // 4. Try to run analysis
  console.log('\n4. Attempting conversation analysis...');
  try {
    const result = await threadManager.analyzeConversationHistory(roomId, 100);
    console.log(`   Analysis completed:`);
    console.log(`     - Suggestions: ${result.suggestions?.length || 0}`);
    console.log(`     - Created threads: ${result.createdThreads?.length || 0}`);

    if (result.createdThreads && result.createdThreads.length > 0) {
      console.log('\n   Created threads:');
      result.createdThreads.forEach(t => {
        console.log(`     - ${t.title} (${t.messageCount} messages)`);
      });
    } else {
      console.log('   ⚠️  No threads were created');
      if (result.suggestions && result.suggestions.length > 0) {
        console.log('\n   Suggestions that were not created:');
        result.suggestions.forEach(s => {
          console.log(`     - ${s.title} (category: ${s.category}, confidence: ${s.confidence})`);
        });
      }
    }
  } catch (error) {
    console.error('   ❌ Error during analysis:', error.message);
    console.error('   Stack:', error.stack);
  }

  // 5. Check database for threads
  console.log('\n5. Checking database for threads...');
  try {
    const dbResult = await dbPostgres.query(
      'SELECT id, title, category, message_count, created_at FROM threads WHERE room_id = $1 ORDER BY created_at DESC',
      [roomId]
    );
    console.log(`   Found ${dbResult.rows.length} threads in database:`);
    dbResult.rows.forEach(t => {
      console.log(
        `     - ${t.title} (${t.message_count} messages, category: ${t.category}, created: ${t.created_at})`
      );
    });
  } catch (error) {
    console.error('   ❌ Error querying database:', error.message);
  }

  console.log('\n=== DEBUG COMPLETE ===\n');
}

// Get roomId from command line or use default
const roomId = process.argv[2];
if (!roomId) {
  console.error('Usage: node debug-threading.js <roomId>');
  console.error('Example: node debug-threading.js room-123');
  process.exit(1);
}

debugThreading(roomId)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
