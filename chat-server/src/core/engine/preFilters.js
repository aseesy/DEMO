/**
 * Pre-Filters
 *
 * Fast, local analysis to filter messages before AI calls.
 * Reduces API costs by identifying safe messages early.
 *
 * @module liaizen/core/preFilters
 * 
 * Patterns are now imported from centralized config:
 * @see src/config/patterns/
 */

const {
  ALLOWED_GREETINGS,
  ALLOWED_POLITE,
  POLITE_REQUEST_PATTERNS,
  POSITIVE_PATTERNS,
} = require('../../config/patterns');

// ============================================================================
// CONFLICT PATTERN DETECTION
// ============================================================================

/**
 * Detect conflict patterns in message (local analysis, no API call)
 * Feature 006: Refined to exclude positive contexts from accusatory detection
 *
 * @param {string} messageText - Message to analyze
 * @returns {Object} Pattern detection results
 */
function detectConflictPatterns(messageText) {
  const text = messageText.toLowerCase();

  // Positive context words that indicate friendly intent
  const positiveContextWords =
    /\b(friend|best|great|awesome|amazing|wonderful|helpful|kind|love|appreciate|proud|happy|good|fantastic|incredible|well|person)\b/i;

  // Check if "you're/you are" is in a positive context
  const hasYouAre = /\b(you'?re|you are)\b/i.test(text);
  const isPositiveContext = positiveContextWords.test(text);

  // Negative words that make "you're/you are" accusatory
  const negativeContextWords =
    /\b(wrong|bad|stupid|crazy|irresponsible|useless|terrible|awful|horrible|pathetic|lazy|selfish|rude|mean|inconsiderate|careless)\b/i;

  return {
    hasAccusatory:
      /\b(you always|you never)\b/.test(text) ||
      (hasYouAre && !isPositiveContext && negativeContextWords.test(text)),
    hasTriangulation: /\b(she told me|he said|the kids|child.*said)\b/.test(text),
    hasComparison: /\b(fine with me|never does that|at my house|at your house)\b/.test(text),
    hasBlaming: /\b(your fault|because of you|you made|you caused)\b/.test(text),
  };
}

// ============================================================================
// MESSAGE PRE-FILTERS
// ============================================================================

// Patterns are now imported from centralized config (src/config/patterns/)
// This ensures single source of truth and easier maintenance

/**
 * Check if message is a simple greeting
 * @param {string} text - Lowercase trimmed message
 * @returns {boolean}
 */
function isGreeting(text) {
  return ALLOWED_GREETINGS.includes(text);
}

/**
 * Check if message is a polite response
 * @param {string} text - Lowercase trimmed message
 * @returns {boolean}
 */
function isPoliteResponse(text) {
  return ALLOWED_POLITE.includes(text);
}

/**
 * Check if message is about a third party (not the co-parent)
 * @param {string} text - Original message text
 * @returns {boolean}
 */
function isThirdPartyStatement(text) {
  const mentionsYou = /\b(you|your|you'?re|you'?ve|you'?d|you'?ll)\b/i.test(text);
  const mentionsThirdParty =
    /\b(my\s+)?(friend|teacher|boss|neighbor|colleague|coworker|brother|sister|mother|father|parent|grandma|grandpa|aunt|uncle|cousin)\b/i.test(
      text
    );

  return !mentionsYou && mentionsThirdParty;
}

/**
 * Check if message has positive sentiment
 * @param {string} text - Original message text
 * @returns {boolean}
 */
function hasPositiveSentiment(text) {
  return POSITIVE_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Check if message is a polite request (custody exchange, scheduling, questions)
 * These should never be flagged - they represent good co-parenting communication
 * @param {string} text - Original message text
 * @returns {boolean}
 */
function isPoliteRequest(text) {
  return POLITE_REQUEST_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Run all pre-filters on a message
 * Returns early decision if message can be allowed without AI
 *
 * @param {string} messageText - Message to check
 * @returns {Object} { shouldSkipAI: boolean, reason: string|null }
 */
function runPreFilters(messageText) {
  const text = messageText.toLowerCase().trim();

  // Check greeting
  if (isGreeting(text)) {
    return { shouldSkipAI: true, reason: 'greeting' };
  }

  // Check polite response
  if (isPoliteResponse(text)) {
    return { shouldSkipAI: true, reason: 'polite_response' };
  }

  // Check if message is a simple test message (e.g., "test", "test message", "testing")
  // This allows test messages to bypass mediation for debugging
  if (/^test(ing)?(\s+message)?\s*$/.test(text)) {
    return { shouldSkipAI: true, reason: 'test_message' };
  }

  // Check third-party statement
  if (isThirdPartyStatement(messageText)) {
    return { shouldSkipAI: true, reason: 'third_party_statement' };
  }

  // Check positive sentiment
  if (hasPositiveSentiment(messageText)) {
    return { shouldSkipAI: true, reason: 'positive_sentiment' };
  }

  // Check polite requests (custody exchanges, scheduling, questions)
  if (isPoliteRequest(messageText)) {
    return { shouldSkipAI: true, reason: 'polite_request' };
  }

  return { shouldSkipAI: false, reason: null };
}

module.exports = {
  // Pattern detection
  detectConflictPatterns,

  // Individual filters
  isGreeting,
  isPoliteResponse,
  isThirdPartyStatement,
  hasPositiveSentiment,
  isPoliteRequest,

  // Combined filter
  runPreFilters,

  // Constants for external use
  ALLOWED_GREETINGS,
  ALLOWED_POLITE,
  POSITIVE_PATTERNS,
  POLITE_REQUEST_PATTERNS,
};
