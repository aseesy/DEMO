/**
 * AXIOM_001: Displaced Accusation
 *
 * Pattern: Reports [negative state] of [Child] + Linked to [Receiver Domain] + [Softener]
 *
 * Uses the child's negative emotional state to imply blame toward the receiver,
 * while maintaining plausible deniability ("I'm just telling you how she feels").
 *
 * Example: "She's been upset since you changed the schedule"
 * - Child reference: "She"
 * - Negative state: "upset"
 * - Receiver link: "since you changed"
 * - High deniability: Can claim "I'm just sharing information"
 *
 * Intent vs Impact Delta:
 * - Sender's claimed intent: "I'm sharing important information about our child"
 * - Receiver's experience: "You're blaming me for our child's feelings"
 *
 * @module axioms/indirect/displacedAccusation
 * @version 1.0.0
 */

'use strict';

const { AXIOM_CATEGORIES, createFiringAxiomResult, createNonFiringAxiomResult } = require('../../types');

// ============================================================================
// AXIOM METADATA
// ============================================================================

const id = 'AXIOM_001';
const name = 'Displaced Accusation';
const category = AXIOM_CATEGORIES.INDIRECT_COMMUNICATION;
const description = 'Uses child\'s negative state to imply blame toward receiver';
const pattern = '[Negative Child State] + [Receiver Link] + [Optional Softener]';

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

/**
 * Child reference patterns (pronouns and terms)
 */
const CHILD_REFERENCES = [
  /\b(she|he|they)\b/gi,
  /\b(she's|he's|they're|she has|he has|they have)\b/gi,
  /\b(the\s+)?(kids?|children?|daughter|son)\b/gi,
  /\b(our|my|your)\s+(daughter|son|child|kids?|children?)\b/gi
];

/**
 * Negative emotional states
 */
const NEGATIVE_STATES = [
  'upset', 'sad', 'unhappy', 'worried', 'anxious', 'stressed',
  'crying', 'crying', 'struggling', 'confused', 'scared', 'afraid',
  'angry', 'frustrated', 'disappointed', 'hurt', 'lonely', 'depressed',
  'withdrawn', 'quiet', 'not herself', 'not himself', 'acting out',
  'having trouble', 'having problems', 'not eating', 'not sleeping',
  'nightmares', 'clingy', 'acting different', 'not doing well'
];

/**
 * Receiver link patterns (connecting child's state to receiver's action)
 */
const RECEIVER_LINKS = [
  /\bsince\s+you\b/gi,
  /\bafter\s+you\b/gi,
  /\bbecause\s+(of\s+)?you\b/gi,
  /\bwhen\s+you\b/gi,
  /\bever\s+since\s+you\b/gi,
  /\bfollowing\s+your\b/gi,
  /\bdue\s+to\s+your\b/gi,
  /\bwith\s+your\b/gi,
  /\babout\s+your\b/gi,
  /\bat\s+your\s+(house|place)\b/gi
];

/**
 * Softener patterns (increase deniability)
 */
const SOFTENERS = [
  /\bi'm\s+just\b/gi,
  /\bjust\s+(thought|wanted|letting)\b/gi,
  /\bi\s+thought\s+you\s+should\s+know\b/gi,
  /\byou\s+should\s+know\b/gi,
  /\bi\s+wanted\s+to\s+(let\s+you\s+know|tell\s+you|share)\b/gi,
  /\bi\s+noticed\b/gi,
  /\bi'm\s+worried\b/gi,
  /\bi'm\s+concerned\b/gi
];

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Find child references in text
 * @param {string} text - Message text
 * @param {Object} conceptual - Conceptual primitives
 * @returns {string[]} - Child references found
 */
function findChildReferences(text, conceptual = {}) {
  const refs = new Set();
  const textLower = text.toLowerCase();

  // Check patterns
  for (const pattern of CHILD_REFERENCES) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      refs.add(match[0].trim());
    }
  }

  // Check conceptual third_party
  if (conceptual.third_party) {
    for (const ref of conceptual.third_party) {
      refs.add(ref);
    }
  }

  return Array.from(refs);
}

/**
 * Find negative states in text
 * @param {string} text - Message text
 * @returns {string[]} - Negative states found
 */
function findNegativeStates(text) {
  const states = [];
  const textLower = text.toLowerCase();

  for (const state of NEGATIVE_STATES) {
    if (textLower.includes(state)) {
      states.push(state);
    }
  }

  return states;
}

