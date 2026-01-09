/**
 * Intent Extractor
 *
 * Extracts user intent from messages and conversation history.
 * Identifies what the user actually wants/needs, even when the current message
 * is problematic or doesn't explicitly state the intent.
 *
 * Intent Categories:
 * - SCHEDULING_NEED: Change time, coordinate pickup, swap days
 * - INFORMATION_NEED: Get clarification, understand situation
 * - BOUNDARY_NEED: Set limits, assert rights
 * - COLLABORATION_NEED: Work together, solve problem
 * - ACKNOWLEDGMENT_NEED: Be heard, validated
 * - ACTION_NEED: Get something done, make decision
 *
 * @module liaizen/core/intentExtractor
 * @version 1.0.0
 */

'use strict';

const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'intentExtractor' });

// ============================================================================
// INTENT CATEGORIES
// ============================================================================

/**
 * Intent category definitions
 */
const INTENT_CATEGORIES = {
  SCHEDULING_NEED: {
    id: 'SCHEDULING_NEED',
    name: 'Scheduling Need',
    description: 'User wants to change time, coordinate pickup, swap days, or adjust schedule',
    keywords: [
      'time',
      'pickup',
      'drop',
      'dropoff',
      'schedule',
      'meet',
      'meeting',
      'swap',
      'switch',
      'change',
      'pm',
      'am',
      'hour',
      'when',
      'day',
      'weekend',
      'weekday',
    ],
    questionPatterns: [/what\s+time/i, /when\s+(can|will|do)/i, /can\s+we\s+(meet|swap|change)/i],
  },
  INFORMATION_NEED: {
    id: 'INFORMATION_NEED',
    name: 'Information Need',
    description: 'User wants clarification, understanding, or information about a situation',
    keywords: [
      'what',
      'why',
      'how',
      'when',
      'where',
      'who',
      'explain',
      'clarify',
      'understand',
      'know',
      'tell',
      'information',
      'details',
    ],
    questionPatterns: [
      /what\s+(is|was|are|were|do|did|does|will)/i,
      /why\s+(is|was|are|were|do|did|does|will)/i,
      /how\s+(is|was|are|were|do|did|does|will)/i,
      /can\s+you\s+(explain|clarify|tell)/i,
      /i\s+(need|want)\s+to\s+know/i,
    ],
  },
  BOUNDARY_NEED: {
    id: 'BOUNDARY_NEED',
    name: 'Boundary Need',
    description: 'User wants to set limits, assert rights, or establish boundaries',
    keywords: [
      'boundary',
      'limit',
      'right',
      'court',
      'order',
      'legal',
      'lawyer',
      'attorney',
      'custody',
      'agreement',
      'not',
      "won't",
      "can't",
      'stop',
      'enough',
      'respect',
    ],
    questionPatterns: [
      /i\s+(need|want)\s+(you\s+to\s+)?(stop|respect|follow)/i,
      /this\s+(is|was)\s+not/i,
      /you\s+(can'?t|won'?t|shouldn'?t)/i,
    ],
  },
  COLLABORATION_NEED: {
    id: 'COLLABORATION_NEED',
    name: 'Collaboration Need',
    description: 'User wants to work together, solve a problem, or coordinate',
    keywords: [
      'work',
      'together',
      'coordinate',
      'cooperate',
      'collaborate',
      'solve',
      'figure',
      'plan',
      'discuss',
      'talk',
      'decide',
      'agree',
      'compromise',
    ],
    questionPatterns: [
      /can\s+we\s+(work|figure|discuss|talk|plan)/i,
      /let'?s\s+(work|figure|discuss|talk|plan)/i,
      /we\s+need\s+to\s+(work|figure|discuss|talk|plan)/i,
    ],
  },
  ACKNOWLEDGMENT_NEED: {
    id: 'ACKNOWLEDGMENT_NEED',
    name: 'Acknowledgment Need',
    description: 'User wants to be heard, validated, or acknowledged',
    keywords: [
      'listen',
      'hear',
      'understand',
      'acknowledge',
      'recognize',
      'appreciate',
      'notice',
      'see',
      'care',
      'matter',
      'important',
      'frustrated',
      'upset',
      'hurt',
    ],
    questionPatterns: [
      /you\s+(don'?t|never)\s+(listen|hear|understand|care)/i,
      /i\s+(feel|need)\s+(like|to\s+be)/i,
      /no\s+one\s+(listens|hears|understands|cares)/i,
    ],
  },
  ACTION_NEED: {
    id: 'ACTION_NEED',
    name: 'Action Need',
    description: 'User wants something done, a decision made, or action taken',
    keywords: [
      'need',
      'want',
      'require',
      'must',
      'should',
      'have to',
      'do',
      'done',
      'finish',
      'complete',
      'handle',
      'take care',
      'deal with',
    ],
    questionPatterns: [
      /i\s+(need|want|require)\s+(you\s+to\s+)?(do|handle|take|finish)/i,
      /can\s+you\s+(do|handle|take|finish)/i,
      /please\s+(do|handle|take|finish)/i,
    ],
  },
};

// ============================================================================
// INTENT DETECTION FROM CURRENT MESSAGE
// ============================================================================

/**
 * Detect intent from current message text
 *
 * @param {string} messageText - Current message text
 * @returns {Object[]} Array of detected intents with confidence scores
 */
function detectIntentFromMessage(messageText) {
  if (!messageText || typeof messageText !== 'string') {
    return [];
  }

  const text = messageText.toLowerCase();
  const detectedIntents = [];

  // Check each intent category
  for (const [_categoryKey, category] of Object.entries(INTENT_CATEGORIES)) {
    let confidence = 0;
    const evidence = [];

    // Check keywords
    const keywordMatches = category.keywords.filter(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(text);
    });
    if (keywordMatches.length > 0) {
      confidence += keywordMatches.length * 15;
      evidence.push(`Keywords: ${keywordMatches.join(', ')}`);
    }

    // Check question patterns
    const questionMatches = category.questionPatterns.filter(pattern => pattern.test(text));
    if (questionMatches.length > 0) {
      confidence += questionMatches.length * 25;
      evidence.push(`Question patterns matched`);
    }

    // Boost confidence for explicit requests
    if (
      (category.id === 'ACTION_NEED' || category.id === 'SCHEDULING_NEED') &&
      (text.includes('can you') || text.includes('please') || text.includes('?'))
    ) {
      confidence += 20;
      evidence.push('Explicit request detected');
    }

    // Boost confidence for questions (information need)
    if (category.id === 'INFORMATION_NEED' && text.includes('?')) {
      confidence += 15;
      evidence.push('Question mark detected');
    }

    if (confidence > 0) {
      detectedIntents.push({
        intent: category,
        confidence: Math.min(confidence, 100),
        evidence: evidence.join('; '),
        source: 'current_message',
      });
    }
  }

  // Sort by confidence (highest first)
  detectedIntents.sort((a, b) => b.confidence - a.confidence);

  return detectedIntents;
}

// ============================================================================
// INTENT INFERENCE FROM CONVERSATION HISTORY
// ============================================================================

/**
 * Infer intent from conversation history
 * Looks for patterns in recent messages to understand what the user actually wants
 *
 * @param {string} currentMessage - Current message text
 * @param {Array} recentMessages - Array of recent messages (last 5-10)
 * @param {string} senderId - Sender's identifier
 * @returns {Object[]} Array of inferred intents with confidence scores
 */
function inferIntentFromHistory(currentMessage, recentMessages = [], senderId = null) {
  if (!recentMessages || recentMessages.length === 0) {
    return [];
  }

  const inferredIntents = [];
  const senderMessages = recentMessages.filter(
    m => m.username === senderId || m.sender_id === senderId || m.user_id === senderId
  );

  if (senderMessages.length === 0) {
    return [];
  }

  // Analyze recent messages for patterns
  const recentText = senderMessages
    .slice(-5) // Last 5 messages from sender
    .map(m => (m.text || m.message || '').toLowerCase())
    .join(' ');

  // Look for repeated topics or requests
  for (const [_categoryKey, category] of Object.entries(INTENT_CATEGORIES)) {
    let confidence = 0;
    const evidence = [];

    // Count mentions of category keywords in recent messages
    const keywordCount = category.keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = recentText.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);

    if (keywordCount >= 2) {
      confidence += Math.min(keywordCount * 10, 60);
      evidence.push(`Repeated mentions in recent messages (${keywordCount} matches)`);
    }

    // Check for explicit requests in recent messages
    const hasExplicitRequest = category.questionPatterns.some(pattern =>
      senderMessages.some(m => {
        const msgText = (m.text || m.message || '').toLowerCase();
        return pattern.test(msgText);
      })
    );

    if (hasExplicitRequest) {
      confidence += 30;
      evidence.push('Explicit request found in recent messages');
    }

    // Boost confidence if current message is problematic but recent messages show clear intent
    if (confidence > 40 && isProblematicMessage(currentMessage)) {
      confidence += 20;
      evidence.push('Current message is problematic but recent context shows clear intent');
    }

    if (confidence > 0) {
      inferredIntents.push({
        intent: category,
        confidence: Math.min(confidence, 100),
        evidence: evidence.join('; '),
        source: 'conversation_history',
        messageCount: senderMessages.length,
      });
    }
  }

  // Sort by confidence (highest first)
  inferredIntents.sort((a, b) => b.confidence - a.confidence);

  return inferredIntents;
}

