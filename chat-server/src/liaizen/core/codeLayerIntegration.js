/**
 * Code Layer Integration Module
 *
 * Bridges the Code Layer (structural analysis) with the AI Layer (nuance/conscience).
 * This module provides:
 * 1. Quick-pass logic to skip AI for clean messages
 * 2. ParsedMessage formatting for AI prompts
 * 3. AI response validation
 *
 * @module codeLayerIntegration
 * @version 1.0.0
 */

'use strict';

// Import the Code Layer
let codeLayer;
try {
  codeLayer = require('./codeLayer');
  console.log('✅ Code Layer Integration: Code Layer v' + codeLayer.VERSION + ' loaded');
} catch (err) {
  console.warn('⚠️ Code Layer Integration: Code Layer not available:', err.message);
  codeLayer = null;
}

// ============================================================================
// QUICK-PASS LOGIC
// ============================================================================

/**
 * Determine if a message can pass without AI analysis
 *
 * Quick-pass criteria:
 * - Only clean axioms fired (or no axioms)
 * - Low conflict potential
 * - No pattern markers detected
 * - transmit: true from assessment
 *
 * @param {ParsedMessage} parsed - The parsed message from Code Layer
 * @returns {Object} - { canPass: boolean, reason: string }
 */
function shouldQuickPass(parsed) {
  if (!parsed) {
    return { canPass: false, reason: 'no_parsed_message' };
  }

  // Check assessment transmit flag
  if (!parsed.assessment.transmit) {
    return { canPass: false, reason: 'assessment_blocked' };
  }

  // Check conflict potential
  if (parsed.assessment.conflict_potential !== 'low') {
    return { canPass: false, reason: 'elevated_conflict_potential' };
  }

  // Check for hostile axioms (indirect OR direct hostility)
  const hostileAxioms = parsed.axiomsFired.filter(
    a => a.category === 'indirect_communication' || a.category === 'direct_hostility'
  );
  if (hostileAxioms.length > 0) {
    return { canPass: false, reason: 'hostile_axioms_fired', axioms: hostileAxioms.map(a => a.id) };
  }

  // Check for pattern markers
  if (parsed.linguistic.pattern_markers && parsed.linguistic.pattern_markers.length > 0) {
    // Check if any are concerning (not just evaluative)
    const concerningMarkers = parsed.linguistic.pattern_markers.filter(
      m => m.type === 'blame' || m.type === 'global_statement' || m.type === 'character_attack'
    );
    if (concerningMarkers.length > 0) {
      return { canPass: false, reason: 'concerning_pattern_markers' };
    }
  }

  // Check child as instrument
  if (parsed.assessment.child_as_instrument) {
    return { canPass: false, reason: 'child_as_instrument' };
  }

  // All checks passed - can quick pass
  return { canPass: true, reason: 'clean_message' };
}

// ============================================================================
// AI PROMPT FORMATTING
// ============================================================================

/**
 * Format ParsedMessage for inclusion in AI prompt
 *
 * @param {ParsedMessage} parsed - The parsed message
 * @returns {string} - Formatted context string for AI prompt
 */
