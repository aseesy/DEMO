/**
 * Code Layer Entry Point
 *
 * Main entry point that orchestrates all Code Layer modules into a single `parse()` function.
 * This is the interface between the Code Layer and the AI Layer.
 *
 * Flow:
 * 1. Tokenizer → Break message into tagged tokens
 * 2. Marker Detector → Extract linguistic markers
 * 3. Primitive Mapper → Map to conceptual primitives
 * 4. Vector Identifier → Identify communication vector
 * 5. Axiom Checker → Check for pattern axioms (Phase 2)
 * 6. Assessment Generator → Generate final assessment
 *
 * @module codeLayer
 * @version 1.0.0
 */

'use strict';

const {
  VERSION,
  createEmptyParsedMessage,
  CONFLICT_LEVELS,
  AXIOM_CATEGORIES
} = require('./types');

const tokenizer = require('./tokenizer');
const markerDetector = require('./markerDetector');
const primitiveMapper = require('./primitiveMapper');
const vectorIdentifier = require('./vectorIdentifier');
const assessmentGen = require('./assessmentGen');
const axiomChecker = require('./axioms');

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Performance thresholds for logging warnings
 */
const PERFORMANCE_THRESHOLDS = {
  TOTAL_MS: 100,      // Warn if total parsing exceeds this
  COMPONENT_MS: 50,   // Warn if any component exceeds this
};

/**
 * Enable performance logging
 */
let performanceLoggingEnabled = process.env.CODE_LAYER_PERF_LOG === 'true';

// ============================================================================
// MAIN PARSE FUNCTION
// ============================================================================

/**
 * Parse a message through the Code Layer pipeline
 *
 * @param {string} messageText - The message text to parse
 * @param {Object} context - Parsing context
 * @param {string} context.senderId - Sender's user ID
 * @param {string} context.receiverId - Receiver's user ID
 * @param {string[]} [context.childNames] - Names of children (for detection)
 * @param {boolean} [context.has_new_partner] - Receiver has a new partner
 * @param {string} [context.income_disparity] - Income disparity level
 * @param {string} [context.separation_date] - Date of separation
 * @param {string} [context.distance_to_school] - Sender's proximity to school
 * @returns {Promise<ParsedMessage>} - Complete ParsedMessage object
 *
 * @example
 * const parsed = await parse("She's been upset since you changed the schedule", {
 *   senderId: "alice",
 *   receiverId: "bob",
 *   childNames: ["Emma"]
 * });
 * console.log(parsed.axioms_fired); // Axioms that matched
 * console.log(parsed.assessment.transmit); // Whether AI intervention needed
 */
