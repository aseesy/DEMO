/**
 * User Intelligence - Passive Learning System
 *
 * Silently observes conversations and builds rich profiles of each user.
 * Zero effort required from users - AI learns and adapts automatically.
 *
 * What it captures:
 * - VALUES: What matters to them (health, education, routine, etc.)
 * - PATTERNS: How they communicate (direct, emotional, logical)
 * - TRIGGERS: What sets them off (lateness, broken promises, etc.)
 * - GROWTH: How they're improving over time
 * - INSIGHTS: Observations that can help them understand themselves
 *
 * Storage: Neo4j graph database for relationship context
 *          PostgreSQL for detailed profile data
 */

const neo4j = require('neo4j-driver');

// Get Neo4j client
let neo4jClient;
try {
  neo4jClient = require('../../infrastructure/database/neo4jClient');
} catch (err) {
  logger.warn('⚠️ UserIntelligence: Neo4j client not available');
  neo4jClient = null;
}

// Get values profile for extraction
let valuesProfile;
try {
  valuesProfile = require('../profiles/valuesProfile');
} catch (err) {
  logger.warn('⚠️ UserIntelligence: Values profile not available');
  valuesProfile = null;
}

const dbPostgres = require('../../../dbPostgres');

const { defaultLogger: defaultLogger } = require('../../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'userIntelligence',
});

// ============================================================
// POSTGRESQL FALLBACK (when Neo4j is unavailable)
// ============================================================

/**
 * Verify that the user_intelligence table exists
 *
 * @deprecated Schema changes must be done via migrations, not runtime creation.
 * Table is created by migration 042_user_intelligence.sql
 * This function now only validates the table exists (throws if missing)
 *
 * @returns {Promise<void>}
 * @throws {Error} If table does not exist (migration needs to be run)
 */
async function initializeIntelligenceTable() {
  try {
    // Verify table exists by querying information_schema
    const result = await dbPostgres.query(`
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_name = 'user_intelligence'
    `);

    if (result.rows.length === 0) {
      throw new Error(
        'user_intelligence table does not exist. ' +
          'Please run migration 042_user_intelligence.sql. ' +
          'Command: npm run migrate (from chat-server directory)'
      );
    }
  } catch (error) {
    if (error.message.includes('does not exist')) {
      throw error;
    }
    logger.error('❌ UserIntelligence: Error verifying PostgreSQL table', {
      message: error.message,
    });
    throw error;
  }
}

/**
 * Update user's PostgreSQL profile with learned intelligence (fallback)
 */
async function updatePostgresProfile(userId, intelligence) {
  try {
    // Check if user has a record
    const existing = await dbPostgres.query('SELECT * FROM user_intelligence WHERE user_id = $1', [
      userId,
    ]);

    if (existing.rows.length === 0) {
      // Create new record
      await dbPostgres.query(
        `
        INSERT INTO user_intelligence (user_id, messages_analyzed, communication_styles, triggers, emotional_patterns, values)
        VALUES ($1, 1, $2, $3, $4, $5)
      `,
        [
          userId,
          JSON.stringify(buildStylesObject(intelligence)),
          JSON.stringify(buildTriggersObject(intelligence)),
          JSON.stringify(buildEmotionsObject(intelligence)),
          JSON.stringify(buildValuesObject(intelligence)),
        ]
      );
    } else {
      // Update existing record
      const current = existing.rows[0];
      const styles = mergeJsonb(current.communication_styles, buildStylesObject(intelligence));
      const triggers = mergeJsonb(current.triggers, buildTriggersObject(intelligence));
      const emotions = mergeJsonb(current.emotional_patterns, buildEmotionsObject(intelligence));
      const values = mergeJsonb(current.values, buildValuesObject(intelligence));

      await dbPostgres.query(
        `
        UPDATE user_intelligence
        SET messages_analyzed = messages_analyzed + 1,
            communication_styles = $2,
            triggers = $3,
            emotional_patterns = $4,
            values = $5,
            last_analyzed = NOW(),
            updated_at = NOW()
        WHERE user_id = $1
      `,
        [
          userId,
          JSON.stringify(styles),
          JSON.stringify(triggers),
          JSON.stringify(emotions),
          JSON.stringify(values),
        ]
      );
    }
    return true;
  } catch (error) {
    logger.error('❌ UserIntelligence: Failed to update PostgreSQL profile', {
      message: error.message,
    });
    return false;
  }
}

