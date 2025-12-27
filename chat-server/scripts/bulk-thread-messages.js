#!/usr/bin/env node
/**
 * Bulk thread messages based on topic keywords
 * More aggressive matching than AI-based analysis
 */

require('dotenv').config();

const ROOM_ID = 'room_1765827298745_878fce74a53e7';

// Define topics with keywords for matching
const TOPIC_KEYWORDS = {
  'Pickup and Dropoff': ['pickup', 'pick up', 'drop off', 'dropoff', 'pick-up', 'drop-off', 'picking up', 'dropping off'],
  'School and Education': ['school', 'homework', 'teacher', 'class', 'grades', 'education', 'learning', 'classroom', 'principal'],
  'Medical and Health': ['doctor', 'medical', 'sick', 'medicine', 'hospital', 'appointment', 'health', 'fever', 'dentist', 'vaccine'],
  'Schedule and Custody': ['schedule', 'custody', 'weekend', 'week', 'visitation', 'time with', 'my time', 'your time', 'days'],
  'Activities and Sports': ['soccer', 'practice', 'game', 'sports', 'activity', 'activities', 'swimming', 'dance', 'basketball', 'baseball'],
  'Birthday and Holidays': ['birthday', 'christmas', 'thanksgiving', 'holiday', 'easter', 'halloween', 'new year', 'celebration', 'party'],
  'Money and Expenses': ['money', 'pay', 'payment', 'expense', 'cost', 'bill', 'support', 'child support', 'reimburse', '$'],
  'Travel and Vacation': ['travel', 'trip', 'vacation', 'flight', 'hotel', 'passport', 'visiting', 'out of town'],
  'Clothes and Belongings': ['clothes', 'shoes', 'jacket', 'bag', 'backpack', 'toy', 'toys', 'belongings', 'stuff'],
  'Food and Meals': ['food', 'dinner', 'lunch', 'breakfast', 'eat', 'eating', 'meal', 'hungry', 'snack', 'feed'],
  'Sleep and Bedtime': ['sleep', 'bedtime', 'bed', 'tired', 'nap', 'wake up', 'sleeping', 'woke up'],
  'Communication Issues': ['respond', 'reply', 'call', 'text', 'answer', 'ignore', 'ignoring', 'message', 'phone'],
};

async function bulkThreadMessages() {
  const dbPostgres = require('../dbPostgres');

  try {
    console.log('\n🔄 Bulk threading messages...\n');

    // Get existing threads
    const existingThreads = await dbPostgres.query(
      'SELECT id, title FROM threads WHERE room_id = $1',
      [ROOM_ID]
    );

    const threadMap = {};
    existingThreads.rows.forEach(t => {
      threadMap[t.title.toLowerCase()] = t.id;
    });

    console.log(`Found ${existingThreads.rows.length} existing threads\n`);

    // Get unthreaded messages
    const unthreadedResult = await dbPostgres.query(`
      SELECT id, text, timestamp
      FROM messages
      WHERE room_id = $1
        AND (thread_id IS NULL OR thread_id = '')
        AND type != 'system'
        AND text IS NOT NULL
        AND LENGTH(text) > 5
      ORDER BY timestamp ASC
    `, [ROOM_ID]);

    console.log(`Found ${unthreadedResult.rows.length} unthreaded messages\n`);

    let totalAssigned = 0;
    const topicCounts = {};

    // For each topic, find and assign matching messages
    for (const [topicName, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      // Find or create thread for this topic
      let threadId = threadMap[topicName.toLowerCase()];

      if (!threadId) {
        // Create new thread
        threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await dbPostgres.query(`
          INSERT INTO threads (id, room_id, title, created_by, created_at, updated_at, message_count, is_archived)
          VALUES ($1, $2, $3, 'system', NOW(), NOW(), 0, 0)
        `, [threadId, ROOM_ID, topicName]);
        threadMap[topicName.toLowerCase()] = threadId;
        console.log(`📁 Created thread: ${topicName}`);
      }

      // Build regex pattern for keywords
      const pattern = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const regex = new RegExp(pattern, 'i');

      // Find matching messages
      let assignedCount = 0;
      for (const msg of unthreadedResult.rows) {
        if (msg.text && regex.test(msg.text)) {
          // Assign to thread
          await dbPostgres.query(
            'UPDATE messages SET thread_id = $1 WHERE id = $2 AND (thread_id IS NULL OR thread_id = \'\')',
            [threadId, msg.id]
          );
          assignedCount++;
        }
      }

      if (assignedCount > 0) {
        // Update thread message count
        await dbPostgres.query(`
          UPDATE threads SET
            message_count = (SELECT COUNT(*) FROM messages WHERE thread_id = $1),
            updated_at = NOW()
          WHERE id = $1
        `, [threadId]);

        console.log(`  ✅ ${topicName}: ${assignedCount} messages assigned`);
        totalAssigned += assignedCount;
        topicCounts[topicName] = assignedCount;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  Total messages assigned: ${totalAssigned}`);
    console.log(`  Topics with messages:`);
    Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([topic, count]) => {
        console.log(`    - ${topic}: ${count}`);
      });

    // Final count
    const finalUnthreaded = await dbPostgres.query(`
      SELECT COUNT(*) as count FROM messages
      WHERE room_id = $1
        AND (thread_id IS NULL OR thread_id = '')
        AND type != 'system'
    `, [ROOM_ID]);

    console.log(`\n  Remaining unthreaded: ${finalUnthreaded.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

bulkThreadMessages();