function formatParsedMessageForPrompt(parsed) {
  if (!parsed) {
    return '';
  }

  const sections = [];

  // Header
  sections.push('=== CODE LAYER STRUCTURAL ANALYSIS ===');

  // Axioms that fired
  if (parsed.axiomsFired.length > 0) {
    sections.push('\n📊 AXIOMS FIRED:');
    for (const axiom of parsed.axiomsFired) {
      sections.push(`  - ${axiom.id} (${axiom.name}): confidence ${axiom.confidence}%`);
      if (axiom.intent_impact_delta) {
        sections.push(`    └─ Intent vs Impact: ${axiom.intent_impact_delta.substring(0, 150)}...`);
      }
    }
  } else {
    sections.push('\n📊 AXIOMS FIRED: None (clean message)');
  }

  // Communication Vector
  sections.push('\n🎯 COMMUNICATION VECTOR:');
  sections.push(`  - Target: ${parsed.vector.target}`);
  sections.push(`  - Instrument: ${parsed.vector.instrument || 'none'}`);
  sections.push(`  - Aim: ${parsed.vector.aim}`);

  // Assessment
  sections.push('\n⚖️ ASSESSMENT:');
  sections.push(`  - Conflict Potential: ${parsed.assessment.conflict_potential}`);
  sections.push(`  - Attack Surface: ${parsed.assessment.attack_surface.join(', ') || 'none'}`);
  sections.push(`  - Child as Instrument: ${parsed.assessment.child_as_instrument}`);
  sections.push(`  - Deniability: ${parsed.assessment.deniability}`);

  // Linguistic markers summary
  const markers = parsed.linguistic;
  if (markers.intensifiers?.length > 0 || markers.softeners?.length > 0) {
    sections.push('\n📝 LINGUISTIC MARKERS:');
    if (markers.intensifiers?.length > 0) {
      sections.push(`  - Intensifiers: ${markers.intensifiers.join(', ')}`);
    }
    if (markers.softeners?.length > 0) {
      sections.push(`  - Softeners: ${markers.softeners.join(', ')}`);
    }
    if (markers.contrastMarkers?.length > 0) {
      sections.push(`  - Contrast markers: ${markers.contrastMarkers.join(', ')}`);
    }
  }

  // Performance
  sections.push(`\n⏱️ Analysis completed in ${parsed.meta.latencyMs}ms`);

  return sections.join('\n');
}

/**
 * Build the Code Layer section for the AI system prompt
 *
 * @param {ParsedMessage} parsed - The parsed message
 * @returns {string} - Section to add to AI prompt
 */
function buildCodeLayerPromptSection(parsed) {
  if (!parsed || parsed.axiomsFired.length === 0) {
    return '';
  }

  const sections = [];

  sections.push('\n=== STRUCTURAL ANALYSIS (AXIOMS DETECTED) ===');
  sections.push('\nCommunication patterns detected in this message:\n');

  // List fired axioms with human-readable descriptions
  for (const axiom of parsed.axioms_fired) {
    sections.push(`• ${axiom.name}`);
    if (axiom.intent_impact_delta) {
      sections.push(`  What this means: ${axiom.intent_impact_delta}`);
    }
  }

  // Guidance for AI
  sections.push('\n\nUSE THESE AXIOM NAMES in your mirrorMessage observation.');
  sections.push('Example: "This message shows [Axiom Name] - a pattern where [observation]."');

  return sections.join('\n');
}

// ============================================================================
// AI RESPONSE VALIDATION
// ============================================================================

/**
 * Forbidden emotional terms in AI responses
 */
const FORBIDDEN_EMOTIONAL_TERMS = [
  "you're angry",
  "you seem frustrated",
  "you feel",
  "you're upset",
  "you're hurt",
  "you're defensive",
  "you're being",
  "you might feel",
  "you may feel",
  "you could feel"
];

/**
 * Validate that AI response complies with constitution and references Axioms
 *
 * @param {Object} aiResponse - The parsed AI response
 * @param {ParsedMessage} parsed - The Code Layer parsed message
 * @returns {Object} - { valid: boolean, errors: string[], response: Object }
 */