/**
 * Get user profile from PostgreSQL (fallback)
 */
async function getProfileFromPostgres(userId) {
  try {
    const result = await dbPostgres.query('SELECT * FROM user_intelligence WHERE user_id = $1', [
      userId,
    ]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      messagesAnalyzed: row.messages_analyzed || 0,
      lastAnalyzed: row.last_analyzed,
      values: row.values || {},
      communicationStyles: row.communication_styles || {},
      triggers: row.triggers || {},
      emotionalPatterns: row.emotional_patterns || {},
    };
  } catch (error) {
    logger.error('❌ UserIntelligence: Failed to get PostgreSQL profile', {
      message: error.message,
    });
    return null;
  }
}

// Helper functions for building JSONB objects
function buildStylesObject(intelligence) {
  const obj = {};
  if (intelligence.communicationStyle.length > 0) {
    const topStyle = intelligence.communicationStyle[0];
    obj[topStyle.style] = 1;
  }
  return obj;
}

function buildTriggersObject(intelligence) {
  const obj = {};
  for (const trigger of intelligence.triggers) {
    obj[trigger.trigger] = trigger.intensity === 'high' ? 2 : 1;
  }
  return obj;
}

function buildEmotionsObject(intelligence) {
  const obj = {};
  if (intelligence.emotionalState) {
    obj[intelligence.emotionalState] = 1;
  }
  return obj;
}

function buildValuesObject(intelligence) {
  const obj = {};
  for (const [key, data] of Object.entries(intelligence.values)) {
    obj[key] = Math.round(data.score);
  }
  return obj;
}

function mergeJsonb(existing, newData) {
  const merged = { ...(existing || {}) };
  for (const [key, value] of Object.entries(newData)) {
    merged[key] = (merged[key] || 0) + value;
  }
  return merged;
}

// ============================================================
// COMMUNICATION PATTERN DETECTION
// ============================================================

const COMMUNICATION_PATTERNS = {
  direct: {
    name: 'Direct Communicator',
    markers: ['need', 'want', 'will', "won't", 'can you', 'please'],
    description: 'Gets straight to the point',
  },
  emotional: {
    name: 'Emotional Communicator',
    markers: ['feel', 'feeling', 'hurt', 'upset', 'happy', 'worried', 'scared', 'love'],
    description: 'Leads with feelings',
  },
  logical: {
    name: 'Logical Communicator',
    markers: ['because', 'reason', 'makes sense', 'logically', 'think about', 'consider'],
    description: 'Uses reasoning and logic',
  },
  questioning: {
    name: 'Questioning Communicator',
    markers: ['why', 'how come', 'what if', 'could you explain', '?'],
    description: 'Seeks understanding through questions',
  },
  accommodating: {
    name: 'Accommodating Communicator',
    markers: ['whatever you think', 'up to you', 'i guess', 'if that works', 'no problem'],
    description: 'Tends to go along with others',
  },
  assertive: {
    name: 'Assertive Communicator',
    markers: ['i expect', 'i need', "it's important", 'must', 'should'],
    description: 'Clear about expectations',
  },
};

const TRIGGER_PATTERNS = {
  lateness: {
    name: 'Time/Punctuality',
    markers: ['late', 'waiting', 'on time', 'delayed', 'running behind', 'where are you'],
    intensity_markers: ['always late', 'never on time', 'again'],
  },
  communication: {
    name: 'Communication Gaps',
    markers: ["didn't tell", "didn't know", "why didn't you", 'should have told', 'inform'],
    intensity_markers: ['never tell', 'always find out'],
  },
  broken_promises: {
    name: 'Broken Promises',
    markers: ['said you would', 'promised', 'supposed to', 'agreed', 'commitment'],
    intensity_markers: ['always break', 'never follow through'],
  },
  money: {
    name: 'Financial Issues',
    markers: ['pay', 'money', 'expensive', 'cost', 'afford', 'child support'],
    intensity_markers: ['never pay', 'always about money'],
  },
  parenting_decisions: {
    name: 'Parenting Decisions',
    markers: ['without asking', "didn't consult", 'my decision too', 'both parents'],
    intensity_markers: ['never ask', 'always decide'],
  },
  new_partner: {
    name: 'New Partner Issues',
    markers: ['boyfriend', 'girlfriend', 'partner', 'new person', 'around my child'],
    intensity_markers: ["don't want", 'uncomfortable'],
  },
};

