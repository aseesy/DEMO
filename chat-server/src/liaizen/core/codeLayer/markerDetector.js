/**
 * Marker Detector Module
 *
 * Consolidates existing pattern modules into a unified marker detector.
 * Extracts linguistic markers (softeners, intensifiers, patterns, contrasts, negations).
 *
 * @module codeLayer/markerDetector
 * @version 1.0.0
 */

'use strict';

const tokenizer = require('./tokenizer');

// ============================================================================
// MARKER PATTERNS (Compiled once at module load)
// ============================================================================

/**
 * Softener phrases (hedging language)
 * Reused from language-analyzer/patterns/hedging.js
 */
const SOFTENER_PATTERNS = [
  // Single words
  /\bjust\b/gi,
  /\bmaybe\b/gi,
  /\bmight\b/gi,
  /\bperhaps\b/gi,
  /\bpossibly\b/gi,
  /\bprobably\b/gi,
  /\bsomewhat\b/gi,
  /\bbasically\b/gi,
  /\bactually\b/gi,
  /\bhonestly\b/gi,
  /\bfrankly\b/gi,
  /\bsimply\b/gi,
  /\bonly\b/gi,
  /\bmerely\b/gi,
  // Multi-word phrases
  /\bkind of\b/gi,
  /\bsort of\b/gi,
  /\ba bit\b/gi,
  /\ba little\b/gi,
  /\bslightly\b/gi,
  /\bi think\b/gi,
  /\bi feel like\b/gi,
  /\bi guess\b/gi,
  /\bi suppose\b/gi,
  /\bit seems\b/gi,
  /\bi'm just\b/gi,
  /\bi was just\b/gi,
];

/**
 * Intensifier patterns (amplifying language)
 * Reused from language-analyzer/patterns/globalSpecific.js
 */
const INTENSIFIER_PATTERNS = [
  // Absolute terms
  /\balways\b/gi,
  /\bnever\b/gi,
  /\bevery\b/gi,
  /\beverything\b/gi,
  /\beveryone\b/gi,
  /\beverywhere\b/gi,
  /\bnothing\b/gi,
  /\bnobody\b/gi,
  /\bnowhere\b/gi,
  /\ball\b/gi,
  /\bnone\b/gi,
  // Degree intensifiers
  /\bcompletely\b/gi,
  /\btotally\b/gi,
  /\babsolutely\b/gi,
  /\bconstantly\b/gi,
  /\bforever\b/gi,
  /\bentirely\b/gi,
  /\bextremely\b/gi,
  /\bvery\b/gi,
  /\breally\b/gi,
  /\bso\b/gi,
  /\bsuch\b/gi,
  /\bdefinitely\b/gi,
  /\bcertainly\b/gi,
  /\bobviously\b/gi,
  /\bclearly\b/gi,
];

/**
 * Pattern markers for problematic communication patterns
 * Reused from language-analyzer
 */
