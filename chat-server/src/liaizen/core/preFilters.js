/**
 * Pre-Filters
 *
 * Fast, local analysis to filter messages before AI calls.
 * Reduces API costs by identifying safe messages early.
 *
 * @module liaizen/core/preFilters
 */

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

// Common greetings that never need mediation
const ALLOWED_GREETINGS = ['hi', 'hello', 'hey', 'hi there', 'hello there', 'hey there'];

// Polite responses that never need mediation
const ALLOWED_POLITE = [
  'thanks',
  'thank you',
  'ok',
  'okay',
  'sure',
  'yes',
  'no',
  'got it',
  'sounds good',
];

// Positive sentiment patterns (never mediate friendly messages)
const POSITIVE_PATTERNS = [
  /\b(you'?re|you are)\s+(my\s+)?(friend|best|great|awesome|amazing|wonderful|the best|so kind|so helpful|so great|incredible|fantastic)\b/i,
  /\b(love|appreciate|thankful|grateful)\s+(you|that|this)\b/i,
  /\b(thank|thanks)\s+(you|so much|for)\b/i,
  /\b(good job|well done|nice work|great work|great job)\b/i,
  /\bI\s+(love|appreciate|value|admire|respect)\s+(you|this|that|our)\b/i,
  /\b(you'?re|you are)\s+(doing\s+)?(great|well|good|amazing|awesome)\b/i,
  /\b(miss|missed)\s+you\b/i,
  /\b(proud of|happy for)\s+you\b/i,
  /\byou('?re| are)\s+a\s+(great|good|wonderful|amazing)\s+(parent|dad|mom|father|mother|person)\b/i,
  /\b(I\s+)?love\s+(how|when|that)\s+you\b/i,
  /\b(I\s+)?love\s+(it|this)\s+when\s+you\b/i,
  /\byou\s+(make|made)\s+me\s+(happy|smile|laugh|feel\s+(good|better|loved|special))\b/i,
  /\b(you'?re|you are)\s+(so\s+)?(sweet|kind|thoughtful|caring|supportive|helpful)\b/i,
];

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

  // Check third-party statement
  if (isThirdPartyStatement(messageText)) {
    return { shouldSkipAI: true, reason: 'third_party_statement' };
  }

  // Check positive sentiment
  if (hasPositiveSentiment(messageText)) {
    return { shouldSkipAI: true, reason: 'positive_sentiment' };
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

  // Combined filter
  runPreFilters,

  // Constants for external use
  ALLOWED_GREETINGS,
  ALLOWED_POLITE,
  POSITIVE_PATTERNS,
};
