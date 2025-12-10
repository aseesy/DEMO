/**
 * Primitive Mapper Module
 *
 * Maps tokens and markers to conceptual primitives:
 * - Speaker presence (I/me/my)
 * - Addressee presence (you/your)
 * - Third party references (children, others)
 * - Temporal focus (past/present/future)
 * - Epistemic stance (fact/interpretation)
 * - Domain (schedule/money/parenting/character/logistics)
 *
 * @module codeLayer/primitiveMapper
 * @version 1.0.0
 */

'use strict';

const { DOMAINS, TEMPORAL, EPISTEMIC } = require('./types');

// ============================================================================
// TEMPORAL DETECTION PATTERNS
// ============================================================================

/**
 * Past tense indicators
 */
const PAST_INDICATORS = new Set([
  'was', 'were', 'had', 'did', 'said', 'told', 'went', 'came',
  'forgot', 'missed', 'changed', 'cancelled', 'happened',
  'yesterday', 'last', 'ago', 'before', 'used to', 'back when',
  'previously', 'earlier', 'already', 'once'
]);

/**
 * Future tense indicators
 */
const FUTURE_INDICATORS = new Set([
  'will', 'would', 'shall', 'going to', 'gonna', 'plan to',
  'tomorrow', 'next', 'soon', 'later', 'upcoming', 'eventually',
  'about to', 'intend to', 'hope to', 'expect to'
]);

/**
 * Past tense verb endings
 */
const PAST_VERB_ENDINGS = ['ed', 'ought', 'ught'];

/**
 * Future tense patterns (regex)
 */
const FUTURE_PATTERNS = [
  /\bwill\s+\w+/gi,
  /\bgoing\s+to\s+\w+/gi,
  /\bplan\s+to\s+\w+/gi,
  /\babout\s+to\s+\w+/gi
];

// ============================================================================
// EPISTEMIC STANCE PATTERNS
// ============================================================================

/**
 * Fact indicators - statements presented as objective truth
 */
const FACT_INDICATORS = [
  /\b(she|he|they|it) (is|was|are|were|did|does|has|have|had)\b/gi,
  /\bthe (fact|truth|reality) is\b/gi,
  /\b(actually|clearly|obviously|definitely)\b/gi,
  /\b(happened|occurred|took place)\b/gi,
  /\bit's (true|false|a fact)\b/gi
];

/**
 * Interpretation indicators - statements presented as subjective
 */
const INTERPRETATION_INDICATORS = [
  /\bi (think|feel|believe|guess|suppose|assume)\b/gi,
  /\bit (seems|appears|looks like)\b/gi,
  /\b(maybe|perhaps|possibly|probably)\b/gi,
  /\bin my (opinion|view|experience)\b/gi,
  /\bi'm (worried|concerned|upset|frustrated)\b/gi,
  /\byou (seem|appear|look|sound)\b/gi,
  /\b(might|could|should|would) be\b/gi
];

// ============================================================================
// DOMAIN DETECTION PATTERNS
// ============================================================================

/**
 * Domain keyword sets for classification
 */
