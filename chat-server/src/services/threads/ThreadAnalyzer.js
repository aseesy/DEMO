/**
 * ThreadAnalyzer - AI-powered conversation analysis
 *
 * Analyzes conversation windows to extract:
 * - Category (schedule, medical, education, etc.)
 * - Descriptive title
 * - Summary of the conversation
 * - Decisions made
 * - Open items requiring follow-up
 *
 * Uses the full conversation context, not keyword matching.
 *
 * @module services/threads/ThreadAnalyzer
 */

const pool = require('../../../dbPostgres');
const openaiClient = require('../../core/engine/client');

// Categories in priority order (highest to lowest)
const CATEGORIES = [
  'safety',
  'medical',
  'schedule',
  'education',
  'finances',
  'activities',
  'travel',
  'co-parenting',
  'logistics',
];

const CATEGORY_DESCRIPTIONS = {
  safety: 'Emergency contacts, safety concerns, urgent issues',
  medical: 'Doctor appointments, health issues, medications, therapy',
  schedule: 'Pickup, dropoff, custody timing, weekend plans',
  education: 'School, homework, grades, teachers, tutoring',
  finances: 'Child support, shared expenses, reimbursements, bills',
  activities: 'Sports, hobbies, extracurriculars, lessons, camps',
  travel: 'Vacations, trips, travel arrangements, passports',
  'co-parenting': 'Relationship discussions, parenting decisions, boundaries',
  logistics: 'General coordination, supplies, belongings, miscellaneous',
};

class ThreadAnalyzer {
  /**
   * @param {Object} aiClient OpenAI client instance (optional, uses shared client if not provided)
   * @param {Object} options Configuration options
   */
  constructor(aiClient = null, options = {}) {
    this.aiClient = aiClient || openaiClient.getClient();
    this.model = options.model || 'gpt-4o-mini';
    this.maxTokens = options.maxTokens || 800;
  }

  /**
   * Check if AI analysis is available
   * @returns {boolean}
   */
  isAvailable() {
    return openaiClient.isConfigured() && this.aiClient !== null;
  }

  /**
   * Analyze a conversation window
   *
   * @param {Object} window Conversation window from ConversationWindower
   * @param {Array} window.messages Messages in the window
   * @param {Array} window.participants Participant emails
   * @returns {Promise<ThreadAnalysis>} Analysis result
   */
  async analyzeWindow(window) {
    try {
      // Get participant display names
      const participantNames = await this._getParticipantNames(
        window.participants
      );

      // Build and send prompt
      const prompt = this._buildPrompt(window, participantNames);

      const response = await this.aiClient.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: this.maxTokens,
        temperature: 0.3,
      });

      // Parse and validate response
      const result = this._parseResponse(response, window);