async function parse(messageText, context = {}) {
  const startTime = Date.now();
  const componentLatency = {};

  // Handle empty/invalid input
  if (!messageText || typeof messageText !== 'string') {
    const emptyResult = createEmptyParsedMessage('', context);
    emptyResult.meta.latencyMs = Date.now() - startTime;
    return emptyResult;
  }

  const trimmedText = messageText.trim();
  if (trimmedText.length === 0) {
    const emptyResult = createEmptyParsedMessage('', context);
    emptyResult.meta.latencyMs = Date.now() - startTime;
    return emptyResult;
  }

  try {
    // =========================================================================
    // STEP 1: TOKENIZE
    // =========================================================================
    const tokenizerStart = Date.now();
    const tokenizerResult = tokenizer.tokenize(trimmedText);
    componentLatency.tokenizerMs = Date.now() - tokenizerStart;

    if (componentLatency.tokenizerMs > PERFORMANCE_THRESHOLDS.COMPONENT_MS && performanceLoggingEnabled) {
      console.warn(`[CodeLayer] ⚠️ Tokenizer slow: ${componentLatency.tokenizerMs}ms`);
    }

    // =========================================================================
    // STEP 2: DETECT MARKERS
    // =========================================================================
    const markerStart = Date.now();
    const markerResult = markerDetector.detect(trimmedText, tokenizerResult.tokens);
    componentLatency.markerDetectorMs = Date.now() - markerStart;

    if (componentLatency.markerDetectorMs > PERFORMANCE_THRESHOLDS.COMPONENT_MS && performanceLoggingEnabled) {
      console.warn(`[CodeLayer] ⚠️ Marker Detector slow: ${componentLatency.markerDetectorMs}ms`);
    }

    // =========================================================================
    // STEP 3: MAP PRIMITIVES
    // =========================================================================
    const primitiveStart = Date.now();
    const primitiveResult = primitiveMapper.map(
      tokenizerResult.tokens,
      markerResult,
      context,
      trimmedText
    );
    componentLatency.primitiveMapperMs = Date.now() - primitiveStart;

    if (componentLatency.primitiveMapperMs > PERFORMANCE_THRESHOLDS.COMPONENT_MS && performanceLoggingEnabled) {
      console.warn(`[CodeLayer] ⚠️ Primitive Mapper slow: ${componentLatency.primitiveMapperMs}ms`);
    }

    // =========================================================================
    // STEP 4: IDENTIFY VECTOR
    // =========================================================================
    const vectorStart = Date.now();
    const vectorResult = vectorIdentifier.identify(
      tokenizerResult.tokens,
      primitiveResult.conceptual,
      markerResult,
      context,
      trimmedText
    );
    componentLatency.vectorIdentifierMs = Date.now() - vectorStart;

    if (componentLatency.vectorIdentifierMs > PERFORMANCE_THRESHOLDS.COMPONENT_MS && performanceLoggingEnabled) {
      console.warn(`[CodeLayer] ⚠️ Vector Identifier slow: ${componentLatency.vectorIdentifierMs}ms`);
    }

    // =========================================================================
    // STEP 5: CHECK AXIOMS
    // =========================================================================
    const axiomStart = Date.now();

    // Build partial parsed message for axiom checks
    const partialParsed = {
      raw: trimmedText,
      linguistic: markerResult,
      conceptual: primitiveResult.conceptual,
      vector: vectorResult.vector
    };

    // Check all axioms
    const axiomResult = await axiomChecker.checkAll(partialParsed, context);
    componentLatency.axiomCheckerMs = Date.now() - axiomStart;

    if (componentLatency.axiomCheckerMs > PERFORMANCE_THRESHOLDS.COMPONENT_MS && performanceLoggingEnabled) {
      console.warn(`[CodeLayer] ⚠️ Axiom Checker slow: ${componentLatency.axiomCheckerMs}ms`);
    }

    // =========================================================================
    // STEP 6: GENERATE ASSESSMENT
    // =========================================================================
    const assessmentStart = Date.now();
    const assessmentResult = assessmentGen.generate({
      axiomsFired: axiomResult.axiomsFired,
      vector: vectorResult.vector,
      markers: markerResult,
      conceptual: primitiveResult.conceptual
    });
    componentLatency.assessmentGenMs = Date.now() - assessmentStart;

    if (componentLatency.assessmentGenMs > PERFORMANCE_THRESHOLDS.COMPONENT_MS && performanceLoggingEnabled) {
      console.warn(`[CodeLayer] ⚠️ Assessment Generator slow: ${componentLatency.assessmentGenMs}ms`);
    }

    // =========================================================================
    // BUILD FINAL PARSED MESSAGE
    // =========================================================================
    const totalLatency = Date.now() - startTime;

    if (totalLatency > PERFORMANCE_THRESHOLDS.TOTAL_MS && performanceLoggingEnabled) {
      console.warn(`[CodeLayer] ⚠️ Total parsing slow: ${totalLatency}ms`);
    }

    const parsedMessage = {
      raw: trimmedText,
      linguistic: {
        tokens: tokenizerResult.tokens,
        softeners: markerResult.softeners,
        intensifiers: markerResult.intensifiers,
        patternMarkers: markerResult.patternMarkers,
        contrastMarkers: markerResult.contrastMarkers,
        negations: markerResult.negations
      },
      conceptual: primitiveResult.conceptual,
      vector: vectorResult.vector,
      axiomsFired: axiomResult.axiomsFired,
      assessment: assessmentResult.assessment,
      meta: {
        version: VERSION,
        latencyMs: totalLatency,
        componentLatency: componentLatency
      }
    };

    return parsedMessage;

  } catch (error) {
    // Handle errors gracefully - return partial ParsedMessage with error flag
    console.error('[CodeLayer] ❌ Parse error:', error.message);

    const errorResult = createEmptyParsedMessage(trimmedText, context);
    errorResult.meta.latencyMs = Date.now() - startTime;
    errorResult.meta.error = true;
    errorResult.meta.errorMessage = error.message;

    return errorResult;
  }
}

/**
 * Parse multiple messages in batch (for testing/benchmarking)
 * @deprecated Unused - will be removed if not used within 6 months
 * @future-use Kept for potential testing/benchmarking utilities
 * @param {string[]} messages - Array of message texts
 * @param {Object} context - Shared parsing context
 * @returns {Promise<ParsedMessage[]>} - Array of parsed messages
 */
async function parseBatch(messages, context = {}) {
  return Promise.all(messages.map(msg => parse(msg, context)));
}

/**
 * Quick check if a message likely needs AI intervention
 * (Faster than full parse for pre-screening)
 * @deprecated Unused - will be removed if not used within 6 months
 * @future-use Kept for potential performance optimization (faster pre-screening)
 * @param {string} messageText - Message text
 * @returns {boolean} - True if message likely needs intervention
 */
function quickCheck(messageText) {
  if (!messageText || typeof messageText !== 'string') {
    return false;
  }

  const text = messageText.toLowerCase();

  // Quick pattern checks (no full parsing)
  const redFlags = [
    /\byou\s+(always|never)\b/,
    /\byou('re| are)\s+(so|such|the|a)\b/,
    /\byour\s+fault\b/,
    /\bbecause\s+of\s+you\b/,
    /\b(she|he|they)\s+(said|told)\s+.*(you|your)\b/,
    /\bhow\s+could\s+you\b/,
    /\bwhat\s+(is|were)\s+you\s+thinking\b/
  ];

  return redFlags.some(pattern => pattern.test(text));
}

/**
 * Enable or disable performance logging
 * @deprecated Unused - will be removed if not used within 6 months
 * @future-use Kept for debugging/performance monitoring
 * @param {boolean} enabled - Whether to enable logging
 */
function setPerformanceLogging(enabled) {
  performanceLoggingEnabled = enabled;
}

/**
 * Get Code Layer version
 * @returns {string} - Version string
 */
function getVersion() {
  return VERSION;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main functions
  parse,
  parseBatch,
  quickCheck,

  // Configuration
  setPerformanceLogging,
  getVersion,
  VERSION,

  // Re-export individual modules for direct access
  tokenizer,
  markerDetector,
  primitiveMapper,
  vectorIdentifier,
  assessmentGen,
  axiomChecker,

  // Re-export types
  types: require('./types')
};
