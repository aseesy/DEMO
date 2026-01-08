/**
 * Profile Analyzer
 *
 * Part of the Dual-Brain AI Mediator architecture.
 * Analyzes user messages to extract:
 * - Core values (what they care about)
 * - Known triggers (phrases/topics that upset them)
 * - Communication patterns (how they express themselves)
 * - Recurring complaints (historical pain points)
 * - Conflict themes (topics that cause tension)
 *
 * IMPORTANT: Follows the AI Mediation Constitution:
 * - Focus on language patterns, not emotions
 * - No psychological diagnoses or labels
 * - Describe what words DO, not what people FEEL
 */

const openaiClient = require('../engine/client');
const narrativeMemory = require('../memory/narrativeMemory');

const { defaultLogger: defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'profileAnalyzer',
});

/**
 * Build the prompt for user perspective analysis
 * @param {Array<{text: string, timestamp: Date}>} userMessages - User's messages
 * @param {string} username - User's display name or identifier
 * @returns {string} The analysis prompt
 */
function buildUserAnalysisPrompt(userMessages, username) {
  const messageTexts = userMessages
    .slice(0, 100) // Limit to most recent 100 messages
    .map((m, i) => `${i + 1}. "${m.text}"`)
    .join('\n');

  return `You are analyzing communication patterns for a co-parenting communication platform.

CRITICAL RULES (from AI Mediation Constitution):
1. Focus ONLY on language and phrasing patterns - never diagnose emotions
2. NEVER use psychological terms like: narcissist, manipulative, passive-aggressive, toxic, controlling
3. Describe what words and phrases DO, not what the person FEELS
4. Focus on observable communication patterns, not personality traits

Your task: Analyze these messages from "${username}" to understand their communication patterns.
Focus ONLY on this user's perspective. Do not analyze the other person.

MESSAGES FROM ${username.toUpperCase()}:
${messageTexts}

Extract the following (respond ONLY with valid JSON):

{
  "core_values": [
    // 3-5 values they seem to prioritize based on their language
    // Examples: "consistency in schedules", "clear communication", "child's routine", "fairness"
    // NOT emotions like "feels unheard" - use "values being understood" instead
  ],
  "known_triggers": [
    // 3-5 phrases/topics that seem to cause strong reactions in their messages
    // Examples: "last-minute schedule changes", "money discussions", "new partner mentions"
    // Focus on TOPICS/PHRASES, not emotional states
  ],
  "communication_patterns": {
    // Scores from 0-1 for observed language patterns
    "uses_absolutes": 0.0, // "always", "never", "you always", "you never"
    "asks_questions": 0.0, // Uses questions vs. statements
    "solution_oriented": 0.0, // Proposes solutions vs. just complaining
    "direct_communication": 0.0, // Clear requests vs. hints/implications
    "uses_i_statements": 0.0, // "I need" vs. "You should"
    "acknowledges_other": 0.0 // Acknowledges the other person's point
  },
  "recurring_complaints": [
    // 2-4 things they repeatedly bring up
    // Examples: "schedule not being followed", "communication timing", "pickup logistics"
    // Focus on the TOPIC of the complaint, not feelings about it
  ],
  "conflict_themes": [
    // 2-4 topics that frequently appear in tense messages
    // Examples: "custody transitions", "financial matters", "school decisions", "extracurricular activities"
  ],
  "communication_strengths": [
    // 1-3 positive patterns observed
    // Examples: "often proposes specific solutions", "uses clear timeframes", "acknowledges constraints"
  ]
}

Respond ONLY with the JSON object. No additional text.`;
}

/**
 * Parse AI response into structured profile data
 * @param {string} aiResponse - Raw AI response
 * @returns {Object|null} Parsed profile or null if invalid
 */
function parseProfileResponse(aiResponse) {
  if (!aiResponse || typeof aiResponse !== 'string') {
    return null;
  }

  try {
    // Try to extract JSON from the response
    let jsonStr = aiResponse.trim();

    // Handle responses that might have markdown code blocks
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    const requiredFields = [
      'core_values',
      'known_triggers',
      'communication_patterns',
      'recurring_complaints',
      'conflict_themes',
    ];

    for (const field of requiredFields) {
      if (!(field in parsed)) {
        logger.warn('Log message', {
          value: `⚠️ ProfileAnalyzer: Missing required field: ${field}`,
        });
        parsed[field] = field === 'communication_patterns' ? {} : [];
      }
    }

    // Ensure arrays are arrays
    ['core_values', 'known_triggers', 'recurring_complaints', 'conflict_themes'].forEach(field => {
      if (!Array.isArray(parsed[field])) {
        parsed[field] = [];
      }
    });

    // Ensure communication_patterns is an object with valid scores
    if (typeof parsed.communication_patterns !== 'object') {
      parsed.communication_patterns = {};
    }

    // Normalize scores to 0-1 range
    Object.keys(parsed.communication_patterns).forEach(key => {
      const value = parsed.communication_patterns[key];
      if (typeof value === 'number') {
        parsed.communication_patterns[key] = Math.max(0, Math.min(1, value));
      } else {
        parsed.communication_patterns[key] = 0;
      }
    });

    return parsed;
  } catch (error) {
    logger.error('❌ ProfileAnalyzer: Failed to parse AI response', {
      message: error.message,
    });
    return null;
  }
}

/**
 * Analyze user's messages from their perspective
 * @param {number} userId - User ID
 * @param {string} roomId - Room ID
 * @param {Array<{id: string, text: string, timestamp: Date, username: string}>} messages - All room messages
 * @returns {Promise<Object|null>} Analysis result or null if failed
 */
