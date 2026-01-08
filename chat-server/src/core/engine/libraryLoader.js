/**
 * Library Loader
 *
 * Centralized dependency injection for optional AI mediation libraries.
 * Each library loads with graceful degradation - if unavailable, returns null.
 *
 * @module liaizen/core/libraryLoader
 */

const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'libraryLoader' });

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
        logger.warn('Library initialization failed', {
          name,
          error: err.message,
        });
      });
    }

    logger.debug('Library loaded', { name });
    return module;
  } catch (err) {
    // Optional modules are expected to be missing - use debug level
    logger.debug('Library not available (optional feature)', { name });
    return null;
  }
}

/**
 * Create a lazy loader function for a module
 * Loads the module only when first accessed (lazy loading)
 * @param {string} modulePath - Path to require
 * @param {string} name - Human-readable name for logging
 * @param {Function} [initFn] - Optional async initialization function
 * @returns {Function} Getter function that loads on first call
 */
function createLazyLoader(modulePath, name, initFn = null) {
  let cachedModule = null;
  let isLoading = false;

  return function getModule() {
    // Return cached module if already loaded
    if (cachedModule !== null) {
      return cachedModule;
    }

    // Prevent concurrent loading
    if (isLoading) {
      logger.warn('Library is already loading, returning null', { name });
      return null;
    }

    isLoading = true;
    try {
      cachedModule = safeLoad(modulePath, name, initFn);
      return cachedModule;
    } finally {
      isLoading = false;
    }
  };
}

/**
 * Load code layer integration with version check
 */
function loadCodeLayerIntegration() {
  try {
    const module = require('./codeLayerIntegration');
    if (module.isAvailable()) {
      logger.debug('Code Layer Integration loaded', {
        version: module.getVersion(),
      });
      return module;
    }
    logger.warn('Code Layer Integration loaded but Code Layer not available');
    return module;
  } catch (err) {
    logger.warn('Code Layer Integration not available', {
      error: err.message,
    });
    return null;
  }
}

// ============================================================================
// LOAD ALL LIBRARIES
// ============================================================================

// Lazy loaders for heavy modules (only load when first accessed)
const lazyLoaders = {
  // Language analysis (Feature 005) - LAZY LOADED (only when analyzing messages)
  languageAnalyzer: createLazyLoader('../analysis/languageAnalyzer', 'Language analyzer'),

  // Communication profile - LAZY LOADED (only when recording rewrites)
  communicationProfile: createLazyLoader(
    '../profiles/communicationProfile',
    'Communication profile'
  ),
};

// Eagerly loaded libraries (lightweight or needed at startup)
const libraries = {
  // Voice signature extraction (Phase 1: Contextual Awareness)
  voiceSignature: safeLoad(
    '../profiles/communicationProfile/voiceSignature',
    'Voice signature extraction'
  ),

  // Conversation pattern analysis (Phase 1: Contextual Awareness)
  conversationPatterns: safeLoad(
    '../profiles/communicationProfile/conversationPatterns',
    'Conversation pattern analysis'
  ),

  // Intervention learning (Phase 2: Enhanced Context)
  interventionLearning: safeLoad(
    '../profiles/communicationProfile/interventionLearning',
    'Intervention learning system'
  ),

  // Rewrite Validator (Feature 006)
  rewriteValidator: safeLoad('../analysis/rewriteValidator', 'Rewrite validator'),

  // Code Layer Integration (Feature 004 - Hybrid Mediation Engine)
  codeLayerIntegration: loadCodeLayerIntegration(),

  // Profile Helpers (Feature 010 - Comprehensive User Profile)
  profileHelpers: safeLoad('../../utils/profileHelpers', 'Profile helpers'),

  // Co-Parent Context (Situational context for AI coaching)
  coparentContext: safeLoad('../profiles/coparentContext', 'Co-parent context'),

  // Graph Context (Neo4j relationship insights)
  graphContext: safeLoad('../profiles/graphContext', 'Graph context (Neo4j integration)'),

  // Values Profile (Learn user values from conversations)
  valuesProfile: safeLoad('../profiles/valuesProfile', 'Values profile', async module => {
    await module.initializeTable();
    logger.debug('Values profile table initialized');
  }),

  // User Intelligence (Passive learning from conversations)
  userIntelligence: safeLoad(
    '../intelligence/userIntelligence',
    'User intelligence',
    async module => {
      await module.initializeInsightsTable();
      logger.debug('User intelligence table initialized');
    }
  ),
};

/**
 * Check if a library is available
 * @param {string} name - Library name
 * @returns {boolean}
 */
function isAvailable(name) {
  // Check lazy loaders first
  if (lazyLoaders[name]) {
    const module = lazyLoaders[name]();
    return module !== null;
  }
  // Check regular libraries
  return libraries[name] !== null;
}

/**
 * Get a loaded library (with lazy loading support)
 * @param {string} name - Library name
 * @returns {Object|null}
 */
function get(name) {
  // Check lazy loaders first
  if (lazyLoaders[name]) {
    return lazyLoaders[name]();
  }
  // Return from regular libraries
  return libraries[name];
}

// Create getters/setters for lazy-loaded modules that load on first access
// Support both lazy loading and test mocking
let languageAnalyzerOverride = null;
let communicationProfileOverride = null;

const languageAnalyzerGetter = () => {
  // Allow test overrides
  if (languageAnalyzerOverride !== null) {
    return languageAnalyzerOverride;
  }
  return lazyLoaders.languageAnalyzer();
};

const communicationProfileGetter = () => {
  // Allow test overrides
  if (communicationProfileOverride !== null) {
    return communicationProfileOverride;
  }
  return lazyLoaders.communicationProfile();
};

const languageAnalyzerSetter = value => {
  languageAnalyzerOverride = value;
};

const communicationProfileSetter = value => {
  communicationProfileOverride = value;
};

module.exports = {
  libraries,
  isAvailable,
  get,

  // Direct access for convenience
  // Lazy-loaded modules (load on first access, supports test mocking)
  get languageAnalyzer() {
    return languageAnalyzerGetter();
  },
  set languageAnalyzer(value) {
    languageAnalyzerSetter(value);
  },
  get communicationProfile() {
    return communicationProfileGetter();
  },
  set communicationProfile(value) {
    communicationProfileSetter(value);
  },

  // Eagerly loaded modules
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
