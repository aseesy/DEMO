/**
 * Language Analyzer Library
 *
 * Analyzes message language patterns to produce structured analysis
 * for the AI coaching system.
 *
 * CONSTITUTION COMPLIANCE (ai-mediation-constitution.md):
 * - Principle I: Describes language patterns, not emotions
 * - Principle II: No psychological labels or diagnoses
 * - Principle III: Child-centric analysis when applicable
 *
 * This library provides ANALYSIS ONLY - no coaching or recommendations.
 * The output feeds into the AI mediator for coaching decisions.
 */

const globalSpecific = require('./patterns/globalSpecific');
const evaluative = require('./patterns/evaluative');
const hedging = require('./patterns/hedging');
const specificity = require('./patterns/specificity');
const focus = require('./patterns/focus');
const childInvolvement = require('./patterns/childInvolvement');
const structure = require('./patterns/structure');

const VERSION = '1.0.0';

/**
 * Analyze a message and return structured analysis
 *
 * @param {string} text - The message text to analyze
 * @param {Object} options - Optional configuration
 * @param {string[]} options.childNames - Array of child names to detect
 * @returns {Object} Structured analysis result
 */
function analyze(text, options = {}) {
  const startTime = Date.now();

  if (!text || typeof text !== 'string') {
    return createEmptyAnalysis('invalid_input');
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return createEmptyAnalysis('empty_input');
  }

  // Run all pattern detectors
  const globalSpecificPatterns = globalSpecific.detect(trimmedText);
  const evaluativePatterns = evaluative.detect(trimmedText);
  const hedgingPatterns = hedging.detect(trimmedText);
  const specificityPatterns = specificity.detect(trimmedText);
  const focusPatterns = focus.detect(trimmedText);
  const childPatterns = childInvolvement.detect(trimmedText, options.childNames || []);
  const structurePatterns = structure.detect(trimmedText);

  // Compile patterns into unified structure
  const patterns = {
    // Global vs Specific
    global_positive: globalSpecificPatterns.global_positive,
    global_negative: globalSpecificPatterns.global_negative,
    specific_behavior: globalSpecificPatterns.specific_behavior,
    specific_impact: globalSpecificPatterns.specific_impact,

    // Evaluative vs Descriptive
    evaluative_character: evaluativePatterns.evaluative_character,
    evaluative_competence: evaluativePatterns.evaluative_competence,
    descriptive_action: evaluativePatterns.descriptive_action,
    descriptive_observation: evaluativePatterns.descriptive_observation,

    // Hedging
    over_explaining: hedgingPatterns.over_explaining,
    apologetic_framing: hedgingPatterns.apologetic_framing,
    hedging_softeners: hedgingPatterns.hedging_softeners,
    direct_statement: hedgingPatterns.direct_statement,

    // Vague vs Specific
    vague_complaint: specificityPatterns.vague_complaint,
    vague_request: specificityPatterns.vague_request,
    specific_complaint: specificityPatterns.specific_complaint,
    specific_request: specificityPatterns.specific_request,

    // Focus
    logistics_focused: focusPatterns.logistics_focused,
    character_focused: focusPatterns.character_focused,
    child_focused: focusPatterns.child_focused,
    relationship_focused: focusPatterns.relationship_focused,
    past_focused: focusPatterns.past_focused,
    future_focused: focusPatterns.future_focused,

    // Child involvement
    child_mentioned: childPatterns.child_mentioned,
    child_as_messenger: childPatterns.child_as_messenger,
    child_as_weapon: childPatterns.child_as_weapon,
    child_wellbeing_cited: childPatterns.child_wellbeing_cited,
    child_triangulation: childPatterns.child_triangulation,

    // Structure
    has_concrete_request: structurePatterns.has_concrete_request,
    has_proposed_change: structurePatterns.has_proposed_change,
  };

  // Compile structure analysis
  const structureAnalysis = {
    sentence_type: structurePatterns.sentence_type,
    target: structurePatterns.target,
    tense: structurePatterns.tense,
    absolutes_used: globalSpecificPatterns.absolutes_used,
    hedges_used: hedgingPatterns.hedges_used,
  };

  // Generate summary from all detectors
  const summary = generateSummary(
    globalSpecificPatterns,
    evaluativePatterns,
    hedgingPatterns,
    specificityPatterns,
    focusPatterns,
    childPatterns,
    structurePatterns
  );

  // Calculate confidence based on pattern clarity
  const confidence = calculateConfidence(patterns, structureAnalysis);

  const processingTime = Date.now() - startTime;

  return {
    patterns,
    structure: structureAnalysis,
    summary,
    meta: {
      analyzer_version: VERSION,
      analysis_method: 'local',
      confidence,
      processing_time_ms: processingTime,
      text_length: trimmedText.length,
    },
  };
}

/**
 * Generate human-readable summary from all pattern results
 */
