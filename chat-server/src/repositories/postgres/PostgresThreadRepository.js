/**
 * PostgreSQL Thread Repository Implementation
 *
 * Implements IThreadRepository using PostgreSQL database.
 * Handles all thread persistence operations.
 *
 * @module repositories/postgres/PostgresThreadRepository
 */

const { IThreadRepository } = require('../interfaces/IThreadRepository');
const { PostgresGenericRepository } = require('./PostgresGenericRepository');
const { normalizeCategory, validateCategory } = require('../../services/threads/threadCategories');
const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({ component: 'PostgresThreadRepository' });

/**
 * PostgreSQL implementation of thread repository
 * Uses ISemanticIndex for semantic operations (dependency injection)
 */
class PostgresThreadRepository extends PostgresGenericRepository {
  /**
   * @param {ISemanticIndex} semanticIndex - Semantic index implementation (injected)
   */
  constructor(semanticIndex = null) {
    super('threads');
    this.semanticIndex = semanticIndex;
  }

  /**
   * Find threads by room ID
   * @param {string} roomId - Room ID
   * @param {Object} options - { includeArchived, limit }
   * @returns {Promise<Array>} Array of thread objects
   */
  async findByRoomId(roomId, options = {}) {
    const { includeArchived = false, limit = 10 } = options;

    // Check query cache first
    const queryCache = require('../../infrastructure/cache/queryCache');
    const cacheKey = { roomId, includeArchived, limit };
    const cached = await queryCache.get('threads:room', cacheKey);
    if (cached) {
      return cached;
    }

    const whereClause = includeArchived ? { room_id: roomId } : { room_id: roomId, is_archived: 0 };

    // PERFORMANCE: Uses idx_threads_room_archived_updated or idx_threads_room_active_updated
    //              (created in migration 034) for optimal query performance
    const result = await this.find(whereClause, {
      orderBy: 'updated_at',
      orderDirection: 'DESC',
      limit: limit,
    });

    // Cache result for 5 minutes
    await queryCache.set('threads:room', cacheKey, result, 300).catch(err => {
      logger.warn('Failed to cache threads', err, { roomId, includeArchived, limit });
    });

    return result;
  }

  /**
   * Find thread by ID
   * @param {string} threadId - Thread ID
   * @returns {Promise<Object|null>} Thread object or null
   */
  async findById(threadId) {
    return this.findOne({ id: threadId });
  }

  /**
   * Find threads by category
   * @param {string} roomId - Room ID
   * @param {string} category - Category name
   * @param {number} limit - Maximum number of threads
   * @returns {Promise<Array>} Array of thread objects
   */
  async findByCategory(roomId, category, limit = 10) {
    const normalizedCategory = normalizeCategory(category);
    return this.find(
      { room_id: roomId, category: normalizedCategory, is_archived: 0 },
      { orderBy: 'updated_at', orderDirection: 'DESC', limit }
    );
  }

  /**
   * Create a new thread
   * @param {Object} threadData - Thread data
   * @returns {Promise<string>} Created thread ID
   */
  async create(threadData) {
    const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const normalizedCategory = normalizeCategory(threadData.category || 'logistics');

    const threadRecord = {
      id: threadId,
      room_id: threadData.roomId,
      title: threadData.title,
      created_by: threadData.createdBy,
      created_at: now,
      updated_at: now,
      message_count: threadData.initialMessageId ? 1 : 0,
      last_message_at: threadData.initialMessageId ? now : null,
      is_archived: 0,
      category: normalizedCategory,
      // Top-level thread: no parent, root is self, depth is 0
      parent_thread_id: null,
      root_thread_id: threadId, // Self-reference for top-level
      parent_message_id: null,
      depth: 0,
    };

    // Use parent's insert method to avoid naming conflict with our create method
    const dbSafe = require('../../../dbSafe');
    await dbSafe.safeInsert('threads', threadRecord);

    // Invalidate query cache for this room
    const queryCache = require('../../infrastructure/cache/queryCache');
    await queryCache.invalidateRoom(threadData.roomId).catch(err => {
      logger.warn('Failed to invalidate cache', err, { roomId: threadData.roomId });
    });

    // Index thread for semantic search (fail-open: errors are non-fatal)
    if (this.semanticIndex) {
      try {
        await this.semanticIndex.indexThread(threadId, threadData.roomId, threadData.title);
      } catch (err) {
        // Fail-open: semantic indexing is optional, don't block thread creation
        logger.warn('Failed to index thread (non-fatal)', err, {
          threadId,
          roomId: threadData.roomId,
        });
      }
    }

    return threadId;
  }

  /**
   * Update thread title
   * @param {string} threadId - Thread ID
   * @param {string} newTitle - New title
   * @returns {Promise<boolean>} Success status
   */
  async updateTitle(threadId, newTitle) {
    try {
      // Get roomId before update for cache invalidation
      const thread = await this.findById(threadId);
      const roomId = thread?.room_id;

      await this.update(
        { title: newTitle, updated_at: new Date().toISOString() },
        { id: threadId }
      );

      // Invalidate query cache for this room
      if (roomId) {
        const queryCache = require('../../infrastructure/cache/queryCache');
        await queryCache.invalidateRoom(roomId).catch(err => {
          logger.warn('Failed to invalidate cache', err, { roomId });
        });
      }

      return true;
    } catch (error) {
      logger.error('Error updating thread title', error, { threadId });
      return false;
    }
  }

