/**
 * Profile Loader
 *
 * Loads user communication profiles from the database.
 * Implements lazy initialization - profiles are created on first access.
 *
 * Updated: 2024-12-23 to use normalized tables via PostgresCommunicationRepository
 *
 * Feature: 002-sender-profile-mediation
 */

const { PostgresCommunicationRepository } = require('../../../repositories/postgres');

// Singleton repository instance
const communicationRepo = new PostgresCommunicationRepository();

const DEFAULT_PROFILE = {
  communication_patterns: {
    tone_tendencies: [],
    common_phrases: [],
    avg_message_length: 0,
    message_count: 0,
  },
  triggers: {
    topics: [],
    phrases: [],
    intensity: 0,
  },
  successful_rewrites: [],
  intervention_history: {
    total_interventions: 0,
    accepted_count: 0,
    rejected_count: 0,
    acceptance_rate: 0,
    last_intervention: null,
  },
  profile_version: 1,
  last_profile_update: null,
};

/**
 * Get a single user's communication profile
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 *
 * @param {string} userId - User ID (username)
 * @param {Object} db - Database connection (dbPostgres) - kept for backward compatibility, but not used
 * @returns {Promise<Object>} - User's communication profile
 */
async function getProfile(userId, db) {
  if (!userId) {
    console.warn('⚠️ ProfileLoader: No userId provided');
    return { ...DEFAULT_PROFILE, user_id: null };
  }

  try {
    // Use the new normalized tables via repository
    const profile = await communicationRepo.getCommunicationProfile(userId);

    if (profile.is_new) {
      console.log(`📊 ProfileLoader: No profile for ${userId}, using defaults`);
    }

    return profile;
  } catch (err) {
    console.error(`❌ ProfileLoader: Error loading profile for ${userId}:`, err.message);
    // Return default profile on error (graceful degradation)
    return {
      ...DEFAULT_PROFILE,
      user_id: userId.toLowerCase(),
      is_new: true,
      load_error: err.message,
    };
  }
}

/**
 * Get multiple user profiles efficiently
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 *
 * @param {string[]} userIds - Array of user IDs
 * @param {Object} db - Database connection - kept for backward compatibility, but not used
 * @returns {Promise<Map<string, Object>>} - Map of userId -> profile
 */
async function getProfiles(userIds, db) {
  const profiles = new Map();

  if (!userIds || userIds.length === 0) {
    return profiles;
  }

  const normalizedIds = userIds.map(id => id.toLowerCase());

  try {
    // Load profiles individually using the repository
    // TODO: Optimize with batch loading in PostgresCommunicationRepository
    const promises = normalizedIds.map(async userId => {
      const profile = await communicationRepo.getCommunicationProfile(userId);
      return { userId, profile };
    });

    const results = await Promise.all(promises);

    for (const { userId, profile } of results) {
      profiles.set(userId, profile);
    }

    console.log(`📊 ProfileLoader: Loaded ${profiles.size} profiles`);
    return profiles;
  } catch (err) {
    console.error('❌ ProfileLoader: Error batch loading profiles:', err.message);
    // Return default profiles on error
    for (const userId of normalizedIds) {
      profiles.set(userId, {
        ...DEFAULT_PROFILE,
        user_id: userId,
        is_new: true,
        load_error: err.message,
      });
    }
    return profiles;
  }
}

module.exports = {
  getProfile,
  getProfiles,
  // Deprecated aliases - use getProfile/getProfiles instead
  loadProfile: getProfile,
  loadProfiles: getProfiles,
  DEFAULT_PROFILE,
};
