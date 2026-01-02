/**
 * PostgreSQL Message Repository
 *
 * Handles all message database operations with optimized queries
 * and consistent data transformation.
 *
 * @module repositories/postgres/MessageRepository
 */

const { PostgresGenericRepository } = require('./PostgresGenericRepository');
const dbPostgres = require('../../../dbPostgres');
const { buildUserObject } = require('../../../socketHandlers/utils');

/**
 * PostgreSQL implementation of message repository
 */
class MessageRepository extends PostgresGenericRepository {
  constructor() {
    super('messages');
  }

  /**
   * Get messages for a room with pagination
   * @param {string} roomId - Room ID
   * @param {Object} options - { limit, offset, before, after, threadId }
   * @returns {Promise<Object>} { messages, total, hasMore }
   */
  async findByRoomId(roomId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      before = null,
      after = null,
      threadId = null,
    } = options;

    // Build WHERE clause
    let whereConditions = ['m.room_id = $1'];
    let params = [roomId];
    let paramIndex = 2;

    // Exclude system messages, private, and flagged
    whereConditions.push('(m.type IS NULL OR m.type != $' + paramIndex + ')');
    params.push('system');
    paramIndex++;

    whereConditions.push('(m.private = 0 OR m.private IS NULL)');
    whereConditions.push('(m.flagged = 0 OR m.flagged IS NULL)');
    whereConditions.push('m.text NOT LIKE $' + paramIndex);
    params.push('%joined the chat%');
    paramIndex++;

    whereConditions.push('m.text NOT LIKE $' + paramIndex);
    params.push('%left the chat%');
    paramIndex++;

    // Filter by thread if specified
    if (threadId) {
      whereConditions.push('m.thread_id = $' + paramIndex);
      params.push(threadId);
      paramIndex++;
    }

    // Cursor-based pagination
    if (before) {
      whereConditions.push('m.timestamp < $' + paramIndex);
      params.push(before);
      paramIndex++;
    }
    if (after) {
      whereConditions.push('m.timestamp > $' + paramIndex);
      params.push(after);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM messages m
      WHERE ${whereClause}
    `;
    const countResult = await dbPostgres.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Get messages with user data
    const messagesQuery = `
      SELECT 
        m.id, m.type, m.user_email, m.text, m.timestamp, m.room_id, m.thread_id,
        m.thread_sequence, m.edited, m.edited_at, m.reactions, m.user_flagged_by,
        m.validation, m.tip1, m.tip2, m.rewrite, m.original_message,
        u.id as user_id, u.first_name, u.last_name, u.email as user_email_from_join
      FROM messages m
      LEFT JOIN users u ON m.user_email IS NOT NULL AND LOWER(m.user_email) = LOWER(u.email)
      WHERE ${whereClause}
      ORDER BY m.timestamp DESC, m.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await dbPostgres.query(messagesQuery, params);
    const messages = this._formatMessages(result.rows, roomId);

    return {
      messages: messages.reverse(), // Return in chronological order
      total,
      hasMore: offset + messages.length < total,
      limit,
      offset,
    };
  }

  /**
   * Get messages for a thread with pagination
   * @param {string} threadId - Thread ID
   * @param {Object} options - { limit, offset }
   * @returns {Promise<Object>} { messages, total, hasMore }
   */
  async findByThreadId(threadId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM messages m
      WHERE m.thread_id = $1
        AND (m.private = 0 OR m.private IS NULL)
        AND (m.flagged = 0 OR m.flagged IS NULL)
        AND m.type != 'system'
    `;
    const countResult = await dbPostgres.query(countQuery, [threadId]);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Get messages
    const messagesQuery = `
      SELECT 
        m.*,
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

    const result = await dbPostgres.query(messagesQuery, [threadId, limit, offset]);
    const messages = this._formatMessages(result.rows);

    return {
      messages,
      total,
      hasMore: offset + messages.length < total,
      limit,
      offset,
    };
  }

  /**
   * Get a single message by ID
   * @param {string} messageId - Message ID
   * @returns {Promise<Object|null>} Message object or null
   */
  async findById(messageId) {
    const query = `
      SELECT 
        m.*,
        u.id as user_id, u.first_name, u.last_name, u.email
      FROM messages m
      LEFT JOIN users u ON m.user_email = u.email
      WHERE m.id = $1
    `;

    const result = await dbPostgres.query(query, [messageId]);
    if (result.rows.length === 0) {
      return null;
    }

    const messages = this._formatMessages(result.rows);
    return messages[0];
  }

