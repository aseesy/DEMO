/**
 * Hedging and Apologizing Pattern Detection
 *
 * Detects whether language uses excessive hedging, apologizing,
 * or over-explaining vs direct statements.
 *
 * CONSTITUTION COMPLIANCE:
 * - Describes language patterns, not emotions
 * - No psychological labels
 */

// Hedging/softening markers
const HEDGING_MARKERS = [
  'just', 'maybe', 'possibly', 'perhaps', 'might', 'really',
  'sort of', 'kind of', 'kinda', 'a little', 'a bit',
  'i think', 'i feel like', 'i guess', 'think maybe',
  'not sure if', 'not sure but', 'i could be wrong',
  'if you don\'t mind', 'if that\'s okay', 'if it\'s not too much',
  'isn\'t really', 'not really'
];

// Apologetic framing markers
const APOLOGETIC_MARKERS = [
  'sorry to', 'sorry for', 'i\'m sorry but',
  'hate to', 'don\'t want to bother',
  'i know this is', 'i know you\'re busy',
  'apologize for', 'forgive me for'
];

// Over-explaining markers
const OVER_EXPLAINING_MARKERS = [
  'let me explain', 'the reason is', 'because you see',
  'what happened was', 'the thing is',
  'i want you to understand', 'you have to understand',
  'it\'s not that i', 'it\'s just that'
];

// Direct statement patterns
const DIRECT_PATTERNS = [
  /^i need\b/i,
  /^can we\b/i,
  /^please\b/i,
  /^the \w+ is\b/i,
  /^we need to\b/i,
  /^let's\b/i
];

/**
 * Count hedging words in text
 * @param {string} text - Message text
 * @returns {string[]} Array of found hedges
 */
function findHedges(text) {
  const lowerText = text.toLowerCase();
  return HEDGING_MARKERS.filter(marker => lowerText.includes(marker));
}

/**
 * Detect hedging and apologizing patterns in text
 * @param {string} text - Message text to analyze
 * @returns {Object} Pattern detection results
 */
function detect(text) {
  const lowerText = text.toLowerCase();

  // Find hedging words
  const hedgesFound = findHedges(text);
  const hasHedging = hedgesFound.length > 0;

  // Excessive hedging (3+ hedges in one message)
  const hasExcessiveHedging = hedgesFound.length >= 3;

  // Check for apologetic framing
  const hasApologeticFraming = APOLOGETIC_MARKERS.some(marker =>
    lowerText.includes(marker)
  );

  // Check for over-explaining
  const hasOverExplaining = OVER_EXPLAINING_MARKERS.some(marker =>
    lowerText.includes(marker)
  );

  // Check for direct statement pattern
  const isDirectStatement = DIRECT_PATTERNS.some(pattern =>
    pattern.test(text)
  ) && !hasHedging && !hasApologeticFraming;

  // Check for trailing ellipsis (uncertainty marker)
  const hasTrailingEllipsis = /\.\.\.\s*$/.test(text);

  // Check for question tags seeking validation
  const hasValidationSeeking = /\bright\?\s*$|\bokay\?\s*$|\byes\?\s*$/i.test(text);

  return {
    hedging_softeners: hasHedging,
    excessive_hedging: hasExcessiveHedging,
    apologetic_framing: hasApologeticFraming,
    over_explaining: hasOverExplaining,
    direct_statement: isDirectStatement,
    trailing_uncertainty: hasTrailingEllipsis || hasValidationSeeking,
    hedges_used: hedgesFound
  };
}

/**
 * Get summary observations for hedging patterns
 * @param {Object} patterns - Pattern detection results
 * @returns {string[]} Array of factual observations
 */
function summarize(patterns) {
  const observations = [];

  if (patterns.excessive_hedging) {
    observations.push(`Excessive hedging weakens the message (${patterns.hedges_used.length} softeners)`);
  } else if (patterns.hedging_softeners) {
    observations.push(`Contains hedging language: ${patterns.hedges_used.join(', ')}`);
  }

  if (patterns.apologetic_framing) {
    observations.push('Apologetic framing for raising concern');
  }

  if (patterns.over_explaining) {
    observations.push('Over-explaining/justifying');
  }

  if (patterns.trailing_uncertainty) {
    observations.push('Ends with uncertainty marker');
  }

  if (patterns.direct_statement) {
    observations.push('Direct, clear statement');
  }

  return observations;
}

module.exports = {
  detect,
  summarize,
  findHedges,
  HEDGING_MARKERS,
  APOLOGETIC_MARKERS,
  OVER_EXPLAINING_MARKERS
};