const DOMAIN_PATTERNS = {
  schedule: {
    keywords: new Set([
      'pickup', 'pick-up', 'drop-off', 'dropoff', 'custody', 'visitation',
      'weekend', 'weekday', 'holiday', 'vacation', 'overnight', 'time',
      'schedule', 'calendar', 'day', 'days', 'week', 'weeks',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'morning', 'afternoon', 'evening', 'night', 'tonight', 'tomorrow', 'today'
    ]),
    patterns: [
      /\b(pick|drop)\s*(up|off|her|him|them)\b/gi,
      /\b(my|your|our)\s*(time|day|weekend|week)\b/gi,
      /\bat\s+\d{1,2}(:\d{2})?\s*(am|pm|o'clock)?\b/gi
    ]
  },
  money: {
    keywords: new Set([
      'payment', 'pay', 'paid', 'money', 'expense', 'expenses', 'cost', 'costs',
      'support', 'child support', 'alimony', 'financial', 'afford',
      'bill', 'bills', 'fee', 'fees', 'tuition', 'insurance',
      'medical', 'dental', 'reimburse', 'reimbursement', 'split', 'owe'
    ]),
    patterns: [
      /\$\d+/gi,
      /\b\d+\s*(dollars|bucks)\b/gi,
      /\bchild\s*support\b/gi,
      /\b(pay|paid|paying)\s+(for|back|me|you)\b/gi
    ]
  },
  parenting: {
    keywords: new Set([
      'homework', 'school', 'discipline', 'bedtime', 'routine', 'rules',
      'behavior', 'behaviour', 'screen time', 'chores', 'responsibilities',
      'parenting', 'teaching', 'learning', 'boundaries', 'consequences',
      'teacher', 'grade', 'grades', 'project', 'assignment', 'education'
    ]),
    patterns: [
      /\b(her|his|their)\s*(homework|grades|behavior|routine|bedtime)\b/gi,
      /\b(at|in|from)\s*school\b/gi,
      /\bparent-teacher\b/gi
    ]
  },
  character: {
    keywords: new Set([
      'behavior', 'behaviour', 'attitude', 'personality', 'character',
      'trait', 'habit', 'habits', 'type', 'kind', 'person', 'selfish',
      'irresponsible', 'unreliable', 'lazy', 'controlling', 'manipulative'
    ]),
    patterns: [
      /\byou('re| are)\s+(always|never|so|such|the)\b/gi,
      /\byou('re| are)\s+a\s+\w+\s+(person|parent|father|mother)\b/gi,
      /\b(kind|type|sort)\s+of\s+(person|parent)\b/gi,
      /\byour\s+(attitude|behavior|personality|way)\b/gi
    ]
  },
  logistics: {
    keywords: new Set([
      'address', 'location', 'place', 'house', 'home', 'apartment',
      'car', 'drive', 'driving', 'travel', 'distance', 'miles',
      'passport', 'documents', 'paperwork', 'forms', 'sign', 'signed',
      'permission', 'consent', 'arrange', 'arrangements', 'plan', 'plans'
    ]),
    patterns: [
      /\b(sign|fill out|complete)\s+(the|this|that)\s+(form|document|paper)\b/gi,
      /\bpermission\s+(slip|form)\b/gi,
      /\b(pick|drop)\s*(up|off)\s+at\b/gi
    ]
  }
};

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

/**
 * Detect speaker presence from tokens
 * @param {Token[]} tokens - Tokenized message
 * @returns {boolean} - True if speaker (I/me/my) is present
 */
function detectSpeakerPresence(tokens) {
  return tokens.some(t => t.speaker);
}

/**
 * Detect addressee presence from tokens
 * @param {Token[]} tokens - Tokenized message
 * @returns {boolean} - True if addressee (you/your) is present
 */
function detectAddresseePresence(tokens) {
  return tokens.some(t => t.addressee);
}

/**
 * Detect third party references from tokens and context
 * @param {Token[]} tokens - Tokenized message
 * @param {string} text - Original message text
 * @param {string[]} childNames - Known child names from context
 * @returns {string[]} - Array of third party references
 */
function detectThirdParty(tokens, text, childNames = []) {
  const thirdParty = new Set();
  const textLower = text.toLowerCase();

  // Check tokens for third-party pronouns
  for (const token of tokens) {
    if (token.third_party) {
      thirdParty.add(token.word);
    }
    if (token.child_term) {
      thirdParty.add(token.word);
    }
  }

  // Check for known child names
  for (const name of childNames) {
    if (textLower.includes(name.toLowerCase())) {
      thirdParty.add(name.toLowerCase());
    }
  }

  // Check for generic child references
  const childPatterns = [
    /\bthe kid(s)?\b/gi,
    /\bour kid(s)?\b/gi,
    /\bthe child(ren)?\b/gi,
    /\bour child(ren)?\b/gi,
    /\bmy (daughter|son)\b/gi,
    /\byour (daughter|son)\b/gi,
    /\bour (daughter|son)\b/gi
  ];

  for (const pattern of childPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      thirdParty.add(match[0].toLowerCase());
    }
  }

  return Array.from(thirdParty);
}

/**
 * Detect temporal focus of the message
 * @param {Token[]} tokens - Tokenized message
 * @param {string} text - Original message text
 * @returns {'past'|'present'|'future'} - Temporal focus
 */
function detectTemporal(tokens, text) {
  const textLower = text.toLowerCase();
  let pastScore = 0;
  let futureScore = 0;

  // Check tokens for temporal indicators
  for (const token of tokens) {
    if (PAST_INDICATORS.has(token.word)) {
      pastScore++;
    }
    if (FUTURE_INDICATORS.has(token.word)) {
      futureScore++;
    }
    // Check verb endings
    for (const ending of PAST_VERB_ENDINGS) {
      if (token.word.endsWith(ending) && token.pos === 'verb') {
        pastScore++;
      }
    }
  }

  // Check for future patterns in text
  for (const pattern of FUTURE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(textLower)) {
      futureScore++;
    }
  }

  // Determine temporal focus
  if (futureScore > pastScore && futureScore > 0) {
    return TEMPORAL.FUTURE;
  }
  if (pastScore > futureScore && pastScore > 0) {
    return TEMPORAL.PAST;
  }
  return TEMPORAL.PRESENT;
}

/**
 * Detect epistemic stance (fact vs interpretation)
 * @param {string} text - Original message text
 * @param {Object} markers - Marker detection result
 * @returns {'fact'|'interpretation'|'unknown'} - Epistemic stance
 */
function detectEpistemic(text, markers = {}) {
  const textLower = text.toLowerCase();
  let factScore = 0;
  let interpretationScore = 0;

  // Check fact patterns
  for (const pattern of FACT_INDICATORS) {
    pattern.lastIndex = 0;
    if (pattern.test(textLower)) {
      factScore++;
    }
  }

  // Check interpretation patterns
  for (const pattern of INTERPRETATION_INDICATORS) {
    pattern.lastIndex = 0;
    if (pattern.test(textLower)) {
      interpretationScore++;
    }
  }

  // Softeners suggest interpretation
  if (markers.softeners && markers.softeners.length > 0) {
    interpretationScore += markers.softeners.length;
  }

  // Intensifiers with "you" suggest presenting interpretation as fact
  if (markers.intensifiers && markers.intensifiers.length > 0) {
    if (textLower.includes('you')) {
      factScore += markers.intensifiers.length;
    }
  }

  // Determine epistemic stance
  if (interpretationScore > factScore) {
    return EPISTEMIC.INTERPRETATION;
  }
  if (factScore > interpretationScore && factScore > 0) {
    return EPISTEMIC.FACT;
  }
  return EPISTEMIC.UNKNOWN;
}

/**
 * Detect primary domain of the message
 * @param {Token[]} tokens - Tokenized message
 * @param {string} text - Original message text
 * @returns {string} - Primary domain
 */
function detectDomain(tokens, text) {
  const textLower = text.toLowerCase();
  const domainScores = {};

  // Initialize scores
  for (const domain of Object.keys(DOMAIN_PATTERNS)) {
    domainScores[domain] = 0;
  }

  // Check tokens for domain keywords
  for (const token of tokens) {
    if (token.domain) {
      // Map token domains to our domain categories
      if (token.domain === 'child_education') {
        domainScores.parenting += 2;
      } else if (domainScores[token.domain] !== undefined) {
        domainScores[token.domain] += 2;
      }
    }

    // Check each domain's keywords
    for (const [domain, config] of Object.entries(DOMAIN_PATTERNS)) {
      if (config.keywords.has(token.word)) {
        domainScores[domain]++;
      }
    }
  }

  // Check domain patterns in text
  for (const [domain, config] of Object.entries(DOMAIN_PATTERNS)) {
    for (const pattern of config.patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(textLower)) !== null) {
        domainScores[domain] += 2;
      }
    }
  }

  // Find highest scoring domain
  let maxDomain = DOMAINS.GENERAL;
  let maxScore = 0;

  for (const [domain, score] of Object.entries(domainScores)) {
    if (score > maxScore) {
      maxScore = score;
      maxDomain = domain;
    }
  }

  // Only return specific domain if score is significant
  return maxScore >= 2 ? maxDomain : DOMAINS.GENERAL;
}