  /**
   * Create a new message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created message
   */
  async create(messageData) {
    const {
      id,
      type = 'user',
      user_email,
      text = '',
      timestamp = new Date().toISOString(),
      room_id,
      thread_id = null,
      thread_sequence = null,
      socket_id = null,
      private: isPrivate = false,
      flagged = false,
      validation = null,
      tip1 = null,
      tip2 = null,
      rewrite = null,
      original_message = null,
      edited = false,
      edited_at = null,
      reactions = {},
      user_flagged_by = [],
    } = messageData;

    const insertQuery = `
      INSERT INTO messages (
        id, type, user_email, text, timestamp, room_id, thread_id, thread_sequence,
        socket_id, private, flagged, validation, tip1, tip2, rewrite, original_message,
        edited, edited_at, reactions, user_flagged_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      )
      RETURNING *
    `;

    const params = [
      id,
      type,
      user_email.toLowerCase().trim(),
      text,
      timestamp,
      room_id,
      thread_id,
      thread_sequence,
      socket_id,
      isPrivate ? 1 : 0,
      flagged ? 1 : 0,
      validation,
      tip1,
      tip2,
      rewrite,
      original_message ? JSON.stringify(original_message) : null,
      edited ? 1 : 0,
      edited_at,
      JSON.stringify(reactions),
      JSON.stringify(user_flagged_by),
    ];

    const result = await dbPostgres.query(insertQuery, params);
    const messages = this._formatMessages(result.rows);
    return messages[0];
  }

  /**
   * Update a message
   * @param {string} messageId - Message ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated message or null
   */
  async update(messageId, updates) {
    const allowedFields = [
      'text',
      'edited',
      'edited_at',
      'validation',
      'tip1',
      'tip2',
      'rewrite',
      'original_message',
      'reactions',
      'user_flagged_by',
    ];

    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'original_message' && value) {
          updateFields.push(`${key} = $${paramIndex}`);
          params.push(JSON.stringify(value));
        } else if (key === 'reactions' && value) {
          updateFields.push(`${key} = $${paramIndex}`);
          params.push(JSON.stringify(value));
        } else if (key === 'user_flagged_by' && value) {
          updateFields.push(`${key} = $${paramIndex}`);
          params.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = $${paramIndex}`);
          params.push(value);
        }
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return this.findById(messageId);
    }

    params.push(messageId);
    const query = `
      UPDATE messages
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await dbPostgres.query(query, params);
    if (result.rows.length === 0) {
      return null;
    }

    const messages = this._formatMessages(result.rows);
    return messages[0];
  }

  /**
   * Delete a message (soft delete by setting private flag)
   * @param {string} messageId - Message ID
   * @returns {Promise<boolean>} Success
   */
  async delete(messageId) {
    const query = `
      UPDATE messages
      SET private = 1
      WHERE id = $1
    `;
    const result = await dbPostgres.query(query, [messageId]);
    return result.rowCount > 0;
  }

  /**
   * Format database rows to message DTOs
   * @private
   */
  _formatMessages(rows, roomId = null) {
    return rows.map(row => {
      const senderData = {
        id: row.user_id || null,
        email: row.user_email || null,
        first_name: row.first_name || null,
        last_name: row.last_name || null,
      };

      const sender = buildUserObject(senderData);

      // Parse JSON fields
      const reactions = this._parseJson(row.reactions, {});
      const user_flagged_by = this._parseJson(row.user_flagged_by, []);
      const original_message = this._parseJson(row.original_message, null);

      return {
        id: row.id,
        type: row.type || 'user',
        sender: sender || {
          email: row.user_email,
          firstName: row.first_name,
          lastName: row.last_name,
        },
        receiver: null, // Will be set by service layer
        user_email: row.user_email,
        text: row.text || '',
        timestamp: row.timestamp,
        roomId: row.room_id || roomId,
        threadId: row.thread_id || null,
        threadSequence: row.thread_sequence || null,
        edited: row.edited === 1 || row.edited === '1',
        editedAt: row.edited_at || null,
        reactions,
        user_flagged_by,
        metadata: {
          validation: row.validation || null,
          tip1: row.tip1 || null,
          tip2: row.tip2 || null,
          rewrite: row.rewrite || null,
          originalMessage: original_message,
        },
      };
    });
  }

  /**
   * Parse JSON field with fallback
   * @private
   */
  _parseJson(value, fallback) {
    if (!value) return fallback;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return fallback;
    }
  }
}

module.exports = MessageRepository;