function generateSummary(
  globalSpecificPatterns,
  evaluativePatterns,
  hedgingPatterns,
  specificityPatterns,
  focusPatterns,
  childPatterns,
  structurePatterns
) {
  const observations = [];

  // Prioritized summary generation (most important patterns first)

  // 1. Structure type (what kind of message is this?)
  const structureSummary = structure.summarize(structurePatterns);
  observations.push(...structureSummary.slice(0, 2)); // Take top 2

  // 2. Global/evaluative issues (most problematic patterns)
  if (globalSpecificPatterns.global_negative) {
    observations.push(...globalSpecific.summarize(globalSpecificPatterns).slice(0, 2));
  }
  if (evaluativePatterns.evaluative_character || evaluativePatterns.evaluative_competence) {
    observations.push(...evaluative.summarize(evaluativePatterns).slice(0, 1));
  }

  // 3. Child involvement (critical for co-parenting)
  if (childPatterns.child_mentioned) {
    const childSummary = childInvolvement.summarize(childPatterns);
    // Include notable child patterns prominently
    if (childPatterns.child_as_weapon) {
      observations.push('Links evaluation to child to strengthen attack');
    }
    if (childPatterns.child_triangulation) {
      observations.push("Triangulation: uses child's words/preferences against other parent");
    }
    if (childPatterns.child_as_messenger) {
      observations.push('Uses child as messenger to other parent');
    }
  }

  // 4. Specificity issues
  if (specificityPatterns.vague_complaint || specificityPatterns.vague_request) {
    observations.push(...specificity.summarize(specificityPatterns).slice(0, 1));
  }

  // 5. Hedging (if notable)
  if (hedgingPatterns.excessive_hedging || hedgingPatterns.apologetic_framing) {
    observations.push(...hedging.summarize(hedgingPatterns).slice(0, 1));
  }

  // 6. Focus analysis
  const focusSummary = focus.summarize(focusPatterns);
  if (focusSummary.length > 0 && !focusPatterns.logistics_focused) {
    observations.push(focusSummary[0]);
  }

  // 7. Missing elements
  if (
    !structurePatterns.has_concrete_request &&
    !structurePatterns.has_proposed_change &&
    (globalSpecificPatterns.global_negative || evaluativePatterns.evaluative_character)
  ) {
    observations.push('No concrete request or proposed change');
  }

  // Remove duplicates and limit length
  const uniqueObservations = [...new Set(observations)];
  return uniqueObservations.slice(0, 6); // Max 6 observations
}

/**
 * Calculate confidence score based on pattern clarity
 */
function calculateConfidence(patterns, structureAnalysis) {
  let confidence = 70; // Base confidence

  // Strong patterns increase confidence
  if (patterns.global_negative || patterns.evaluative_character) {
    confidence += 10;
  }
  if (patterns.child_as_weapon || patterns.child_triangulation) {
    confidence += 10;
  }
  if (structureAnalysis.sentence_type !== 'statement') {
    confidence += 5;
  }

  // Ambiguous patterns decrease confidence
  if (structureAnalysis.target === 'unclear') {
    confidence -= 10;
  }
  if (structureAnalysis.absolutes_used.length === 0 && structureAnalysis.hedges_used.length === 0) {
    confidence -= 5; // Very neutral language is harder to analyze
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, confidence));
}

/**
 * Create empty analysis for invalid/empty inputs
 */
function createEmptyAnalysis(reason) {
  return {
    patterns: {},
    structure: {
      sentence_type: 'unknown',
      target: 'unclear',
      tense: 'unknown',
      absolutes_used: [],
      hedges_used: [],
    },
    summary: [],
    meta: {
      analyzer_version: VERSION,
      analysis_method: 'local',
      confidence: 0,
      processing_time_ms: 0,
      error: reason,
    },
  };
}

/**
 * Quick check if message likely needs intervention
 * (Useful for pre-filtering before full analysis)
 *
 * @param {string} text - Message text
 * @returns {boolean} True if message has potential issues
 */
function quickCheck(text) {
  if (!text || typeof text !== 'string') return false;

  const lowerText = text.toLowerCase();

  // Quick regex checks for common problems
  const hasAbsolutes = /\b(always|never)\b/i.test(text);
  const hasYouAttack = /\byou('re|'re| are)\s+(a\s+)?\w*(bad|terrible|awful|worst)\b/i.test(text);
  const hasBlame = /\b(your fault|because of you|you made)\b/i.test(text);
  const hasInsult = /\b(stupid|idiot|pathetic|worthless|useless)\b/i.test(lowerText);
  const hasThreat = /\b(lawyer|court|custody|or else)\b/i.test(lowerText);

  return hasAbsolutes || hasYouAttack || hasBlame || hasInsult || hasThreat;
}

/**
 * Format analysis for inclusion in AI prompt
 *
 * @param {Object} analysis - Analysis result from analyze()
 * @returns {string} Formatted string for AI context
 */
function formatForPrompt(analysis) {
  if (!analysis || !analysis.patterns) {
    return 'LANGUAGE ANALYSIS: Unable to analyze message';
  }

  const lines = ['=== LANGUAGE ANALYSIS (factual observations) ===', ''];

  // Summary observations
  if (analysis.summary.length > 0) {
    lines.push('Observations:');
    analysis.summary.forEach(obs => {
      lines.push(`• ${obs}`);
    });
    lines.push('');
  }

  // Key pattern flags
  const flags = [];
  if (analysis.patterns.global_negative) flags.push('global_negative');
  if (analysis.patterns.evaluative_character) flags.push('character_evaluation');
  if (analysis.patterns.child_as_weapon) flags.push('child_as_weapon');
  if (analysis.patterns.child_triangulation) flags.push('triangulation');
  if (analysis.patterns.vague_complaint) flags.push('vague_complaint');
  if (!analysis.patterns.has_concrete_request) flags.push('no_concrete_request');

  if (flags.length > 0) {
    lines.push(`Pattern flags: ${flags.join(', ')}`);
  }

  // Structure info
  lines.push(`Structure: ${analysis.structure.sentence_type} → ${analysis.structure.target}`);

  if (analysis.structure.absolutes_used.length > 0) {
    lines.push(`Absolutes used: ${analysis.structure.absolutes_used.join(', ')}`);
  }

  return lines.join('\n');
}

module.exports = {
  analyze,
  quickCheck,
  formatForPrompt,
  VERSION,

  // Export individual pattern modules for direct access if needed
  patterns: {
    globalSpecific,
    evaluative,
    hedging,
    specificity,
    focus,
    childInvolvement,
    structure,
  },
};
