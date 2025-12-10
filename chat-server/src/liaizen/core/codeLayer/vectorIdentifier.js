/**
 * Vector Identifier Module
 *
 * Identifies the communication vector:
 * Sender → Receiver → Target via Instrument
 *
 * - Target: What is being attacked/addressed (character, competence, autonomy, parenting)
 * - Instrument: What is being used to deliver the message (child, money, schedule, third_party)
 * - Aim: What the sender is trying to accomplish (attack, control, inform, request, defend)
 *
 * @module codeLayer/vectorIdentifier
 * @version 1.0.0
 */

'use strict';

const { TARGETS, INSTRUMENTS, AIMS } = require('./types');

// ============================================================================
// TARGET DETECTION PATTERNS
// ============================================================================

/**
 * Character target patterns - attacks on who the person IS
 */
const CHARACTER_PATTERNS = [
  /\byou('re| are)\s+(so|such|always|never|the)\b/gi,
  /\byou('re| are)\s+a\s+\w+\b/gi,
  /\b(kind|type|sort)\s+of\s+(person|parent|father|mother)\b/gi,
  /\byour\s+(personality|character|attitude|way)\b/gi,
  /\byou\s+(seem|sound|act)\s+like\b/gi,
  /\b(selfish|irresponsible|unreliable|lazy|controlling|manipulative)\b/gi,
  /\byou\s+don't\s+care\b/gi,
  /\byou\s+only\s+(care|think)\s+about\s+(yourself|your)\b/gi
];

/**
 * Competence target patterns - attacks on what the person CAN DO
 */
const COMPETENCE_PATTERNS = [
  /\byou\s+(forgot|forget|missed|can't|couldn't|failed|messed up)\b/gi,
  /\byou\s+don't\s+(know|understand|remember)\b/gi,
  /\byou\s+never\s+(remember|follow through|do|finish)\b/gi,
  /\byou\s+(should|could)\s+have\b/gi,
  /\byou\s+weren't\s+able\b/gi,
  /\bincapable\b/gi,
  /\byou\s+can't\s+even\b/gi,
  /\byou\s+always\s+(mess up|screw up|drop the ball)\b/gi
];

/**
 * Autonomy target patterns - attacks on the person's right to decide
 */
const AUTONOMY_PATTERNS = [
  /\byou\s+(should|need to|have to|must|ought to)\b/gi,
  /\byou\s+can't\s+just\b/gi,
  /\byou\s+don't\s+get\s+to\b/gi,
  /\bi\s+(decide|say|determine)\b/gi,
  /\bit's\s+my\s+(decision|choice|call)\b/gi,
  /\byou\s+have\s+no\s+(right|say|choice)\b/gi,
  /\bi'll\s+(allow|let|permit)\b/gi,
  /\byou\s+need\s+my\s+(permission|approval)\b/gi
];

/**
 * Parenting target patterns - attacks on parenting ability
 */
const PARENTING_PATTERNS = [
  /\b(as|like)\s+a\s+(parent|father|mother|dad|mom)\b/gi,
  /\byour\s+parenting\b/gi,
  /\bparent\s+like\s+you\b/gi,
  /\b(good|bad|terrible|great)\s+(parent|father|mother|dad|mom)\b/gi,
  /\bthe\s+way\s+you\s+(raise|parent|discipline)\b/gi,
  /\byou\s+(let|allow|make)\s+(her|him|them)\b/gi,
  /\bat\s+your\s+house\b/gi,
  /\bwhen\s+(she's|he's|they're)\s+with\s+you\b/gi
];

// ============================================================================
// INSTRUMENT DETECTION PATTERNS
// ============================================================================

/**
 * Child as instrument patterns - using child to deliver message
 */
const CHILD_INSTRUMENT_PATTERNS = [
  /\b(she|he|they)\s+(said|told|asked|mentioned|wants|needs)\b/gi,
  /\b(the\s+)?(kids?|children?|daughter|son)\s+(said|told|wants|needs)\b/gi,
  /\baccording\s+to\s+(her|him|them|the kids)\b/gi,
  /\b(her|his|their)\s+(words|feelings|opinion)\b/gi,
  /\b(for|about)\s+(her|him|them|the kids?|children?)\b/gi,
  /\b(she|he|they)\s+(is|are|was|were)\s+(upset|sad|worried|anxious|confused)\b/gi,
  /\b(she's|he's|they're|she has|he has|they have)\s+(been\s+)?(upset|sad|worried|anxious|confused|crying|struggling)\b/gi,
  /\bwhat\s+(she|he|they)\s+(said|told me|wants)\b/gi,
  /\b(since|after|because|when)\s+you\b.*\b(she|he|they|kids?|children?)\b/gi,
  /\b(she|he|they|kids?|children?)\b.*\b(since|after|because|when)\s+you\b/gi
];

/**
 * Money as instrument patterns - using finances to deliver message
 */
const MONEY_INSTRUMENT_PATTERNS = [
  /\bchild\s*support\b/gi,
  /\b(pay|paid|payment|owe|owes|afford)\b/gi,
  /\$\d+/gi,
  /\b(expense|expenses|cost|costs|bill|bills|fees?)\b/gi,
  /\bfinancial(ly)?\b/gi,
  /\b(split|reimburse|contribute)\b/gi
];

/**
 * Schedule as instrument patterns - using time/custody to deliver message
 */
const SCHEDULE_INSTRUMENT_PATTERNS = [
  /\b(my|your)\s+(time|day|weekend|week|custody)\b/gi,
  /\b(pickup|drop-?off|visitation)\b/gi,
  /\b(schedule|calendar)\b/gi,
  /\bon\s+(my|your)\s+(days?|time)\b/gi,
  /\bduring\s+(my|your)\s+(time|custody)\b/gi
];

/**
 * Third party as instrument patterns - using others to deliver message
 */
const THIRD_PARTY_INSTRUMENT_PATTERNS = [
  /\b(my\s+)?(lawyer|attorney|therapist|counselor|mediator)\b/gi,
  /\b(teacher|doctor|coach)\s+(said|told|mentioned|thinks)\b/gi,
  /\beveryone\s+(knows|says|thinks)\b/gi,
  /\b(my\s+)?(mom|dad|mother|father|sister|brother|family)\s+(said|told|thinks)\b/gi,
  /\b(friends|neighbors|people)\s+(say|think|told)\b/gi
];

// ============================================================================
// AIM DETECTION PATTERNS
// ============================================================================

/**
 * Attack aim patterns - intent to hurt or blame
 */
const ATTACK_AIM_PATTERNS = [
  /\byou\s+(always|never)\b/gi,
  /\byour\s+fault\b/gi,
  /\bbecause\s+of\s+you\b/gi,
  /\bthanks\s+to\s+you\b/gi,
  /\byou('re| are)\s+(the\s+)?(worst|terrible|awful)\b/gi,
  /\bhow\s+could\s+you\b/gi,
  /\bwhat\s+were\s+you\s+thinking\b/gi
];

/**
 * Control aim patterns - intent to direct behavior
 */
const CONTROL_AIM_PATTERNS = [
  /\byou\s+(need to|have to|must|should|ought to)\b/gi,
  /\bi\s+(want|expect|need)\s+you\s+to\b/gi,
  /\byou\s+will\b/gi,
  /\byou('re| are)\s+going\s+to\b/gi,
  /\bmake\s+sure\s+you\b/gi,
  /\bi\s+(decide|say|determine|allow)\b/gi
];

/**
 * Inform aim patterns - intent to share information
 */
const INFORM_AIM_PATTERNS = [
  /\bjust\s+(so\s+you\s+know|letting\s+you\s+know|FYI)\b/gi,
  /\bi\s+wanted\s+to\s+(let\s+you\s+know|tell\s+you|inform\s+you)\b/gi,
  /\b(practice|game|appointment|event)\s+is\s+(at|on)\b/gi,
  /\bfor\s+your\s+information\b/gi,
  /\bheads\s+up\b/gi
];

/**
 * Request aim patterns - intent to ask for something
 */
const REQUEST_AIM_PATTERNS = [
  /\bcan\s+you\b/gi,
  /\bcould\s+you\b/gi,
  /\bwould\s+you\b/gi,
  /\bwill\s+you\b/gi,
  /\bplease\b/gi,
  /\bi\s+(need|want|would\s+like)\b/gi,
  /\bis\s+it\s+possible\b/gi,
  /\bwould\s+it\s+be\s+possible\b/gi
];

/**
 * Defend aim patterns - intent to protect or justify
 */
const DEFEND_AIM_PATTERNS = [
  /\bi\s+(didn't|don't|wasn't|haven't)\b/gi,
  /\bi\s+was\s+(just|only|trying)\b/gi,
  /\bthat's\s+not\s+(true|what|how)\b/gi,
  /\bi\s+never\s+(said|did|meant)\b/gi,
  /\byou('re| are)\s+(wrong|mistaken)\b/gi,
  /\bactually\b/gi,
  /\bto\s+be\s+(fair|clear|honest)\b/gi
];

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Count pattern matches in text
 * @param {string} text - Text to search
 * @param {RegExp[]} patterns - Array of regex patterns
 * @returns {number} - Number of matches
 */
function countPatternMatches(text, patterns) {
  let count = 0;
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
}

/**
 * Detect the target of the message
 * @param {Token[]} tokens - Tokenized message
 * @param {Object} conceptual - Conceptual primitives
 * @param {string} text - Original message text
 * @returns {string} - Target type
 */
function detectTarget(tokens, conceptual, text) {
  const textLower = text.toLowerCase();
  const scores = {
    [TARGETS.CHARACTER]: countPatternMatches(textLower, CHARACTER_PATTERNS),
    [TARGETS.COMPETENCE]: countPatternMatches(textLower, COMPETENCE_PATTERNS),
    [TARGETS.AUTONOMY]: countPatternMatches(textLower, AUTONOMY_PATTERNS),
    [TARGETS.PARENTING]: countPatternMatches(textLower, PARENTING_PATTERNS)
  };

  // Boost based on domain
  if (conceptual.domain === 'character') {
    scores[TARGETS.CHARACTER] += 2;
  }
  if (conceptual.domain === 'parenting') {
    scores[TARGETS.PARENTING] += 2;
  }

  // Find highest scoring target
  let maxTarget = TARGETS.UNCLEAR;
  let maxScore = 0;

  for (const [target, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxTarget = target;
    }
  }

  return maxScore > 0 ? maxTarget : TARGETS.UNCLEAR;
}

/**
 * Detect the instrument used to deliver the message
 * @param {Token[]} tokens - Tokenized message
 * @param {Object} conceptual - Conceptual primitives
 * @param {string} text - Original message text
 * @returns {string|null} - Instrument type or null
 */
function detectInstrument(tokens, conceptual, text) {
  const textLower = text.toLowerCase();
  const scores = {
    [INSTRUMENTS.CHILD]: countPatternMatches(textLower, CHILD_INSTRUMENT_PATTERNS),
    [INSTRUMENTS.MONEY]: countPatternMatches(textLower, MONEY_INSTRUMENT_PATTERNS),
    [INSTRUMENTS.SCHEDULE]: countPatternMatches(textLower, SCHEDULE_INSTRUMENT_PATTERNS),
    [INSTRUMENTS.THIRD_PARTY]: countPatternMatches(textLower, THIRD_PARTY_INSTRUMENT_PATTERNS)
  };

  // Boost based on third party references
  if (conceptual.third_party && conceptual.third_party.length > 0) {
    scores[INSTRUMENTS.CHILD] += conceptual.third_party.length;
  }

  // Boost based on domain
  if (conceptual.domain === 'money') {
    scores[INSTRUMENTS.MONEY] += 2;
  }
  if (conceptual.domain === 'schedule') {
    scores[INSTRUMENTS.SCHEDULE] += 2;
  }

  // Find highest scoring instrument
  let maxInstrument = null;
  let maxScore = 0;

  for (const [instrument, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxInstrument = instrument;
    }
  }

  // Only return if score is significant
  return maxScore >= 1 ? maxInstrument : null;
}

/**
 * Detect the aim (intent) of the message
 * @param {Token[]} tokens - Tokenized message
 * @param {Object} markers - Marker detection result
 * @param {string} text - Original message text
 * @returns {string} - Aim type
 */
function detectAim(tokens, markers, text) {
  const textLower = text.toLowerCase();
  const scores = {
    [AIMS.ATTACK]: countPatternMatches(textLower, ATTACK_AIM_PATTERNS),
    [AIMS.CONTROL]: countPatternMatches(textLower, CONTROL_AIM_PATTERNS),
    [AIMS.INFORM]: countPatternMatches(textLower, INFORM_AIM_PATTERNS),
    [AIMS.REQUEST]: countPatternMatches(textLower, REQUEST_AIM_PATTERNS),
    [AIMS.DEFEND]: countPatternMatches(textLower, DEFEND_AIM_PATTERNS)
  };

  // Boost attack score if pattern markers suggest it
  if (markers.pattern_markers) {
    const blameMarkers = markers.pattern_markers.filter(m =>
      m.type === 'blame' || m.type === 'global_statement' || m.type === 'character_attack'
    );
    scores[AIMS.ATTACK] += blameMarkers.length * 2;

    const evaluativeMarkers = markers.pattern_markers.filter(m =>
      m.type === 'evaluative'
    );
    scores[AIMS.CONTROL] += evaluativeMarkers.length;
  }

  // Boost based on intensifiers
  if (markers.intensifiers && markers.intensifiers.length > 0) {
    scores[AIMS.ATTACK] += markers.intensifiers.length;
  }

  // Boost inform if softeners and no attack patterns
  if (markers.softeners && markers.softeners.length > 0 && scores[AIMS.ATTACK] === 0) {
    scores[AIMS.INFORM]++;
  }

  // Find highest scoring aim
  let maxAim = AIMS.INFORM; // Default
  let maxScore = 0;

  for (const [aim, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxAim = aim;
    }
  }

  return maxAim;
}

/**
 * Identify the communication vector
 *
 * @param {Token[]} tokens - Tokenized message
 * @param {Object} conceptual - Conceptual primitives
 * @param {Object} markers - Marker detection result
 * @param {Object} context - Parsing context
 * @param {string} text - Original message text
 * @returns {Object} - Vector identification result
 *
 * @example
 * identify(tokens, conceptual, markers, { senderId: "alice", receiverId: "bob" }, "She said you forgot to pick her up again")
 * // Returns:
 * // {
 * //   vector: {
 * //     sender: "alice",
 * //     receiver: "bob",
 * //     target: "competence",
 * //     instrument: "child",
 * //     aim: "attack"
 * //   },
 * //   latencyMs: 8
 * // }
 */
function identify(tokens, conceptual, markers, context = {}, text = '') {
  const startTime = Date.now();

  // Handle empty input
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return {
      vector: {
        sender: context.senderId || 'unknown',
        receiver: context.receiverId || 'unknown',
        target: TARGETS.UNCLEAR,
        instrument: null,
        aim: AIMS.INFORM
      },
      latencyMs: Date.now() - startTime
    };
  }

  const vector = {
    sender: context.senderId || 'unknown',
    receiver: context.receiverId || 'unknown',
    target: detectTarget(tokens, conceptual, text),
    instrument: detectInstrument(tokens, conceptual, text),
    aim: detectAim(tokens, markers, text)
  };

  return {
    vector,
    latencyMs: Date.now() - startTime
  };
}

/**
 * Check if vector indicates child is being used as instrument
 * @param {Object} vector - Communication vector
 * @returns {boolean}
 */
function isChildAsInstrument(vector) {
  return vector.instrument === INSTRUMENTS.CHILD;
}

/**
 * Check if vector indicates hostile intent
 * @param {Object} vector - Communication vector
 * @returns {boolean}
 */
function isHostileVector(vector) {
  return (
    vector.aim === AIMS.ATTACK ||
    (vector.aim === AIMS.CONTROL && vector.target !== TARGETS.UNCLEAR)
  );
}

// Note: getVectorRiskLevel removed - unused

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main function
  identify,

  // Detection functions
  detectTarget,
  detectInstrument,
  detectAim,

  // Analysis helpers
  isChildAsInstrument,
  isHostileVector,
  // Note: getVectorRiskLevel removed - unused

  // Pattern exports (for testing/extension)
  CHARACTER_PATTERNS,
  COMPETENCE_PATTERNS,
  AUTONOMY_PATTERNS,
  PARENTING_PATTERNS,
  CHILD_INSTRUMENT_PATTERNS,
  MONEY_INSTRUMENT_PATTERNS,
  SCHEDULE_INSTRUMENT_PATTERNS,
  THIRD_PARTY_INSTRUMENT_PATTERNS,
  ATTACK_AIM_PATTERNS,
  CONTROL_AIM_PATTERNS,
  INFORM_AIM_PATTERNS,
  REQUEST_AIM_PATTERNS,
  DEFEND_AIM_PATTERNS
};
