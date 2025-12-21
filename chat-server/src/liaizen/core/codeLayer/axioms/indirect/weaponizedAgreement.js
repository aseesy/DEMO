/**
 * AXIOM_004: Weaponized Agreement
 *
 * Pattern: Agreement + "But" + [Negative State/Accusation]
 *
 * Appears to agree or be reasonable, but uses the agreement as a setup
 * to deliver criticism. The "but" negates the agreement.
 *
 * Examples:
 * - "I agree we should be consistent, but you never follow through"
 * - "I understand you're busy, but the kids need a reliable parent"
 * - "I know I'm not perfect, but at least I..."
 *
 * Intent vs Impact Delta:
 * - Sender's claimed intent: "I'm being reasonable and acknowledging your point"
 * - Receiver's experience: "You just used fake agreement to attack me"
 *
 * @module axioms/indirect/weaponizedAgreement
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

const id = 'AXIOM_004';
const name = 'Weaponized Agreement';
const category = AXIOM_CATEGORIES.INDIRECT_COMMUNICATION;
const description = 'Uses apparent agreement as setup for criticism';
const pattern = '[Agreement] + "but" + [Criticism/Accusation]';

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

/**
 * Agreement patterns (before the "but")
 */
const AGREEMENT_PATTERNS = [
  /\bi\s+agree\b/gi,
  /\bi\s+understand\b/gi,
  /\bi\s+know\b/gi,
  /\bi\s+get\s+(it|that)\b/gi,
  /\bi\s+hear\s+you\b/gi,
  /\byou('re| are)\s+right\b/gi,
  /\bthat's\s+(true|fair|valid)\b/gi,
  /\bi\s+see\s+(your|the)\s+point\b/gi,
  /\bi\s+appreciate\b/gi,
  /\bi'm\s+not\s+(saying|trying)\b/gi,
  /\bsure\b/gi,
  /\bof\s+course\b/gi,
  /\bi\s+admit\b/gi,
  /\bi'm\s+willing\b/gi,
];

/**
 * Contrast markers that negate the agreement
 */
const CONTRAST_MARKERS = [
  /\bbut\b/gi,
  /\bhowever\b/gi,
  /\balthough\b/gi,
  /\bthough\b/gi,
  /\byet\b/gi,
  /\bstill\b/gi,
  /\bnevertheless\b/gi,
  /\bnonetheless\b/gi,
];

/**
 * Criticism patterns (after the "but")
 */
const CRITICISM_PATTERNS = [
  /\byou\s+(always|never)\b/gi,
  /\byou\s+(don't|can't|won't|didn't)\b/gi,
  /\byou\s+(should|need to|have to)\b/gi,
  /\byou('re| are)\s+(not|never)\b/gi,
  /\bat\s+least\s+i\b/gi,
  /\bunlike\s+you\b/gi,
  /\bi\s+would\s+never\b/gi,
  /\bthe\s+(kids?|children?)\s+(need|deserve)\b/gi,
  /\byour\b/gi, // Often followed by criticism
];

/**
 * Negative intensifiers (after the "but")
 */
const NEGATIVE_INTENSIFIERS = [
  'always',
  'never',
  'nothing',
  'no one',
  'nobody',
  'constantly',
  'repeatedly',
  'again',
  'every time',
];

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Find agreement statements in text
 * @param {string} text - Message text
 * @returns {string[]} - Agreement phrases found
 */
function findAgreementPhrases(text) {
  const phrases = [];
  const textLower = text.toLowerCase();

  for (const pattern of AGREEMENT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      phrases.push(match[0].trim());
    }
  }

  return phrases;
}

/**
 * Find contrast marker and split text
 * @param {string} text - Message text
 * @returns {Object|null} - { marker, before, after } or null
 */
function findContrastSplit(text) {
  const textLower = text.toLowerCase();

  for (const pattern of CONTRAST_MARKERS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(textLower);
    if (match) {
      const index = match.index;
      return {
        marker: match[0].trim(),
        before: text.substring(0, index).trim(),
        after: text.substring(index + match[0].length).trim(),
      };
    }
  }

  return null;
}

/**
 * Find criticism patterns in text
 * @param {string} text - Message text
 * @returns {string[]} - Criticism phrases found
 */
function findCriticismPhrases(text) {
  const phrases = [];
  const textLower = text.toLowerCase();

  for (const pattern of CRITICISM_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      phrases.push(match[0].trim());
    }
  }

  return phrases;
}