// ============================================================
// PASSIVE LEARNING FUNCTIONS
// ============================================================

/**
 * Analyze a message and extract all intelligence
 * @param {string} message - The message text
 * @param {Object} context - Additional context (previous messages, etc.)
 * @returns {Object} Extracted intelligence
 */
function analyzeMessage(message, context = {}) {
  const lowerMessage = message.toLowerCase();
  const intelligence = {
    values: {},
    communicationStyle: [],
    triggers: [],
    emotionalState: null,
    topics: [],
    intensity: 'normal',
    hasInsight: false,
    insight: null,
  };

  // Extract values using the valuesProfile module
  if (valuesProfile) {
    const valueSignals = valuesProfile.extractValuesFromMessage(message);
    intelligence.values = valueSignals.values;
    intelligence.intensity = valueSignals.intensity;
  }

  // Detect communication patterns
  for (const [patternKey, pattern] of Object.entries(COMMUNICATION_PATTERNS)) {
    const matchCount = pattern.markers.filter(m => lowerMessage.includes(m)).length;
    if (matchCount >= 2) {
      intelligence.communicationStyle.push({
        style: patternKey,
        name: pattern.name,
        confidence: Math.min(matchCount * 20, 100),
      });
    }
  }

  // Detect triggers
  for (const [triggerKey, trigger] of Object.entries(TRIGGER_PATTERNS)) {
    const baseMatch = trigger.markers.filter(m => lowerMessage.includes(m)).length;
    const intensityMatch = trigger.intensity_markers.filter(m => lowerMessage.includes(m)).length;

    if (baseMatch > 0) {
      intelligence.triggers.push({
        trigger: triggerKey,
        name: trigger.name,
        intensity: intensityMatch > 0 ? 'high' : 'normal',
        confidence: Math.min((baseMatch + intensityMatch * 2) * 20, 100),
      });
    }
  }

  // Detect emotional state
  const emotionMarkers = {
    frustrated: ['frustrated', 'annoyed', 'irritated', 'fed up', 'sick of', 'tired of'],
    hurt: ['hurt', 'disappointed', 'let down', 'betrayed'],
    anxious: ['worried', 'anxious', 'nervous', 'scared', 'afraid'],
    angry: ['angry', 'furious', 'mad', 'pissed', 'livid'],
    sad: ['sad', 'depressed', 'down', 'unhappy'],
    hopeful: ['hope', 'hoping', 'maybe we can', 'would be nice'],
    grateful: ['thank', 'appreciate', 'grateful', 'glad'],
  };

  for (const [emotion, markers] of Object.entries(emotionMarkers)) {
    if (markers.some(m => lowerMessage.includes(m))) {
      intelligence.emotionalState = emotion;
      break;
    }
  }

  // Extract topics mentioned
  const topicPatterns = {
    schedule: ['pickup', 'drop off', 'schedule', 'time', 'when'],
    school: ['school', 'homework', 'teacher', 'grades', 'class'],
    health: ['doctor', 'sick', 'medicine', 'healthy', 'diet'],
    activities: ['practice', 'game', 'lesson', 'activity', 'sport'],
    behavior: ['behavior', 'attitude', 'acting', 'tantrum', 'misbehave'],
  };

  for (const [topic, markers] of Object.entries(topicPatterns)) {
    if (markers.some(m => lowerMessage.includes(m))) {
      intelligence.topics.push(topic);
    }
  }

  // Generate potential insight (for later reflection)
  if (intelligence.triggers.length > 0 && intelligence.intensity === 'strong') {
    const mainTrigger = intelligence.triggers[0];
    intelligence.hasInsight = true;
    intelligence.insight = {
      type: 'trigger_pattern',
      observation: `${mainTrigger.name} seems to be a significant concern`,
      suggestion: `This might be worth exploring - what makes this feel so important?`,
    };
  }

  return intelligence;
}

