/**
 * ConversationWindower - Groups messages into conversation windows
 *
 * Groups messages by time proximity to form natural conversation boundaries.
 * A gap of 2+ hours typically indicates a new conversation.
 *
 * Key Design Decisions:
 * - 2 hour gap = new conversation window (configurable)
 * - Same topic replies within longer gaps can be merged
 * - Max window duration: 8 hours (prevents runaway windows)
 * - Min messages per window: 2 (single messages aren't conversations)
 *
 * @module services/threads/ConversationWindower
 */

const pool = require('../../../dbPostgres');

// Default configuration
const DEFAULT_CONFIG = {
  // Gap threshold: 2 hours in milliseconds
  windowGapMs: 2 * 60 * 60 * 1000,

  // Maximum window duration: 4 hours (conversations rarely span longer)
  maxWindowDurationMs: 4 * 60 * 60 * 1000,

  // Minimum messages to form a conversation
  minMessagesPerWindow: 2,

  // Maximum messages per window (typical co-parenting exchanges are 10-30 messages)
  maxMessagesPerWindow: 35,
};

class ConversationWindower {
  /**
   * @param {Object} config Configuration options
   * @param {number} config.windowGapMs Gap threshold in ms (default: 2 hours)
   * @param {number} config.maxWindowDurationMs Max window duration (default: 8 hours)
   * @param {number} config.minMessagesPerWindow Min messages per window (default: 2)
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get messages for a room within a time range
   *
   * @param {string} roomId Room ID
   * @param {Object} options Query options
   * @param {Date} options.since Only messages after this date
   * @param {Date} options.until Only messages before this date
   * @param {number} options.limit Max messages to retrieve
   * @returns {Promise<Array>} Messages ordered by timestamp ASC
   */
  async getMessages(roomId, options = {}) {
    const { since, until, limit = 500 } = options;

    let query = `
      SELECT id, room_id, user_email, text, timestamp, type
      FROM messages
      WHERE room_id = $1
        AND type IN ('user', 'message')
        AND text IS NOT NULL
        AND LENGTH(TRIM(text)) > 0
    `;
    const params = [roomId];

    if (since) {
      params.push(since);
      query += ` AND timestamp > $${params.length}`;
    }

    if (until) {
      params.push(until);
      query += ` AND timestamp <= $${params.length}`;
    }

    query += ` ORDER BY timestamp ASC`;

    if (limit) {
      params.push(limit);
      query += ` LIMIT $${params.length}`;
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Group messages into conversation windows
   *
   * Algorithm:
   * 1. Sort messages by timestamp
   * 2. Start new window when gap > threshold OR duration > max
   * 3. Track participants per window
   * 4. Filter out windows with < minMessages
   *
   * @param {Array} messages Messages to group (must be sorted by timestamp)
   * @returns {Array<ConversationWindow>} Array of conversation windows
   */
  windowMessages(messages) {
    if (!messages || messages.length === 0) {
      return [];
    }

    const windows = [];
    let currentWindow = this._createNewWindow(messages[0]);

    for (let i = 1; i < messages.length; i++) {
      const message = messages[i];
      const prevMessage = messages[i - 1];

      const gap = new Date(message.timestamp) - new Date(prevMessage.timestamp);
      const windowDuration = new Date(message.timestamp) - new Date(currentWindow.firstMessageAt);

      // Start new window if:
      // 1. Gap exceeds threshold (2 hours default)
      // 2. Window duration exceeds max (8 hours default)
      // 3. Window has too many messages
      const shouldStartNewWindow =
        gap > this.config.windowGapMs ||
        windowDuration > this.config.maxWindowDurationMs ||
        currentWindow.messages.length >= this.config.maxMessagesPerWindow;

      if (shouldStartNewWindow) {
        // Save current window if it has enough messages
        if (currentWindow.messages.length >= this.config.minMessagesPerWindow) {
          windows.push(this._finalizeWindow(currentWindow));
        }
        currentWindow = this._createNewWindow(message);
      } else {
        // Add to current window
        this._addMessageToWindow(currentWindow, message);
      }
    }

    // Don't forget the last window
    if (currentWindow.messages.length >= this.config.minMessagesPerWindow) {
      windows.push(this._finalizeWindow(currentWindow));
    }

    return windows;
  }

  /**
   * Get conversation windows for a room
   *
   * @param {string} roomId Room ID
   * @param {Object} options Query options
   * @returns {Promise<Array<ConversationWindow>>} Conversation windows
   */
  async getConversationWindows(roomId, options = {}) {
    const messages = await this.getMessages(roomId, options);
    return this.windowMessages(messages);
  }

  /**
   * Find windows that need processing (no thread_id assigned)
   *
   * @param {string} roomId Room ID
   * @param {number} limit Max windows to return
   * @returns {Promise<Array<ConversationWindow>>} Unprocessed windows
   */
  async getUnprocessedWindows(roomId, limit = 10) {
    // Get messages not assigned to any thread
    const query = `
      SELECT id, room_id, user_email, text, timestamp, type
      FROM messages
      WHERE room_id = $1
        AND type IN ('user', 'message')
        AND text IS NOT NULL
        AND LENGTH(TRIM(text)) > 0
        AND thread_id IS NULL
      ORDER BY timestamp ASC
      LIMIT $2
    `;

    const result = await pool.query(query, [roomId, limit * 50]);
    const windows = this.windowMessages(result.rows);

    return windows.slice(0, limit);
  }

  /**
   * Get the date key for a window (for grouping/display)
   *
   * @param {ConversationWindow} window
   * @returns {string} Date in YYYY-MM-DD format
   */
  getWindowDateKey(window) {
    const date = new Date(window.firstMessageAt);
    return date.toISOString().split('T')[0];
  }

  /**
   * Create a new conversation window
   * @private
   */
  _createNewWindow(firstMessage) {
    return {
      messages: [firstMessage],
      messageIds: [firstMessage.id],
      participants: new Set([firstMessage.user_email]),
      firstMessageAt: firstMessage.timestamp,
      lastMessageAt: firstMessage.timestamp,
    };
  }

  /**
   * Add a message to an existing window
   * @private
   */
  _addMessageToWindow(window, message) {
    window.messages.push(message);
    window.messageIds.push(message.id);
    window.participants.add(message.user_email);
    window.lastMessageAt = message.timestamp;
  }

  /**
   * Finalize a window for output
   * @private
   */
  _finalizeWindow(window) {
    return {
      messages: window.messages,
      messageIds: window.messageIds,
      participants: Array.from(window.participants),
      messageCount: window.messages.length,
      firstMessageAt: window.firstMessageAt,
      lastMessageAt: window.lastMessageAt,
      durationMs: new Date(window.lastMessageAt) - new Date(window.firstMessageAt),
    };
  }
}

module.exports = ConversationWindower;
