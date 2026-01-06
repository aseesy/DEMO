/**
 * Dual-Brain Context Builder
 *
 * Runtime synthesis component for the Dual-Brain AI Mediator architecture.
 * Queries both PostgreSQL (narrative memory) and Neo4j (social map) during
 * message mediation to provide context-aware coaching.
 *
 * Two "brains":
 * 1. Narrative Memory (PostgreSQL + embeddings) - What happened: beliefs, patterns, historical wounds
 * 2. Social Map (Neo4j) - Who matters: relationships, entities, sentiment toward people
 *
 * @module liaizen/core/contexts/dualBrainContext
 */

const narrativeMemory = require('../../memory/narrativeMemory');
const entityExtractor = require('../../intelligence/entityExtractor');
const socialMapBuilder = require('../../intelligence/socialMapBuilder');
const neo4jClient = require('../../../infrastructure/database/neo4jClient');

/**
 * Build complete dual-brain context for AI mediation
 *
 * @param {string} messageText - Current message being analyzed
 * @param {number} senderUserId - Sender's user ID
 * @param {number} receiverUserId - Receiver's user ID
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Dual-brain context for AI prompt
 */
async function buildDualBrainContext(messageText, senderUserId, receiverUserId, roomId) {
  if (!messageText || !senderUserId || !roomId) {
    return {
      narrativeContext: null,
      socialContext: null,
      synthesis: null,
      hasContext: false,
    };
  }

  console.log(`🧠 DualBrain: Building context for room ${roomId}`);

  try {
    // Query both brains in parallel
    const [narrativeContext, socialContext] = await Promise.all([
      buildNarrativeContext(messageText, senderUserId, receiverUserId, roomId),
      buildSocialContext(messageText, senderUserId, receiverUserId, roomId),
    ]);

    // Synthesize insights from both brains
    const synthesis = generateSynthesis(narrativeContext, socialContext, messageText);

    const hasContext =
      narrativeContext.hasProfile ||
      narrativeContext.hasSimilarMessages ||
      socialContext.hasPeople;

    if (hasContext) {
      console.log(
        `✅ DualBrain: Context built - Narrative: ${narrativeContext.hasProfile ? 'profile' : 'none'}, ` +
          `Similar: ${narrativeContext.similarMessages?.length || 0}, ` +
          `People: ${socialContext.mentionedPeople?.length || 0}`
      );
    }

    return {
      narrativeContext,
      socialContext,
      synthesis,
      hasContext,
    };
  } catch (error) {
    console.error('❌ DualBrain: Failed to build context:', error.message);
    return {
      narrativeContext: null,
      socialContext: null,
      synthesis: null,
      hasContext: false,
      error: error.message,
    };
  }
}

/**
 * Build narrative context from PostgreSQL (embeddings + profiles)
 *
 * @param {string} messageText - Current message
 * @param {number} senderUserId - Sender's user ID
 * @param {number} receiverUserId - Receiver's user ID
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Narrative context
 */
async function buildNarrativeContext(messageText, senderUserId, receiverUserId, roomId) {
  const context = {
    senderProfile: null,
    receiverProfile: null,
    similarMessages: [],
    detectedPatterns: [],
    hasProfile: false,
    hasSimilarMessages: false,
  };

  try {
    // Get narrative profiles for both participants
    const [senderProfile, receiverProfile, similarMessages] = await Promise.all([
      narrativeMemory.getUserNarrativeProfile(senderUserId, roomId),
      receiverUserId ? narrativeMemory.getUserNarrativeProfile(receiverUserId, roomId) : null,
      narrativeMemory.findSimilarMessages(messageText, null, roomId, 5),
    ]);

    context.senderProfile = senderProfile;
    context.receiverProfile = receiverProfile;
    context.similarMessages = similarMessages;
    context.hasProfile = !!senderProfile || !!receiverProfile;
    context.hasSimilarMessages = similarMessages.length > 0;

    // Detect patterns in similar messages
    if (similarMessages.length >= 2) {
      context.detectedPatterns = detectPatterns(similarMessages, messageText);
    }
  } catch (error) {
    console.warn('⚠️ DualBrain: Narrative context partial failure:', error.message);
  }

  return context;
}

