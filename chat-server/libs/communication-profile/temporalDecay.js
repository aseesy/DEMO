/**
 * Temporal Decay
 *
 * Implements step-function decay for communication patterns.
 * Recent patterns are weighted more heavily than older ones.
 *
 * Decay Thresholds (from research.md):
 * - 0-30 days: weight 1.0 (full relevance)
 * - 31-60 days: weight 0.7 (reduced relevance)
 * - 61-90 days: weight 0.3 (minimal relevance)
 * - >90 days: weight 0.0 (expired, removed)
 *
 * Feature: 002-sender-profile-mediation
 */

const THRESHOLDS = {
  FULL: 30, // 0-30 days: full weight (1.0)
  REDUCED: 60, // 31-60 days: reduced weight (0.7)
  MINIMAL: 90, // 61-90 days: minimal weight (0.3)
  EXPIRED: 90, // >90 days: expired (0.0)
};

const WEIGHTS = {
  FULL: 1.0,
  REDUCED: 0.7,
  MINIMAL: 0.3,
  EXPIRED: 0.0,
};

/**
 * Calculate the decay weight for a given timestamp
 * @param {string|Date} timestamp - When the data was recorded
 * @returns {number} - Weight between 0.0 and 1.0
 */
function calculateWeight(timestamp) {
  if (!timestamp) return WEIGHTS.EXPIRED;

  const recordDate = new Date(timestamp);
  const now = new Date();
  const daysDiff = Math.floor((now - recordDate) / (1000 * 60 * 60 * 24));

  if (daysDiff <= THRESHOLDS.FULL) {
    return WEIGHTS.FULL;
  } else if (daysDiff <= THRESHOLDS.REDUCED) {
    return WEIGHTS.REDUCED;
  } else if (daysDiff <= THRESHOLDS.MINIMAL) {
    return WEIGHTS.MINIMAL;
  } else {
    return WEIGHTS.EXPIRED;
  }
}

/**
 * Apply temporal decay to an array of timestamped items
 * @param {Array} items - Array of items with timestamp field
 * @param {string} timestampField - Name of the timestamp field
 * @returns {Array} - Items with weight > 0, sorted by recency
 */
function applyDecay(items, timestampField = 'timestamp') {
  if (!items || !Array.isArray(items)) return [];

  return items
    .map(item => ({
      ...item,
      _weight: calculateWeight(item[timestampField]),
    }))
    .filter(item => item._weight > 0)
    .sort((a, b) => {
      // Sort by weight (higher first), then by timestamp (newer first)
      if (a._weight !== b._weight) {
        return b._weight - a._weight;
      }
      return new Date(b[timestampField]) - new Date(a[timestampField]);
    });
}

/**
 * Get decayed communication patterns for a profile
 * Weights patterns based on when they were last observed
 * @param {Object} profile - User communication profile
 * @returns {Object} - Decayed patterns with weighted relevance
 */
function getDecayedPatterns(profile) {
  if (!profile) return null;

  const lastUpdate = profile.last_profile_update;
  const baseWeight = calculateWeight(lastUpdate);

  // If profile is too old, return minimal patterns
  if (baseWeight === WEIGHTS.EXPIRED) {
    return {
      tone_tendencies: [],
      common_phrases: [],
      triggers: { topics: [], phrases: [], intensity: 0 },
      relevance_weight: 0,
      is_stale: true,
    };
  }

  const patterns = profile.communication_patterns || {};
  const triggers = profile.triggers || {};

  // Apply decay to successful rewrites
  const decayedRewrites = applyDecay(profile.successful_rewrites || [], 'accepted_at');

  // Apply decay to recent interventions
  const interventionHistory = profile.intervention_history || {};
  const decayedInterventions = applyDecay(
    interventionHistory.recent_interventions || [],
    'timestamp'
  );

  return {
    tone_tendencies: patterns.tone_tendencies || [],
    common_phrases: patterns.common_phrases || [],
    avg_message_length: patterns.avg_message_length || 0,
    triggers: {
      topics: triggers.topics || [],
      phrases: triggers.phrases || [],
      intensity: (triggers.intensity || 0) * baseWeight, // Scale intensity by freshness
    },
    successful_rewrites: decayedRewrites.slice(0, 10), // Keep top 10 most relevant
    recent_interventions: decayedInterventions.slice(0, 5), // Keep top 5
    acceptance_rate: interventionHistory.acceptance_rate || 0,
    relevance_weight: baseWeight,
    is_stale: baseWeight < WEIGHTS.FULL,
    last_updated: lastUpdate,
  };
}

/**
 * Check if a profile needs refresh (data is getting stale)
 * @param {Object} profile - User profile
 * @returns {boolean} - True if profile should be refreshed
 */
function needsRefresh(profile) {
  if (!profile || !profile.last_profile_update) return true;

  const weight = calculateWeight(profile.last_profile_update);
  return weight < WEIGHTS.FULL;
}

module.exports = {
  THRESHOLDS,
  WEIGHTS,
  calculateWeight,
  applyDecay,
  getDecayedPatterns,
  needsRefresh,
};
