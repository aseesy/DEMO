/**
 * Pattern → Intent Connector
 *
 * Connects behavioral patterns to user intent and generates explanations
 * for why the pattern won't achieve the user's goal.
 *
 * This module creates the connection logic:
 * "This [behavioral pattern] won't help you [user intent] because..."
 *
 * @module liaizen/core/patternIntentConnector
 * @version 1.0.0
 */

'use strict';

const { defaultLogger } = require('../../infrastructure/logging/logger');
const _behavioralPatternAnalyzer = require('./behavioralPatternAnalyzer');
const _intentExtractor = require('./intentExtractor');

const logger = defaultLogger.child({ module: 'patternIntentConnector' });

// ============================================================================
// CONNECTION TEMPLATES
// ============================================================================

/**
 * Connection templates mapping behavioral patterns to intent categories
 * Each template explains why the pattern won't achieve the intent
 */
const CONNECTION_TEMPLATES = {
  // Making Assumptions + Intent combinations
  MAKING_ASSUMPTIONS_SCHEDULING_NEED: {
    explanation:
      "Assuming their intent or schedule without asking won't help you coordinate a meeting time - you need actual information, not assumptions.",
    alternative: 'Ask directly: "What time works for you?" instead of assuming.',
  },
  MAKING_ASSUMPTIONS_INFORMATION_NEED: {
    explanation:
      "Assuming their intent or situation without asking won't get you the clarification you need - you need to ask questions to understand.",
    alternative: 'Ask directly: "Can you explain what happened?" instead of assuming.',
  },
  MAKING_ASSUMPTIONS_COLLABORATION_NEED: {
    explanation:
      "Assuming their position or intent without asking won't help you work together - collaboration requires understanding their actual perspective.",
    alternative: 'Ask: "What is your perspective on this?" instead of assuming.',
  },
  MAKING_ASSUMPTIONS_ACTION_NEED: {
    explanation:
      "Assuming what they'll do or why they haven't done it won't get you the action you need - you need to make a clear request.",
    alternative: 'Make a direct request: "Can you [specific action]?" instead of assuming.',
  },

  // Avoiding Responsibility + Intent combinations
  AVOIDING_RESPONSIBILITY_COLLABORATION_NEED: {
    explanation:
      "Shifting blame won't help you work together to solve this - collaboration requires both people taking ownership of their part.",
    alternative: 'Take ownership: "I can help by..." instead of shifting blame.',
  },
  AVOIDING_RESPONSIBILITY_ACTION_NEED: {
    explanation:
      "Shifting blame won't get you the action you need - focusing on fault prevents problem-solving.",
    alternative: 'Focus on solution: "What can we do to fix this?" instead of blame.',
  },

  // Character Attack + Intent combinations
  CHARACTER_ATTACK_SCHEDULING_NEED: {
    explanation:
      "Attacking their character won't help you change the meeting time - it shifts focus from the scheduling issue to defending themselves, so your actual need won't get addressed.",
    alternative: 'Focus on the schedule: "I need to change our meeting time. What works for you?"',
  },
  CHARACTER_ATTACK_INFORMATION_NEED: {
    explanation:
      "Attacking their character won't get you the information you need - it makes them defensive rather than willing to share details.",
    alternative: 'Ask directly: "Can you help me understand what happened?"',
  },
  CHARACTER_ATTACK_COLLABORATION_NEED: {
    explanation:
      "Attacking their character won't help you work together - character attacks create defensiveness, not collaboration.",
    alternative: 'Focus on the issue: "Can we work together on this?" instead of attacking.',
  },
  CHARACTER_ATTACK_ACTION_NEED: {
    explanation:
      "Attacking their character won't get you the action you need - it shifts focus from what needs to be done to defending themselves.",
    alternative: 'Make a clear request: "I need you to [specific action]. Can you do that?"',
  },
  CHARACTER_ATTACK_ACKNOWLEDGMENT_NEED: {
    explanation:
      "Attacking their character won't help you be heard - character attacks make people defensive, not receptive to your concerns.",
    alternative: 'Express your need: "I need you to understand that..." instead of attacking.',
  },

  // Triangulation + Intent combinations
  TRIANGULATION_SCHEDULING_NEED: {
    explanation:
      "Using a messenger won't help you coordinate the meeting time - you need to communicate directly to coordinate schedules effectively.",
    alternative: 'Communicate directly: "I need to change our meeting time. What works for you?"',
  },
  TRIANGULATION_INFORMATION_NEED: {
    explanation:
      "Using a messenger won't get you the information you need - you need to ask directly to get accurate details.",
    alternative: 'Ask directly: "Can you explain what happened?" instead of using a messenger.',
  },
  TRIANGULATION_COLLABORATION_NEED: {
    explanation:
      "Using a messenger won't help you work together - collaboration requires direct communication between the two of you.",
    alternative: 'Communicate directly: "Can we discuss this together?"',
  },
  TRIANGULATION_ACTION_NEED: {
    explanation:
      "Using a messenger won't get you the action you need - direct communication is needed to coordinate what needs to be done.",
    alternative: 'Ask directly: "Can you [specific action]?" instead of using a messenger.',
  },

  // Escalation + Intent combinations
  ESCALATION_SCHEDULING_NEED: {
    explanation:
      "Threats and ultimatums won't help you change the meeting time - they create defensiveness and resistance rather than cooperation.",
    alternative:
      'Make a request: "I need to change our meeting time. Can we find a time that works?"',
  },
  ESCALATION_COLLABORATION_NEED: {
    explanation:
      "Threats and ultimatums won't help you work together - escalation creates conflict, not collaboration.",
    alternative:
      'Propose collaboration: "Can we work together to solve this?" instead of threatening.',
  },
  ESCALATION_ACTION_NEED: {
    explanation:
      "Threats and ultimatums won't get you the action you need - they create resistance rather than cooperation.",
    alternative: 'Make a clear request: "I need you to [specific action]. Can you do that?"',
  },
  ESCALATION_BOUNDARY_NEED: {
    explanation:
      "Threats and ultimatums won't help you set boundaries effectively - boundaries are better communicated clearly and directly, not through escalation.",
    alternative: 'State your boundary: "I need [specific boundary]. This is important to me."',
  },

  // Emotional Dumping + Intent combinations
  EMOTIONAL_DUMPING_SCHEDULING_NEED: {
    explanation:
      "Expressing multiple emotions without focus won't help you coordinate the meeting time - the receiver gets overwhelmed and can't address your actual scheduling need.",
    alternative: 'Focus on the schedule: "I need to change our meeting time. What works for you?"',
  },
  EMOTIONAL_DUMPING_INFORMATION_NEED: {
    explanation:
      "Expressing multiple emotions without structure won't get you the information you need - the receiver gets overwhelmed and can't provide clear details.",
    alternative: 'Ask one focused question: "Can you explain what happened?"',
  },
  EMOTIONAL_DUMPING_COLLABORATION_NEED: {
    explanation:
      "Expressing multiple emotions without structure won't help you work together - emotional dumping overwhelms the receiver and prevents productive collaboration.",
    alternative: 'Focus on one issue: "Can we work together on [specific issue]?"',
  },
  EMOTIONAL_DUMPING_ACTION_NEED: {
    explanation:
      "Expressing multiple emotions without focus won't get you the action you need - the receiver gets overwhelmed and can't determine what you actually need done.",
    alternative: 'Make one clear request: "I need you to [specific action]. Can you do that?"',
  },
};