/**
 * Build social context from Neo4j (entities + relationships)
 *
 * @param {string} messageText - Current message
 * @param {number} senderUserId - Sender's user ID
 * @param {number} receiverUserId - Receiver's user ID
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Social context
 */
async function buildSocialContext(messageText, senderUserId, receiverUserId, roomId) {
  const context = {
    mentionedPeople: [],
    entityContext: null,
    relationshipContext: null,
    sensitivePeople: [],
    hasPeople: false,
  };

  try {
    // Extract entities from current message
    const entityContext = await entityExtractor.getMessageEntityContext(
      messageText,
      senderUserId,
      receiverUserId,
      roomId
    );

    context.entityContext = entityContext;
    context.mentionedPeople = entityContext?.entities?.people || [];
    context.hasPeople = context.mentionedPeople.length > 0;

    if (context.mentionedPeople.length > 0) {
      // Get relationship context from Neo4j
      const [relationshipContext, sensitivePeople] = await Promise.all([
        neo4jClient.getRelationshipContext(
          senderUserId,
          receiverUserId,
          context.mentionedPeople,
          roomId
        ),
        socialMapBuilder.getSensitivePeopleForUser(receiverUserId, roomId),
      ]);

      context.relationshipContext = relationshipContext;
      context.sensitivePeople = sensitivePeople;
    }
  } catch (error) {
    console.warn('⚠️ DualBrain: Social context partial failure:', error.message);
  }

  return context;
}

/**
 * Detect recurring patterns in similar messages
 *
 * @param {Array} similarMessages - Messages similar to current
 * @param {string} currentMessage - Current message text
 * @returns {Array<Object>} Detected patterns
 */
function detectPatterns(similarMessages, currentMessage) {
  const patterns = [];

  if (!similarMessages || similarMessages.length < 2) {
    return patterns;
  }

  // Check for recurring themes
  const themes = new Map();

  // Common conflict indicators
  const conflictIndicators = [
    { pattern: /\balways\b/i, theme: 'absolutes', description: 'Uses absolute language' },
    { pattern: /\bnever\b/i, theme: 'absolutes', description: 'Uses absolute language' },
    { pattern: /\byou should\b/i, theme: 'directive', description: 'Directive phrasing' },
    { pattern: /\byou need to\b/i, theme: 'directive', description: 'Directive phrasing' },
    { pattern: /\bwhy (don't|didn't|won't|can't) you\b/i, theme: 'accusatory', description: 'Accusatory questioning' },
    { pattern: /\bi told you\b/i, theme: 'frustration', description: 'Repetition frustration' },
    { pattern: /\bagain\b/i, theme: 'frustration', description: 'Repetition frustration' },
  ];

  // Check current message and similar messages for pattern matches
  for (const indicator of conflictIndicators) {
    let matchCount = 0;

    if (indicator.pattern.test(currentMessage)) {
      matchCount++;
    }

    for (const msg of similarMessages) {
      if (indicator.pattern.test(msg.text || '')) {
        matchCount++;
      }
    }

    // If pattern appears in multiple messages, it's recurring
    if (matchCount >= 2) {
      if (!themes.has(indicator.theme)) {
        themes.set(indicator.theme, {
          theme: indicator.theme,
          description: indicator.description,
          frequency: matchCount,
          isRecurring: true,
        });
      } else {
        themes.get(indicator.theme).frequency += matchCount;
      }
    }
  }

  // Check if similar topics keep coming up
  const topicWords = new Map();
  const allTexts = [currentMessage, ...similarMessages.map(m => m.text || '')];

  for (const text of allTexts) {
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 4 && !isCommonWord(word)) {
        topicWords.set(word, (topicWords.get(word) || 0) + 1);
      }
    }
  }

  // Find recurring topic words (appear in 3+ messages)
  for (const [word, count] of topicWords) {
    if (count >= 3) {
      patterns.push({
        theme: 'recurring_topic',
        description: `Topic "${word}" keeps coming up`,
        frequency: count,
        isRecurring: true,
        topic: word,
      });
    }
  }

  return [...themes.values(), ...patterns.filter(p => p.theme === 'recurring_topic').slice(0, 3)];
}

