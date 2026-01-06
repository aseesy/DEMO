/**
 * Entity Extractor
 *
 * Part of the Dual-Brain AI Mediator architecture.
 * Extracts entities (people, locations, topics) from messages
 * and analyzes sentiment toward each entity.
 *
 * Entity Types:
 * - Person: Grandma, Teacher, New Partner, Doctor, etc.
 * - Location: School, Soccer Field, Mom's House
 * - Topic: Homework, Schedule, Medical, Money
 *
 * IMPORTANT: Does NOT extract the co-parents themselves as entities
 * (they are the primary actors, not mentioned people)
 */

const openaiClient = require('../engine/client');

/**
 * Extract entities from a single message (for real-time)
 * @param {string} text - Message text
 * @returns {Promise<{people: string[], locations: string[], topics: string[]}|null>}
 */
async function extractEntitiesFromText(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { people: [], locations: [], topics: [] };
  }

  const client = openaiClient.getClient();
  if (!client) {
    return null;
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You extract entities from co-parenting messages.

Entity types:
- People: Names or roles of people mentioned (Grandma, Teacher, Coach, Doctor, Babysitter, new partner names)
- Locations: Places mentioned (school, soccer field, doctor's office, park)
- Topics: Main subjects discussed (homework, schedule, pickup time, medical, money)

Rules:
- Do NOT include pronouns (he, she, they)
- Do NOT include generic terms like "kids", "children" (too common)
- Only extract specific people/roles that are mentioned
- Normalize variations (e.g., "Mom's house" -> "Mom's house", not "mothers house")

Respond ONLY with JSON, no other text.`,
        },
        {
          role: 'user',
          content: `Extract entities from this message:
"${text.slice(0, 500)}"

Respond with JSON:
{
  "people": ["Person1", "Person2"],
  "locations": ["Location1"],
  "topics": ["Topic1", "Topic2"]
}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      return { people: [], locations: [], topics: [] };
    }

    try {
      // Clean the response - remove markdown code blocks if present
      let jsonStr = content.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);
      return {
        people: Array.isArray(parsed.people) ? parsed.people : [],
        locations: Array.isArray(parsed.locations) ? parsed.locations : [],
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      };
    } catch {
      return { people: [], locations: [], topics: [] };
    }
  } catch (error) {
    console.error('❌ EntityExtractor: Failed to extract entities:', error.message);
    return null;
  }
}

/**
 * Analyze sentiment toward a specific entity based on context messages
 * @param {string} entityName - Entity to analyze
 * @param {Array<{text: string, timestamp: Date}>} contextMessages - Messages mentioning the entity
 * @param {number} userId - User who wrote these messages
 * @returns {Promise<{sentiment: string, strength: number, reason: string}|null>}
 */
async function analyzeEntitySentiment(entityName, contextMessages, _userId) {
  if (!entityName || !contextMessages || contextMessages.length === 0) {
    return { sentiment: 'neutral', strength: 0.5, reason: 'insufficient data' };
  }

  const client = openaiClient.getClient();
  if (!client) {
    return null;
  }

  const messageTexts = contextMessages
    .slice(0, 20)
    .map(m => m.text)
    .join('\n---\n');

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You analyze the sender's sentiment toward a specific person based on their messages.

Sentiment categories:
- "positive": Trusts, respects, speaks well of them
- "negative": Distrusts, speaks negatively, conflict source
- "neutral": No strong sentiment either way
- "mixed": Sometimes positive, sometimes negative

Rules:
- Focus on the SENDER's view, not objective truth
- Look at language used when mentioning this person
- Consider if this person is often mentioned during conflicts
- Strength is 0-1 (0.5 = mild, 0.8+ = strong)

Respond ONLY with JSON.`,
        },
        {
          role: 'user',
          content: `Analyze the sender's sentiment toward "${entityName}" based on these messages:

${messageTexts}

Respond with JSON:
{
  "sentiment": "positive|negative|neutral|mixed",
  "strength": 0.0,
  "reason": "brief explanation"
}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 150,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      return { sentiment: 'neutral', strength: 0.5, reason: 'no response' };
    }

    try {
      let jsonStr = content.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);
      return {
        sentiment: ['positive', 'negative', 'neutral', 'mixed'].includes(parsed.sentiment)
          ? parsed.sentiment
          : 'neutral',
        strength: typeof parsed.strength === 'number' ? Math.max(0, Math.min(1, parsed.strength)) : 0.5,
        reason: parsed.reason || '',
      };
    } catch {
      return { sentiment: 'neutral', strength: 0.5, reason: 'parse error' };
    }
  } catch (error) {
    console.error('❌ EntityExtractor: Failed to analyze sentiment:', error.message);
    return null;
  }
}

