/**
 * Feature Flags for AI Mediation
 *
 * Controls which experimental/optional features are enabled.
 * All experimental features default to DISABLED for cost and performance.
 *
 * @module src/infrastructure/config/featureFlags
 */

// ============================================================================
// FEATURE FLAG DEFINITIONS
// ============================================================================

const FEATURE_FLAGS = {
  // Core features (always enabled - required for basic functionality)
  CORE_MEDIATION: true,
  PRE_FILTERS: true,
  CODE_LAYER: true,
  MESSAGE_CACHE: true,

  // Experimental features (default: disabled)
  // Enable via environment variables: ENABLE_DUAL_BRAIN=true
  DUAL_BRAIN_CONTEXT: process.env.ENABLE_DUAL_BRAIN === 'true',
  VOICE_SIGNATURE: process.env.ENABLE_VOICE_SIGNATURE === 'true',
  VALUES_CONTEXT: process.env.ENABLE_VALUES_CONTEXT === 'true',
  CONVERSATION_PATTERNS: process.env.ENABLE_CONVERSATION_PATTERNS === 'true',
  INTERVENTION_LEARNING: process.env.ENABLE_INTERVENTION_LEARNING === 'true',
  GRAPH_CONTEXT: process.env.ENABLE_GRAPH_CONTEXT === 'true',
  USER_INTELLIGENCE: process.env.ENABLE_USER_INTELLIGENCE === 'true',

  // AI-powered features (can be disabled for cost savings)
  // Name detection: Will use regex by default, LLM as fallback if enabled
  AI_NAME_DETECTION: process.env.ENABLE_AI_NAME_DETECTION === 'true',
  AI_CONTACT_SUGGESTIONS: process.env.ENABLE_AI_CONTACT_SUGGESTIONS === 'true',
  AI_INSIGHTS_EXTRACTION: process.env.ENABLE_AI_INSIGHTS === 'true',

  // Performance optimizations (always enabled after refactor)
  EARLY_EXIT_OPTIMIZATION: true,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a feature is enabled
 * @param {string} feature - Feature name (must match FEATURE_FLAGS key)
 * @returns {boolean} True if feature is enabled
 * @throws {Error} If feature name is invalid
 */
function isEnabled(feature) {
  if (!(feature in FEATURE_FLAGS)) {
    throw new Error(`Unknown feature flag: ${feature}`);
  }
  return FEATURE_FLAGS[feature] === true;
}

/**
 * Get all enabled features (for logging/debugging)
 * @returns {Object} Object with enabled feature names as keys
 */
function getEnabledFeatures() {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .reduce((acc, [name]) => {
      acc[name] = true;
      return acc;
    }, {});
}

/**
 * Get all feature flags with their status (for admin/debugging)
 * @returns {Object} All feature flags with their enabled/disabled status
 */
function getAllFlags() {
  return { ...FEATURE_FLAGS };
}

/**
 * Check if any experimental features are enabled
 * Useful for logging/warnings
 * @returns {boolean}
 */
function hasExperimentalFeaturesEnabled() {
  const experimentalFlags = [
    'DUAL_BRAIN_CONTEXT',
    'VOICE_SIGNATURE',
    'VALUES_CONTEXT',
    'CONVERSATION_PATTERNS',
    'INTERVENTION_LEARNING',
    'GRAPH_CONTEXT',
    'USER_INTELLIGENCE',
  ];

  return experimentalFlags.some(flag => isEnabled(flag));
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  FEATURE_FLAGS,
  isEnabled,
  getEnabledFeatures,
  getAllFlags,
  hasExperimentalFeaturesEnabled,
};
