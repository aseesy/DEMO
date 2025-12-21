/**
 * AXIOM_010: Child as Messenger
 *
 * Pattern: Sender quotes child's negative view/experience of receiver
 *
 * Uses the child's voice to deliver criticism, creating plausible deniability
 * ("I'm just telling you what she said"). This is triangulation.
 *
 * Examples:
 * - "She said you forgot to pick her up again"
 * - "He told me you yelled at him"
 * - "The kids said they don't want to go to your house"
 * - "Emma mentioned you didn't help with homework"
 *
 * Intent vs Impact Delta:
 * - Sender's claimed intent: "I'm just relaying what the child said"
 * - Receiver's experience: "You're using our child to attack me"
 *
 * @module axioms/indirect/childAsMessenger
 * @version 1.0.0
 */

'use strict';

const {
  AXIOM_CATEGORIES,
  createFiringAxiomResult,
  createNonFiringAxiomResult,
} = require('../../types');

// ============================================================================
// AXIOM METADATA
// ============================================================================

const id = 'AXIOM_010';
const name = 'Child as Messenger';
const category = AXIOM_CATEGORIES.INDIRECT_COMMUNICATION;
const description = "Uses child's voice to deliver criticism of receiver";
const pattern = '[Child] + [said/told] + [Negative about Receiver]';

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

/**
 * Child reference patterns
 */
const CHILD_REFERENCES = [
  /\b(she|he|they)\b/gi,
  /\b(the\s+)?(kids?|children?|daughter|son)\b/gi,
  /\b(our|my|your)\s+(daughter|son|child|kids?|children?)\b/gi,
];

/**
 * Reporting verb patterns (child said/told/mentioned)
 */
const REPORTING_VERBS = [
  /\b(she|he|they)\s+(said|told|mentioned|asked|complained|cried|was\s+saying)\b/gi,
  /\b(the\s+)?(kids?|children?)\s+(said|told|mentioned|asked|complained)\b/gi,
  /\baccording\s+to\s+(her|him|them|the\s+kids?)\b/gi,
  /\b(she|he|they)\s+told\s+me\b/gi,
  /\b(she|he|they)\s+(said|says)\s+that\b/gi,
];

/**
 * Negative content about receiver patterns
 */
const NEGATIVE_RECEIVER_CONTENT = [
  /\byou\s+(forgot|yelled|screamed|didn't|don't|won't|wouldn't|can't|never)\b/gi,
  /\byou\s+didn't\s+(help|pick|call|come|show)\b/gi,
  /\byou\s+weren't\s+(there|home|listening)\b/gi,
  /\b(don't|doesn't)\s+want\s+to\s+(go|stay|be)\s+(to|at|with)\s+(your|you)\b/gi,
  /\b(scared|afraid|worried)\s+(of|about)\s+you\b/gi,
  /\byour\s+(house|place)\b/gi,
  /\bwith\s+you\b/gi,
  /\byou\s+always\b/gi,
  /\byou\s+never\b/gi,
];

/**
 * Direct quote indicators
 */
const QUOTE_INDICATORS = [/["']/g, /\bthat\s+you\b/gi, /\bwhy\s+you\b/gi];

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Find child references in text
 * @param {string} text - Message text
 * @returns {string[]} - Child references found
 */
function findChildReferences(text) {
  const refs = new Set();
  const textLower = text.toLowerCase();

  for (const pattern of CHILD_REFERENCES) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      refs.add(match[0].trim());
    }
  }

  return Array.from(refs);
}

/**
 * Find reporting verbs (child said/told)
 * @param {string} text - Message text
 * @returns {string[]} - Reporting verb phrases found
 */
function findReportingVerbs(text) {
  const verbs = [];
  const textLower = text.toLowerCase();

  for (const pattern of REPORTING_VERBS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      verbs.push(match[0].trim());
    }
  }

  return verbs;
}

/**
 * Find negative content about receiver
 * @param {string} text - Message text
 * @returns {string[]} - Negative content phrases found
 */
function findNegativeReceiverContent(text) {
  const content = [];
  const textLower = text.toLowerCase();

  for (const pattern of NEGATIVE_RECEIVER_CONTENT) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      content.push(match[0].trim());
    }
  }

  return content;
}

/**
 * Check for quote indicators
 * @param {string} text - Message text
 * @returns {boolean} - True if quotes present
 */
function hasQuoteIndicators(text) {
  const textLower = text.toLowerCase();

  for (const pattern of QUOTE_INDICATORS) {
    pattern.lastIndex = 0;
    if (pattern.test(textLower)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate confidence score
 * @param {Object} evidence - Detection evidence
 * @returns {number} - Confidence score (0-100)
 */
function calculateConfidence(evidence) {
  let confidence = 0;

  // Core elements
  if (evidence.child_references.length > 0) confidence += 25;
  if (evidence.reporting_verbs.length > 0) confidence += 30;
  if (evidence.negative_content.length > 0) confidence += 30;

  // Bonus for quote indicators (stronger triangulation signal)
  if (evidence.has_quotes) confidence += 10;

  // Bonus for multiple negative content
  if (evidence.negative_content.length > 1) confidence += 5;

  return Math.min(100, confidence);
}

// ============================================================================
// MAIN CHECK FUNCTION
// ============================================================================

/**
 * Check if AXIOM_010 fires for this message
 *
 * @param {Object} parsed - Partial ParsedMessage
 * @param {Object} context - Parsing context
 * @returns {Object} - AxiomResult
 */
function check(parsed, context = {}) {
  const text = parsed.raw || '';

  // Gather evidence
  const evidence = {
    child_references: findChildReferences(text),
    reporting_verbs: findReportingVerbs(text),
    negative_content: findNegativeReceiverContent(text),
    has_quotes: hasQuoteIndicators(text),
  };

  // Must have reporting verb (the key pattern)
  if (evidence.reporting_verbs.length === 0) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Must have negative content about receiver
  if (evidence.negative_content.length === 0) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Calculate confidence
  const confidence = calculateConfidence(evidence);

  // Must have minimum confidence to fire
  if (confidence < 75) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Build trigger phrase
  const triggerPhrase = `${evidence.reporting_verbs[0]} ... ${evidence.negative_content[0]}`;

  // Build intent vs impact delta
  const intentImpactDelta = buildIntentImpactDelta(evidence);

  return createFiringAxiomResult(
    id,
    name,
    category,
    confidence,
    {
      child_mentioned: evidence.child_references[0] || 'child',
      reporting_verb: evidence.reporting_verbs[0],
      negative_content: evidence.negative_content[0],
      trigger_phrase: triggerPhrase,
      all_evidence: evidence,
    },
    intentImpactDelta
  );
}

/**
 * Build intent vs impact delta explanation
 */
function buildIntentImpactDelta(evidence) {
  const reportingVerb = evidence.reporting_verbs[0] || 'said';

  return (
    `Frames criticism as child's words ("${reportingVerb}") rather than sender's opinion. ` +
    `This is triangulation - using the child as a messenger to deliver blame. ` +
    `The child is put in the middle, and the receiver can't defend without seeming to dismiss the child.`
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Metadata
  id,
  name,
  category,
  description,
  pattern,

  // Main function
  check,

  // Helpers (for testing)
  findChildReferences,
  findReportingVerbs,
  findNegativeReceiverContent,
  hasQuoteIndicators,
  calculateConfidence,
};
