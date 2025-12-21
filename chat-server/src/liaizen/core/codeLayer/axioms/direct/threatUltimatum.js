/**
 * AXIOM_D102: Threat / Ultimatum
 *
 * Pattern: Threat of negative consequence or ultimatum
 *
 * Uses threats to coerce compliance rather than expressing needs.
 * The receiver focuses on the threat, not on solving the problem.
 *
 * Examples:
 * - "or else we'll end up going back to court"
 * - "If you do that again, I'll..."
 * - "Do X or I'll call my lawyer"
 * - "You'll regret this"
 * - "Keep it up and see what happens"
 *
 * @module axioms/direct/threatUltimatum
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

const id = 'AXIOM_D102';
const name = 'Threat / Ultimatum';
const category = 'direct_hostility';
const description = 'Uses threats or ultimatums to coerce compliance';
const pattern = '[Condition] + [Negative Consequence] OR [Threat Phrase]';

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

/**
 * "Or else" / "Or I'll" patterns
 */
const OR_ELSE_PATTERNS = [
  /\bor\s+else\b/gi,
  /\bor\s+i('ll|'m\s+going\s+to|'m\s+gonna|will)\b/gi,
  /\bor\s+we('ll|'re\s+going\s+to|will)\b/gi,
  /\bor\s+(we'?ll|you'?ll)\s+(end\s+up|be|have\s+to|need\s+to)\b/gi,
];

/**
 * "If you... I'll/we'll" conditional threats
 */
const CONDITIONAL_THREAT_PATTERNS = [
  /\bif\s+you\s+.{1,30}\s+i('ll|'m\s+going\s+to|will)\b/gi,
  /\bif\s+you\s+.{1,30}\s+we('ll|'re\s+going\s+to|will)\b/gi,
  /\bif\s+you\s+(don'?t|do\s+not|keep|continue)\b.{1,50}\b(court|lawyer|attorney|police|cops|custody)\b/gi,
];

/**
 * Legal/custody threat patterns
 */
const LEGAL_THREAT_PATTERNS = [
  /\b(going\s+)?(back\s+)?to\s+court\b/gi,
  /\b(call|contact|get|hire)\s+(my\s+)?(lawyer|attorney)\b/gi,
  /\b(full\s+)?custody\b.{0,20}\b(take|get|fight\s+for|going\s+to)\b/gi,
  /\b(take|get|fight\s+for|going\s+to).{0,20}\b(full\s+)?custody\b/gi,
  /\bmodify\s+(the\s+)?custody\b/gi,
  /\breport\s+(you|this)\s+to\b/gi,
];

/**
 * Direct threat phrases
 */
const THREAT_PHRASES = [
  /\byou('?ll|'?re\s+going\s+to|will)\s+regret\b/gi,
  /\bkeep\s+it\s+up\b/gi,
  /\bsee\s+what\s+happens\b/gi,
  /\bwatch\s+(what\s+happens|yourself|out)\b/gi,
  /\byou('?ve|'?ll)\s+been\s+warned\b/gi,
  /\bdon'?t\s+test\s+me\b/gi,
  /\bdon'?t\s+push\s+me\b/gi,
  /\bi\s+won'?t\s+hesitate\b/gi,
  /\bi('?m|'ll\s+be)\s+documenting\b/gi,
  /\bthis\s+is\s+(being\s+)?documented\b/gi,
  /\bi('?m|\s+am)\s+keeping\s+records\b/gi,
];

/**
 * Consequence indicators (strengthen threat detection)
 */
const CONSEQUENCE_INDICATORS = [
  /\b(neither\s+of\s+us\s+want|you\s+don'?t\s+want)\b/gi,
  /\bwaste\s+of\s+(time|money)\b/gi,
  /\bpunish\b/gi,
];

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

function findOrElsePatterns(text) {
  const matches = [];
  const textLower = text.toLowerCase();

  for (const pattern of OR_ELSE_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      matches.push(match[0].trim());
    }
  }

  return matches;
}

function findConditionalThreats(text) {
  const matches = [];
  const textLower = text.toLowerCase();

  for (const pattern of CONDITIONAL_THREAT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      matches.push(match[0].trim());
    }
  }

  return matches;
}

function findLegalThreats(text) {
  const matches = [];
  const textLower = text.toLowerCase();

  for (const pattern of LEGAL_THREAT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      matches.push(match[0].trim());
    }
  }

  return matches;
}

function findThreatPhrases(text) {
  const matches = [];
  const textLower = text.toLowerCase();

  for (const pattern of THREAT_PHRASES) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      matches.push(match[0].trim());
    }
  }

  return matches;
}

function findConsequenceIndicators(text) {
  const matches = [];
  const textLower = text.toLowerCase();

  for (const pattern of CONSEQUENCE_INDICATORS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      matches.push(match[0].trim());
    }
  }

  return matches;
}

/**
 * Calculate confidence score
 */
function calculateConfidence(evidence) {
  let confidence = 0;

  // "Or else" is strong threat indicator
  if (evidence.or_else.length > 0) confidence += 45;

  // Conditional threats
  if (evidence.conditional_threats.length > 0) confidence += 40;

  // Legal/custody threats are very strong
  if (evidence.legal_threats.length > 0) confidence += 50;

  // Direct threat phrases
  if (evidence.threat_phrases.length > 0) confidence += 35;

  // Consequence indicators boost confidence
  if (evidence.consequence_indicators.length > 0) confidence += 10;

  // Combined "or else" + legal threat is very high
  if (evidence.or_else.length > 0 && evidence.legal_threats.length > 0) {
    confidence += 20;
  }

  return Math.min(100, confidence);
}

// ============================================================================
// MAIN CHECK FUNCTION
// ============================================================================

function check(parsed, context = {}) {
  const text = parsed.raw || '';

  // Gather evidence
  const evidence = {
    or_else: findOrElsePatterns(text),
    conditional_threats: findConditionalThreats(text),
    legal_threats: findLegalThreats(text),
    threat_phrases: findThreatPhrases(text),
    consequence_indicators: findConsequenceIndicators(text),
  };

  // Must have at least one threat indicator
  const hasThreat =
    evidence.or_else.length > 0 ||
    evidence.conditional_threats.length > 0 ||
    evidence.legal_threats.length > 0 ||
    evidence.threat_phrases.length > 0;

  if (!hasThreat) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Calculate confidence
  const confidence = calculateConfidence(evidence);

  // Must have minimum confidence
  if (confidence < 45) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Build trigger phrase
  const allThreats = [
    ...evidence.or_else,
    ...evidence.legal_threats,
    ...evidence.threat_phrases,
    ...evidence.conditional_threats,
  ];
  const triggerPhrase = allThreats.slice(0, 2).join(' + ');

  return createFiringAxiomResult(
    id,
    name,
    category,
    confidence,
    {
      threats_found: allThreats,
      trigger_phrase: triggerPhrase,
      all_evidence: evidence,
    },
    `Threat/ultimatum makes this about consequences, not about what you need. They'll focus on defending themselves instead of solving the problem.`
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  id,
  name,
  category,
  description,
  pattern,
  check,
  findOrElsePatterns,
  findConditionalThreats,
  findLegalThreats,
  findThreatPhrases,
  calculateConfidence,
};
