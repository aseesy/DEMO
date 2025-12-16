/**
 * Vague vs Specific Pattern Detection
 *
 * Detects whether language is vague/abstract
 * vs specific/concrete.
 *
 * CONSTITUTION COMPLIANCE:
 * - Describes language patterns, not emotions
 * - No psychological labels
 */

// Vague reference markers
const VAGUE_REFERENCES = [
  'things', 'stuff', 'everything', 'something', 'anything',
  'issues', 'problems', 'situation', 'matters',
  'the way you', 'how you', 'what you do',
  'all of this', 'all that', 'this whole'
];

// Vague complaint patterns
const VAGUE_COMPLAINT_PATTERNS = [
  /\bthe way you('re| are)?\s+\w+ing\b/i,
  /\bhow you\s+(handle|deal|treat|act)\b/i,
  /\byour\s+(attitude|behavior|approach|way)\b/i,
  /\bthis\s+(situation|issue|problem|mess)\b/i
];

// Vague request patterns
const VAGUE_REQUEST_PATTERNS = [
  /\bdo better\b/i,
  /\btry harder\b/i,
  /\bbe more\s+\w+\b/i,
  /\bstep up\b/i,
  /\bget it together\b/i,
  /\bfix (this|it|things)\b/i,
  /\bchange\s+(your|this)\b/i
];

// Specific request patterns
const SPECIFIC_REQUEST_PATTERNS = [
  /\bcan (you|we)\s+\w+\s+(on|at|by|the)\b/i,  // "Can we swap the Tuesday..."
  /\bplease\s+\w+\s+(the|her|him|them)\b/i,
  /\bwould (you|we)\s+\w+\s+(at|on|by|the)\b/i,
  /\bi need you to\s+\w+/i,
  /\b(pack|bring|pick up|drop off|call|text|email)\s+(the|her|him)\b/i,
  /\bcan we\s+swap\b/i,  // "Can we swap..."
  /\b(swap|change|move)\s+the\s+\w+\s+(pickup|dropoff|visit|time)\b/i  // "swap the Tuesday pickup"
];

// Specific reference patterns (times, places, items)
const SPECIFIC_REFERENCE_PATTERNS = [
  /\b\d{1,2}(:\d{2})?\s*(am|pm|o'clock)?\b/i,  // Times
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,  // Days
  /\b(her|his)\s+(inhaler|backpack|homework|lunch|medication|jacket|shoes)\b/i,  // Items
  /\b(school|soccer|piano|dance|doctor|dentist)\b/i  // Activities
];

/**
 * Detect vague vs specific patterns in text
 * @param {string} text - Message text to analyze
 * @returns {Object} Pattern detection results
 */
function detect(text) {
  const lowerText = text.toLowerCase();

  // Check for vague references
  const hasVagueReference = VAGUE_REFERENCES.some(marker =>
    lowerText.includes(marker)
  );

  // Check for vague complaint patterns
  const hasVagueComplaint = VAGUE_COMPLAINT_PATTERNS.some(pattern =>
    pattern.test(text)
  );

  // Check for vague request patterns
  const hasVagueRequest = VAGUE_REQUEST_PATTERNS.some(pattern =>
    pattern.test(text)
  );

  // Check for specific request patterns
  const hasSpecificRequest = SPECIFIC_REQUEST_PATTERNS.some(pattern =>
    pattern.test(text)
  );

  // Check for specific references
  const hasSpecificReference = SPECIFIC_REFERENCE_PATTERNS.some(pattern =>
    pattern.test(text)
  );

  // Check for concrete items mentioned
  const hasConcreteItem = /\b(the|her|his)\s+(inhaler|backpack|homework|lunch|medication|jacket|phone|tablet|charger)\b/i.test(text);

  // Check for specific time reference
  const hasTimeReference = /\b(at|by|before|after|until)\s+\d/i.test(text) ||
    /\b\d{1,2}(:\d{2})?\s*(am|pm)\b/i.test(text);

  return {
    vague_complaint: hasVagueComplaint || (hasVagueReference && !hasSpecificReference),
    vague_request: hasVagueRequest,
    specific_complaint: hasSpecificReference && !hasVagueComplaint,
    specific_request: hasSpecificRequest,
    has_concrete_item: hasConcreteItem,
    has_time_reference: hasTimeReference,
    vague_terms_used: VAGUE_REFERENCES.filter(v => lowerText.includes(v))
  };
}

/**
 * Get summary observations for specificity patterns
 * @param {Object} patterns - Pattern detection results
 * @returns {string[]} Array of factual observations
 */
function summarize(patterns) {
  const observations = [];

  if (patterns.vague_complaint) {
    observations.push('Vague complaint without specific details');
  }
  if (patterns.vague_terms_used.length > 0) {
    observations.push(`Uses vague terms: ${patterns.vague_terms_used.join(', ')}`);
  }
  if (patterns.vague_request) {
    observations.push('Request is vague/non-actionable');
  }
  if (patterns.specific_complaint) {
    observations.push('Complaint references specific details');
  }
  if (patterns.specific_request) {
    observations.push('Request is specific and actionable');
  }
  if (patterns.has_concrete_item) {
    observations.push('References specific item');
  }
  if (patterns.has_time_reference) {
    observations.push('Includes specific time');
  }

  return observations;
}

module.exports = {
  detect,
  summarize,
  VAGUE_REFERENCES,
  VAGUE_COMPLAINT_PATTERNS,
  VAGUE_REQUEST_PATTERNS,
  SPECIFIC_REQUEST_PATTERNS
};
