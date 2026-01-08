/**
 * ThreadService - Orchestrates conversation threading
 *
 * Coordinates:
 * - ConversationWindower for grouping messages
 * - ThreadAnalyzer for AI analysis
 * - Database persistence for threads, decisions, open items
 *
 * Provides automatic processing triggered by new messages.
 *
 * @module services/threads/ThreadService
 */

const pool = require('../../../dbPostgres');
const ConversationWindower = require('./ConversationWindower');
const ThreadAnalyzer = require('./ThreadAnalyzer');

const { defaultLogger: defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'ThreadService',
});

// Processing debounce per room (30 seconds)
const PROCESS_DEBOUNCE_MS = 30 * 1000;

// Track processing state per room
const processingState = new Map();

class ThreadService {
  constructor(options = {}) {
    this.windower = new ConversationWindower(options.windowerConfig);
    this.analyzer = new ThreadAnalyzer(null, options.analyzerConfig);
    this.debounceMs = options.debounceMs || PROCESS_DEBOUNCE_MS;
  }

  /**
   * Get threads for a room, grouped by category
   *
   * @param {string} roomId Room ID
   * @param {Object} options Query options
   * @param {number} options.limitPerCategory Max threads per category (default: 5)
   * @param {boolean} options.includeDetails Include decisions/open items (default: false)
   * @returns {Promise<Object>} Threads grouped by category
   */
  async getThreadsByCategory(roomId, options = {}) {
    const { limitPerCategory = 5, includeDetails = false } = options;

    const query = `
      WITH ranked_threads AS (
        SELECT
          t.*,
          ROW_NUMBER() OVER (PARTITION BY t.category ORDER BY t.last_message_at DESC NULLS LAST) as rn
        FROM threads t
        WHERE t.room_id = $1
          AND t.is_archived = 0
      )
      SELECT * FROM ranked_threads
      WHERE rn <= $2
      ORDER BY
        CASE category
          WHEN 'safety' THEN 1
          WHEN 'medical' THEN 2
          WHEN 'schedule' THEN 3
          WHEN 'education' THEN 4
          WHEN 'finances' THEN 5
          WHEN 'activities' THEN 6
          WHEN 'travel' THEN 7
          WHEN 'co-parenting' THEN 8
          WHEN 'logistics' THEN 9
          ELSE 10
        END,
        last_message_at DESC NULLS LAST
    `;

    const result = await pool.query(query, [roomId, limitPerCategory]);

    // Group by category
    const grouped = {};
    for (const thread of result.rows) {
      const category = thread.category || 'logistics';
      if (!grouped[category]) {
        grouped[category] = [];
      }

      const threadData = {
        id: thread.id,
        title: thread.title,
        category: thread.category,
        summary: thread.summary,
        messageCount: thread.message_count,
        firstMessageAt: thread.first_message_at,
        lastMessageAt: thread.last_message_at,
        aiConfidence: thread.ai_confidence,
        createdAt: thread.created_at,
      };

      if (includeDetails) {
        threadData.decisions = await this._getDecisions(thread.id);
        threadData.openItems = await this._getOpenItems(thread.id);
      }

      grouped[category].push(threadData);
    }

    return grouped;
  }

  /**
   * Get a single thread with full details
   *
   * @param {string} threadId Thread ID
   * @returns {Promise<Object>} Thread with decisions, open items, and messages
   */
  async getThreadWithDetails(threadId) {
    // Get thread
    const threadResult = await pool.query('SELECT * FROM threads WHERE id = $1', [threadId]);

    if (threadResult.rows.length === 0) {
      return null;
    }

    const thread = threadResult.rows[0];

    // Get messages
    const messagesResult = await pool.query(
      `
      SELECT m.id, m.text, m.user_email, m.timestamp, m.type
      FROM messages m
      WHERE m.thread_id = $1
      ORDER BY m.timestamp ASC
    `,
      [threadId]
    );

    // Get participant names
    const emails = [...new Set(messagesResult.rows.map(m => m.user_email).filter(Boolean))];
    const usersResult =
      emails.length > 0
        ? await pool.query(
            'SELECT email, first_name, display_name FROM users WHERE email = ANY($1)',
            [emails]
          )
        : { rows: [] };

    const nameMap = {};
    usersResult.rows.forEach(u => {
      nameMap[u.email] = u.first_name || u.display_name || u.email.split('@')[0];
    });

    return {
      id: thread.id,
      title: thread.title,
      category: thread.category,
      summary: thread.summary,
      messageCount: thread.message_count,
      firstMessageAt: thread.first_message_at,
      lastMessageAt: thread.last_message_at,
      aiConfidence: thread.ai_confidence,
      decisions: await this._getDecisions(threadId),
      openItems: await this._getOpenItems(threadId),
      messages: messagesResult.rows.map(m => ({
        id: m.id,
        text: m.text,
        senderEmail: m.user_email,
        senderName: nameMap[m.user_email] || m.user_email?.split('@')[0],
        timestamp: m.timestamp,
      })),
    };
  }

