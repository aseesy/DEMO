/**
 * AXIOM_D002: Clean Information
 *
 * Pattern: Verifiable Fact + Relevant + No Pattern Markers
 *
 * Pure information sharing about child-related logistics without
 * hidden criticism or manipulation.
 *
 * Examples:
 * - "Practice is at 5pm on Tuesday"
 * - "Her dentist appointment is scheduled for March 15th"
 * - "The school conference is next Thursday at 4pm"
 * - "She has a project due on Friday"
 *
 * Clean axioms indicate safe, constructive communication that can pass
 * without AI intervention.
 *
 * @module axioms/clean/cleanInformation
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

const id = 'AXIOM_D002';
const name = 'Clean Information';
const category = AXIOM_CATEGORIES.CLEAN;
const description = 'Pure factual information sharing about child logistics';
const pattern = '[Activity/Event] + [Time/Date/Location]';

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

/**
 * Information-sharing intro patterns
 */
const INFO_INTROS = [
  /\bjust\s+(so\s+you\s+know|letting\s+you\s+know|fyi)\b/gi,
  /\bheads\s+up\b/gi,
  /\bfor\s+your\s+information\b/gi,
  /\bi\s+wanted\s+to\s+(let\s+you\s+know|inform\s+you|tell\s+you)\b/gi,
  /\breminder\b/gi,
  /\bjust\s+a\s+(quick\s+)?note\b/gi,
];

/**
 * Event/activity patterns
 */
const EVENT_PATTERNS = [
  /\b(practice|game|match|recital|performance|concert)\b/gi,
  /\b(appointment|checkup|dentist|doctor|therapy)\b/gi,
  /\b(conference|meeting|open\s+house)\b/gi,
  /\b(project|assignment|homework|test|exam)\b/gi,
  /\b(birthday|party|playdate|sleepover)\b/gi,
  /\b(class|lesson|tutoring|camp)\b/gi,
  /\b(school|daycare|preschool)\b/gi,
];

/**
 * Time/date/location patterns
 */
const TIME_DATE_PATTERNS = [
  /\bat\s+\d{1,2}(:\d{2})?\s*(am|pm|o'clock)?\b/gi,
  /\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/gi,
  /\b\d{1,2}\/\d{1,2}\b/gi, // Date format 3/15
  /\b(tomorrow|today|tonight|this\s+weekend|next\s+week)\b/gi,
  /\bfrom\s+\d+\s*(am|pm)?\s*(to|until|-)\s*\d+\s*(am|pm)?\b/gi,
  /\b(at|in)\s+(the\s+)?(school|gym|office|park|field|center)\b/gi,
];

/**
 * Third-person verbs indicating factual reporting (not accusatory)
 */
const FACTUAL_VERBS = [
  /\b(she|he|they)\s+(has|have|is|are)\b/gi,
  /\b(her|his|their)\s+(appointment|practice|game|class)\b/gi,
  /\bis\s+(scheduled|planned|set)\b/gi,
  /\bis\s+(at|on|due)\b/gi,
  /\bwill\s+be\b/gi,
  /\bstarts\s+(at|on)\b/gi,
];

/**
 * Disqualifying patterns
 */
const DISQUALIFIERS = [
  /\byou\s+(always|never)\b/gi,
  /\byour\s+fault\b/gi,
  /\bbecause\s+(of\s+)?you\b/gi,
  /\b(again|as\s+usual)\b/gi,
  /\b(she|he|they)\s+(said|told)\s+.*(you|your)\b/gi, // Child as messenger
  /\bif\s+you\s+(had|hadn't|would|wouldn't)\b/gi, // Conditional blame
  /\bunlike\s+you\b/gi,
  /\bwhy\s+(can't|don't|won't)\s+you\b/gi,
];

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Find info intro patterns
 * @param {string} text - Message text
 * @returns {string[]} - Info intros found
 */
function findInfoIntros(text) {
  const intros = [];
  const textLower = text.toLowerCase();

  for (const pattern of INFO_INTROS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      intros.push(match[0].trim());
    }
  }

  return intros;
}

/**
 * Find event patterns
 * @param {string} text - Message text
 * @returns {string[]} - Events found
 */
function findEventPatterns(text) {
  const events = [];
  const textLower = text.toLowerCase();

  for (const pattern of EVENT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      events.push(match[0].trim());
    }
  }

  return events;
}

/**
 * Find time/date patterns
 * @param {string} text - Message text
 * @returns {string[]} - Time/date patterns found
 */
function findTimeDatePatterns(text) {
  const timeDates = [];
  const textLower = text.toLowerCase();

  for (const pattern of TIME_DATE_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      timeDates.push(match[0].trim());
    }
  }

  return timeDates;
}

/**
 * Find factual verb patterns
 * @param {string} text - Message text
 * @returns {string[]} - Factual verbs found
 */
function findFactualVerbs(text) {
  const verbs = [];
  const textLower = text.toLowerCase();

  for (const pattern of FACTUAL_VERBS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      verbs.push(match[0].trim());
    }
  }

  return verbs;
}

/**
 * Find disqualifying patterns
 * @param {string} text - Message text
 * @returns {string[]} - Disqualifiers found
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

  // Event/activity is key
  if (evidence.events.length > 0) confidence += 35;

  // Time/date/location adds specificity
  if (evidence.time_dates.length > 0) confidence += 35;

  // Info intro adds clarity of intent
  if (evidence.info_intros.length > 0) confidence += 15;

  // Factual verbs indicate neutral tone
  if (evidence.factual_verbs.length > 0) confidence += 15;

  return Math.min(100, confidence);
}

// ============================================================================
// MAIN CHECK FUNCTION
// ============================================================================

/**
 * Check if AXIOM_D002 fires for this message
 *
 * @param {Object} parsed - Partial ParsedMessage
 * @param {Object} context - Parsing context
 * @returns {Object} - AxiomResult
 */
function check(parsed, context = {}) {
  const text = parsed.raw || '';

  // Gather evidence
  const evidence = {
    info_intros: findInfoIntros(text),
    events: findEventPatterns(text),
    time_dates: findTimeDatePatterns(text),
    factual_verbs: findFactualVerbs(text),
    disqualifiers: findDisqualifiers(text),
  };

  // Check disqualifiers first
  if (evidence.disqualifiers.length > 0) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Must have at least event OR time/date (preferably both)
  if (evidence.events.length === 0 && evidence.time_dates.length === 0) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Calculate confidence
  const confidence = calculateConfidence(evidence);

  // High threshold for clean axiom
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
      event: evidence.events[0] || null,
      time_date: evidence.time_dates[0] || null,
      intro: evidence.info_intros[0] || null,
      trigger_phrase: triggerPhrase,
      all_evidence: evidence,
    },
    'Pure factual information about child activities. Safe to transmit.'
  );
}

/**
 * Build trigger phrase from evidence
 */
function buildTriggerPhrase(evidence) {
  const parts = [];
  if (evidence.events[0]) parts.push(evidence.events[0]);
  if (evidence.time_dates[0]) parts.push(evidence.time_dates[0]);
  return parts.join(' @ ') || 'factual information';
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
  findInfoIntros,
  findEventPatterns,
  findTimeDatePatterns,
  findFactualVerbs,
  findDisqualifiers,
  calculateConfidence,
};