/**
 * Map tokens and markers to conceptual primitives
 *
 * @param {Token[]} tokens - Tokenized message
 * @param {Object} markers - Marker detection result
 * @param {Object} context - Parsing context
 * @param {string[]} [context.childNames] - Known child names
 * @param {string} text - Original message text
 * @returns {Object} - Conceptual primitives result
 *
 * @example
 * map(tokens, markers, { childNames: ["Emma"] }, "You need to change your behavior")
 * // Returns:
 * // {
 * //   conceptual: {
 * //     speaker: true,
 * //     addressee: true,
 * //     thirdParty: [],
 * //     temporal: "present",
 * //     epistemic: "interpretation",
 * //     domain: "character"
 * //   },
 * //   latencyMs: 5
 * // }
 */
function map(tokens, markers, context = {}, text = '') {
  const startTime = Date.now();

  // Handle empty input
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return {
      conceptual: {
        speaker: false,
        addressee: false,
        thirdParty: [],
        temporal: TEMPORAL.PRESENT,
        epistemic: EPISTEMIC.UNKNOWN,
        domain: DOMAINS.GENERAL
      },
      latencyMs: Date.now() - startTime
    };
  }

  const childNames = context.childNames || [];

  // Map all primitives
  const conceptual = {
    speaker: detectSpeakerPresence(tokens),
    addressee: detectAddresseePresence(tokens),
    thirdParty: detectThirdParty(tokens, text, childNames),
    temporal: detectTemporal(tokens, text),
    epistemic: detectEpistemic(text, markers),
    domain: detectDomain(tokens, text)
  };

  return {
    conceptual,
    latencyMs: Date.now() - startTime
  };
}

/**
 * Check if message has child involvement
 * @param {Object} conceptual - Conceptual primitives
 * @returns {boolean} - True if children are mentioned
 */
function hasChildInvolvement(conceptual) {
  if (!conceptual || !conceptual.third_party) return false;

  const childTerms = ['she', 'he', 'they', 'kids', 'children', 'child', 'daughter', 'son'];
  return conceptual.third_party.some(ref =>
    childTerms.some(term => ref.includes(term))
  );
}

/**
 * Check if message is character-focused (about the receiver as a person)
 * @param {Object} conceptual - Conceptual primitives
 * @returns {boolean} - True if character-focused
 */
function isCharacterFocused(conceptual) {
  return conceptual.domain === DOMAINS.CHARACTER && conceptual.addressee;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main function
  map,

  // Detection functions
  detectSpeakerPresence,
  detectAddresseePresence,
  detectThirdParty,
  detectTemporal,
  detectEpistemic,
  detectDomain,

  // Analysis helpers
  hasChildInvolvement,
  isCharacterFocused,

  // Pattern exports (for testing/extension)
  PAST_INDICATORS,
  FUTURE_INDICATORS,
  FACT_INDICATORS,
  INTERPRETATION_INDICATORS,
  DOMAIN_PATTERNS
};
