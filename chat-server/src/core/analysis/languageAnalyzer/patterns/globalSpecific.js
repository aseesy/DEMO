/**
 * Global vs Specific Pattern Detection
 *
 * Detects whether language uses global/absolute statements
 * vs specific, concrete references.
 *
 * CONSTITUTION COMPLIANCE:
 * - Describes language patterns, not emotions
 * - No psychological labels
 */

// Global/absolute markers
const GLOBAL_MARKERS = [
  'always',
  'never',
  'every time',
  'constantly',
  'forever',
  'completely',
  'totally',
  'absolutely',
  'entirely',
  'all the time',
  'without fail',
  'no matter what',
  'basically',
  'essentially',
  'fundamentally',
];

// Specific time/behavior markers
const SPECIFIC_MARKERS = [
  'on tuesday',
  'on wednesday',
  'on monday',
  'on thursday',
  'on friday',
  'on saturday',
  'on sunday',
  'yesterday',
  'last week',
  'last month',
  'this morning',
  'tonight',
  'at \\d',
  'when you',
  'that time',
  'specifically',
  'the time when',
  'on the \\d',
];

/**
 * Detect global vs specific patterns in text
 * @param {string} text - Message text to analyze
 * @returns {Object} Pattern detection results
 */
function detect(text) {
  const lowerText = text.toLowerCase();

  // Find global markers
  const foundGlobalMarkers = GLOBAL_MARKERS.filter(marker => lowerText.includes(marker));

  // Check for specific references
  const hasSpecificReference = SPECIFIC_MARKERS.some(marker => {
    const regex = new RegExp(marker, 'i');
    return regex.test(lowerText);
  });

  // Detect "you always/never" pattern (strong global negative)
  const hasYouAlwaysNever = /\byou\s+(always|never)\b/i.test(text);

  // Detect positive global ("you're a great parent")
  const hasGlobalPositive =
    /\byou('re|'re| are)\s+(a\s+)?(great|wonderful|amazing|perfect|best)\b/i.test(text);

  // Detect negative global ("you're a bad/terrible parent", "you're basically failing", "you're such a terrible")
  const hasGlobalNegative =
    hasYouAlwaysNever ||
    /\byou('re|'re| are)\s+(a\s+|such\s+a\s+)?(bad|terrible|awful|worst|horrible)\b/i.test(text) ||
    /\byou('re|'re| are)\s+(basically|essentially|fundamentally)?\s*(fail|suck|ruin)/i.test(text) ||
    (foundGlobalMarkers.length > 0 && /\b(fail|failing|ruining|hurting|damaging)\b/i.test(text));

  // Detect specific behavior reference
  const hasSpecificBehavior =
    hasSpecificReference || /\bwhen you (did|said|went|took|picked|dropped|forgot)\b/i.test(text);

  // Detect specific impact
  const hasSpecificImpact =
    /\b(she|he|they)\s+(missed|was late|couldn't|didn't get|had to)\b/i.test(text) ||
    /\bbecause of (that|this),?\s+(she|he|they|i)\b/i.test(text);

  return {
    global_positive: hasGlobalPositive,
    global_negative: hasGlobalNegative,
    specific_behavior: hasSpecificBehavior,
    specific_impact: hasSpecificImpact,
    absolutes_used: foundGlobalMarkers,
  };
}

/**
 * Get summary observations for global/specific patterns
 * @param {Object} patterns - Pattern detection results
 * @returns {string[]} Array of factual observations
 */
function summarize(patterns) {
  const observations = [];

  if (patterns.global_negative) {
    observations.push('Uses global/absolute negative language');
  }
  if (patterns.global_positive) {
    observations.push('Uses global positive language');
  }
  if (patterns.absolutes_used.length > 0) {
    observations.push(`Contains absolute terms: ${patterns.absolutes_used.join(', ')}`);
  }
  if (!patterns.specific_behavior && (patterns.global_negative || patterns.global_positive)) {
    observations.push('No specific behavior cited to support claim');
  }
  if (patterns.specific_behavior) {
    observations.push('References specific behavior or time');
  }
  if (patterns.specific_impact) {
    observations.push('Describes specific impact or consequence');
  }

  return observations;
}

module.exports = {
  detect,
  summarize,
  GLOBAL_MARKERS,
  SPECIFIC_MARKERS,
};