/**
 * Update user's profile with learned intelligence
 * Uses Neo4j if available, otherwise falls back to PostgreSQL
 * @param {number} userId - User's database ID
 * @param {Object} intelligence - Extracted intelligence from analyzeMessage
 */
async function updateNeo4jProfile(userId, intelligence) {
  // Fallback to PostgreSQL if Neo4j isn't available
  if (!neo4jClient || !neo4jClient.isAvailable()) {
    return updatePostgresProfile(userId, intelligence);
  }

  try {
    const neo4jDriver = require('neo4j-driver');

    // Build update properties
    const updates = [];
    const params = { userId: neo4jDriver.int(userId) };

    // Update communication style scores
    if (intelligence.communicationStyle.length > 0) {
      const topStyle = intelligence.communicationStyle[0];
      updates.push(
        `u.communication_style_${topStyle.style} = COALESCE(u.communication_style_${topStyle.style}, 0) + 1`
      );
    }

    // Update trigger counts
    for (const trigger of intelligence.triggers) {
      updates.push(
        `u.trigger_${trigger.trigger} = COALESCE(u.trigger_${trigger.trigger}, 0) + ${trigger.intensity === 'high' ? 2 : 1}`
      );
    }

    // Update emotional patterns
    if (intelligence.emotionalState) {
      updates.push(
        `u.emotion_${intelligence.emotionalState} = COALESCE(u.emotion_${intelligence.emotionalState}, 0) + 1`
      );
    }

    // Update value scores
    for (const [valueKey, valueData] of Object.entries(intelligence.values)) {
      updates.push(
        `u.value_${valueKey} = COALESCE(u.value_${valueKey}, 0) + ${Math.round(valueData.score)}`
      );
    }

    // Update messages analyzed count
    updates.push('u.messages_analyzed = COALESCE(u.messages_analyzed, 0) + 1');
    updates.push('u.last_analyzed = datetime()');

    if (updates.length === 0) return true;

    const query = `
      MATCH (u:User {userId: $userId})
      SET ${updates.join(', ')}
      RETURN u
    `;

    await neo4jClient._executeCypher(query, params);
    return true;
  } catch (error) {
    logger.error('❌ UserIntelligence: Failed to update Neo4j profile', {
      message: error.message,
    });
    return false;
  }
}

/**
 * Process a message and learn from it (main entry point)
 * @param {number} userId - User's database ID
 * @param {string} message - The message text
 * @param {string} roomId - Room ID for relationship context
 */
async function learnFromMessage(userId, message, roomId = null) {
  try {
    // Analyze the message
    const intelligence = analyzeMessage(message);

    // Update Neo4j profile
    await updateNeo4jProfile(userId, intelligence);

    // Store insight if found
    if (intelligence.hasInsight) {
      await storeInsight(userId, intelligence.insight, roomId);
    }

    // Log learning
    const learned = [];
    if (Object.keys(intelligence.values).length > 0) {
      learned.push(`values: ${Object.keys(intelligence.values).join(', ')}`);
    }
    if (intelligence.communicationStyle.length > 0) {
      learned.push(`style: ${intelligence.communicationStyle[0].name}`);
    }
    if (intelligence.triggers.length > 0) {
      learned.push(`triggers: ${intelligence.triggers.map(t => t.name).join(', ')}`);
    }

    if (learned.length > 0) {
      logger.debug('Log message', {
        value: `🧠 UserIntelligence: Learned from user ${userId}: ${learned.join('; ')}`,
      });
    }

    return intelligence;
  } catch (error) {
    logger.error('❌ UserIntelligence: Failed to learn from message', {
      message: error.message,
    });
    return null;
  }
}

// ============================================================
// INSIGHT STORAGE AND RETRIEVAL
// ============================================================

/**
 * Store an insight about a user
 */
