/**
 * Values Profile - Learn and Store User Values & Motivations
 *
 * This module extracts, stores, and retrieves user values and motivations
 * from their conversation patterns. It enables LiaiZen to provide
 * attuned coaching that resonates with what matters most to each person.
 *
 * Key Concepts:
 * - VALUES: What they prioritize (health, education, routine, flexibility)
 * - STANCES: Their position on parenting topics (strict on diet, relaxed on screen time)
 * - SELF-IMAGE: How they see themselves as a parent (hands-on, provider, nurturer)
 * - MOTIVATIONS: Why they care about certain things (past experiences, beliefs)
 * - NON-NEGOTIABLES: What they absolutely won't compromise on
 */

const dbPostgres = require('../../../dbPostgres');

// ============================================================
// VALUE CATEGORIES AND DETECTION PATTERNS
// ============================================================

const VALUE_CATEGORIES = {
  health_nutrition: {
    name: 'Health & Nutrition',
    keywords: [
      'healthy',
      'diet',
      'nutrition',
      'vegetables',
      'junk food',
      'mcdonalds',
      'fast food',
      'organic',
      'sugar',
      'eating',
      'meals',
      'food',
      'weight',
      'exercise',
      'active',
    ],
    phrases: ['healthy eating', 'balanced diet', 'too much sugar', 'junk food', 'processed food'],
    sentiment_boost: ['important', 'matters', 'care about', 'priority', 'essential', 'crucial'],
  },

  education_learning: {
    name: 'Education & Learning',
    keywords: [
      'school',
      'homework',
      'grades',
      'education',
      'learning',
      'reading',
      'studying',
      'teacher',
      'college',
      'academic',
      'smart',
      'tutor',
      'lessons',
    ],
    phrases: ['good grades', 'do well in school', 'education matters', 'future success'],
    sentiment_boost: ['important', 'priority', 'focus on', 'investment'],
  },

  routine_structure: {
    name: 'Routine & Structure',
    keywords: [
      'routine',
      'schedule',
      'bedtime',
      'consistent',
      'structure',
      'organized',
      'plan',
      'on time',
      'punctual',
      'regular',
      'predictable',
    ],
    phrases: ['same time', 'every day', 'stick to', 'follow through', 'keep to schedule'],
    sentiment_boost: ['need', 'must', 'should', 'always'],
  },

  emotional_safety: {
    name: 'Emotional Safety',
    keywords: [
      'feelings',
      'emotions',
      'scared',
      'worried',
      'anxiety',
      'stress',
      'happy',
      'sad',
      'comfort',
      'secure',
      'safe',
      'loved',
      'support',
      'listen',
    ],
    phrases: ['how they feel', 'emotional needs', 'feel safe', 'be there for'],
    sentiment_boost: ['important', 'matters', 'care about', 'worry about'],
  },

  independence_growth: {
    name: 'Independence & Growth',
    keywords: [
      'independent',
      'responsibility',
      'grow',
      'learn',
      'themselves',
      'capable',
      'confident',
      'self-reliant',
      'decision',
      'choice',
    ],
    phrases: ['on their own', 'figure it out', 'learn from', 'grow up'],
    sentiment_boost: ['important', 'need to', 'should'],
  },

  quality_time: {
    name: 'Quality Time',
    keywords: [
      'together',
      'time',
      'activities',
      'fun',
      'play',
      'bond',
      'memories',
      'experience',
      'weekend',
      'special',
    ],
    phrases: ['spend time', 'do things together', 'quality time', 'make memories'],
    sentiment_boost: ['love', 'enjoy', 'cherish', 'important'],
  },

  safety_protection: {
    name: 'Safety & Protection',
    keywords: [
      'safe',
      'danger',
      'careful',
      'protect',
      'watch',
      'supervise',
      'risk',
      'accident',
      'hurt',
      'injury',
    ],
    phrases: ['keep safe', 'be careful', 'watch out', 'not safe'],
    sentiment_boost: ['worried', 'concerned', 'scared', 'important'],
  },

  respect_manners: {
    name: 'Respect & Manners',
    keywords: [
      'respect',
      'manners',
      'polite',
      'please',
      'thank you',
      'behavior',
      'attitude',
      'rude',
      'disrespectful',
    ],
    phrases: ['good manners', 'be respectful', 'proper behavior'],
    sentiment_boost: ['important', 'expect', 'should', 'must'],
  },

  financial_responsibility: {
    name: 'Financial Responsibility',
    keywords: [
      'money',
      'afford',
      'expensive',
      'cost',
      'budget',
      'save',
      'spend',
      'waste',
      'value',
      'worth',
    ],
    phrases: ["can't afford", 'too expensive', 'waste money', 'value of money'],
    sentiment_boost: ['important', 'careful', 'responsible'],
  },

  screen_time: {
    name: 'Screen Time',
    keywords: [
      'screen',
      'phone',
      'tablet',
      'ipad',
      'tv',
      'video games',
      'youtube',
      'tiktok',
      'social media',
      'device',
    ],
    phrases: ['too much screen', 'limit screen', 'no phones', 'put down the'],
    sentiment_boost: ['worried', 'concerned', 'too much', 'limit'],
  },
};

