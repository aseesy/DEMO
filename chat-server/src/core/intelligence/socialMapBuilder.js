/**
 * Social Map Builder
 *
 * Part of the Dual-Brain AI Mediator architecture.
 * Orchestrates building the Neo4j social graph from extracted entities.
 * Creates Person nodes and relationship edges (MENTIONS, TRUSTS, DISLIKES).
 *
 * Privacy: Only stores pseudonymized entity names (e.g., "Grandma", "Teacher"),
 * never real names or PII.
 */

const neo4jClient = require('../../infrastructure/database/neo4jClient');
const entityExtractor = require('./entityExtractor');

/**
 * Build complete social map for a room from message history
 * @param {string} roomId - Room ID
 * @param {Array<{text: string, timestamp: Date, username: string}>} messages - Messages to analyze
 * @param {Object} options - Options
 * @param {boolean} [options.analyzeSentiment=true] - Whether to analyze sentiment for each entity
 * @returns {Promise<Object>} Build result with stats
 */
async function buildSocialMap(roomId, messages, options = {}) {
  const { analyzeSentiment = true } = options;

  if (!roomId || !messages || messages.length === 0) {
    return {
      success: false,
      error: 'Missing roomId or messages',
      stats: { people: 0, relationships: 0 },
    };
  }

  console.log(`🔄 SocialMapBuilder: Building map for room ${roomId} (${messages.length} messages)`);

  const stats = {
    people: 0,
    mentionsRelationships: 0,
    sentimentRelationships: 0,
    errors: 0,
  };

  try {
    // Step 1: Extract entities from all messages
    const entities = await entityExtractor.extractEntities(messages, roomId);

    if (!entities || entities.people.length === 0) {
      console.log('ℹ️ SocialMapBuilder: No people found in messages');
      return { success: true, stats, entities };
    }

    // Step 2: Get user mappings (email -> userId)
    const pool = require('../../../dbPostgres');
    const query = (sql, params) => pool.query(sql, params);
    const userResult = await query(
      `SELECT u.id, u.email
       FROM users u
       JOIN room_members rm ON u.id = rm.user_id
       WHERE rm.room_id = $1`,
      [roomId]
    );

    const emailToUserId = new Map();
    userResult.rows.forEach(row => {
      emailToUserId.set(row.email, row.id);
    });

    // Step 3: Create Person nodes and MENTIONS relationships
    for (const person of entities.people) {
      // Create/update Person node
      await neo4jClient.createOrUpdatePersonNode(person.name, roomId);
      stats.people++;

      // Create MENTIONS relationships for each user who mentioned this person
      for (const username of person.mentionedBy) {
        const userId = emailToUserId.get(username);
        if (userId) {
          // Get messages from this user mentioning this person for sentiment
          const userMessages = messages.filter(
            m => m.username === username && m.text.toLowerCase().includes(person.name.toLowerCase())
          );

          let sentiment = 'neutral';
          let sentimentResult = null;

          if (analyzeSentiment && userMessages.length > 0) {
            sentimentResult = await entityExtractor.analyzeEntitySentiment(
              person.name,
              userMessages,
              userId
            );
            sentiment = sentimentResult?.sentiment || 'neutral';
          }

          // Create MENTIONS relationship
          await neo4jClient.createMentionsRelationship(
            userId,
            person.name,
            roomId,
            sentiment,
            userMessages.length
          );
          stats.mentionsRelationships++;

          // Create sentiment relationship if analyzed
          if (sentimentResult && sentimentResult.sentiment !== 'neutral') {
            const relType =
              sentimentResult.sentiment === 'positive'
                ? 'TRUSTS'
                : sentimentResult.sentiment === 'negative'
                  ? 'DISLIKES'
                  : 'NEUTRAL_TOWARD';

            await neo4jClient.createSentimentRelationship(
              userId,
              person.name,
              roomId,
              relType,
              sentimentResult.strength,
              sentimentResult.reason
            );
            stats.sentimentRelationships++;
          }
        }
      }
    }

    console.log(
      `✅ SocialMapBuilder: Built map with ${stats.people} people, ${stats.mentionsRelationships} mentions, ${stats.sentimentRelationships} sentiment relationships`
    );

    return { success: true, stats, entities };
  } catch (error) {
    console.error('❌ SocialMapBuilder: Failed to build social map:', error.message);
    return { success: false, error: error.message, stats };
  }
}

/**
 * Update social map incrementally from a new message
 * Used for real-time updates during message sending
 * @param {Object} message - Message object
 * @param {number} userId - Sender's user ID
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Update result
 */
async function updateSocialMapFromMessage(message, userId, roomId) {
  if (!message?.text || !userId || !roomId) {
    return { updated: false, entities: null };
  }

  try {
    // Extract entities from this single message
    const entities = await entityExtractor.extractEntitiesFromText(message.text);

    if (!entities || entities.people.length === 0) {
      return { updated: false, entities };
    }

    // Update each mentioned person
    for (const personName of entities.people) {
      // Create/update Person node
      await neo4jClient.createOrUpdatePersonNode(personName, roomId);

      // Update MENTIONS relationship (increment count)
      await neo4jClient.createMentionsRelationship(userId, personName, roomId, 'neutral', 1);
    }

    console.log(
      `✅ SocialMapBuilder: Updated map with ${entities.people.length} people from new message`
    );

    return { updated: true, entities };
  } catch (error) {
    console.error('❌ SocialMapBuilder: Failed to update from message:', error.message);
    return { updated: false, error: error.message };
  }
}

/**
 * Get social map summary for display
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Summary with people and their relationships
 */
async function getSocialMapSummary(roomId) {
  if (!roomId) {
    return { people: [], summary: null };
  }

  try {
    const people = await neo4jClient.getRoomPeople(roomId);

    // Categorize by sentiment
    const trustedByAll = [];
    const contested = []; // Different users have different sentiments
    const disliked = [];

    for (const person of people) {
      const sentiments = person.sentiments?.filter(s => s.type) || [];

      if (sentiments.length === 0) {
        continue;
      }

      const hasTrust = sentiments.some(s => s.type === 'TRUSTS');
      const hasDislike = sentiments.some(s => s.type === 'DISLIKES');

      if (hasTrust && hasDislike) {
        contested.push(person.name);
      } else if (hasDislike) {
        disliked.push(person.name);
      } else if (hasTrust) {
        trustedByAll.push(person.name);
      }
    }

    return {
      people,
      summary: {
        totalPeople: people.length,
        trustedByAll,
        contested,
        disliked,
        sensitiveTopics: contested, // Contested people are sensitive topics
      },
    };
  } catch (error) {
    console.error('❌ SocialMapBuilder: Failed to get summary:', error.message);
    return { people: [], summary: null, error: error.message };
  }
}

/**
 * Get people who are sensitive for a specific user
 * @param {number} userId - User ID
 * @param {string} roomId - Room ID
 * @returns {Promise<string[]>} Array of sensitive person names
 */
async function getSensitivePeopleForUser(userId, roomId) {
  if (!userId || !roomId) {
    return [];
  }

  try {
    const people = await neo4jClient.getRoomPeople(roomId);

    return people
      .filter(person => {
        const userSentiment = person.sentiments?.find(
          s => s.userId === userId && s.type === 'DISLIKES'
        );
        return !!userSentiment;
      })
      .map(person => person.name);
  } catch (error) {
    console.error('❌ SocialMapBuilder: Failed to get sensitive people:', error.message);
    return [];
  }
}

module.exports = {
  buildSocialMap,
  updateSocialMapFromMessage,
  getSocialMapSummary,
  getSensitivePeopleForUser,
};