  /**
   * Update thread category
   * @param {string} threadId - Thread ID
   * @param {string} newCategory - New category
   * @returns {Promise<boolean>} Success status
   */
  async updateCategory(threadId, newCategory) {
    try {
      // Get roomId before update for cache invalidation
      const thread = await this.findById(threadId);
      const roomId = thread?.room_id;

      const normalizedCategory = normalizeCategory(newCategory);
      await this.update(
        { category: normalizedCategory, updated_at: new Date().toISOString() },
        { id: threadId }
      );

      // Invalidate query cache for this room
      if (roomId) {
        const queryCache = require('../../infrastructure/cache/queryCache');
        await queryCache.invalidateRoom(roomId).catch(err => {
          logger.warn('Failed to invalidate cache', err, { roomId });
        });
      }

      return true;
    } catch (error) {
      logger.error('Error updating thread category', error, { threadId, category: newCategory });
      return false;
    }
  }

  /**
   * Archive or unarchive a thread
   * @param {string} threadId - Thread ID
   * @param {boolean} archived - Archive status
   * @returns {Promise<boolean>} Success status
   */
  async archive(threadId, archived = true) {
    try {
      // Get roomId before update for cache invalidation
      const thread = await this.findById(threadId);
      const roomId = thread?.room_id;

      await this.update(
        { is_archived: archived ? 1 : 0, updated_at: new Date().toISOString() },
        { id: threadId }
      );

      // Invalidate query cache for this room
      if (roomId) {
        const queryCache = require('../../infrastructure/cache/queryCache');
        await queryCache.invalidateRoom(roomId).catch(err => {
          logger.warn('Failed to invalidate cache', err, { roomId });
        });
      }

      return true;
    } catch (error) {
      logger.error('Error archiving thread', error, { threadId, archived });
      return false;
    }
  }

  /**
   * Get messages for a thread
   * @param {string} threadId - Thread ID
   * @param {number} limit - Maximum number of messages
   * @returns {Promise<Array>} Array of message objects
   */
  async getMessages(threadId, limit = 50, offset = 0) {
    try {
      const db = require('../../../dbPostgres');
      const { buildUserObject } = require('../../../socketHandlers/utils');

      // Get messages for this thread, excluding system messages, private, and flagged
      // Order by sequence number (handles out-of-order delivery), fallback to timestamp
      // Join with users table to get user details for sender
      // PERFORMANCE: Uses idx_messages_thread_timestamp index (created in migration 017)
      //              Filters by thread_id first (indexed), then applies private/flagged filters
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
          sequenceNumber: msg.thread_sequence,
        };
      });
    } catch (error) {
      logger.error('Error getting thread messages', error, { threadId, limit, offset });
      return [];
    }
  }

  /**
   * Add a message to a thread
   * @param {string} messageId - Message ID
   * @param {string} threadId - Thread ID
   * @returns {Promise<Object>} Result with success, messageCount, lastMessageAt, sequenceNumber
   */
  async addMessage(messageId, threadId) {
    try {
      const db = require('../../../dbPostgres');
      const now = new Date().toISOString();

      // ATOMIC SEQUENCE ASSIGNMENT + INCREMENT in single transaction
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

      // Index message for semantic search (fail-open: errors are non-fatal)
      if (this.semanticIndex) {
        try {
          await this.semanticIndex.indexMessage(messageId, threadId);
        } catch (err) {
          // Fail-open: semantic indexing is optional, don't block message addition
          logger.warn('Failed to index message (non-fatal)', err, { messageId, threadId });
        }
      }

      const row = result.rows[0] || {};
      return {
        success: true,
        messageCount: row.message_count || 0,
        lastMessageAt: row.last_message_at || now,
        sequenceNumber: row.thread_sequence || 0,
      };
    } catch (error) {
      logger.error('Error adding message to thread', error, { messageId, threadId });
      return { success: false, messageCount: 0, lastMessageAt: null, sequenceNumber: null };
    }
  }

  /**
   * Remove a message from a thread
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Result with success, threadId, messageCount
   */
  async removeMessage(messageId) {
    try {
      const db = require('../../../dbPostgres');
      const dbSafe = require('../../../dbSafe');

      // First get the thread_id before we null it
      const msgResult = await db.query('SELECT thread_id FROM messages WHERE id = $1', [messageId]);
      const threadId = msgResult.rows[0]?.thread_id;

      // Update message to remove from thread
      await dbSafe.safeUpdate('messages', { thread_id: null }, { id: messageId });

      if (!threadId) {
        return { success: true, threadId: null, messageCount: 0 };
      }

      // ATOMIC DECREMENT in database layer
      const now = new Date().toISOString();
      const result = await db.query(
        `UPDATE threads
         SET message_count = GREATEST(0, message_count - 1),
             updated_at = $1
         WHERE id = $2
         RETURNING message_count`,
        [now, threadId]
      );

      return {
        success: true,
        threadId,
        messageCount: result.rows[0]?.message_count || 0,
      };
    } catch (error) {
      logger.error('Error removing message from thread', error, { messageId });
      return { success: false, threadId: null, messageCount: 0 };
    }
  }
}

module.exports = { PostgresThreadRepository };