// Self-image patterns
const SELF_IMAGE_PATTERNS = {
  hands_on: ['I always', 'I make sure', 'I do', 'I take care of', 'I handle'],
  provider: ['I pay', 'I work', 'I provide', 'I buy', 'I afford'],
  nurturer: ['I comfort', 'I listen', 'I support', "I'm there for", 'I help with feelings'],
  organizer: ['I plan', 'I schedule', 'I organize', 'I keep track', 'I arrange'],
  educator: ['I teach', 'I help with homework', 'I read to', 'I explain', 'I show'],
  protector: ['I protect', 'I watch', "I make sure they're safe", 'I worry about'],
};

// ============================================================
// VALUE EXTRACTION FROM MESSAGES
// ============================================================

/**
 * Analyze a message and extract value signals
 * @param {string} message - The message text
 * @returns {Object} Extracted value signals with confidence scores
 */
function extractValuesFromMessage(message) {
  const lowerMessage = message.toLowerCase();
  const signals = {
    values: {},
    stances: [],
    self_image: [],
    intensity: 'normal', // normal, strong, passionate
  };

  // Check for intensity markers
  const intensityMarkers = [
    '!',
    'always',
    'never',
    'absolutely',
    'must',
    'need to',
    'have to',
    'so important',
  ];
  const intensityCount = intensityMarkers.filter(m => lowerMessage.includes(m)).length;
  if (intensityCount >= 3) signals.intensity = 'passionate';
  else if (intensityCount >= 1) signals.intensity = 'strong';

  // Extract values from categories
  for (const [categoryKey, category] of Object.entries(VALUE_CATEGORIES)) {
    let score = 0;
    const matchedKeywords = [];

    // Check keywords
    for (const keyword of category.keywords) {
      if (lowerMessage.includes(keyword)) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    }

    // Check phrases (worth more)
    for (const phrase of category.phrases) {
      if (lowerMessage.includes(phrase)) {
        score += 2;
        matchedKeywords.push(phrase);
      }
    }

    // Check sentiment boosters
    for (const booster of category.sentiment_boost) {
      if (lowerMessage.includes(booster)) {
        score += 0.5;
      }
    }

    // Apply intensity multiplier
    if (signals.intensity === 'passionate') score *= 1.5;
    else if (signals.intensity === 'strong') score *= 1.2;

    if (score > 0) {
      signals.values[categoryKey] = {
        name: category.name,
        score: Math.round(score * 10) / 10,
        keywords: matchedKeywords,
      };
    }
  }

  // Extract self-image signals
  for (const [imageKey, patterns] of Object.entries(SELF_IMAGE_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        signals.self_image.push(imageKey);
        break;
      }
    }
  }

  // Extract stance (opinion/position) from the message
  const stancePatterns = [
    {
      pattern: /(?:i believe|i think|for me|in my opinion|i feel that)\s+(.+?)(?:\.|$)/i,
      type: 'belief',
    },
    { pattern: /(?:should|shouldn't|must|mustn't)\s+(.+?)(?:\.|$)/i, type: 'stance' },
    { pattern: /(?:too much|not enough)\s+(\w+)/i, type: 'concern' },
  ];

  for (const { pattern, type } of stancePatterns) {
    const match = message.match(pattern);
    if (match) {
      signals.stances.push({ type, content: match[1].trim() });
    }
  }

  return signals;
}

/**
 * Get the dominant value from extracted signals
 * @param {Object} signals - Extracted signals from extractValuesFromMessage
 * @returns {string|null} The key of the strongest value or null
 */
function getDominantValue(signals) {
  if (!signals.values || Object.keys(signals.values).length === 0) {
    return null;
  }

  let maxScore = 0;
  let dominantKey = null;

  for (const [key, data] of Object.entries(signals.values)) {
    if (data.score > maxScore) {
      maxScore = data.score;
      dominantKey = key;
    }
  }

  return dominantKey;
}

// ============================================================
// DATABASE OPERATIONS
// ============================================================

/**
 * Verify that the values profile table exists
 * 
 * @deprecated Schema changes must be done via migrations, not runtime creation.
 * Table is created by migration 041_user_values_profile.sql
 * This function now only validates the table exists (throws if missing)
 * 
 * @returns {Promise<boolean>} True if table exists
 * @throws {Error} If table does not exist (migration needs to be run)
 */