/**
 * Check if message is problematic (insulting, attacking, etc.)
 * Used to boost confidence when inferring intent from history
 *
 * @param {string} messageText - Message text
 * @returns {boolean} True if message appears problematic
 */
function isProblematicMessage(messageText) {
  if (!messageText) return false;

  const text = messageText.toLowerCase();
  const problematicPatterns = [
    /\b(you'?re|you\s+are)\s+(a\s+)?(pathetic|sad|crazy|stupid|selfish|terrible|awful|horrible|worthless|useless|incompetent|irresponsible|lazy)\b/i,
    /\b(you\s+suck|fuck\s+you|go\s+to\s+hell)\b/i,
    /\bit'?s\s+(all\s+)?your\s+fault\b/i,
    /\byou\s+made\s+me\b/i,
    /\b(always|never)\s+(do|did|will|are)/i,
  ];

  return problematicPatterns.some(pattern => pattern.test(text));
}

// ============================================================================
// MAIN INTENT EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract user intent from message and conversation history
 *
 * @param {Object} params - Extraction parameters
 * @param {string} params.messageText - Current message text
 * @param {Array} params.recentMessages - Recent conversation messages
 * @param {string} params.senderId - Sender's identifier
 * @param {Object} params.context - Additional context (topic, goal from existing extractMessageGoal)
 * @returns {Object} Intent extraction result
 */
function extractUserIntent({ messageText, recentMessages = [], senderId = null, context = {} }) {
  const startTime = Date.now();

  // 1. Detect intent from current message
  const currentMessageIntents = detectIntentFromMessage(messageText);

  // 2. Infer intent from conversation history
  const historyIntents = inferIntentFromHistory(messageText, recentMessages, senderId);

  // 3. Combine and deduplicate intents
  const allIntents = [...currentMessageIntents, ...historyIntents];
  const intentMap = new Map();

  for (const intentResult of allIntents) {
    const intentId = intentResult.intent.id;
    const existing = intentMap.get(intentId);

    if (!existing) {
      intentMap.set(intentId, intentResult);
    } else {
      // Merge: use higher confidence, combine evidence
      if (intentResult.confidence > existing.confidence) {
        intentMap.set(intentId, {
          ...intentResult,
          evidence: `${existing.evidence}; ${intentResult.evidence}`,
          sources: [existing.source, intentResult.source].filter((v, i, a) => a.indexOf(v) === i),
        });
      } else {
        existing.evidence = `${existing.evidence}; ${intentResult.evidence}`;
        if (!existing.sources) {
          existing.sources = [existing.source];
        }
        if (intentResult.source && !existing.sources.includes(intentResult.source)) {
          existing.sources.push(intentResult.source);
        }
      }
    }
  }

  const finalIntents = Array.from(intentMap.values()).sort((a, b) => b.confidence - a.confidence);

  // 4. Determine primary intent (highest confidence)
  const primaryIntent = finalIntents.length > 0 ? finalIntents[0] : null;

  // 5. Enhance with context if available
  if (context.topic && primaryIntent) {
    // Map topic to intent if it makes sense
    const topicToIntentMap = {
      scheduling: 'SCHEDULING_NEED',
      financial: 'ACTION_NEED',
      parenting: 'COLLABORATION_NEED',
    };

    const mappedIntentId = topicToIntentMap[context.topic];
    if (mappedIntentId && primaryIntent.intent.id !== mappedIntentId) {
      // Check if we should boost the mapped intent
      const mappedIntent = finalIntents.find(i => i.intent.id === mappedIntentId);
      if (mappedIntent && mappedIntent.confidence > primaryIntent.confidence - 20) {
        // Close enough, use context to boost
        mappedIntent.confidence = Math.min(mappedIntent.confidence + 15, 100);
        mappedIntent.evidence += `; Context topic: ${context.topic}`;
      }
    }
  }

  const latencyMs = Date.now() - startTime;

  logger.debug('Intent extraction complete', {
    intentsDetected: finalIntents.length,
    primaryIntent: primaryIntent?.intent?.id,
    latencyMs,
  });

  return {
    intents: finalIntents,
    primaryIntent,
    meta: {
      totalDetected: finalIntents.length,
      fromCurrentMessage: currentMessageIntents.length,
      fromHistory: historyIntents.length,
      latencyMs,
    },
  };
}

/**
 * Get intent category by ID
 *
 * @param {string} intentId - Intent ID (e.g., 'SCHEDULING_NEED')
 * @returns {Object|null} Intent category definition or null
 */
function getIntentCategory(intentId) {
  return Object.values(INTENT_CATEGORIES).find(cat => cat.id === intentId) || null;
}

/**
 * List all available intent categories
 *
 * @returns {Object[]} Array of all intent category definitions
 */
function listAllIntentCategories() {
  return Object.values(INTENT_CATEGORIES);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main extractor
  extractUserIntent,

  // Intent categories
  INTENT_CATEGORIES,
  getIntentCategory,
  listAllIntentCategories,

  // Helper functions (for testing)
  detectIntentFromMessage,
  inferIntentFromHistory,
};