/**
 * Check if a word is a common word (should be ignored in topic detection)
 */
function isCommonWord(word) {
  const commonWords = new Set([
    'about', 'after', 'before', 'being', 'could', 'doing', 'going',
    'having', 'their', 'there', 'these', 'thing', 'think', 'those',
    'through', 'would', 'really', 'should', 'still', 'where', 'which',
    'while', 'because', 'other', 'people', 'something', 'anything',
  ]);
  return commonWords.has(word);
}

/**
 * Detect if message mentions a person who is sensitive for the receiver
 *
 * @param {Object} socialContext - Social context with relationship data
 * @returns {Object|null} Sensitive person warning if detected
 */
function detectSensitivePerson(socialContext) {
  if (!socialContext?.mentionedPeople || !socialContext?.sensitivePeople) {
    return null;
  }

  const mentionedLower = socialContext.mentionedPeople.map(p => p.toLowerCase());
  const sensitiveLower = socialContext.sensitivePeople.map(p => p.toLowerCase());

  const sensitiveMentions = mentionedLower.filter(p => sensitiveLower.includes(p));

  if (sensitiveMentions.length > 0) {
    return {
      hasSensitiveMention: true,
      people: sensitiveMentions,
      warning: `Message mentions ${sensitiveMentions.join(', ')} who the receiver has negative feelings about`,
    };
  }

  return null;
}

/**
 * Generate synthesis from both brains for AI prompt
 *
 * @param {Object} narrativeContext - Context from narrative memory
 * @param {Object} socialContext - Context from social map
 * @param {string} messageText - Current message
 * @returns {Object} Synthesized insights
 */
function generateSynthesis(narrativeContext, socialContext, messageText) {
  const synthesis = {
    senderInsights: [],
    receiverInsights: [],
    relationshipInsights: [],
    warnings: [],
    promptSection: '',
  };

  // Sender insights from narrative profile
  if (narrativeContext?.senderProfile) {
    const profile = narrativeContext.senderProfile;

    if (profile.known_triggers?.length > 0) {
      synthesis.senderInsights.push({
        type: 'triggers',
        insight: `Sender's known triggers: ${profile.known_triggers.join(', ')}`,
      });
    }

    if (profile.communication_patterns?.uses_absolutes > 0.7) {
      synthesis.senderInsights.push({
        type: 'pattern',
        insight: 'Sender tends to use absolute language (always/never)',
      });
    }

    if (profile.conflict_themes?.length > 0) {
      synthesis.senderInsights.push({
        type: 'themes',
        insight: `Recurring conflict themes: ${profile.conflict_themes.join(', ')}`,
      });
    }
  }

  // Receiver insights
  if (narrativeContext?.receiverProfile) {
    const profile = narrativeContext.receiverProfile;

    if (profile.known_triggers?.length > 0) {
      synthesis.receiverInsights.push({
        type: 'triggers',
        insight: `Receiver's sensitivities: ${profile.known_triggers.join(', ')}`,
      });

      // Check if message might trigger receiver
      const messageLower = messageText.toLowerCase();
      const triggeredTopics = profile.known_triggers.filter(trigger =>
        messageLower.includes(trigger.toLowerCase())
      );

      if (triggeredTopics.length > 0) {
        synthesis.warnings.push({
          type: 'trigger_warning',
          severity: 'medium',
          message: `Message may touch on receiver's sensitive topic: ${triggeredTopics.join(', ')}`,
        });
      }
    }
  }

  // Pattern insights from similar messages
  if (narrativeContext?.detectedPatterns?.length > 0) {
    for (const pattern of narrativeContext.detectedPatterns) {
      if (pattern.isRecurring) {
        synthesis.warnings.push({
          type: 'recurring_pattern',
          severity: 'low',
          message: pattern.description,
        });
      }
    }
  }

  // Relationship insights from social context
  if (socialContext?.relationshipContext) {
    const relContext = socialContext.relationshipContext;

    if (relContext.senderSentiments?.length > 0) {
      for (const sentiment of relContext.senderSentiments) {
        if (sentiment.type === 'DISLIKES') {
          synthesis.relationshipInsights.push({
            type: 'sentiment_conflict',
            insight: `Sender has negative feelings about ${sentiment.person}`,
          });
        }
      }
    }

    if (relContext.receiverSentiments?.length > 0) {
      for (const sentiment of relContext.receiverSentiments) {
        if (sentiment.type === 'DISLIKES') {
          synthesis.relationshipInsights.push({
            type: 'sentiment_conflict',
            insight: `Receiver has negative feelings about ${sentiment.person}`,
          });
        }
      }
    }

    // Check for contested people (different sentiments from each parent)
    if (relContext.contestedPeople?.length > 0) {
      synthesis.warnings.push({
        type: 'contested_person',
        severity: 'high',
        message: `${relContext.contestedPeople.join(', ')} viewed differently by each parent - sensitive topic`,
      });
    }
  }

  // Check for sensitive person mentions
  const sensitivePerson = detectSensitivePerson(socialContext);
  if (sensitivePerson) {
    synthesis.warnings.push({
      type: 'sensitive_mention',
      severity: 'high',
      message: sensitivePerson.warning,
    });
  }

  // Build prompt section
  synthesis.promptSection = formatSynthesisForPrompt(synthesis);

  return synthesis;
}

