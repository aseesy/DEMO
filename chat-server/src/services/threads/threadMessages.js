/**
 * Thread Messages Module
 *
 * Handles message-thread operations:
 * - Add message to thread
 * - Remove message from thread
 */

const dbSafe = require('../../../dbSafe');
const { extractDistinctiveKeywords } = require('./threadKeywords');

// Neo4j client for semantic threading
let neo4jClient = null;
try {
  neo4jClient = require('../../infrastructure/database/neo4jClient');
} catch (err) {
  console.warn('⚠️  Neo4j client not available - semantic threading will use fallback');
}

// =============================================================================
// CATEGORY KEYWORDS for fast local matching
// =============================================================================
const CATEGORY_KEYWORDS = {
  schedule: ['pickup', 'dropoff', 'drop-off', 'pick-up', 'custody', 'visitation', 'weekend', 'weekday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'morning', 'evening', 'afternoon', 'time', 'schedule', 'arrangement', 'switch', 'exchange'],
  medical: ['doctor', 'hospital', 'medicine', 'medication', 'prescription', 'appointment', 'sick', 'fever', 'health', 'dentist', 'therapy', 'therapist', 'vaccine', 'checkup', 'illness', 'symptoms', 'allergy'],
  education: ['school', 'homework', 'teacher', 'grade', 'class', 'test', 'exam', 'tutor', 'tutoring', 'college', 'education', 'learning', 'assignment', 'project', 'report', 'conference'],
  finances: ['money', 'payment', 'expense', 'cost', 'bill', 'support', 'reimburse', 'financial', 'budget', 'pay', 'paid', 'owe', 'debt', 'invoice', 'receipt', 'spend', 'spent'],
  activities: ['soccer', 'basketball', 'baseball', 'football', 'practice', 'game', 'sport', 'activity', 'hobby', 'lesson', 'camp', 'club', 'dance', 'music', 'piano', 'swim', 'swimming', 'gymnastics', 'martial', 'arts', 'recital', 'tournament'],
  travel: ['travel', 'trip', 'vacation', 'flight', 'passport', 'visit', 'holiday', 'plane', 'airport', 'hotel', 'drive', 'road', 'destination', 'traveling'],
  safety: ['emergency', 'safety', 'concern', 'danger', 'worry', 'secure', 'protect', 'urgent', 'warning', 'alert', 'accident', 'injury', 'hurt'],
  logistics: ['clothes', 'clothing', 'shoes', 'backpack', 'supplies', 'stuff', 'things', 'items', 'belongings', 'forgot', 'left', 'bring', 'pack', 'packed'],
  'co-parenting': ['parenting', 'decision', 'agree', 'discuss', 'relationship', 'communication', 'boundary', 'boundaries', 'conflict', 'disagreement', 'cooperate', 'rules', 'discipline'],
};

/**
 * Add message to thread
 * Uses atomic database operations - never calculate in application layer
 * - Assigns sequence number atomically for temporal integrity
 * - Increments message_count atomically
 * Returns the new message count and sequence number for delta updates
 */
async function addMessageToThread(messageId, threadId) {
  try {
    const db = require('../../../dbPostgres');
    const now = new Date().toISOString();

    // ATOMIC SEQUENCE ASSIGNMENT + INCREMENT in single transaction
    // This ensures no race conditions for sequence numbers
    const result = await db.query(
      `WITH sequence_assign AS (
         UPDATE threads
         SET next_sequence = next_sequence + 1,
             message_count = message_count + 1,
             last_message_at = $1,
             updated_at = $1
         WHERE id = $2
         RETURNING next_sequence - 1 as assigned_sequence, message_count, last_message_at
       )
       UPDATE messages
       SET thread_id = $2,
           thread_sequence = (SELECT assigned_sequence FROM sequence_assign)
       WHERE id = $3
       RETURNING thread_sequence, (SELECT message_count FROM sequence_assign) as message_count,
                 (SELECT last_message_at FROM sequence_assign) as last_message_at`,
      [now, threadId, messageId]
    );

    // Link message to thread in Neo4j for semantic search
    if (neo4jClient && neo4jClient.isAvailable()) {
      try {
        await neo4jClient.linkMessageToThread(messageId, threadId);
      } catch (err) {
        console.warn('⚠️  Failed to link message to thread in Neo4j (non-fatal):', err.message);
      }
    }

    const row = result.rows[0] || {};
    const messageCount = row.message_count || 0;
    const lastMessageAt = row.last_message_at || now;
    const sequenceNumber = row.thread_sequence || 0;

    return { success: true, messageCount, lastMessageAt, sequenceNumber };
  } catch (error) {
    console.error('Error adding message to thread:', error);
    return { success: false, messageCount: 0, lastMessageAt: null, sequenceNumber: null };
  }
}

/**
 * Remove message from thread (move back to main conversation)
 * Uses atomic database decrement - never calculate in application layer
 * Returns the threadId and new count for delta updates
 */
async function removeMessageFromThread(messageId) {
  try {
    const db = require('../../../dbPostgres');

    // First get the thread_id before we null it
    const msgResult = await db.query(
      'SELECT thread_id FROM messages WHERE id = $1',
      [messageId]
    );
    const threadId = msgResult.rows[0]?.thread_id;

    // Update message to remove from thread
    await dbSafe.safeUpdate('messages', { thread_id: null }, { id: messageId });

    if (!threadId) {
      return { success: true, threadId: null, messageCount: 0 };
    }

    // ATOMIC DECREMENT in database layer - never read-modify-write in app layer
    const now = new Date().toISOString();
    const result = await db.query(
      `UPDATE threads
       SET message_count = GREATEST(0, message_count - 1),
           updated_at = $1
       WHERE id = $2
       RETURNING message_count`,
      [now, threadId]
    );

    const messageCount = result.rows[0]?.message_count || 0;

    return { success: true, threadId, messageCount };
  } catch (error) {
    console.error('Error removing message from thread:', error);
    return { success: false, threadId: null, messageCount: 0 };
  }
}

/**
 * Auto-assign a message to the best matching existing thread
 * Uses fast keyword matching (no AI call) for real-time assignment
 *
 * @param {Object} message - Message object with id, text, roomId
 * @param {Function} getThreadsForRoom - Function to get threads for room
 * @returns {Promise<Object|null>} - { threadId, threadTitle, category, score } or null
 */
async function autoAssignMessageToThread(message, getThreadsForRoom) {
  if (!message || !message.text || !message.roomId) {
    return null;
  }

  try {
    // Get existing active threads for this room
    const existingThreads = await getThreadsForRoom(message.roomId, false);

    if (existingThreads.length === 0) {
      return null;
    }

    // Extract keywords from the message
    const messageKeywords = extractDistinctiveKeywords(message.text, 3);

    if (messageKeywords.length === 0) {
      return null;
    }

    // Score each thread based on keyword overlap
    const scoredThreads = existingThreads.map(thread => {
      // Extract keywords from thread title
      const titleKeywords = extractDistinctiveKeywords(thread.title, 3);

      // Get category-specific keywords
      const categoryKeywords = CATEGORY_KEYWORDS[thread.category] || [];

      // Calculate score
      let score = 0;

      // 1. Direct keyword match with thread title (highest weight)
      const titleMatches = messageKeywords.filter(k => titleKeywords.includes(k));
      score += titleMatches.length * 3;

      // 2. Category keyword match (medium weight)
      const categoryMatches = messageKeywords.filter(k => categoryKeywords.includes(k));
      score += categoryMatches.length * 2;

      // 3. Bonus for category keywords appearing in thread title
      const titleCategoryOverlap = titleKeywords.filter(k => categoryKeywords.includes(k));
      if (titleCategoryOverlap.length > 0 && categoryMatches.length > 0) {
        score += 2; // Bonus for strong category alignment
      }

      return {
        threadId: thread.id,
        threadTitle: thread.title,
        category: thread.category,
        score,
        titleMatches,
        categoryMatches,
      };
    });

    // Find the best matching thread
    const bestMatch = scoredThreads
      .filter(t => t.score >= 3) // Minimum score threshold
      .sort((a, b) => b.score - a.score)[0];

    if (bestMatch) {
      console.log(`[threadMessages] Auto-assigning message to thread "${bestMatch.threadTitle}" (score: ${bestMatch.score})`);

      // Actually assign the message to the thread
      await addMessageToThread(message.id, bestMatch.threadId);

      return {
        threadId: bestMatch.threadId,
        threadTitle: bestMatch.threadTitle,
        category: bestMatch.category,
        score: bestMatch.score,
      };
    }

    return null;
  } catch (error) {
    console.error('[threadMessages] Error auto-assigning message to thread:', error);
    return null;
  }
}

module.exports = {
  addMessageToThread,
  removeMessageFromThread,
  autoAssignMessageToThread,
  CATEGORY_KEYWORDS,
};