// ============================================================================
// CONNECTION LOGIC
// ============================================================================

/**
 * Generate connection explanation for a behavioral pattern and user intent
 *
 * @param {Object} behavioralPattern - Behavioral pattern result from analyzer
 * @param {Object} userIntent - User intent result from extractor
 * @param {string} originalMessage - Original message text (for context)
 * @returns {Object} Connection explanation
 */
function connectPatternToIntent(behavioralPattern, userIntent, _originalMessage = '') {
  if (!behavioralPattern || !userIntent) {
    return null;
  }

  const patternId = behavioralPattern.pattern.id;
  const intentId = userIntent.intent.id;

  // Look up connection template
  const templateKey = `${patternId}_${intentId}`;
  const template = CONNECTION_TEMPLATES[templateKey];

  if (!template) {
    // Generate generic connection if no specific template
    return generateGenericConnection(behavioralPattern, userIntent);
  }

  return {
    pattern: behavioralPattern.pattern,
    intent: userIntent.intent,
    explanation: template.explanation,
    alternative: template.alternative,
    confidence: Math.min((behavioralPattern.confidence + userIntent.confidence) / 2, 95),
    source: 'template',
  };
}

/**
 * Generate generic connection when no specific template exists
 *
 * @param {Object} behavioralPattern - Behavioral pattern result
 * @param {Object} userIntent - User intent result
 * @returns {Object} Generic connection explanation
 */