const PATTERN_MARKERS = [
  // Global statements (overgeneralizations)
  {
    pattern: /\byou always\b/gi,
    type: 'global_statement',
    description: 'Overgeneralization about receiver',
  },
  {
    pattern: /\byou never\b/gi,
    type: 'global_statement',
    description: 'Negative overgeneralization',
  },
  {
    pattern: /\byou('re| are) always\b/gi,
    type: 'global_statement',
    description: 'Character overgeneralization',
  },
  {
    pattern: /\byou('re| are) never\b/gi,
    type: 'global_statement',
    description: 'Negative character overgeneralization',
  },
  { pattern: /\bevery time you\b/gi, type: 'global_statement', description: 'Pattern accusation' },
  {
    pattern: /\byou('re| are) the (kind|type|sort) of person\b/gi,
    type: 'character_attack',
    description: 'Character labeling',
  },

  // Evaluative language (judgments)
  { pattern: /\byou should\b/gi, type: 'evaluative', description: 'Prescriptive statement' },
  { pattern: /\byou need to\b/gi, type: 'evaluative', description: 'Prescriptive demand' },
  { pattern: /\byou have to\b/gi, type: 'evaluative', description: 'Prescriptive demand' },
  { pattern: /\byou must\b/gi, type: 'evaluative', description: 'Strong prescriptive' },
  {
    pattern: /\byou ought to\b/gi,
    type: 'evaluative',
    description: 'Prescriptive with moral weight',
  },

  // Rhetorical questions (often accusatory)
  {
    pattern: /\bwhy (did|do|don't|didn't|can't|won't|wouldn't) you\b/gi,
    type: 'rhetorical_question',
    description: 'Accusatory question',
  },
  {
    pattern: /\bhow could you\b/gi,
    type: 'rhetorical_question',
    description: 'Accusatory question',
  },
  {
    pattern: /\bwhat were you thinking\b/gi,
    type: 'rhetorical_question',
    description: 'Judgment question',
  },

  // Blame patterns
  { pattern: /\byour fault\b/gi, type: 'blame', description: 'Direct blame attribution' },
  { pattern: /\bbecause of you\b/gi, type: 'blame', description: 'Causation blame' },
  { pattern: /\bthanks to you\b/gi, type: 'blame', description: 'Sarcastic blame' },
  {
    pattern: /\bif you (had|hadn't|would|wouldn't)\b/gi,
    type: 'blame',
    description: 'Conditional blame',
  },

  // Comparison patterns
  { pattern: /\bunlike you\b/gi, type: 'comparison', description: 'Negative comparison' },
  { pattern: /\bat least i\b/gi, type: 'comparison', description: 'Self-elevating comparison' },
  {
    pattern: /\bi would never\b/gi,
    type: 'comparison',
    description: 'Implicit criticism via contrast',
  },
];

/**
 * Contrast markers (signal shifts or contradictions)
 */
const CONTRAST_MARKERS = [
  /\bbut\b/gi,
  /\bhowever\b/gi,
  /\balthough\b/gi,
  /\bthough\b/gi,
  /\byet\b/gi,
  /\beven though\b/gi,
  /\bdespite\b/gi,
  /\bin spite of\b/gi,
  /\bnevertheless\b/gi,
  /\bnonetheless\b/gi,
  /\bstill\b/gi,
  /\bon the other hand\b/gi,
];

/**
 * Negation markers
 */
const NEGATION_PATTERNS = [
  /\bnot\b/gi,
  /\bnever\b/gi,
  /\bno\b/gi,
  /\bdon't\b/gi,
  /\bdoesn't\b/gi,
  /\bdidn't\b/gi,
  /\bwon't\b/gi,
  /\bwouldn't\b/gi,
  /\bcouldn't\b/gi,
  /\bshouldn't\b/gi,
  /\bcan't\b/gi,
  /\bcannot\b/gi,
  /\bnobody\b/gi,
  /\bnothing\b/gi,
  /\bnowhere\b/gi,
];

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Extract all matches for a pattern array
 * @param {string} text - Text to search
 * @param {RegExp[]} patterns - Array of regex patterns
 * @returns {string[]} - Unique matches found
 */
function extractMatches(text, patterns) {
  const matches = new Set();

  for (const pattern of patterns) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      matches.add(match[0].toLowerCase().trim());
    }
  }

  return Array.from(matches);
}

/**
 * Extract pattern markers with metadata
 * @param {string} text - Text to search
 * @returns {Object[]} - Array of marker objects with type and description
 */
function extractPatternMarkers(text) {
  const markers = [];

  for (const { pattern, type, description } of PATTERN_MARKERS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      markers.push({
        match: match[0].toLowerCase().trim(),
        type,
        description,
        position: match.index,
      });
    }
  }

  // Sort by position and dedupe
  markers.sort((a, b) => a.position - b.position);

  // Remove duplicates by match
  const seen = new Set();
  return markers.filter(m => {
    if (seen.has(m.match)) return false;
    seen.add(m.match);
    return true;
  });
}

/**
 * Detect linguistic markers in a message
 *
 * @param {string} text - Message text
 * @param {Token[]} [tokens] - Pre-computed tokens (optional, for efficiency)
 * @returns {Object} - Marker detection result
 *
 * @example
 * detect("I'm just worried, but you never listen")
 * // Returns:
 * // {
 * //   softeners: ["just"],
 * //   intensifiers: ["never"],
 * //   patternMarkers: [{ match: "you never", type: "global_statement", ... }],
 * //   contrastMarkers: ["but"],
 * //   negations: ["never"],
 * //   latencyMs: 3
 * // }
 */
function detect(text, tokens = null) {
  const startTime = Date.now();

  // Handle empty/invalid input
  if (!text || typeof text !== 'string') {
    return {
      softeners: [],
      intensifiers: [],
      patternMarkers: [],
      contrastMarkers: [],
      negations: [],
      latencyMs: Date.now() - startTime,
    };
  }

  const normalizedText = text.toLowerCase();

  // Extract each marker type
  const softeners = extractMatches(normalizedText, SOFTENER_PATTERNS);
  const intensifiers = extractMatches(normalizedText, INTENSIFIER_PATTERNS);
  const patternMarkers = extractPatternMarkers(normalizedText);
  const contrastMarkers = extractMatches(normalizedText, CONTRAST_MARKERS);
  const negations = extractMatches(normalizedText, NEGATION_PATTERNS);

  // If tokens provided, cross-reference for accuracy
  if (tokens && Array.isArray(tokens)) {
    // Add token-detected softeners not caught by regex
    for (const token of tokens) {
      if (token.softener && !softeners.includes(token.word)) {
        softeners.push(token.word);
      }
      if (token.intensifier && !intensifiers.includes(token.word)) {
        intensifiers.push(token.word);
      }
    }
  }

  return {
    softeners,
    intensifiers,
    patternMarkers,
    contrastMarkers,
    negations,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Get summary statistics for markers
 * @param {Object} markers - Result from detect()
 * @returns {Object} - Summary statistics
 */
function getMarkerStats(markers) {
  return {
    totalSofteners: markers.softeners.length,
    totalIntensifiers: markers.intensifiers.length,
    totalPatternMarkers: markers.patternMarkers.length,
    totalContrastMarkers: markers.contrastMarkers.length,
    totalNegations: markers.negations.length,
    hasGlobalStatements: markers.patternMarkers.some(m => m.type === 'global_statement'),
    hasEvaluativeLanguage: markers.patternMarkers.some(m => m.type === 'evaluative'),
    hasBlamePatterns: markers.patternMarkers.some(m => m.type === 'blame'),
    hasRhetoricalQuestions: markers.patternMarkers.some(m => m.type === 'rhetorical_question'),
    hasCharacterAttacks: markers.patternMarkers.some(m => m.type === 'character_attack'),
    deniability_level: markers.softeners.length > 0 ? 'high' : 'low',
  };
}

/**
 * Check if markers suggest conflict potential
 * @param {Object} markers - Result from detect()
 * @returns {'low'|'moderate'|'high'} - Conflict potential level
 */
function assessConflictPotential(markers) {
  const stats = getMarkerStats(markers);

  // High conflict indicators
  if (
    stats.has_blame_patterns ||
    stats.has_character_attacks ||
    (stats.has_global_statements && stats.total_intensifiers > 0)
  ) {
    return 'high';
  }

  // Moderate conflict indicators
  if (
    stats.has_global_statements ||
    stats.has_evaluative_language ||
    stats.has_rhetorical_questions ||
    stats.total_intensifiers >= 2
  ) {
    return 'moderate';
  }

  // Low conflict
  return 'low';
}

/**
 * Check if message has "but" contrast pattern (common in passive aggression)
 * Pattern: Positive statement + but + negative statement
 * @param {string} text - Message text
 * @returns {Object|null} - Contrast analysis or null
 */
function analyzeButContrast(text) {
  const butMatch = text.toLowerCase().match(/(.+?)\bbut\b(.+)/i);
  if (!butMatch) return null;

  const beforeBut = butMatch[1].trim();
  const afterBut = butMatch[2].trim();

  // Check for softeners before "but" (often signal upcoming criticism)
  const hasSoftenerBeforeBut = SOFTENER_PATTERNS.some(p => {
    p.lastIndex = 0;
    return p.test(beforeBut);
  });

  // Check for intensifiers after "but" (often signal criticism)
  const hasIntensifierAfterBut = INTENSIFIER_PATTERNS.some(p => {
    p.lastIndex = 0;
    return p.test(afterBut);
  });

  return {
    before_but: beforeBut,
    after_but: afterBut,
    softener_before: hasSoftenerBeforeBut,
    intensifier_after: hasIntensifierAfterBut,
    likely_criticism: hasSoftenerBeforeBut || hasIntensifierAfterBut,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main function
  detect,

  // Analysis helpers
  getMarkerStats,
  assessConflictPotential,
  analyzeButContrast,

  // Utility functions
  extractMatches,
  extractPatternMarkers,

  // Pattern exports (for testing/extension)
  SOFTENER_PATTERNS,
  INTENSIFIER_PATTERNS,
  PATTERN_MARKERS,
  CONTRAST_MARKERS,
  NEGATION_PATTERNS,
};
