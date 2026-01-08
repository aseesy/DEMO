/**
 * Insights Extractor
 *
 * Extracts and manages relationship insights from conversations.
 *
 * @module liaizen/core/ai/insightsExtractor
 */

const openaiClient = require('../client');
const { MESSAGE } = require('../../../infrastructure/config/constants');
const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'insightsExtractor' });

/**
 * Extract relationship insights from conversation
 *
 * @param {Array} recentMessages - Recent messages
 * @param {string} roomId - Room ID
 * @param {Map} conversationInsights - Existing insights map
 * @param {Object} roleContext - Optional sender/receiver context
 * @returns {Promise<Object|null>} Updated insights or null
 */
async function extractRelationshipInsights(
  recentMessages,
  roomId,
  conversationInsights,
  roleContext = null
) {
  if (!openaiClient.isConfigured() || recentMessages.length < MESSAGE.MIN_MESSAGES_FOR_INSIGHTS) {
    return null;
  }

  try {
    const messageHistory = recentMessages
      .slice(-MESSAGE.RECENT_MESSAGES_COUNT)
      .map(msg => `${msg.username}: ${msg.text}`)
      .join('\n');

    const existingInsights = conversationInsights.get(roomId) || {
      communicationStyle: null,
      commonTopics: [],
      tensionPoints: [],
      positivePatterns: [],
      questionsToAsk: [],
    };

    const prompt = `Analyze this co-parenting conversation to understand relationship dynamics.

Recent conversation:
${messageHistory}

Existing insights:
${JSON.stringify(existingInsights, null, 2)}

Extract insights about:
1. Communication style (formal/casual, direct/indirect, collaborative/defensive)
2. Common topics they discuss
3. Tension points or recurring issues
4. Positive patterns (what works well)
5. Questions to ask to learn more

Respond with ONLY valid JSON:
{
  "communicationStyle": "description",
  "commonTopics": ["topic1", "topic2"],
  "tensionPoints": ["point1"],
  "positivePatterns": ["pattern1"],
  "questionsToAsk": ["question1", "question2"]
}`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Analyze co-parenting dynamics. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 250,
      temperature: 0.4,
    });

    const response = completion.choices[0].message.content.trim();
    const insights = JSON.parse(response);

    // Merge with existing insights
    const merged = {
      communicationStyle: insights.communicationStyle || existingInsights.communicationStyle,
      commonTopics: [
        ...new Set([...existingInsights.commonTopics, ...(insights.commonTopics || [])]),
      ],
      tensionPoints: [
        ...new Set([...existingInsights.tensionPoints, ...(insights.tensionPoints || [])]),
      ],
      positivePatterns: [
        ...new Set([...existingInsights.positivePatterns, ...(insights.positivePatterns || [])]),
      ],
      questionsToAsk: insights.questionsToAsk || existingInsights.questionsToAsk,
      lastUpdated: new Date().toISOString(),
    };

    // Update in-memory cache
    conversationInsights.set(roomId, merged);

    // Persist to database
    await persistInsights(roomId, merged, roleContext);

    return merged;
  } catch (error) {
    logger.error('Error extracting relationship insights', {
      error: error.message,
      stack: error.stack,
      roomId,
      messageCount: recentMessages.length,
    });
    return null;
  }
}

/**
 * Persist insights to database
 *
 * @param {string} roomId - Room ID
 * @param {Object} insights - Insights to persist
 * @param {Object} roleContext - Optional sender/receiver context
 */
async function persistInsights(roomId, insights, roleContext) {
  try {
    const dbSafe = require('../../../../dbSafe');
    const now = new Date().toISOString();

    const existingResult = await dbSafe.safeSelect(
      'relationship_insights',
      { room_id: roomId },
      { limit: 1 }
    );
    const existingRows = dbSafe.parseResult(existingResult);

    if (existingRows.length > 0) {
      await dbSafe.safeUpdate(
        'relationship_insights',
        { room_id: roomId },
        {
          insights_json: JSON.stringify(insights),
          updated_at: now,
        }
      );
    } else {
      const insertData = {
        room_id: roomId,
        insights_json: JSON.stringify(insights),
        created_at: now,
        updated_at: now,
      };

      if (roleContext?.senderId && roleContext?.receiverId) {
        insertData.sender_id = roleContext.senderId.toLowerCase();
        insertData.receiver_id = roleContext.receiverId.toLowerCase();
      }

      await dbSafe.safeInsert('relationship_insights', insertData);
    }

    logger.debug('Relationship insights saved', {
      roomId,
      hasInsights: !!insights,
    });
  } catch (err) {
    logger.error('Error saving relationship insights', {
      error: err.message,
      roomId,
    });
  }
}

/**
 * Get relationship insights from database
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 *
 * @param {string} roomId - Room ID
 * @param {Map} conversationInsights - Insights cache map
 * @returns {Promise<Object|null>} Loaded insights or null
 */
async function getRelationshipInsights(roomId, conversationInsights) {
  if (!roomId) {
    return null;
  }

  try {
    const dbSafe = require('../../../../dbSafe');
    const insightsResult = await dbSafe.safeSelect(
      'relationship_insights',
      { room_id: roomId },
      { limit: 1 }
    );
    const insightsRows = dbSafe.parseResult(insightsResult);

    if (insightsRows.length > 0) {
      const insights = JSON.parse(insightsRows[0].insights_json);
      conversationInsights.set(roomId, insights);
      return insights;
    }

    return conversationInsights.get(roomId) || null;
  } catch (err) {
    logger.error('Error loading relationship insights', {
      error: err.message,
      roomId,
    });
    return conversationInsights.get(roomId) || null;
  }
}

module.exports = {
  extractRelationshipInsights,
  persistInsights,
  getRelationshipInsights,
  // Deprecated alias - use getRelationshipInsights instead
  loadRelationshipInsights: getRelationshipInsights,
};
