/**
 * SummaryGenerator - Creates AI summaries with citations
 *
 * Part of AI Thread Summaries feature.
 *
 * Uses GPT-4o-mini to:
 * 1. Summarize topic messages into 1-3 sentences
 * 2. Extract key facts with source message IDs
 * 3. Generate structured citation data
 *
 * @module services/topics/SummaryGenerator
 */

const pool = require('../../../dbPostgres');

const { defaultLogger: defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'SummaryGenerator',
});

class SummaryGenerator {
  /**
   * @param {Object} aiClient OpenAI client instance
   * @param {Object} options Configuration options
   */
  constructor(aiClient, options = {}) {
    this.aiClient = aiClient;
    this.model = options.model || 'gpt-4o-mini';
    this.maxTokens = options.maxTokens || 500;
  }

  /**
   * Generate summary for a topic
   *
   * @param {string} topicId Topic to summarize
   * @param {Array<Object>} messages Messages in topic with IDs
   * @param {Object} context Additional context
   * @param {Array<string>} context.participants Participant names
   * @param {string} context.category Topic category
   * @returns {Promise<{summary: string, citations: Array}>}
   */
  async generateSummary(topicId, messages, context) {
    try {
      // Build the prompt
      const prompt = this._buildPrompt(messages, context);

      // Call OpenAI
      const response = await this.aiClient.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: this.maxTokens,
        temperature: 0.3, // Lower temperature for factual summaries
      });

      // Parse response
      const result = this._parseResponse(response, messages);