/**
 * Extract all entities from a set of messages
 * Groups entities by type and counts mentions
 * @param {Array<{text: string, timestamp: Date, username: string}>} messages - Messages to analyze
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Extracted entities with counts
 */
async function extractEntities(messages, roomId) {
  if (!messages || messages.length === 0) {
    return { people: [], locations: [], topics: [] };
  }

  // Aggregate entities across all messages
  const entityCounts = {
    people: new Map(), // name -> { count, firstMention, lastMention }
    locations: new Map(),
    topics: new Map(),
  };

  // Process messages in batches to avoid rate limiting
  const batchSize = 10;
  const delayMs = 500;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async msg => {
        const entities = await extractEntitiesFromText(msg.text);
        return { entities, timestamp: msg.timestamp, username: msg.username };
      })
    );

    // Aggregate results
    for (const { entities, timestamp, username } of batchResults) {
      if (!entities) continue;

      for (const type of ['people', 'locations', 'topics']) {
        for (const name of entities[type] || []) {
          const normalizedName = name.trim().toLowerCase();
          if (!normalizedName) continue;

          const existing = entityCounts[type].get(normalizedName);
          if (existing) {
            existing.count++;
            existing.lastMention = timestamp;
            if (!existing.mentionedBy.includes(username)) {
              existing.mentionedBy.push(username);
            }
          } else {
            entityCounts[type].set(normalizedName, {
              name: name.trim(), // Keep original case for display
              count: 1,
              firstMention: timestamp,
              lastMention: timestamp,
              mentionedBy: [username],
            });
          }
        }
      }
    }

    // Rate limit between batches
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Convert maps to arrays and sort by count
  const result = {
    people: Array.from(entityCounts.people.values())
      .sort((a, b) => b.count - a.count),
    locations: Array.from(entityCounts.locations.values())
      .sort((a, b) => b.count - a.count),
    topics: Array.from(entityCounts.topics.values())
      .sort((a, b) => b.count - a.count),
  };

  console.log(
    `✅ EntityExtractor: Found ${result.people.length} people, ${result.locations.length} locations, ${result.topics.length} topics in room ${roomId}`
  );

  return result;
}

/**
 * Get entities mentioned in a specific message with user sentiment context
 * Used during real-time mediation
 * @param {string} text - Message text
 * @param {number} senderUserId - Sender's user ID
 * @param {number} receiverUserId - Receiver's user ID
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Entities with sentiment context
 */
async function getMessageEntityContext(text, _senderUserId, _receiverUserId, _roomId) {
  const entities = await extractEntitiesFromText(text);
  if (!entities || entities.people.length === 0) {
    return { entities, sentimentContext: {} };
  }

  // For each person mentioned, we would look up their sentiment in Neo4j
  // This will be implemented when we integrate with socialMapBuilder
  // For now, return the entities without sentiment
  return {
    entities,
    sentimentContext: {},
    hasPeople: entities.people.length > 0,
    hasLocations: entities.locations.length > 0,
    hasTopics: entities.topics.length > 0,
  };
}

module.exports = {
  extractEntitiesFromText,
  analyzeEntitySentiment,
  extractEntities,
  getMessageEntityContext,
};