  /**
   * Process new messages for a room (debounced)
   *
   * @param {string} roomId Room ID
   * @returns {Promise<void>}
   */
  queueProcessing(roomId) {
    // Get or create state for this room
    let state = processingState.get(roomId);
    if (!state) {
      state = { timer: null, lastProcessed: null };
      processingState.set(roomId, state);
    }

    // Clear existing timer
    if (state.timer) {
      clearTimeout(state.timer);
    }

    // Set new timer
    state.timer = setTimeout(async () => {
      try {
        await this.processRoom(roomId);
        state.lastProcessed = new Date();
      } catch (error) {
        logger.error('Log message', {
          arg0: `[ThreadService] Error processing room ${roomId}:`,
          error: error,
        });
      }
      state.timer = null;
    }, this.debounceMs);

    logger.debug('Log message', {
      value: `[ThreadService] Queued processing for room ${roomId} (${this.debounceMs}ms debounce)`,
    });
  }

  /**
   * Process a room to create/update threads
   *
   * @param {string} roomId Room ID
   * @param {Object} options Processing options
   * @returns {Promise<{created: number, updated: number}>}
   */
  async processRoom(roomId, options = {}) {
    logger.debug('Log message', {
      value: `[ThreadService] Processing room ${roomId}...`,
    });

    // Check if AI is available
    if (!this.analyzer.isAvailable()) {
      logger.warn('[ThreadService] AI not available, skipping analysis');
      return { created: 0, updated: 0, skipped: true };
    }

    // Get unprocessed conversation windows
    const windows = await this.windower.getUnprocessedWindows(roomId, 10);

    if (windows.length === 0) {
      logger.debug('[ThreadService] No unprocessed windows found');
      return { created: 0, updated: 0 };
    }

    logger.debug('Log message', {
      value: `[ThreadService] Found ${windows.length} windows to process`,
    });

    let created = 0;
    let updated = 0;

    for (const window of windows) {
      try {
        // Analyze window
        const analysis = await this.analyzer.analyzeWindow(window);

        // Create or update thread
        const threadId = await this._createThread(roomId, window, analysis);

        // Save decisions
        for (const decision of analysis.decisions) {
          await this._saveDecision(threadId, decision);
        }

        // Save open items
        for (const openItem of analysis.openItems) {
          await this._saveOpenItem(threadId, openItem);
        }

        created++;
        logger.debug('Log message', {
          value: `[ThreadService] Created thread: "${analysis.title}" (${analysis.category})`,
        });
      } catch (error) {
        logger.error('[ThreadService] Error processing window', {
          error: error,
        });
      }
    }

    return { created, updated };
  }

