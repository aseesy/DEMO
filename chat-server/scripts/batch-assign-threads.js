/**
 * Batch assign existing messages to threads based on keyword matching
 * This populates threads with all related conversation messages
 */

require('dotenv').config();
const { Client } = require('pg');

const CATEGORY_KEYWORDS = {
  schedule: ['pickup', 'dropoff', 'drop-off', 'pick-up', 'custody', 'visitation', 'weekend', 'weekday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'morning', 'evening', 'afternoon', 'time', 'schedule', 'arrangement', 'switch', 'exchange'],
  medical: ['doctor', 'hospital', 'medicine', 'medication', 'prescription', 'appointment', 'sick', 'fever', 'health', 'dentist', 'therapy', 'therapist', 'vaccine', 'checkup', 'illness', 'symptoms', 'allergy'],
  education: ['school', 'homework', 'teacher', 'grade', 'class', 'test', 'exam', 'tutor', 'tutoring', 'college', 'education', 'learning', 'assignment', 'project', 'report', 'conference'],
  finances: ['money', 'payment', 'expense', 'cost', 'bill', 'support', 'reimburse', 'financial', 'budget', 'pay', 'paid', 'owe', 'debt', 'invoice', 'receipt', 'spend', 'spent'],
  activities: ['soccer', 'basketball', 'baseball', 'football', 'practice', 'game', 'sport', 'activity', 'hobby', 'lesson', 'camp', 'club', 'dance', 'music', 'piano', 'swim', 'swimming', 'gymnastics', 'tournament'],
  travel: ['travel', 'trip', 'vacation', 'flight', 'passport', 'visit', 'holiday', 'plane', 'airport', 'hotel'],
  safety: ['emergency', 'safety', 'concern', 'danger', 'worry', 'urgent', 'warning', 'accident', 'injury', 'hurt'],
  logistics: ['clothes', 'clothing', 'shoes', 'backpack', 'supplies', 'stuff', 'things', 'items', 'belongings', 'forgot', 'left', 'bring', 'pack'],
  'co-parenting': ['parenting', 'decision', 'agree', 'disagree', 'discuss', 'relationship', 'communication', 'boundary', 'conflict', 'cooperate', 'rules', 'discipline'],
};

async function batchAssignMessages() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('🔄 Starting batch thread assignment...\n');

  // Get active threads
  const threads = await client.query('SELECT id, title, category, room_id FROM threads WHERE is_archived = 0');
  console.log(`Found ${threads.rows.length} active threads`);

  // Get ALL unassigned messages (from 2024 onwards - skip ancient history)
  const cutoffDate = new Date('2024-01-01');

  const messages = await client.query(`
    SELECT id, text, room_id, timestamp
    FROM messages
    WHERE thread_id IS NULL
      AND text IS NOT NULL
      AND text != ''
      AND LENGTH(text) > 10
      AND timestamp >= $1
      AND (type IS NULL OR type NOT IN ('system', 'ai_intervention'))
    ORDER BY timestamp DESC
  `, [cutoffDate.toISOString()]);

  console.log(`Found ${messages.rows.length} unassigned messages since 2024\n`);

  const assignments = {}; // threadId -> [messageIds]

  for (const msg of messages.rows) {
    const textLower = msg.text.toLowerCase();
    const words = textLower.split(/\s+/).map(w => w.replace(/[^a-z]/g, '')).filter(w => w.length > 2);

    let bestThread = null;
    let bestScore = 0;

    for (const thread of threads.rows) {
      if (thread.room_id !== msg.room_id) continue;

      const titleWords = thread.title.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z]/g, '')).filter(w => w.length > 2);
      const categoryKws = CATEGORY_KEYWORDS[thread.category] || [];

      let score = 0;

      // Title keyword match (3x weight)
      for (const tw of titleWords) {
        if (words.includes(tw)) score += 3;
      }

      // Category keyword match (2x weight) - check if ANY word matches
      for (const cw of categoryKws) {
        if (textLower.includes(cw)) score += 2;
      }

      // Lower threshold to 2 to capture more messages
      if (score > bestScore && score >= 2) {
        bestScore = score;
        bestThread = thread;
      }
    }

    if (bestThread) {
      if (!assignments[bestThread.id]) {
        assignments[bestThread.id] = { thread: bestThread, messageIds: [] };
      }
      assignments[bestThread.id].messageIds.push(msg.id);
    }
  }

  // Preview assignments
  console.log('📊 Assignment preview:');
  let totalToAssign = 0;
  for (const [threadId, data] of Object.entries(assignments)) {
    console.log(`  📁 "${data.thread.title}" [${data.thread.category}]: ${data.messageIds.length} messages`);
    totalToAssign += data.messageIds.length;
  }
  console.log(`\nTotal: ${totalToAssign} messages to assign\n`);

  // Perform assignments
  if (process.argv.includes('--execute')) {
    console.log('🚀 Executing assignments...\n');

    for (const [threadId, data] of Object.entries(assignments)) {
      const messageIds = data.messageIds;
      const now = new Date().toISOString();

      // Batch update messages to assign to thread
      await client.query(`
        UPDATE messages
        SET thread_id = $1
        WHERE id = ANY($2)
      `, [threadId, messageIds]);

      // Update thread message count and timestamps
      await client.query(`
        UPDATE threads
        SET message_count = (SELECT COUNT(*) FROM messages WHERE thread_id = $1),
            updated_at = $2,
            last_message_at = (SELECT MAX(timestamp) FROM messages WHERE thread_id = $1)
        WHERE id = $1
      `, [threadId, now]);

      console.log(`  ✅ Assigned ${messageIds.length} messages to "${data.thread.title}"`);
    }

    console.log('\n✅ Batch assignment complete!');
  } else {
    console.log('ℹ️  Run with --execute to perform the assignments');
  }

  await client.end();
}

batchAssignMessages().catch(console.error);
