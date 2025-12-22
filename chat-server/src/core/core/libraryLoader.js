/**
 * Library Loader
 *
 * Centralized dependency injection for optional AI mediation libraries.
 * Each library loads with graceful degradation - if unavailable, returns null.
 *
 * @module liaizen/core/libraryLoader
 */

/**
 * Safely load a module with graceful degradation
 * @param {string} modulePath - Path to require
 * @param {string} name - Human-readable name for logging
 * @param {Function} [initFn] - Optional async initialization function
 * @returns {Object|null} The loaded module or null
 */
function safeLoad(modulePath, name, initFn = null) {
  try {
    const module = require(modulePath);

    if (initFn) {
      initFn(module).catch(err => {
        console.warn(`⚠️ Library Loader: ${name} initialization failed:`, err.message);
      });
    }

    console.log(`✅ Library Loader: ${name} loaded`);
    return module;
  } catch (err) {
    console.warn(`⚠️ Library Loader: ${name} not available`);
    return null;
  }
}

/**
 * Load code layer integration with version check
 */
function loadCodeLayerIntegration() {
  try {
    const module = require('./codeLayerIntegration');
    if (module.isAvailable()) {
      console.log(`✅ Library Loader: Code Layer Integration v${module.getVersion()} loaded`);
      return module;
    }
    console.warn('⚠️ Library Loader: Code Layer Integration loaded but Code Layer not available');
    return module;
  } catch (err) {
    console.warn('⚠️ Library Loader: Code Layer Integration not available:', err.message);
    return null;
  }
}

// ============================================================================
// LOAD ALL LIBRARIES
// ============================================================================

const libraries = {
  // Language analysis (Feature 005)
  languageAnalyzer: safeLoad('../analysis/language-analyzer', 'Language analyzer'),

  // Communication profile for sender/receiver distinction
  communicationProfile: safeLoad('../context/communication-profile', 'Communication profile'),

  // Voice signature extraction (Phase 1: Contextual Awareness)
  voiceSignature: safeLoad(
    '../context/communication-profile/voiceSignature',
    'Voice signature extraction'
  ),

  // Conversation pattern analysis (Phase 1: Contextual Awareness)
  conversationPatterns: safeLoad(
    '../context/communication-profile/conversationPatterns',
    'Conversation pattern analysis'
  ),

  // Intervention learning (Phase 2: Enhanced Context)
  interventionLearning: safeLoad(
    '../context/communication-profile/interventionLearning',
    'Intervention learning system'
  ),

  // Rewrite Validator (Feature 006)
  rewriteValidator: safeLoad('../analysis/rewrite-validator', 'Rewrite validator'),

  // Code Layer Integration (Feature 004 - Hybrid Mediation Engine)
  codeLayerIntegration: loadCodeLayerIntegration(),

  // Profile Helpers (Feature 010 - Comprehensive User Profile)
  profileHelpers: safeLoad('../../utils/profileHelpers', 'Profile helpers'),

  // Co-Parent Context (Situational context for AI coaching)
  coparentContext: safeLoad('../context/coparentContext', 'Co-parent context'),

  // Graph Context (Neo4j relationship insights)
  graphContext: safeLoad('../context/graphContext', 'Graph context (Neo4j integration)'),

  // Values Profile (Learn user values from conversations)
  valuesProfile: safeLoad('../context/valuesProfile', 'Values profile', async module => {
    await module.initializeTable();
    console.log('✅ Library Loader: Values profile table initialized');
  }),

  // User Intelligence (Passive learning from conversations)
  userIntelligence: safeLoad(
    '../intelligence/userIntelligence',
    'User intelligence',
    async module => {
      await module.initializeInsightsTable();
      console.log('✅ Library Loader: User intelligence table initialized');
    }
  ),
};

/**
 * Check if a library is available
 * @param {string} name - Library name
 * @returns {boolean}
 */
function isAvailable(name) {
  return libraries[name] !== null;
}

/**
 * Get a loaded library
 * @param {string} name - Library name
 * @returns {Object|null}
 */
function get(name) {
  return libraries[name];
}

module.exports = {
  libraries,
  isAvailable,
  get,

  // Direct access for convenience
  languageAnalyzer: libraries.languageAnalyzer,
  communicationProfile: libraries.communicationProfile,
  voiceSignature: libraries.voiceSignature,
  conversationPatterns: libraries.conversationPatterns,
  interventionLearning: libraries.interventionLearning,
  rewriteValidator: libraries.rewriteValidator,
  codeLayerIntegration: libraries.codeLayerIntegration,
  profileHelpers: libraries.profileHelpers,
  coparentContext: libraries.coparentContext,
  graphContext: libraries.graphContext,
  valuesProfile: libraries.valuesProfile,
  userIntelligence: libraries.userIntelligence,
};