  /**
   * Backfill threads for a room (process all historical messages)
   *
   * @param {string} roomId Room ID
   * @param {Object} options Backfill options
   * @returns {Promise<{processed: number, created: number}>}
   */
  async backfillRoom(roomId, options = {}) {
    const { limit = 500, batchSize = 10 } = options;

    logger.debug('Log message', {
      value: `[ThreadService] Starting backfill for room ${roomId}...`,
    });

    // Get all windows
    const windows = await this.windower.getConversationWindows(roomId, {
      limit,
    });

    logger.debug('Log message', {
      value: `[ThreadService] Found ${windows.length} total windows`,
    });

    let created = 0;

    // Process in batches
    for (let i = 0; i < windows.length; i += batchSize) {
      const batch = windows.slice(i, i + batchSize);

      for (const window of batch) {
        try {
          // Check if window messages are already threaded
          const alreadyThreaded = await this._areMessagesThreaded(window.messageIds);
          if (alreadyThreaded) {
            continue;
          }

          // Analyze and create thread
          const analysis = await this.analyzer.analyzeWindow(window);
          const threadId = await this._createThread(roomId, window, analysis);

          for (const decision of analysis.decisions) {
            await this._saveDecision(threadId, decision);
          }
          for (const openItem of analysis.openItems) {
            await this._saveOpenItem(threadId, openItem);
          }

          created++;
        } catch (error) {
          logger.error('[ThreadService] Backfill error', {
            message: error.message,
          });
        }
      }

      logger.debug('Log message', {
        value: `[ThreadService] Backfill progress: ${Math.min(i + batchSize, windows.length)}/${windows.length}`,
      });

      // Small delay between batches to avoid rate limits
      if (i + batchSize < windows.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.debug('Log message', {
      value: `[ThreadService] Backfill complete: ${created} threads created`,
    });
    return { processed: windows.length, created };
  }

  // ============================================================
  // Private methods
  // ============================================================

  async _getDecisions(threadId) {
    const result = await pool.query(
      `
      SELECT id, decision_text, decided_by, agreed_by, source_message_ids, created_at
      FROM thread_decisions
      WHERE thread_id = $1
      ORDER BY created_at ASC
    `,
      [threadId]
    );

    return result.rows.map(d => ({
      id: d.id,
      text: d.decision_text,
      decidedBy: d.decided_by,
      agreedBy: d.agreed_by,
      messageIds: d.source_message_ids,
      createdAt: d.created_at,
    }));
  }

  async _getOpenItems(threadId) {
    const result = await pool.query(
      `
      SELECT id, item_text, status, assigned_to, source_message_ids, created_at, resolved_at
      FROM thread_open_items
      WHERE thread_id = $1
      ORDER BY
        CASE status WHEN 'open' THEN 0 ELSE 1 END,
        created_at ASC
    `,
      [threadId]
    );

    return result.rows.map(o => ({
      id: o.id,
      text: o.item_text,
      status: o.status,
      assignedTo: o.assigned_to,
      messageIds: o.source_message_ids,
      createdAt: o.created_at,
      resolvedAt: o.resolved_at,
    }));
  }

  async _createThread(roomId, window, analysis) {
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert thread
      await client.query(
        `
        INSERT INTO threads (
          id, room_id, title, category, summary, message_count,
          first_message_at, last_message_at, ai_confidence, processing_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'complete')
      `,
        [
          threadId,
          roomId,
          analysis.title,
          analysis.category,
          analysis.summary,
          window.messageCount,
          window.firstMessageAt,
          window.lastMessageAt,
          analysis.confidence,
        ]
      );

      // Update messages with thread_id
      if (window.messageIds.length > 0) {
        await client.query(
          `
          UPDATE messages
          SET thread_id = $1
          WHERE id = ANY($2)
        `,
          [threadId, window.messageIds]
        );
      }

      await client.query('COMMIT');
      return threadId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async _saveDecision(threadId, decision) {
    await pool.query(
      `
      INSERT INTO thread_decisions (thread_id, decision_text, decided_by, source_message_ids)
      VALUES ($1, $2, $3, $4)
    `,
      [threadId, decision.text, decision.decidedBy, decision.messageIds || []]
    );
  }

  async _saveOpenItem(threadId, openItem) {
    await pool.query(
      `
      INSERT INTO thread_open_items (thread_id, item_text, assigned_to, source_message_ids)
      VALUES ($1, $2, $3, $4)
    `,
      [threadId, openItem.text, openItem.assignedTo, openItem.messageIds || []]
    );
  }

  async _areMessagesThreaded(messageIds) {
    const result = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM messages
      WHERE id = ANY($1) AND thread_id IS NOT NULL
    `,
      [messageIds]
    );

    return parseInt(result.rows[0].count) > 0;
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create ThreadService instance
 * @returns {ThreadService}
 */
function getThreadService() {
  if (!instance) {
    instance = new ThreadService();
  }
  return instance;
}

module.exports = {
  ThreadService,
  getThreadService,
};