/**
 * Find receiver links in text
 * @param {string} text - Message text
 * @returns {string[]} - Receiver links found
 */
function findReceiverLinks(text) {
  const links = [];
  const textLower = text.toLowerCase();

  for (const pattern of RECEIVER_LINKS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      links.push(match[0].trim());
    }
  }

  return links;
}

/**
 * Find softeners in text
 * @param {string} text - Message text
 * @param {Object} markers - Marker detection result
 * @returns {string[]} - Softeners found
 */
function findSofteners(text, markers = {}) {
  const softeners = new Set();
  const textLower = text.toLowerCase();

  // Check patterns
  for (const pattern of SOFTENERS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      softeners.add(match[0].trim());
    }
  }

  // Include markers softeners
  if (markers.softeners) {
    for (const s of markers.softeners) {
      softeners.add(s);
    }
  }

  return Array.from(softeners);
}

/**
 * Calculate confidence score
 * @param {Object} evidence - Detection evidence
 * @returns {number} - Confidence score (0-100)
 */
function calculateConfidence(evidence) {
  let confidence = 0;

  // Base score: Must have all three core elements
  if (evidence.child_references.length > 0) confidence += 30;
  if (evidence.negative_states.length > 0) confidence += 30;
  if (evidence.receiver_links.length > 0) confidence += 25;

  // Bonus for softeners (indicates deniability framing)
  if (evidence.softeners.length > 0) confidence += 10;

  // Bonus for multiple negative states
  if (evidence.negative_states.length > 1) confidence += 5;

  return Math.min(100, confidence);
}

// ============================================================================
// MAIN CHECK FUNCTION
// ============================================================================

/**
 * Check if AXIOM_001 fires for this message
 *
 * @param {Object} parsed - Partial ParsedMessage
 * @param {Object} context - Parsing context
 * @returns {Object} - AxiomResult
 *
 * @example
 * check({ raw: "She's been upset since you changed the schedule", ... }, {})
 * // Returns: { fired: true, id: 'AXIOM_001', confidence: 90, ... }
 */
function check(parsed, context = {}) {
  const text = parsed.raw || '';

  // Gather evidence
  const evidence = {
    child_references: findChildReferences(text, parsed.conceptual),
    negative_states: findNegativeStates(text),
    receiver_links: findReceiverLinks(text),
    softeners: findSofteners(text, parsed.linguistic)
  };

  // All three core elements required
  const hasChildRef = evidence.child_references.length > 0;
  const hasNegativeState = evidence.negative_states.length > 0;
  const hasReceiverLink = evidence.receiver_links.length > 0;

  if (!hasChildRef || !hasNegativeState || !hasReceiverLink) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Calculate confidence
  const confidence = calculateConfidence(evidence);

  // Must have minimum confidence to fire
  if (confidence < 75) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Build trigger phrase (for explanation)
  const triggerPhrase = buildTriggerPhrase(evidence);

  // Build intent vs impact delta
  const intentImpactDelta = buildIntentImpactDelta(evidence);

  return createFiringAxiomResult(
    id,
    name,
    category,
    confidence,
    {
      child_mentioned: evidence.child_references[0],
      negative_state: evidence.negative_states[0],
      receiver_link: evidence.receiver_links[0],
      softener: evidence.softeners[0] || null,
      trigger_phrase: triggerPhrase,
      all_evidence: evidence
    },
    intentImpactDelta
  );
}

/**
 * Build trigger phrase from evidence
 */
function buildTriggerPhrase(evidence) {
  const parts = [];
  if (evidence.child_references[0]) parts.push(evidence.child_references[0]);
  if (evidence.negative_states[0]) parts.push(evidence.negative_states[0]);
  if (evidence.receiver_links[0]) parts.push(evidence.receiver_links[0]);
  return parts.join(' ... ');
}

/**
 * Build intent vs impact delta explanation
 */
function buildIntentImpactDelta(evidence) {
  const childRef = evidence.child_references[0] || 'the child';
  const negativeState = evidence.negative_states[0] || 'upset';

  return `Framed as concern for ${childRef}'s wellbeing (${negativeState}), ` +
    `but receiver will hear as blame for causing the child's emotional state. ` +
    `The child's feelings are being used to deliver a criticism.`;
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
  findNegativeStates,
  findReceiverLinks,
  findSofteners,
  calculateConfidence
};
