/**
 * TopicService - Main service for AI Thread Summaries
 *
 * Orchestrates topic detection, summary generation, and citation management.
 *
 * @module services/topics/TopicService
 */

const pool = require('../../../dbPostgres');
const TopicDetector = require('./TopicDetector');
const SummaryGenerator = require('./SummaryGenerator');

// Debounce map for summary regeneration
const regenerationQueue = new Map();
const REGENERATION_DEBOUNCE_MS = 30000; // 30 seconds

class TopicService {
  constructor(aiClient) {
    this.detector = new TopicDetector();
    this.generator = new SummaryGenerator(aiClient);
  }

  /**
   * Get all topics for a room
   *
   * @param {string} roomId Room ID
   * @param {Object} options Query options
   * @returns {Promise<Array>} Topics with summary previews
   */
  async getTopicsForRoom(roomId, options = {}) {
    const { includeArchived = false, limit = 20 } = options;

    let query = `
      SELECT ts.*,
             (SELECT COUNT(*) FROM topic_messages tm WHERE tm.topic_id = ts.id) as actual_message_count
      FROM topic_summaries ts
      WHERE ts.room_id = $1
    `;

    if (!includeArchived) {
      query += ' AND ts.is_archived = FALSE';
    }

    query += ' ORDER BY ts.updated_at DESC LIMIT $2';

    const result = await pool.query(query, [roomId, limit]);
    return result.rows;
  }

  /**
   * Get a single topic with full citations
   *
   * @param {string} topicId Topic ID
   * @returns {Promise<Object>} Topic with citations
   */
  async getTopicWithCitations(topicId) {
    // Get topic
    const topicResult = await pool.query(
      'SELECT * FROM topic_summaries WHERE id = $1',
      [topicId]
    );

    if (topicResult.rows.length === 0) {
      return null;
    }

    const topic = topicResult.rows[0];

    // Get citations
    const citationsResult = await pool.query(`
      SELECT sc.*,
             (SELECT jsonb_agg(jsonb_build_object(
               'id', m.id,
               'text', m.text,
               'user_email', m.user_email,
               'timestamp', m.timestamp
             ))
             FROM messages m
             WHERE m.id = ANY(sc.message_ids)) as source_messages
      FROM summary_citations sc
      WHERE sc.summary_id = $1
      ORDER BY sc.claim_start_index
    `, [topicId]);

    // Get all messages in topic
    const messagesResult = await pool.query(`
      SELECT m.id, m.text, m.user_email, m.timestamp
      FROM messages m
      JOIN topic_messages tm ON m.id = tm.message_id
      WHERE tm.topic_id = $1
      ORDER BY m.timestamp ASC
    `, [topicId]);

    return {
      ...topic,
      citations: citationsResult.rows,
      messages: messagesResult.rows
    };
  }

  /**
   * Detect and create topics for a room
   *
   * @param {string} roomId Room ID
   * @param {Object} options Detection options
   * @returns {Promise<Array>} Created topics
   */
  async detectAndCreateTopics(roomId, options = {}) {
    // Detect topic candidates
    const candidates = await this.detector.detectTopics(roomId, options);

    const createdTopics = [];

    for (const candidate of candidates) {
      // Check if similar topic already exists
      const existing = await this._findSimilarTopic(roomId, candidate.messageIds);
      if (existing) {
        // Add new messages to existing topic
        await this.addMessagesToTopic(existing.id, candidate.messageIds);
        this.queueRegeneration(existing.id);
        continue;
      }

      // Create new topic
      const topic = await this._createTopic(candidate);
      createdTopics.push(topic);
    }

    return createdTopics;
  }

  /**
   * Add a message to an existing topic
   *
   * @param {string} topicId Topic ID
   * @param {string} messageId Message ID
   * @param {number} relevanceScore How relevant (0-1)
   */
  async addMessageToTopic(messageId, topicId, relevanceScore = 1.0) {
    await pool.query(`
      INSERT INTO topic_messages (topic_id, message_id, relevance_score)
      VALUES ($1, $2, $3)
      ON CONFLICT (topic_id, message_id) DO UPDATE SET relevance_score = $3
    `, [topicId, messageId, relevanceScore]);

    // Update message count
    await pool.query(`
      UPDATE topic_summaries
      SET message_count = (SELECT COUNT(*) FROM topic_messages WHERE topic_id = $1),
          last_message_at = (SELECT MAX(m.timestamp) FROM messages m JOIN topic_messages tm ON m.id = tm.message_id WHERE tm.topic_id = $1),
          updated_at = NOW()
      WHERE id = $1
    `, [topicId]);

    // Queue summary regeneration
    this.queueRegeneration(topicId);
  }