async function initializeTable() {
  try {
    // Verify table exists by querying information_schema
    const result = await dbPostgres.query(`
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_name = 'user_values_profile'
    `);

    if (result.rows.length === 0) {
      throw new Error(
        'user_values_profile table does not exist. ' +
        'Please run migration 041_user_values_profile.sql. ' +
        'Command: npm run migrate (from chat-server directory)'
      );
    }

    return true;
  } catch (error) {
    if (error.message.includes('does not exist')) {
      throw error;
    }
    console.error('❌ Error verifying values profile table:', error.message);
    throw error;
  }
}

/**
 * Get or create a user's values profile
 * @param {number} userId - User's database ID
 * @returns {Promise<Object>} The user's values profile
 */
async function getValuesProfile(userId) {
  try {
    const result = await dbPostgres.query('SELECT * FROM user_values_profile WHERE user_id = $1', [
      userId,
    ]);

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        userId: row.user_id,
        valuesScores:
          typeof row.values_scores === 'string'
            ? JSON.parse(row.values_scores)
            : row.values_scores || {},
        stances: typeof row.stances === 'string' ? JSON.parse(row.stances) : row.stances || [],
        selfImage:
          typeof row.self_image === 'string' ? JSON.parse(row.self_image) : row.self_image || [],
        nonNegotiables:
          typeof row.non_negotiables === 'string'
            ? JSON.parse(row.non_negotiables)
            : row.non_negotiables || [],
        motivations:
          typeof row.motivations === 'string' ? JSON.parse(row.motivations) : row.motivations || [],
        messagesAnalyzed: row.messages_analyzed || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    // Create new profile if doesn't exist
    await dbPostgres.query(
      `INSERT INTO user_values_profile (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    return {
      userId,
      valuesScores: {},
      stances: [],
      selfImage: [],
      nonNegotiables: [],
      motivations: [],
      messagesAnalyzed: 0,
    };
  } catch (error) {
    console.error('❌ Failed to get values profile:', error.message);
    return null;
  }
}

/**
 * Update values profile based on a new message
 * @param {number} userId - User's database ID
 * @param {string} message - The message to learn from
 * @returns {Promise<Object>} Updated profile
 */
async function learnFromMessage(userId, message) {
  try {
    // Extract signals from the message
    const signals = extractValuesFromMessage(message);

    // Get current profile
    const profile = await getValuesProfile(userId);
    if (!profile) return null;

    // Merge new signals with existing profile
    const updatedValues = { ...profile.valuesScores };

    for (const [key, data] of Object.entries(signals.values)) {
      if (updatedValues[key]) {
        // Weighted average: older values count more as confidence builds
        const weight = Math.min(profile.messagesAnalyzed / 10, 5); // max 5x weight to existing
        updatedValues[key] = {
          name: data.name,
          score:
            Math.round(((updatedValues[key].score * weight + data.score) / (weight + 1)) * 10) / 10,
          lastSeen: new Date().toISOString(),
          occurrences: (updatedValues[key].occurrences || 1) + 1,
        };
      } else {
        updatedValues[key] = {
          name: data.name,
          score: data.score,
          lastSeen: new Date().toISOString(),
          occurrences: 1,
        };
      }
    }

    // Merge self-image signals
    const updatedSelfImage = [...new Set([...profile.selfImage, ...signals.self_image])];

    // Merge stances (keep last 20)
    const updatedStances = [...signals.stances, ...profile.stances].slice(0, 20);

    // Update database
    await dbPostgres.query(
      `UPDATE user_values_profile
       SET values_scores = $1::jsonb,
           self_image = $2::jsonb,
           stances = $3::jsonb,
           messages_analyzed = messages_analyzed + 1,
           updated_at = NOW()
       WHERE user_id = $4`,
      [
        JSON.stringify(updatedValues),
        JSON.stringify(updatedSelfImage),
        JSON.stringify(updatedStances),
        userId,
      ]
    );

    return {
      ...profile,
      valuesScores: updatedValues,
      selfImage: updatedSelfImage,
      stances: updatedStances,
      messagesAnalyzed: profile.messagesAnalyzed + 1,
    };
  } catch (error) {
    console.error('❌ Failed to learn from message:', error.message);
    return null;
  }
}

/**
 * Add a non-negotiable to user's profile
 * @param {number} userId - User's database ID
 * @param {string} nonNegotiable - The non-negotiable statement
 * @param {string} source - Where it was learned from ('explicit' or 'inferred')
 */
async function addNonNegotiable(userId, nonNegotiable, source = 'inferred') {
  try {
    const profile = await getValuesProfile(userId);
    if (!profile) return null;

    const updated = [
      { text: nonNegotiable, source, addedAt: new Date().toISOString() },
      ...profile.nonNegotiables.filter(n => n.text !== nonNegotiable),
    ].slice(0, 10); // Keep max 10

    await dbPostgres.query(
      `UPDATE user_values_profile
       SET non_negotiables = $1::jsonb, updated_at = NOW()
       WHERE user_id = $2`,
      [JSON.stringify(updated), userId]
    );

    return updated;
  } catch (error) {
    console.error('❌ Failed to add non-negotiable:', error.message);
    return null;
  }
}

/**
 * Add a motivation to user's profile
 * @param {number} userId - User's database ID
 * @param {string} topic - What the motivation is about
 * @param {string} motivation - Why they care
 */
async function addMotivation(userId, topic, motivation) {
  try {
    const profile = await getValuesProfile(userId);
    if (!profile) return null;

    const updated = [
      { topic, motivation, addedAt: new Date().toISOString() },
      ...profile.motivations.filter(m => m.topic !== topic),
    ].slice(0, 10); // Keep max 10

    await dbPostgres.query(
      `UPDATE user_values_profile
       SET motivations = $1::jsonb, updated_at = NOW()
       WHERE user_id = $2`,
      [JSON.stringify(updated), userId]
    );

    return updated;
  } catch (error) {
    console.error('❌ Failed to add motivation:', error.message);
    return null;
  }
}

// ============================================================
// FORMAT FOR AI CONTEXT
// ============================================================

/**
 * Format values profile for AI mediation prompt
 * @param {number} userId - User's database ID
 * @returns {Promise<string>} Formatted context string for AI
 */
async function formatForAI(userId) {
  const profile = await getValuesProfile(userId);
  if (!profile || profile.messagesAnalyzed < 3) {
    return ''; // Not enough data yet
  }

  const parts = [];

  // Top values (sorted by score)
  const sortedValues = Object.entries(profile.valuesScores)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 3);

  if (sortedValues.length > 0) {
    const valuesList = sortedValues.map(([key, data]) => {
      const strength = data.score > 5 ? 'strongly' : data.score > 2 ? 'moderately' : 'somewhat';
      return `${strength} values ${data.name}`;
    });
    parts.push(`This sender ${valuesList.join(', ')}`);
  }

  // Self-image
  if (profile.selfImage.length > 0) {
    const imageDescriptions = {
      hands_on: 'sees themselves as a hands-on parent',
      provider: 'identifies as the provider',
      nurturer: 'sees themselves as the emotional support',
      organizer: 'takes pride in keeping things organized',
      educator: "values being their child's teacher",
      protector: 'prioritizes keeping their child safe',
    };
    const images = profile.selfImage
      .map(i => imageDescriptions[i])
      .filter(Boolean)
      .slice(0, 2);
    if (images.length > 0) {
      parts.push(images.join(' and '));
    }
  }

  // Non-negotiables
  if (profile.nonNegotiables.length > 0) {
    const nonNegs = profile.nonNegotiables.slice(0, 2).map(n => n.text);
    parts.push(`Non-negotiables: ${nonNegs.join('; ')}`);
  }

  // Motivations
  if (profile.motivations.length > 0) {
    const mots = profile.motivations.slice(0, 2).map(m => `${m.topic}: ${m.motivation}`);
    parts.push(`Motivations: ${mots.join('; ')}`);
  }

  if (parts.length === 0) return '';

  return `\n\n=== SENDER'S VALUES & MOTIVATIONS (learned from ${profile.messagesAnalyzed} messages) ===
${parts.join('. ')}.

ATTUNEMENT GUIDANCE: Acknowledge what matters to this sender. Your coaching should resonate with their values, not contradict them. If they value health, acknowledge that concern. If they see themselves as organized, respect that self-image.`;
}

/**
 * Get quick summary of top values for a user
 * @param {number} userId - User's database ID
 * @returns {Promise<Object>} Quick summary
 */
async function getQuickSummary(userId) {
  const profile = await getValuesProfile(userId);
  if (!profile) return null;

  const topValues = Object.entries(profile.valuesScores)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 3)
    .map(([key, data]) => ({ key, ...data }));

  return {
    topValues,
    selfImage: profile.selfImage,
    nonNegotiables: profile.nonNegotiables.map(n => n.text),
    messagesAnalyzed: profile.messagesAnalyzed,
    hasEnoughData: profile.messagesAnalyzed >= 3,
  };
}

module.exports = {
  // Core functions
  extractValuesFromMessage,
  getDominantValue,

  // Database operations
  initializeTable,
  getValuesProfile,
  learnFromMessage,
  addNonNegotiable,
  addMotivation,

  // AI integration
  formatForAI,
  getQuickSummary,

  // Constants
  VALUE_CATEGORIES,
  SELF_IMAGE_PATTERNS,
};
