/**
 * AXIOM_D001: Clean Request
 *
 * Pattern: Specific + Actionable + No Excessive Softeners/Intensifiers
 *
 * A constructive, clear request that:
 * - States what is needed
 * - Is specific (time, place, action)
 * - Doesn't include hidden criticism
 * - Uses respectful language
 *
 * Examples:
 * - "Can you pick her up at 3pm?"
 * - "Would you be able to take him to soccer practice on Saturday?"
 * - "Please sign the permission slip and send it back tomorrow"
 *
 * Clean axioms indicate safe, constructive communication that can pass
 * without AI intervention.
 *
 * @module axioms/clean/cleanRequest
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

const id = 'AXIOM_D001';
const name = 'Clean Request';
const category = AXIOM_CATEGORIES.CLEAN;
const description = 'Clear, specific, actionable request without hidden criticism';
const pattern = '[Request Verb] + [Specific Action] + [Time/Place] (Optional)';

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

/**
 * Request verb patterns
 */
const REQUEST_PATTERNS = [
  /\bcan\s+you\b/gi,
  /\bcould\s+you\b/gi,
  /\bwould\s+you\b/gi,
  /\bwill\s+you\b/gi,
  /\bplease\b/gi,
  /\bwould\s+you\s+be\s+able\b/gi,
  /\bis\s+it\s+possible\b/gi,
  /\bwould\s+it\s+be\s+possible\b/gi,
  /\bdo\s+you\s+mind\b/gi,
  /\bi\s+need\s+you\s+to\b/gi,
  /\bi('d| would)\s+appreciate\b/gi,
];

/**
 * Specific action verbs (co-parenting context)
 */
const ACTION_VERBS = [
  /\b(pick|pick\s+up|drop|drop\s+off|bring|take|get|give|send)\b/gi,
  /\b(sign|fill\s+out|complete|submit|return)\b/gi,
  /\b(call|text|email|contact|confirm)\b/gi,
  /\b(watch|supervise|help|assist)\b/gi,
  /\b(schedule|arrange|plan|book)\b/gi,
  /\b(pay|reimburse|split|cover)\b/gi,
];

/**
 * Time/place specificity indicators
 */
const SPECIFICITY_PATTERNS = [
  /\bat\s+\d{1,2}(:\d{2})?\s*(am|pm|o'clock)?\b/gi, // "at 3pm"
  /\b(on|by|before|after)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
  /\b(tomorrow|today|tonight|this\s+weekend)\b/gi,
  /\b(this|next|on)\s+(week|month)\b/gi,
  /\bfrom\s+\w+\s+(to|until)\s+\w+\b/gi, // "from 3 to 5"
  /\b\d{1,2}(:\d{2})?\s*(am|pm)\b/gi, // Just times like "3pm"
];

/**
 * Negative patterns that disqualify clean status
 */
const DISQUALIFIERS = [
  /\byou\s+(always|never)\b/gi,
  /\byou\s+(should|need\s+to|have\s+to|must)\b/gi,
  /\byour\s+fault\b/gi,
  /\bbecause\s+(of\s+)?you\b/gi,
  /\b(again|as\s+usual|like\s+always)\b/gi,
  /\bfor\s+once\b/gi,
  /\bwhy\s+(can't|don't|won't)\s+you\b/gi,
  /\b(she|he|they)\s+said\b/gi, // Child as messenger
];

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Find request patterns
 * @param {string} text - Message text
 * @returns {string[]} - Request phrases found
 */
function findRequestPatterns(text) {
  const requests = [];
  const textLower = text.toLowerCase();

  for (const pattern of REQUEST_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      requests.push(match[0].trim());
    }
  }

  return requests;
}

/**
 * Find action verbs
 * @param {string} text - Message text
 * @returns {string[]} - Action verbs found
 */
function findActionVerbs(text) {
  const actions = [];
  const textLower = text.toLowerCase();

  for (const pattern of ACTION_VERBS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      actions.push(match[0].trim());
    }
  }

  return actions;
}

/**
 * Find specificity indicators
 * @param {string} text - Message text
 * @returns {string[]} - Specificity indicators found
 */
function findSpecificityIndicators(text) {
  const specifics = [];
  const textLower = text.toLowerCase();

  for (const pattern of SPECIFICITY_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      specifics.push(match[0].trim());
    }
  }

  return specifics;
}

/**
 * Check for disqualifying patterns
 * @param {string} text - Message text
 * @returns {string[]} - Disqualifying patterns found
 */
function findDisqualifiers(text) {
  const disqualifiers = [];
  const textLower = text.toLowerCase();

  for (const pattern of DISQUALIFIERS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      disqualifiers.push(match[0].trim());
    }
  }

  return disqualifiers;
}

/**
 * Check if message is a question (more likely clean)
 * @param {string} text - Message text
 * @returns {boolean}
 */
function isQuestion(text) {
  return text.trim().endsWith('?');
}

/**
 * Calculate confidence score
 * @param {Object} evidence - Detection evidence
 * @returns {number} - Confidence score (0-100)
 */
function calculateConfidence(evidence) {
  // Disqualifiers immediately reduce confidence
  if (evidence.disqualifiers.length > 0) {
    return 0;
  }

  let confidence = 0;

  // Request pattern is key
  if (evidence.request_patterns.length > 0) confidence += 40;

  // Action verb adds clarity
  if (evidence.action_verbs.length > 0) confidence += 30;

  // Specificity adds value
  if (evidence.specificity_indicators.length > 0) confidence += 20;

  // Question format is typically cleaner
  if (evidence.is_question) confidence += 10;

  return Math.min(100, confidence);
}

// ============================================================================
// MAIN CHECK FUNCTION
// ============================================================================

/**
 * Check if AXIOM_D001 fires for this message
 *
 * @param {Object} parsed - Partial ParsedMessage
 * @param {Object} context - Parsing context
 * @returns {Object} - AxiomResult
 */
function check(parsed, context = {}) {
  const text = parsed.raw || '';

  // Gather evidence
  const evidence = {
    request_patterns: findRequestPatterns(text),
    action_verbs: findActionVerbs(text),
    specificity_indicators: findSpecificityIndicators(text),
    disqualifiers: findDisqualifiers(text),
    is_question: isQuestion(text),
  };

  // Check disqualifiers first
  if (evidence.disqualifiers.length > 0) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Must have request pattern
  if (evidence.request_patterns.length === 0) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Calculate confidence
  const confidence = calculateConfidence(evidence);

  // High threshold for clean axiom (we want to be sure)
  if (confidence < 70) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Build trigger phrase
  const triggerPhrase = buildTriggerPhrase(evidence);

  return createFiringAxiomResult(
    id,
    name,
    category,
    confidence,
    {
      request_type: evidence.request_patterns[0],
      action: evidence.action_verbs[0] || null,
      specificity: evidence.specificity_indicators[0] || null,
      is_question: evidence.is_question,
      trigger_phrase: triggerPhrase,
      all_evidence: evidence,
    },
    'Clear, specific request without hidden criticism. Safe to transmit.'
  );
}

/**
 * Build trigger phrase from evidence
 */
function buildTriggerPhrase(evidence) {
  const parts = [];
  if (evidence.request_patterns[0]) parts.push(evidence.request_patterns[0]);
  if (evidence.action_verbs[0]) parts.push(evidence.action_verbs[0]);
  if (evidence.specificity_indicators[0]) parts.push(evidence.specificity_indicators[0]);
  return parts.join(' + ');
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
  findRequestPatterns,
  findActionVerbs,
  findSpecificityIndicators,
  findDisqualifiers,
  isQuestion,
  calculateConfidence,
};