async function analyzeUserPerspective(userId, roomId, messages) {
  if (!userId || !roomId || !messages || messages.length === 0) {
    return null;
  }

  // Get user's email to filter messages
  const pool = require('../../../dbPostgres');
  const query = (sql, params) => pool.query(sql, params);
  let userEmail;

  try {
    const userResult = await query(
      'SELECT email, first_name, display_name FROM users WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) {
      logger.warn('Log message', {
        value: `⚠️ ProfileAnalyzer: User ${userId} not found`,
      });
      return null;
    }
    userEmail = userResult.rows[0].email;
    const displayName =
      userResult.rows[0].display_name || userResult.rows[0].first_name || userEmail;

    // Filter to only this user's messages
    // Check both username and user_email fields since username may be short form (e.g., "mom1")
    // while user_email has the full email (e.g., "mom1@test.com")
    const userMessages = messages
      .filter(
        m => (m.username === userEmail || m.user_email === userEmail) && m.text && m.text.trim()
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Most recent first

    if (userMessages.length < 5) {
      logger.debug('Log message', {
        value: `ℹ️ ProfileAnalyzer: User ${userId} has only ${userMessages.length} messages, skipping analysis`,
      });
      return null;
    }

    // Build and send prompt
    const prompt = buildUserAnalysisPrompt(userMessages, displayName);
    const client = openaiClient.getClient();

    if (!client) {
      logger.warn('⚠️ ProfileAnalyzer: OpenAI client not configured');
      return null;
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Use efficient model for batch analysis
      messages: [
        {
          role: 'system',
          content:
            'You are a communication pattern analyst. You analyze language patterns, NOT emotions or psychology. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3, // Low temperature for consistent output
      max_tokens: 1000,
    });

    const aiResponse = response.choices?.[0]?.message?.content;
    if (!aiResponse) {
      logger.warn('⚠️ ProfileAnalyzer: Empty AI response');
      return null;
    }

    const analysis = parseProfileResponse(aiResponse);
    if (!analysis) {
      return null;
    }

    // Add metadata
    analysis.message_count_analyzed = userMessages.length;

    // Store the profile
    const stored = await narrativeMemory.updateNarrativeProfile(userId, roomId, analysis);
    if (!stored) {
      logger.warn('⚠️ ProfileAnalyzer: Failed to store profile');
    }

    logger.debug('Log message', {
      value: `✅ ProfileAnalyzer: Analyzed ${userMessages.length} messages for user ${userId} in room ${roomId}`,
    });

    return analysis;
  } catch (error) {
    logger.error('❌ ProfileAnalyzer: Analysis failed', {
      message: error.message,
    });
    return null;
  }
}

/**
 * Analyze all users in a room
 * @param {string} roomId - Room ID
 * @param {Array<Object>} messages - All room messages
 * @returns {Promise<Object>} Map of userId to analysis
 */
async function analyzeRoomParticipants(roomId, messages) {
  if (!roomId || !messages || messages.length === 0) {
    return {};
  }

  const pool = require('../../../dbPostgres');
  const query = (sql, params) => pool.query(sql, params);

  try {
    // Get all users in the room
    const userResult = await query(
      `SELECT u.id, u.email
       FROM users u
       JOIN room_members rm ON u.id = rm.user_id
       WHERE rm.room_id = $1`,
      [roomId]
    );

    const results = {};

    for (const user of userResult.rows) {
      logger.debug('Log message', {
        value: `🔄 ProfileAnalyzer: Analyzing user ${user.id} in room ${roomId}...`,
      });
      const analysis = await analyzeUserPerspective(user.id, roomId, messages);
      if (analysis) {
        results[user.id] = analysis;
      }
    }

    return results;
  } catch (error) {
    logger.error('❌ ProfileAnalyzer: Room analysis failed', {
      message: error.message,
    });
    return {};
  }
}

/**
 * Get a quick summary of trigger sensitivity for a message
 * Checks if a message mentions known triggers for either party
 * @param {string} messageText - Message text to check
 * @param {number} senderUserId - Sender's user ID
 * @param {number} receiverUserId - Receiver's user ID
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Trigger analysis
 */
async function checkMessageTriggers(messageText, senderUserId, receiverUserId, roomId) {
  if (!messageText || !roomId) {
    return { hasTriggers: false, senderTriggers: [], receiverTriggers: [] };
  }

  const messageLower = messageText.toLowerCase();
  const senderProfile = await narrativeMemory.getUserNarrativeProfile(senderUserId, roomId);
  const receiverProfile = await narrativeMemory.getUserNarrativeProfile(receiverUserId, roomId);

  const senderTriggers = (senderProfile?.known_triggers || []).filter(trigger =>
    messageLower.includes(trigger.toLowerCase())
  );

  const receiverTriggers = (receiverProfile?.known_triggers || []).filter(trigger =>
    messageLower.includes(trigger.toLowerCase())
  );

  return {
    hasTriggers: senderTriggers.length > 0 || receiverTriggers.length > 0,
    senderTriggers,
    receiverTriggers,
    senderProfile: senderProfile
      ? {
          core_values: senderProfile.core_values,
          communication_patterns: senderProfile.communication_patterns,
        }
      : null,
    receiverProfile: receiverProfile
      ? {
          core_values: receiverProfile.core_values,
          known_triggers: receiverProfile.known_triggers,
        }
      : null,
  };
}

module.exports = {
  buildUserAnalysisPrompt,
  parseProfileResponse,
  analyzeUserPerspective,
  analyzeRoomParticipants,
  checkMessageTriggers,
};