function generateGenericConnection(behavioralPattern, userIntent) {
  const patternName = behavioralPattern.pattern.name.toLowerCase();
  const intentName = userIntent.intent.name.toLowerCase();

  return {
    pattern: behavioralPattern.pattern,
    intent: userIntent.intent,
    explanation: `This ${patternName} won't help you achieve your ${intentName} - the pattern creates barriers to communication rather than facilitating your goal.`,
    alternative: `Try ${behavioralPattern.pattern.alternative} to achieve your ${intentName}.`,
    confidence: Math.min((behavioralPattern.confidence + userIntent.confidence) / 2, 85),
    source: 'generic',
  };
}

/**
 * Connect behavioral patterns to user intent from analysis results
 *
 * @param {Object} behavioralAnalysis - Result from behavioralPatternAnalyzer
 * @param {Object} intentAnalysis - Result from intentExtractor
 * @param {string} originalMessage - Original message text
 * @returns {Object} Connection analysis
 */
function connectPatternsToIntent(behavioralAnalysis, intentAnalysis, originalMessage = '') {
  if (!behavioralAnalysis || !intentAnalysis) {
    return {
      connections: [],
      primaryConnection: null,
      meta: {
        error: 'Missing analysis data',
      },
    };
  }

  const startTime = Date.now();
  const connections = [];

  // Get primary pattern and intent
  const primaryPattern = behavioralAnalysis.primaryPattern;
  const primaryIntent = intentAnalysis.primaryIntent;

  // Connect primary pattern to primary intent
  if (primaryPattern && primaryIntent) {
    const connection = connectPatternToIntent(primaryPattern, primaryIntent, originalMessage);
    if (connection) {
      connections.push(connection);
    }
  }

  // Connect other high-confidence patterns to primary intent
  if (primaryIntent && behavioralAnalysis.patterns.length > 1) {
    for (const pattern of behavioralAnalysis.patterns.slice(1, 3)) {
      // Only connect if confidence is reasonable
      if (pattern.confidence >= 50) {
        const connection = connectPatternToIntent(pattern, primaryIntent, originalMessage);
        if (connection && !connections.find(c => c.pattern.id === connection.pattern.id)) {
          connections.push(connection);
        }
      }
    }
  }

  // Connect primary pattern to other high-confidence intents
  if (primaryPattern && intentAnalysis.intents.length > 1) {
    for (const intent of intentAnalysis.intents.slice(1, 3)) {
      // Only connect if confidence is reasonable
      if (intent.confidence >= 50) {
        const connection = connectPatternToIntent(primaryPattern, intent, originalMessage);
        if (connection && !connections.find(c => c.intent.id === connection.intent.id)) {
          connections.push(connection);
        }
      }
    }
  }

  // Sort by confidence (highest first)
  connections.sort((a, b) => b.confidence - a.confidence);

  const primaryConnection = connections.length > 0 ? connections[0] : null;

  const latencyMs = Date.now() - startTime;

  logger.debug('Pattern-intent connection complete', {
    connectionsGenerated: connections.length,
    primaryConnection: primaryConnection
      ? `${primaryConnection.pattern.id} → ${primaryConnection.intent.id}`
      : null,
    latencyMs,
  });

  return {
    connections,
    primaryConnection,
    meta: {
      totalConnections: connections.length,
      latencyMs,
    },
  };
}

/**
 * Format connection for inclusion in AI prompt
 *
 * @param {Object} connection - Connection result
 * @returns {string} Formatted connection string
 */
function formatConnectionForPrompt(connection) {
  if (!connection) {
    return '';
  }

  return `\n=== PATTERN → INTENT CONNECTION ===
Behavioral Pattern: ${connection.pattern.name}
User Intent: ${connection.intent.name}

Why this won't work: ${connection.explanation}

Alternative approach: ${connection.alternative}

⚠️ USE THIS CONNECTION in your validation message. Explain why the ${connection.pattern.name.toLowerCase()} pattern won't help them achieve their ${connection.intent.name.toLowerCase()}.`;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main connector
  connectPatternsToIntent,
  connectPatternToIntent,

  // Formatting
  formatConnectionForPrompt,

  // Templates (for reference)
  CONNECTION_TEMPLATES,
};
