/**
 * Thread Messages Module
 *
 * Handles message-thread operations:
 * - Add message to thread
 * - Remove message from thread
 * - Get messages for a thread
 */

const dbSafe = require('../../../dbSafe');
const { buildUserObject } = require('../../../socketHandlers/utils');

// Neo4j client for semantic threading
let neo4jClient = null;
try {
  neo4jClient = require('../../infrastructure/database/neo4jClient');
} catch (err) {
  console.warn('⚠️  Neo4j client not available - semantic threading will use fallback');
}

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
    const msgResult = await db.query('SELECT thread_id FROM messages WHERE id = $1', [messageId]);
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
 * Get messages for a specific thread
 * Orders by sequence number (temporal integrity) with timestamp fallback
 * @param {string} threadId - Thread ID
 * @param {number} limit - Maximum number of messages to return (default 50)
 * @param {number} offset - Offset for pagination (default 0)
 * @returns {Promise<Array>} Array of message objects with sender/receiver structure
 */
async function getThreadMessages(threadId, limit = 50, offset = 0) {
  try {
    const db = require('../../../dbPostgres');
    // Get messages for this thread, excluding system messages, private, and flagged
    // Order by sequence number (handles out-of-order delivery), fallback to timestamp
    // Join with users table to get user details for sender
    const query = `
      SELECT m.*, 
             u.id as user_id, u.first_name, u.last_name, u.email
      FROM messages m
      LEFT JOIN users u ON m.user_email = u.email
      WHERE m.thread_id = $1
        AND (m.private = 0 OR m.private IS NULL)
        AND (m.flagged = 0 OR m.flagged IS NULL)
        AND m.type != 'system'
      ORDER BY COALESCE(m.thread_sequence, 0) ASC, m.timestamp ASC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [threadId, limit, offset]);

    // Build sender objects (receiver not needed for threads - same room participants)
    return result.rows.map(msg => {
      const senderData = {
        id: msg.user_id,
        email: msg.user_email,
        first_name: msg.first_name,
        last_name: msg.last_name,
      };
      const sender = buildUserObject(senderData);

      return {
        id: msg.id,
        type: msg.type,

        // ✅ NEW STRUCTURE (primary)
        sender,

        // Database field (keep for database column mapping)
        user_email: msg.user_email,

        // Core fields
        text: msg.text,
        timestamp: msg.timestamp,
        threadId: msg.thread_id,
        roomId: msg.room_id,
        sequenceNumber: msg.thread_sequence, // Include sequence for client-side ordering
      };
    });
  } catch (error) {
    console.error('Error getting thread messages:', error);
    return [];
  }
}

module.exports = {
  addMessageToThread,
  removeMessageFromThread,
  getThreadMessages,
};
