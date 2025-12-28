/**
 * LiaiZen - AI Mediation Intelligence System
 *
 * Main entry point for the LiaiZen namespace.
 * Exports all LiaiZen components organized by category.
 */

module.exports = {
  // Core Engine
  mediator: require('./engine/mediator'),
  client: require('./engine/client'),

  // Agents (within intelligence/)
  proactiveCoach: require('./intelligence/agents/proactiveCoach'),
  feedbackLearner: require('./intelligence/agents/feedbackLearner'),

  // Policies
  safety: require('./policies/safety'),

  // Profiles (user-level context data)
  communicationProfile: require('./profiles/communicationProfile'),
  userContext: require('./profiles/userContext'),

  // Analysis
  languageAnalyzer: require('./analysis/languageAnalyzer'),
  rewriteValidator: require('./analysis/rewriteValidator'),

  // Intelligence
  contactIntelligence: require('./intelligence/contactIntelligence'),

  // Metrics (within engine/)
  communicationStats: require('./engine/metrics/communicationStats'),
};