      return result;
    } catch (error) {
      console.error('[ThreadAnalyzer] Error analyzing window:', error);
      // Return fallback analysis
      return this._generateFallbackAnalysis(window);
    }
  }

  /**
   * Build the analysis prompt
   * @private
   */
  _buildPrompt(window, participantNames) {
    // Format messages with IDs and sender names
    const formattedMessages = window.messages
      .map(m => {
        const senderName = this._getSenderDisplayName(m.user_email, participantNames);
        const time = new Date(m.timestamp).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
        return `[${m.id}] ${time} ${senderName}: ${m.text}`;
      })
      .join('\n');

    // Build category options string
    const categoryOptions = CATEGORIES.map(
      c => `  - ${c}: ${CATEGORY_DESCRIPTIONS[c]}`
    ).join('\n');

    return `Analyze this co-parenting conversation and extract structured information.

PARTICIPANTS: ${participantNames.join(', ')}
DATE: ${new Date(window.firstMessageAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}

CONVERSATION:
${formattedMessages}

INSTRUCTIONS:
1. CATEGORY: Choose the single most relevant category:
${categoryOptions}

2. TITLE: Create a short (3-6 word) descriptive title that captures what this conversation is about. Be specific to the actual content.
   Examples: "Vira's pickup on Friday", "Doctor appointment follow-up", "Soccer practice schedule"

3. SUMMARY: Write a 2-3 sentence factual summary of what was discussed. Include any specific times, dates, or amounts mentioned. Use neutral tone.

4. DECISIONS: List any agreements or decisions made. Include which participant agreed and the relevant message IDs.

5. OPEN_ITEMS: List any unresolved questions, pending tasks, or items needing follow-up.

6. KEY_MESSAGE_IDS: List the 3-5 most important message IDs that capture the key points.

OUTPUT FORMAT (valid JSON only):
{
  "category": "one of: ${CATEGORIES.join(', ')}",
  "title": "Short descriptive title",
  "summary": "Factual 2-3 sentence summary",
  "decisions": [
    {"text": "What was decided", "decided_by": "email", "message_ids": ["id1"]}
  ],
  "open_items": [
    {"text": "What needs follow-up", "assigned_to": "email or null", "message_ids": ["id1"]}
  ],
  "key_message_ids": ["id1", "id2", "id3"],
  "confidence": 0.85
}`;
  }

  /**
   * Parse and validate the AI response
   * @private
   */
  _parseResponse(response, window) {
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('[ThreadAnalyzer] Failed to parse JSON:', content);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate and normalize category
    const category = CATEGORIES.includes(parsed.category)
      ? parsed.category
      : 'logistics';

    // Validate title
    const title =
      typeof parsed.title === 'string' && parsed.title.length > 0
        ? parsed.title.substring(0, 100) // Limit length
        : 'Conversation';

    // Validate summary
    const summary =
      typeof parsed.summary === 'string' && parsed.summary.length > 0
        ? parsed.summary
        : `Discussion with ${window.messages.length} messages.`;

    // Validate message IDs against actual messages in window
    const validMessageIds = new Set(window.messageIds);

    // Validate decisions
    const decisions = (parsed.decisions || [])
      .filter(d => d.text && typeof d.text === 'string')
      .map(d => ({
        text: d.text,
        decidedBy: d.decided_by || null,
        messageIds: (d.message_ids || []).filter(id => validMessageIds.has(id)),
      }));

    // Validate open items
    const openItems = (parsed.open_items || [])
      .filter(o => o.text && typeof o.text === 'string')
      .map(o => ({
        text: o.text,
        assignedTo: o.assigned_to || null,
        messageIds: (o.message_ids || []).filter(id => validMessageIds.has(id)),
      }));

    // Validate key message IDs
    const keyMessageIds = (parsed.key_message_ids || []).filter(id =>
      validMessageIds.has(id)
    );

    // Validate confidence
    const confidence =
      typeof parsed.confidence === 'number' &&
      parsed.confidence >= 0 &&
      parsed.confidence <= 1
        ? parsed.confidence
        : 0.8;

    return {
      category,
      title,
      summary,
      decisions,
      openItems,
      keyMessageIds,
      confidence,
      messageCount: window.messages.length,
      firstMessageAt: window.firstMessageAt,
      lastMessageAt: window.lastMessageAt,
      participants: window.participants,
    };
  }

  /**
   * Generate fallback analysis when AI fails
   * @private
   */
  _generateFallbackAnalysis(window) {
    // Try to detect category from message content
    const allText = window.messages.map(m => m.text).join(' ').toLowerCase();
    let category = 'logistics';

    for (const cat of CATEGORIES) {
      const keywords = CATEGORY_DESCRIPTIONS[cat].toLowerCase().split(/[,\s]+/);
      if (keywords.some(kw => kw.length > 3 && allText.includes(kw))) {
        category = cat;
        break;
      }
    }

    const date = new Date(window.firstMessageAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return {
      category,
      title: `Conversation on ${date}`,
      summary: `Discussion with ${window.messages.length} messages between ${window.participants.length} participants.`,
      decisions: [],
      openItems: [],
      keyMessageIds: window.messageIds.slice(0, 3),
      confidence: 0.5,
      messageCount: window.messages.length,
      firstMessageAt: window.firstMessageAt,
      lastMessageAt: window.lastMessageAt,
      participants: window.participants,
    };
  }

  /**
   * Get display names for participants
   * @private
   */
  async _getParticipantNames(emails) {
    if (!emails || emails.length === 0) return ['Unknown'];

    try {
      const result = await pool.query(
        `
        SELECT email, first_name, display_name
        FROM users
        WHERE email = ANY($1)
      `,
        [emails]
      );

      const nameMap = {};
      result.rows.forEach(u => {
        nameMap[u.email] =
          u.first_name || u.display_name || u.email.split('@')[0];
      });

      return emails.map(email => nameMap[email] || email.split('@')[0]);
    } catch (error) {
      console.error('[ThreadAnalyzer] Error getting participant names:', error);
      return emails.map(e => e.split('@')[0]);
    }
  }

  /**
   * Get sender display name
   * @private
   */
  _getSenderDisplayName(email, participantNames) {
    // Simple mapping - first participant is usually "Mom", second is "Dad"
    // But use actual names from the lookup
    const index = participantNames.findIndex(
      (_, i) => i < participantNames.length
    );
    return email ? email.split('@')[0] : 'Unknown';
  }
}

module.exports = ThreadAnalyzer;