/**
 * Format synthesis for AI prompt
 *
 * @param {Object} synthesis - Synthesized insights
 * @returns {string} Formatted prompt section
 */
function formatSynthesisForPrompt(synthesis) {
  const sections = [];

  // High-priority warnings first
  const highWarnings = synthesis.warnings.filter(w => w.severity === 'high');
  if (highWarnings.length > 0) {
    sections.push('⚠️ IMPORTANT CONTEXT:');
    for (const warning of highWarnings) {
      sections.push(`- ${warning.message}`);
    }
    sections.push('');
  }

  // Sender context
  if (synthesis.senderInsights.length > 0) {
    sections.push('SENDER CONTEXT:');
    for (const insight of synthesis.senderInsights) {
      sections.push(`- ${insight.insight}`);
    }
    sections.push('');
  }

  // Receiver context
  if (synthesis.receiverInsights.length > 0) {
    sections.push('RECEIVER CONTEXT:');
    for (const insight of synthesis.receiverInsights) {
      sections.push(`- ${insight.insight}`);
    }
    sections.push('');
  }

  // Relationship context
  if (synthesis.relationshipInsights.length > 0) {
    sections.push('RELATIONSHIP CONTEXT:');
    for (const insight of synthesis.relationshipInsights) {
      sections.push(`- ${insight.insight}`);
    }
    sections.push('');
  }

  // Lower-priority observations
  const lowWarnings = synthesis.warnings.filter(w => w.severity !== 'high');
  if (lowWarnings.length > 0) {
    sections.push('OBSERVED PATTERNS:');
    for (const warning of lowWarnings) {
      sections.push(`- ${warning.message}`);
    }
  }

  return sections.join('\n');
}

/**
 * Update dual-brain context after message is sent
 * (Non-blocking, for real-time learning)
 *
 * @param {Object} message - Sent message
 * @param {number} userId - Sender user ID
 * @param {string} roomId - Room ID
 */
function updateDualBrainFromMessage(message, userId, roomId) {
  // Fire and forget - don't block message delivery
  Promise.all([
    // Store embedding for the new message
    narrativeMemory.storeMessageEmbedding(message.id, message.text),
    // Update social map with any new entities
    socialMapBuilder.updateSocialMapFromMessage(message, userId, roomId),
  ]).catch(error => {
    console.warn('⚠️ DualBrain: Background update failed:', error.message);
  });
}

module.exports = {
  buildDualBrainContext,
  buildNarrativeContext,
  buildSocialContext,
  detectPatterns,
  detectSensitivePerson,
  generateSynthesis,
  formatSynthesisForPrompt,
  updateDualBrainFromMessage,
};
