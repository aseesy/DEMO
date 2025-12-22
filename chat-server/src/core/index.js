/**
 * LiaiZen - AI Mediation Intelligence System
 *
 * Main entry point for the LiaiZen namespace.
 * Exports all LiaiZen components organized by category.
 */

module.exports = {
  // Core
  mediator: require('./core/mediator'),
  client: require('./core/client'),

  // Agents
  proactiveCoach: require('./agents/proactiveCoach'),
  feedbackLearner: require('./agents/feedbackLearner'),

  // Policies
  safety: require('./policies/safety'),

  // Context
  communicationProfile: require('./context/communication-profile'),
  userContext: require('./context/userContext'),

  // Analysis
  languageAnalyzer: require('./analysis/language-analyzer'),
  rewriteValidator: require('./analysis/rewrite-validator'),

  // Intelligence
  contactIntelligence: require('./intelligence/contactIntelligence'),

  // Metrics
  communicationStats: require('./metrics/communicationStats'),
};