function validateAIResponse(aiResponse, parsed) {
  const errors = [];

  if (!aiResponse || !aiResponse.intervention) {
    return { valid: true, errors: [], response: aiResponse };
  }

  const intervention = aiResponse.intervention;

  // Only validate if action is INTERVENE
  if (aiResponse.action !== 'INTERVENE') {
    return { valid: true, errors: [], response: aiResponse };
  }

  // Check 1: personalMessage should reference Axiom if axioms fired
  if (parsed.axiomsFired.length > 0 && intervention.personalMessage) {
    const axiomIds = parsed.axiomsFired.map(a => a.id);
    const axiomNames = parsed.axiomsFired.map(a => a.name.toLowerCase());

    const hasAxiomReference = axiomIds.some(id =>
      intervention.personalMessage.includes(id)
    ) || axiomNames.some(name =>
      intervention.personalMessage.toLowerCase().includes(name)
    );

    if (!hasAxiomReference) {
      errors.push(`personalMessage should reference fired Axiom(s): ${axiomIds.join(', ')}`);
    }
  }

  // Check 2: personalMessage should not contain emotional diagnosis
  if (intervention.personalMessage) {
    for (const term of FORBIDDEN_EMOTIONAL_TERMS) {
      if (intervention.personalMessage.toLowerCase().includes(term)) {
        errors.push(`personalMessage contains emotional diagnosis: "${term}"`);
        break;
      }
    }
  }

  // Check 3: tip1 should be concise
  if (intervention.tip1) {
    const wordCount = intervention.tip1.split(/\s+/).length;
    if (wordCount > 12) {
      errors.push(`tip1 exceeds word limit: ${wordCount} words (max 12)`);
    }
  }

  // Check 4: Both rewrites should exist for INTERVENE
  if (!intervention.rewrite1) {
    errors.push('rewrite1 is required for INTERVENE action');
  }
  if (!intervention.rewrite2) {
    errors.push('rewrite2 is required for INTERVENE action');
  }

  // Log validation failures for monitoring
  if (errors.length > 0) {
    console.warn('[CodeLayerIntegration] AI Response validation failures:', errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    response: aiResponse
  };
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Run Code Layer analysis on a message
 *
 * @param {string} messageText - The message text
 * @param {Object} context - Context including senderId, receiverId, childNames
 * @returns {Promise<Object>} - { parsed: ParsedMessage, quickPass: Object }
 */
async function analyzeWithCodeLayer(messageText, context = {}) {
  if (!codeLayer) {
    return {
      parsed: null,
      quickPass: { canPass: false, reason: 'code_layer_not_available' }
    };
  }

  try {
    // Run Code Layer parsing
    const parsed = await codeLayer.parse(messageText, context);

    // Determine quick-pass
    const quickPass = shouldQuickPass(parsed);

    // Log analysis results
    console.log(`[CodeLayer] Analyzed: "${messageText.substring(0, 50)}..."`);
    console.log(`[CodeLayer] Axioms: ${parsed.axiomsFired.map(a => a.id).join(', ') || 'none'}`);
    console.log(`[CodeLayer] Conflict: ${parsed.assessment.conflict_potential}, QuickPass: ${quickPass.canPass}`);

    return { parsed, quickPass };
  } catch (error) {
    console.error('[CodeLayerIntegration] Analysis error:', error.message);
    return {
      parsed: null,
      quickPass: { canPass: false, reason: 'analysis_error', error: error.message }
    };
  }
}

// ============================================================================
// METRICS
// ============================================================================

/**
 * Metrics tracking for Code Layer performance
 */
const metrics = {
  totalAnalyzed: 0,
  quickPassCount: 0,
  aiCallCount: 0,
  axiomFireCounts: {},
  avgLatencyMs: 0,
  latencySamples: []
};

/**
 * Record metrics for an analysis
 */
function recordMetrics(parsed, quickPass) {
  if (!parsed) return;

  metrics.totalAnalyzed++;

  if (quickPass.canPass) {
    metrics.quickPassCount++;
  } else {
    metrics.aiCallCount++;
  }

  // Track axiom fire counts
  for (const axiom of parsed.axioms_fired) {
    metrics.axiomFireCounts[axiom.id] = (metrics.axiomFireCounts[axiom.id] || 0) + 1;
  }

  // Track latency
  metrics.latencySamples.push(parsed.meta.latencyMs);
  if (metrics.latencySamples.length > 100) {
    metrics.latencySamples.shift();
  }
  metrics.avgLatencyMs = metrics.latencySamples.reduce((a, b) => a + b, 0) / metrics.latencySamples.length;
}

/**
 * Get current metrics
 */
function getMetrics() {
  return {
    ...metrics,
    quickPassRate: metrics.totalAnalyzed > 0
      ? (metrics.quickPassCount / metrics.totalAnalyzed * 100).toFixed(1) + '%'
      : '0%',
    aiCallRate: metrics.totalAnalyzed > 0
      ? (metrics.aiCallCount / metrics.totalAnalyzed * 100).toFixed(1) + '%'
      : '0%'
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main analysis
  analyzeWithCodeLayer,

  // Quick-pass logic
  shouldQuickPass,

  // Prompt formatting
  formatParsedMessageForPrompt,
  buildCodeLayerPromptSection,

  // Response validation
  validateAIResponse,
  FORBIDDEN_EMOTIONAL_TERMS,

  // Metrics
  recordMetrics,
  getMetrics,

  // Check if Code Layer is available
  isAvailable: () => codeLayer !== null,
  getVersion: () => codeLayer ? codeLayer.VERSION : null
};