async function storeInsight(userId, insight, roomId = null) {
  try {
    await dbPostgres.query(
      `
      INSERT INTO user_insights (user_id, room_id, insight_type, observation, suggestion, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `,
      [userId, roomId, insight.type, insight.observation, insight.suggestion]
    );
    return true;
  } catch (error) {
    // Table might not exist yet, that's ok
    if (error.message.includes('does not exist')) {
      await initializeInsightsTable();
      return storeInsight(userId, insight, roomId);
    }
    logger.error('❌ UserIntelligence: Failed to store insight', {
      message: error.message,
    });
    return false;
  }
}

/**
 * Verify that all PostgreSQL tables for user intelligence exist
 *
 * @deprecated Schema changes must be done via migrations, not runtime creation.
 * Tables are created by migrations:
 *   - 042_user_intelligence.sql (user_intelligence table)
 *   - 043_user_insights.sql (user_insights table)
 * This function now only validates tables exist (throws if missing)
 *
 * @returns {Promise<void>}
 * @throws {Error} If tables do not exist (migrations need to be run)
 */
async function initializeInsightsTable() {
  try {
    // Verify user_insights table exists
    const insightsResult = await dbPostgres.query(`
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_name = 'user_insights'
    `);

    if (insightsResult.rows.length === 0) {
      throw new Error(
        'user_insights table does not exist. ' +
          'Please run migration 043_user_insights.sql. ' +
          'Command: npm run migrate (from chat-server directory)'
      );
    }

    // Also verify intelligence table (for PostgreSQL fallback)
    await initializeIntelligenceTable();
  } catch (error) {
    if (error.message.includes('does not exist')) {
      throw error;
    }
    logger.error('❌ UserIntelligence: Error verifying insights table', {
      message: error.message,
    });
    throw error;
  }
}

/**
 * Get pending insights for a user (not yet shown)
 */
