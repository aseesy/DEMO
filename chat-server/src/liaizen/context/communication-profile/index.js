/**
 * Communication Profile Library
 *
 * Standalone library for managing user communication profiles.
 * Enables AI mediation to distinguish sender from receiver with
 * individual communication patterns, triggers, and history.
 *
 * Feature: 002-sender-profile-mediation
 * Constitutional Compliance:
 *   - Principle I (Library-First): Standalone module with clear API
 *   - Principle III (Contract-First): Defined interfaces before implementation
 *   - Principle XV (Conflict Reduction): Enables personalized coaching
 */

const profileLoader = require('./profileLoader');
const profilePersister = require('./profilePersister');
const temporalDecay = require('./temporalDecay');
const mediationContext = require('./mediationContext');

module.exports = {
  // Profile Loading
  loadProfile: profileLoader.loadProfile,
  loadProfiles: profileLoader.loadProfiles,

  // Profile Persistence
  updateProfile: profilePersister.updateProfile,
  recordIntervention: profilePersister.recordIntervention,
  recordAcceptedRewrite: profilePersister.recordAcceptedRewrite,

  // Temporal Decay
  applyTemporalDecay: temporalDecay.applyDecay,
  getDecayedPatterns: temporalDecay.getDecayedPatterns,

  // Mediation Context Building
  buildMediationContext: mediationContext.buildContext,
  formatSenderContext: mediationContext.formatSenderContext,
  formatReceiverContext: mediationContext.formatReceiverContext,

  // Constants
  PROFILE_VERSION: 1,
  DECAY_THRESHOLDS: temporalDecay.THRESHOLDS,
};