  /**
   * Add multiple messages to a topic
   */
  async addMessagesToTopic(topicId, messageIds) {
    for (const messageId of messageIds) {
      await this.addMessageToTopic(messageId, topicId);
    }
  }

  /**
   * Regenerate summary for a topic
   *
   * @param {string} topicId Topic ID
   * @returns {Promise<Object>} New summary result
   */
  async regenerateSummary(topicId) {
    return this.generator.regenerateSummary(topicId);
  }

  /**
   * Queue summary regeneration with debouncing
   *
   * @param {string} topicId Topic ID
   */
  queueRegeneration(topicId) {
    // Clear existing timeout
    if (regenerationQueue.has(topicId)) {
      clearTimeout(regenerationQueue.get(topicId));
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      try {
        await this.regenerateSummary(topicId);
        console.log(`[TopicService] Regenerated summary for ${topicId}`);
      } catch (error) {
        console.error(`[TopicService] Failed to regenerate ${topicId}:`, error);
      } finally {
        regenerationQueue.delete(topicId);
      }
    }, REGENERATION_DEBOUNCE_MS);

    regenerationQueue.set(topicId, timeout);
  }

  /**
   * Report an inaccurate summary
   *
   * @param {string} topicId Topic ID
   * @param {string} reportedBy User email
   * @param {string} reason Report reason
   */
  async reportInaccurate(topicId, reportedBy, reason) {
    // Log the report (could be stored in a separate table)
    console.log(`[TopicService] Summary reported: ${topicId} by ${reportedBy}: ${reason}`);

    // Lower confidence score
    await pool.query(`
      UPDATE topic_summaries
      SET confidence_score = GREATEST(confidence_score - 0.1, 0.3)
      WHERE id = $1
    `, [topicId]);

    // Queue immediate regeneration
    regenerationQueue.delete(topicId); // Clear debounce
    return this.regenerateSummary(topicId);
  }

  /**
   * Get message context for citation jump
   *
   * @param {string} messageId Target message ID
   * @param {number} contextSize Number of surrounding messages
   * @returns {Promise<Object>} Message with context
   */
  async getMessageContext(messageId, contextSize = 5) {
    // Get the target message
    const targetResult = await pool.query(
      'SELECT * FROM messages WHERE id = $1',
      [messageId]
    );

    if (targetResult.rows.length === 0) {
      return null;
    }

    const target = targetResult.rows[0];

    // Get surrounding messages
    const contextResult = await pool.query(`
      (SELECT * FROM messages
       WHERE room_id = $1 AND timestamp < $2
       ORDER BY timestamp DESC
       LIMIT $3)
      UNION ALL
      (SELECT * FROM messages WHERE id = $4)
      UNION ALL
      (SELECT * FROM messages
       WHERE room_id = $1 AND timestamp > $2 AND id != $4
       ORDER BY timestamp ASC
       LIMIT $3)
      ORDER BY timestamp ASC
    `, [target.room_id, target.timestamp, contextSize, messageId]);

    return {
      targetMessage: target,
      context: contextResult.rows
    };
  }

  /**
   * Find if a similar topic already exists
   * @private
   */
  async _findSimilarTopic(roomId, messageIds) {
    // Check if any of these messages are already in a topic
    const result = await pool.query(`
      SELECT ts.id, ts.title, COUNT(*) as overlap
      FROM topic_summaries ts
      JOIN topic_messages tm ON ts.id = tm.topic_id
      WHERE ts.room_id = $1 AND tm.message_id = ANY($2)
      GROUP BY ts.id, ts.title
      HAVING COUNT(*) >= 2
      ORDER BY overlap DESC
      LIMIT 1
    `, [roomId, messageIds]);

    return result.rows[0] || null;
  }

  /**
   * Create a new topic from candidate
   * @private
   */
  async _createTopic(candidate) {
    const topicId = `topic-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create topic with initial summary
      await client.query(`
        INSERT INTO topic_summaries (id, room_id, title, category, summary_text, message_count, first_message_at, last_message_at, confidence_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        topicId,
        candidate.roomId,
        candidate.title,
        candidate.category,
        `Discussion about ${candidate.title} with ${candidate.messageCount} messages.`,
        candidate.messageCount,
        candidate.firstMessageAt,
        candidate.lastMessageAt,
        candidate.confidence
      ]);

      // Link messages
      for (const messageId of candidate.messageIds) {
        await client.query(`
          INSERT INTO topic_messages (topic_id, message_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [topicId, messageId]);
      }

      await client.query('COMMIT');

      // Queue AI summary generation
      this.queueRegeneration(topicId);

      return {
        id: topicId,
        ...candidate
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = TopicService;