/**
 * Check for negative intensifiers in text
 * @param {string} text - Message text
 * @returns {string[]} - Intensifiers found
 */
function findNegativeIntensifiers(text) {
  const found = [];
  const textLower = text.toLowerCase();

  for (const intensifier of NEGATIVE_INTENSIFIERS) {
    if (textLower.includes(intensifier)) {
      found.push(intensifier);
    }
  }

  return found;
}

/**
 * Calculate confidence score
 * @param {Object} evidence - Detection evidence
 * @returns {number} - Confidence score (0-100)
 */
function calculateConfidence(evidence) {
  let confidence = 0;

  // Base: Agreement before + Contrast marker + Criticism after
  if (evidence.agreement_phrases.length > 0) confidence += 25;
  if (evidence.contrast_marker) confidence += 25;
  if (evidence.criticism_phrases.length > 0) confidence += 25;

  // Bonus for pattern markers in the "after" section
  if (evidence.after_intensifiers.length > 0) confidence += 15;

  // Bonus for multiple criticism patterns
  if (evidence.criticism_phrases.length > 1) confidence += 10;

  return Math.min(100, confidence);
}

// ============================================================================
// MAIN CHECK FUNCTION
// ============================================================================

/**
 * Check if AXIOM_004 fires for this message
 *
 * @param {Object} parsed - Partial ParsedMessage
 * @param {Object} context - Parsing context
 * @returns {Object} - AxiomResult
 */
function check(parsed, context = {}) {
  const text = parsed.raw || '';

  // Step 1: Find contrast split (the "but")
  const contrastSplit = findContrastSplit(text);
  if (!contrastSplit) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Step 2: Find agreement before the "but"
  const agreementPhrases = findAgreementPhrases(contrastSplit.before);

  // Step 3: Find criticism after the "but"
  const criticismPhrases = findCriticismPhrases(contrastSplit.after);
  const afterIntensifiers = findNegativeIntensifiers(contrastSplit.after);

  // Build evidence
  const evidence = {
    agreement_phrases: agreementPhrases,
    contrast_marker: contrastSplit.marker,
    before_text: contrastSplit.before,
    after_text: contrastSplit.after,
    criticism_phrases: criticismPhrases,
    after_intensifiers: afterIntensifiers,
  };

  // Must have agreement AND criticism
  if (agreementPhrases.length === 0 || criticismPhrases.length === 0) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Calculate confidence
  const confidence = calculateConfidence(evidence);

  // Must have minimum confidence to fire
  if (confidence < 70) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Build trigger phrase
  const triggerPhrase = `"${agreementPhrases[0]}" ... ${contrastSplit.marker} ... "${criticismPhrases[0]}"`;

  // Build intent vs impact delta
  const intentImpactDelta = buildIntentImpactDelta(evidence);

  return createFiringAxiomResult(
    id,
    name,
    category,
    confidence,
    {
      agreement: agreementPhrases[0],
      contrast_marker: contrastSplit.marker,
      criticism: criticismPhrases[0],
      trigger_phrase: triggerPhrase,
      before_text: contrastSplit.before,
      after_text: contrastSplit.after,
      all_evidence: evidence,
    },
    intentImpactDelta
  );
}

/**
 * Build intent vs impact delta explanation
 */
function buildIntentImpactDelta(evidence) {
  return (
    `Opens with apparent agreement ("${evidence.agreement_phrases[0]}") ` +
    `but uses "${evidence.contrast_marker}" to pivot to criticism. ` +
    `The agreement is rhetorical - it doesn't reflect genuine understanding, ` +
    `it sets up the attack. Receiver will feel the agreement was fake.`
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
  findAgreementPhrases,
  findContrastSplit,
  findCriticismPhrases,
  findNegativeIntensifiers,
  calculateConfidence,
};
