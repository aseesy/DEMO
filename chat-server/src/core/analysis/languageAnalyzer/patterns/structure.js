/**
 * Sentence Structure Pattern Detection
 *
 * Detects the structural type of the message:
 * accusation, question, request, statement, demand, threat
 *
 * CONSTITUTION COMPLIANCE:
 * - Describes language patterns, not emotions
 * - No psychological labels
 */

// Accusation patterns
const ACCUSATION_PATTERNS = [
  /^you\s+(did|didn't|never|always|don't|won't|can't)\b/i,
  /\byou('re|'re| are)\s+(the|a|so|such|being|always|basically|just|really)\b/i,
  /\bit's\s+(your|all your)\s+fault\b/i,
  /\bbecause\s+of\s+you\b/i,
  /\byou\s+made\s+(me|her|him|this|it)\b/i,
  /\byou('re|'re| are)\s+\w+ing\s+(vira|the kids?|them|her|him)\b/i, // "You're failing Vira"
];

// Question patterns
const QUESTION_PATTERNS = [
  /\?$/,
  /^(can|could|would|will|do|did|are|is|have|has|why|what|when|where|how)\b/i,
  /^(don't|doesn't|didn't|won't|wouldn't|isn't|aren't)\s+you\b/i,
];

// Request patterns (polite asks)
const REQUEST_PATTERNS = [
  /\bcan\s+(you|we)\b/i,
  /\bcould\s+(you|we)\b/i,
  /\bwould\s+you\s+(mind|be able|please)\b/i,
  /\bplease\b/i,
  /\bi('d| would)\s+appreciate\b/i,
  /\bi('d| would)\s+like\b/i,
  /\bwhen\s+you\s+get\s+a\s+chance\b/i,
];

// Demand patterns (forceful)
const DEMAND_PATTERNS = [
  /\byou\s+need\s+to\b/i,
  /\byou\s+have\s+to\b/i,
  /\byou\s+must\b/i,
  /\byou\s+better\b/i,
  /\bjust\s+do\s+it\b/i,
  /\bstop\s+(doing|being|it)\b/i,
  /^(do|stop|don't)\s+\w+/i,
];

// Threat patterns
const THREAT_PATTERNS = [
  /\bif\s+you\s+(don't|won't|can't)\b.*\bi('ll| will)\b/i,
  /\bi('ll| will)\s+\w+\s+if\s+you\b/i,
  /\bor\s+else\b/i,
  /\bi('m| am)\s+going\s+to\s+\w+\s+(you|the|my lawyer|court)\b/i,
  /\bmy\s+lawyer\b/i,
  /\btake\s+you\s+to\s+court\b/i,
  /\bfull\s+custody\b/i,
];

// Statement patterns (neutral)
const STATEMENT_PATTERNS = [
  /^(the|her|his|their|our|my|i|she|he|it)\s+\w+/i,
  /^(this|that|these|those)\s+\w+/i,
  /\bis\s+(at|on|in|scheduled|planned)\b/i,
];

// Target detection
const TARGET_PATTERNS = {
  other_parent: [/\byou\b/i, /\byour\b/i],
  self: [/\bi\s+\b/i, /\bmy\s+\b/i, /\bi'm\b/i, /\bi've\b/i],
  child: [/\bshe\b/i, /\bhe\b/i, /\bthem\b/i, /\bthe\s+kids?\b/i],
  third_party: [/\b(teacher|doctor|lawyer|counselor|therapist)\b/i],
  situation: [/\bthe\s+(situation|schedule|plan|arrangement)\b/i, /\bit\s+is\b/i, /\bthis\s+is\b/i],
};

// Tense detection
const TENSE_PATTERNS = {
  past: [/\b(did|was|were|had|went|said|forgot|remembered)\b/i, /\blast\s+(time|week|month)\b/i],
  present: [/\b(is|are|am|do|does|'s|'re|'m)\b/i, /\bright\s+now\b/i],
  future: [/\b(will|going to|tomorrow|next\s+(time|week|month))\b/i],
};

/**
 * Determine sentence type
 * @param {string} text - Message text
 * @returns {string} Sentence type
 */
function detectSentenceType(text) {
  // Check in priority order

  // Threats are highest priority
  if (THREAT_PATTERNS.some(p => p.test(text))) {
    return 'threat';
  }

  // Demands next
  if (DEMAND_PATTERNS.some(p => p.test(text)) && !REQUEST_PATTERNS.some(p => p.test(text))) {
    return 'demand';
  }

  // Accusations
  if (ACCUSATION_PATTERNS.some(p => p.test(text))) {
    return 'accusation';
  }

  // Requests (polite) - check before questions since "Can we...?" is a request, not just a question
  if (REQUEST_PATTERNS.some(p => p.test(text))) {
    return 'request';
  }

  // Questions (non-request questions like "Why did you...?")
  if (QUESTION_PATTERNS.some(p => p.test(text))) {
    return 'question';
  }

  // Default to statement
  return 'statement';
}

/**
 * Determine target of the message
 * @param {string} text - Message text
 * @returns {string} Primary target
 */
function detectTarget(text) {
  const counts = {};

  for (const [target, patterns] of Object.entries(TARGET_PATTERNS)) {
    counts[target] = patterns.filter(p => p.test(text)).length;
  }

  // Find highest count
  const maxCount = Math.max(...Object.values(counts));
  if (maxCount === 0) return 'unclear';

  return Object.keys(counts).find(k => counts[k] === maxCount) || 'unclear';
}

/**
 * Determine tense of the message
 * @param {string} text - Message text
 * @returns {string} Primary tense
 */
function detectTense(text) {
  const counts = {};

  for (const [tense, patterns] of Object.entries(TENSE_PATTERNS)) {
    counts[tense] = patterns.filter(p => p.test(text)).length;
  }

  // Check if mixed
  const nonZero = Object.values(counts).filter(c => c > 0).length;
  if (nonZero > 1) return 'mixed';

  // Find highest count
  const maxCount = Math.max(...Object.values(counts));
  if (maxCount === 0) return 'present'; // Default

  return Object.keys(counts).find(k => counts[k] === maxCount) || 'present';
}

/**
 * Detect structure patterns in text
 * @param {string} text - Message text to analyze
 * @returns {Object} Pattern detection results
 */
function detect(text) {
  const sentenceType = detectSentenceType(text);
  const target = detectTarget(text);
  const tense = detectTense(text);

  // Check for concrete request/change
  const hasConcreteRequest =
    /\b(can|could|would)\s+(you|we)\s+\w+\s+(the|her|him|on|at|by)\b/i.test(text);
  const hasProposedChange =
    /\b(let's|how about|what if|could we|can we)\b/i.test(text) || /\bgoing forward\b/i.test(text);

  return {
    sentence_type: sentenceType,
    target: target,
    tense: tense,
    has_concrete_request: hasConcreteRequest,
    has_proposed_change: hasProposedChange,
    is_constructive: sentenceType === 'request' || sentenceType === 'question' || hasProposedChange,
  };
}

/**
 * Get summary observations for structure patterns
 * @param {Object} patterns - Pattern detection results
 * @returns {string[]} Array of factual observations
 */
function summarize(patterns) {
  const observations = [];

  // Sentence type observation
  const typeDescriptions = {
    accusation: 'Structured as accusation',
    question: 'Structured as question',
    request: 'Structured as polite request',
    statement: 'Structured as neutral statement',
    demand: 'Structured as demand/command',
    threat: 'Contains threat or ultimatum',
  };
  observations.push(typeDescriptions[patterns.sentence_type] || 'Structure unclear');

  // Target observation
  if (patterns.target === 'other_parent') {
    observations.push('Directed at the other parent');
  } else if (patterns.target === 'situation') {
    observations.push('Directed at the situation (not personal)');
  } else if (patterns.target === 'child') {
    observations.push('Focused on the child');
  }

  // Tense observation
  if (patterns.tense === 'past') {
    observations.push('Refers to past events');
  } else if (patterns.tense === 'future') {
    observations.push('Future-oriented');
  }

  // Constructive elements
  if (!patterns.has_concrete_request && patterns.sentence_type !== 'statement') {
    observations.push('No concrete request or proposed change');
  }
  if (patterns.has_proposed_change) {
    observations.push('Includes proposed change or solution');
  }

  return observations;
}

module.exports = {
  detect,
  summarize,
  detectSentenceType,
  detectTarget,
  detectTense,
  ACCUSATION_PATTERNS,
  REQUEST_PATTERNS,
  DEMAND_PATTERNS,
  THREAT_PATTERNS,
};