      return result;
    } catch (error) {
      logger.error('[SummaryGenerator] Error generating summary', {
        error: error,
      });
      // Return fallback summary
      return this._generateFallbackSummary(messages, context);
    }
  }

  /**
   * Regenerate summary for an existing topic
   *
   * @param {string} topicId Topic ID to regenerate
   * @returns {Promise<{summary: string, citations: Array}>}
   */
  async regenerateSummary(topicId) {
    // Get topic details
    const topicResult = await pool.query('SELECT * FROM topic_summaries WHERE id = $1', [topicId]);

    if (topicResult.rows.length === 0) {
      throw new Error(`Topic not found: ${topicId}`);
    }

    const topic = topicResult.rows[0];

    // Get messages for topic
    const messagesResult = await pool.query(
      `
      SELECT m.id, m.text, m.user_email, m.timestamp
      FROM messages m
      JOIN topic_messages tm ON m.id = tm.message_id
      WHERE tm.topic_id = $1
      ORDER BY m.timestamp ASC
    `,
      [topicId]
    );

    // Get participant names
    const participants = await this._getParticipantNames(messagesResult.rows);

    // Generate new summary
    const result = await this.generateSummary(topicId, messagesResult.rows, {
      participants,
      category: topic.category,
    });

    // Save to database
    await this._saveSummary(topicId, result);

    return result;
  }

  /**
   * Build prompt for summary generation
   * @private
   */
  _buildPrompt(messages, context) {
    const { participants = [], category = 'general' } = context;

    // Format messages with IDs
    const formattedMessages = messages
      .map(m => {
        const sender = m.displayName || m.user_email?.split('@')[0] || 'Unknown';
        return `[${m.id}] ${sender}: ${m.text}`;
      })
      .join('\n');

    return `You are summarizing a co-parent conversation about: ${category}

Participants: ${participants.join(', ') || 'Co-parents'}

Messages (with IDs for citations):
${formattedMessages}

Generate a 1-3 sentence factual summary that:
1. States the key facts (who, what, when, amounts, deadlines)
2. Notes any agreements or decisions made
3. Uses neutral language (no emotional interpretation)
4. References the first participant as "you" and the second as their name

Also identify citations - for each key fact, list the message ID(s) that support it.

Output valid JSON only:
{
  "summary": "Your factual summary here",
  "citations": [
    {"claim": "specific fact from summary", "message_ids": ["msg_id1", "msg_id2"]}
  ]
}`;
  }

  /**
   * Parse LLM response and validate citations
   * @private
   */
  _parseResponse(response, messages) {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      const parsed = JSON.parse(content);

      // Validate summary exists
      if (!parsed.summary || typeof parsed.summary !== 'string') {
        throw new Error('Invalid summary in response');
      }

      // Validate and enrich citations
      const validMessageIds = new Set(messages.map(m => m.id));
      const citations = (parsed.citations || [])
        .filter(c => c.claim && Array.isArray(c.message_ids))
        .map(c => ({
          claim: c.claim,
          messageIds: c.message_ids.filter(id => validMessageIds.has(id)),
          // Calculate position in summary
          ...this._findClaimPosition(parsed.summary, c.claim),
        }))
        .filter(c => c.messageIds.length > 0); // Only keep citations with valid message IDs

      return {
        summary: parsed.summary,
        citations,
      };
    } catch (error) {
      logger.error('[SummaryGenerator] Error parsing response', {
        error: error,
      });
      throw error;
    }
  }

  /**
   * Find the position of a claim in the summary text
   * @private
   */
  _findClaimPosition(summary, claim) {
    const lowerSummary = summary.toLowerCase();
    const lowerClaim = claim.toLowerCase();

    const startIndex = lowerSummary.indexOf(lowerClaim);
    if (startIndex === -1) {
      // Claim not found exactly, try partial match
      const words = lowerClaim.split(' ');
      for (const word of words) {
        if (word.length > 3) {
          const partialIndex = lowerSummary.indexOf(word);
          if (partialIndex !== -1) {
            return {
              startIndex: partialIndex,
              endIndex: partialIndex + word.length,
            };
          }
        }
      }
      return { startIndex: 0, endIndex: claim.length };
    }

    return {
      startIndex,
      endIndex: startIndex + claim.length,
    };
  }

  /**
   * Generate fallback summary when LLM fails
   * @private
   */
  _generateFallbackSummary(messages, context) {
    // Sort by timestamp
    const sorted = [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Use first and last message for basic summary
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const summary = `Discussion about ${context.category || 'this topic'} with ${messages.length} messages.`;

    return {
      summary,
      citations: [
        {
          claim: 'Discussion',
          messageIds: [first.id],
          startIndex: 0,
          endIndex: 10,
        },
      ],
    };
  }

  /**
   * Get display names for participants
   * @private
   */
  async _getParticipantNames(messages) {
    const emails = [...new Set(messages.map(m => m.user_email).filter(Boolean))];

    if (emails.length === 0) return [];

    const result = await pool.query(
      `
      SELECT email, first_name, display_name
      FROM users
      WHERE email = ANY($1)
    `,
      [emails]
    );

    return result.rows.map(u => u.first_name || u.display_name || u.email.split('@')[0]);
  }

  /**
   * Save summary and citations to database
   * @private
   */
  async _saveSummary(topicId, result) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Archive current version to history
      await client.query(
        `
        INSERT INTO summary_history (id, summary_id, version, summary_text, citations)
        SELECT
          'hist-' || extract(epoch from now())::text || '-' || substr(md5(random()::text), 1, 8),
          id,
          summary_version,
          summary_text,
          (SELECT jsonb_agg(jsonb_build_object('claim', claim_text, 'message_ids', message_ids))
           FROM summary_citations WHERE summary_id = $1)
        FROM topic_summaries
        WHERE id = $1
      `,
        [topicId]
      );

      // Update summary
      await client.query(
        `
        UPDATE topic_summaries
        SET summary_text = $1,
            summary_version = summary_version + 1,
            updated_at = NOW()
        WHERE id = $2
      `,
        [result.summary, topicId]
      );

      // Delete old citations
      await client.query('DELETE FROM summary_citations WHERE summary_id = $1', [topicId]);

      // Insert new citations
      for (const citation of result.citations) {
        await client.query(
          `
          INSERT INTO summary_citations (id, summary_id, claim_text, claim_start_index, claim_end_index, message_ids)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [
            `cite-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
            topicId,
            citation.claim,
            citation.startIndex,
            citation.endIndex,
            citation.messageIds,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = SummaryGenerator;