async function getPendingInsights(userId, limit = 3) {
  try {
    const result = await dbPostgres.query(
      `
      SELECT * FROM user_insights
      WHERE user_id = $1 AND shown_to_user = FALSE
      ORDER BY created_at DESC
      LIMIT $2
    `,
      [userId, limit]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

// ============================================================
// PROFILE RETRIEVAL FOR AI CONTEXT
// ============================================================

/**
 * Get comprehensive user profile for AI context
 * Uses Neo4j if available, otherwise falls back to PostgreSQL
 * @param {number} userId - User's database ID
 * @returns {Promise<Object>} User profile with all learned data
 */
async function getProfileFromNeo4j(userId) {
  // Fallback to PostgreSQL if Neo4j isn't available
  if (!neo4jClient || !neo4jClient.isAvailable()) {
    return getProfileFromPostgres(userId);
  }

  try {
    const neo4jDriver = require('neo4j-driver');
    const query = `
      MATCH (u:User {userId: $userId})
      RETURN u
    `;

    const result = await neo4jClient._executeCypher(query, {
      userId: neo4jDriver.int(userId),
    });

    if (result.records.length === 0) return null;

    const userNode = result.records[0].get('u').properties;

    // Parse the properties into a structured profile
    const profile = {
      messagesAnalyzed: userNode.messages_analyzed || 0,
      lastAnalyzed: userNode.last_analyzed,
      values: {},
      communicationStyles: {},
      triggers: {},
      emotionalPatterns: {},
    };

    // Extract values, styles, triggers, emotions from node properties
    for (const [key, value] of Object.entries(userNode)) {
      if (key.startsWith('value_')) {
        profile.values[key.replace('value_', '')] = value;
      } else if (key.startsWith('communication_style_')) {
        profile.communicationStyles[key.replace('communication_style_', '')] = value;
      } else if (key.startsWith('trigger_')) {
        profile.triggers[key.replace('trigger_', '')] = value;
      } else if (key.startsWith('emotion_')) {
        profile.emotionalPatterns[key.replace('emotion_', '')] = value;
      }
    }

    return profile;
  } catch (error) {
    logger.error('❌ UserIntelligence: Failed to get profile from Neo4j', {
      message: error.message,
    });
    return null;
  }
}

// ============================================================
// TOPIC DETECTION FOR CONTEXT RELEVANCE
// ============================================================

const TOPIC_VALUE_MAP = {
  food: ['health_nutrition'],
  diet: ['health_nutrition'],
  eating: ['health_nutrition'],
  mcdonalds: ['health_nutrition'],
  junk: ['health_nutrition'],
  healthy: ['health_nutrition'],
  vegetables: ['health_nutrition'],
  meal: ['health_nutrition'],
  dinner: ['health_nutrition'],
  lunch: ['health_nutrition'],
  breakfast: ['health_nutrition'],
  snack: ['health_nutrition'],

  school: ['education_learning'],
  homework: ['education_learning'],
  grades: ['education_learning'],
  teacher: ['education_learning'],
  class: ['education_learning'],
  learning: ['education_learning'],

  bedtime: ['routine_structure'],
  schedule: ['routine_structure'],
  routine: ['routine_structure'],
  consistent: ['routine_structure'],

  pickup: ['routine_structure', 'lateness'],
  late: ['lateness'],
  waiting: ['lateness'],
  time: ['lateness', 'routine_structure'],

  money: ['financial_responsibility'],
  pay: ['financial_responsibility'],
  expense: ['financial_responsibility'],
  cost: ['financial_responsibility'],
  support: ['financial_responsibility'],

  screen: ['screen_time'],
  ipad: ['screen_time'],
  phone: ['screen_time'],
  tv: ['screen_time'],
  game: ['screen_time'],

  feelings: ['emotional_safety'],
  upset: ['emotional_safety'],
  crying: ['emotional_safety'],
  scared: ['emotional_safety'],
  anxious: ['emotional_safety'],
};

/**
 * Detect topics in a message and return relevant value/trigger keys
 */
function detectMessageTopics(messageText) {
  const lowerMessage = messageText.toLowerCase();
  const relevantKeys = new Set();

  for (const [keyword, keys] of Object.entries(TOPIC_VALUE_MAP)) {
    if (lowerMessage.includes(keyword)) {
      keys.forEach(k => relevantKeys.add(k));
    }
  }

  return Array.from(relevantKeys);
}

// Specific, non-generic descriptions for values in context
const VALUE_SPECIFIC_DESCRIPTIONS = {
  health_nutrition: {
    context: 'This sender cares about what their child eats',
    specific: 'healthy eating matters to them',
  },
  education_learning: {
    context: 'Education is important to this sender',
    specific: 'academic success matters to them',
  },
  routine_structure: {
    context: 'This sender values consistency',
    specific: 'predictable schedules matter to them',
  },
  emotional_safety: {
    context: 'This sender prioritizes emotional security',
    specific: 'how the child feels matters deeply',
  },
  quality_time: {
    context: 'This sender values meaningful time together',
    specific: 'presence and attention matter to them',
  },
  safety_protection: {
    context: 'Physical safety is a priority',
    specific: 'keeping the child safe matters to them',
  },
  financial_responsibility: {
    context: 'Financial fairness matters',
    specific: 'fair cost-sharing is important to them',
  },
  screen_time: {
    context: 'This sender monitors screen time',
    specific: 'limiting device use matters to them',
  },
};

const TRIGGER_SPECIFIC_DESCRIPTIONS = {
  lateness: {
    context: 'Time and punctuality are sensitive',
    avoid: 'Avoid accusatory language about being late',
  },
  communication: {
    context: 'Being informed matters',
    avoid: 'Avoid implying they were left out intentionally',
  },
  broken_promises: {
    context: 'Follow-through is important',
    avoid: 'Avoid triggering feelings of unreliability',
  },
  money: {
    context: 'Financial topics are sensitive',
    avoid: 'Avoid accusatory money language',
  },
  parenting_decisions: {
    context: 'Shared decision-making matters',
    avoid: 'Avoid implying they were excluded from choices',
  },
};

/**
 * Format user intelligence for AI prompt - TOPIC-AWARE
 * @param {number} userId - User's database ID
 * @param {string} messageText - Current message being analyzed (for topic relevance)
 * @returns {Promise<string>} Formatted context string
 */
async function formatForAI(userId, messageText = '') {
  const profile = await getProfileFromNeo4j(userId);
  if (!profile || profile.messagesAnalyzed < 5) {
    return ''; // Not enough data
  }

  const parts = [];
  const relevantTopics = messageText ? detectMessageTopics(messageText) : [];

  // Only show VALUES relevant to the current message topic
  if (relevantTopics.length > 0) {
    const relevantValues = Object.entries(profile.values)
      .filter(([key]) => relevantTopics.includes(key))
      .sort((a, b) => b[1] - a[1]);

    if (relevantValues.length > 0) {
      const valueDescriptions = relevantValues
        .slice(0, 2)
        .map(([k]) => VALUE_SPECIFIC_DESCRIPTIONS[k]?.specific || k)
        .join(', ');
      parts.push(`What matters here: ${valueDescriptions}`);
    }
  }

  // Communication style (always relevant)
  const sortedStyles = Object.entries(profile.communicationStyles)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1);

  if (sortedStyles.length > 0) {
    const styleDescriptions = {
      direct: 'communicates directly - keep rewrites concise',
      emotional: 'leads with feelings - acknowledge emotions in rewrites',
      logical: 'uses reasoning - include the "why" in rewrites',
      questioning: 'asks questions - frame rewrites as collaborative inquiry',
      accommodating: 'tends to accommodate - rewrites can be more assertive',
      assertive: 'states expectations clearly - match that clarity',
    };
    const topStyle = sortedStyles[0][0];
    parts.push(`Style: ${styleDescriptions[topStyle] || topStyle}`);
  }

  // Only show TRIGGERS relevant to the current message topic
  const relevantTriggers = Object.entries(profile.triggers)
    .filter(([key]) => relevantTopics.includes(key))
    .sort((a, b) => b[1] - a[1]);

  if (relevantTriggers.length > 0) {
    const triggerAdvice = relevantTriggers
      .slice(0, 1)
      .map(([k]) => TRIGGER_SPECIFIC_DESCRIPTIONS[k]?.context || k);
    parts.push(`Note: ${triggerAdvice.join('; ')}`);
  }

  if (parts.length === 0) return '';

  return `\n\n=== SENDER CONTEXT ===
${parts.join('. ')}.`;
}

/**
 * Format RECEIVER's intelligence for AI prompt - TOPIC-AWARE
 * Helps the sender understand what to be mindful of when messaging this person
 * @param {number} userId - Receiver's database ID
 * @param {string} messageText - Current message being analyzed (for topic relevance)
 * @returns {Promise<string>} Formatted context string for receiver awareness
 */
async function formatForReceiverAI(userId, messageText = '') {
  const profile = await getProfileFromNeo4j(userId);
  if (!profile || profile.messagesAnalyzed < 5) {
    return ''; // Not enough data about receiver
  }

  const parts = [];
  const relevantTopics = messageText ? detectMessageTopics(messageText) : [];

  // Only show TRIGGERS relevant to the current message topic
  const relevantTriggers = Object.entries(profile.triggers)
    .filter(([key]) => relevantTopics.length === 0 || relevantTopics.includes(key))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  if (relevantTriggers.length > 0) {
    const triggerAdvice = relevantTriggers.map(([k]) => {
      return (
        TRIGGER_SPECIFIC_DESCRIPTIONS[k]?.avoid ||
        `Receiver is sensitive to ${k.replace(/_/g, ' ')}`
      );
    });
    parts.push(triggerAdvice.join('. '));
  }

  // Only show VALUES relevant to the current message topic
  if (relevantTopics.length > 0) {
    const relevantValues = Object.entries(profile.values)
      .filter(([key]) => relevantTopics.includes(key))
      .sort((a, b) => b[1] - a[1]);

    if (relevantValues.length > 0) {
      const valueDescriptions = relevantValues
        .slice(0, 2)
        .map(([k]) => VALUE_SPECIFIC_DESCRIPTIONS[k]?.specific || k)
        .join(', ');
      parts.push(`Receiver also cares about: ${valueDescriptions}`);
    }
  }

  // Emotional tendencies (only if relevant to topic OR high intensity)
  const sortedEmotions = Object.entries(profile.emotionalPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1);

  if (sortedEmotions.length > 0 && sortedEmotions[0][1] >= 2) {
    const emotionAdvice = {
      frustrated: 'Receiver may already be stressed - tread gently',
      hurt: 'Receiver can feel hurt easily - acknowledge their perspective',
      anxious: 'Receiver tends toward worry - provide reassurance',
      angry: 'Receiver can react strongly - avoid accusatory language',
      defensive: 'Receiver may get defensive - use "I" statements',
      hopeful: 'Receiver is open to collaboration',
      grateful: 'Receiver responds well to appreciation',
    };
    const dominant = sortedEmotions[0][0];
    if (emotionAdvice[dominant]) {
      parts.push(emotionAdvice[dominant]);
    }
  }

  if (parts.length === 0) return '';

  return `\n\n=== RECEIVER CONTEXT ===
${parts.join('. ')}.`;
}

/**
 * Get a self-reflection summary for the user
 * @param {number} userId - User's database ID
 * @returns {Promise<Object>} Reflection summary
 */
async function getSelfReflection(userId) {
  const profile = await getProfileFromNeo4j(userId);
  if (!profile || profile.messagesAnalyzed < 10) {
    return {
      ready: false,
      message: 'Still learning about your communication patterns...',
    };
  }

  const reflections = [];

  // Values reflection
  const topValue = Object.entries(profile.values).sort((a, b) => b[1] - a[1])[0];
  if (topValue) {
    const valueDescriptions = {
      health_nutrition: "Your child's health and nutrition clearly matters deeply to you.",
      routine_structure: 'Consistency and routine seem to be important to how you parent.',
      education_learning: "You place a high value on your child's education and growth.",
      emotional_safety: "Your child's emotional wellbeing is a priority for you.",
      safety_protection: 'Keeping your child safe is a core concern.',
    };
    reflections.push(
      valueDescriptions[topValue[0]] || `You care deeply about ${topValue[0].replace(/_/g, ' ')}.`
    );
  }

  // Trigger reflection
  const topTrigger = Object.entries(profile.triggers).sort((a, b) => b[1] - a[1])[0];
  if (topTrigger) {
    const triggerReflections = {
      lateness:
        'Being kept waiting seems to be frustrating for you - perhaps because you value your time and reliability.',
      communication:
        'Finding out about things after the fact bothers you - you want to be kept in the loop.',
      broken_promises: "When commitments aren't honored, it hits hard. Trust is important to you.",
      money: 'Financial matters create tension - this might be about fairness or security.',
      parenting_decisions:
        'You want to be part of decisions about your child. Co-parenting means shared decision-making to you.',
    };
    reflections.push(
      triggerReflections[topTrigger[0]] ||
        `${topTrigger[0].replace(/_/g, ' ')} seems to be a sensitive area.`
    );
  }

  // Communication style reflection
  const topStyle = Object.entries(profile.communicationStyles).sort((a, b) => b[1] - a[1])[0];
  if (topStyle) {
    const styleReflections = {
      direct: 'You tend to communicate directly and get to the point.',
      emotional: 'You lead with your feelings when you communicate.',
      logical: 'You like to explain your reasoning when you communicate.',
      assertive: "You're clear about your expectations in communication.",
    };
    reflections.push(
      styleReflections[topStyle[0]] || `Your communication style leans ${topStyle[0]}.`
    );
  }

  return {
    ready: true,
    messagesAnalyzed: profile.messagesAnalyzed,
    reflections,
    summary: reflections.join(' '),
  };
}

module.exports = {
  // Analysis
  analyzeMessage,

  // Learning
  learnFromMessage,
  updateNeo4jProfile,

  // Profile retrieval
  getProfileFromNeo4j,
  formatForAI,
  formatForReceiverAI,

  // Self-reflection
  getSelfReflection,
  getPendingInsights,

  // Insights
  storeInsight,
  initializeInsightsTable,

  // Constants
  COMMUNICATION_PATTERNS,
  TRIGGER_PATTERNS,
};
