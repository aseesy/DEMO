/**
 * Profile Loader
 *
 * Loads user communication profiles from the database.
 * Implements lazy initialization - profiles are created on first access.
 *
 * Feature: 002-sender-profile-mediation
 */

const { defaultLogger } = require('../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'profileLoader',
});

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
 * @param {Object} db - Database connection (dbPostgres)
 * @returns {Promise<Object>} - User's communication profile
 */
async function getProfile(userId, db) {
  if (!userId) {
    logger.warn('⚠️ ProfileLoader: No userId provided');
    return { ...DEFAULT_PROFILE, user_id: null };
  }

  try {
    const result = await db.query(
      `SELECT
        user_id,
        communication_patterns,
        triggers,
        successful_rewrites,
        intervention_history,
        profile_version,
        last_profile_update
      FROM user_context
      WHERE user_id = $1`,
      [userId.toLowerCase()]
    );

    if (result.rowCount === 0) {
      // Lazy initialization: Return default profile (will be created on first update)
      logger.debug('Log message', {
        value: `📊 ProfileLoader: No profile for ${userId}, using defaults`,
      });
      return {
        ...DEFAULT_PROFILE,
        user_id: userId.toLowerCase(),
        is_new: true,
      };
    }

    const row = result.rows[0];

    // Parse JSONB fields (may already be objects or strings)
    const parseJsonField = (field, defaultValue) => {
      if (!field) return defaultValue;
      if (typeof field === 'object') return field;
      try {
        return JSON.parse(field);
      } catch (e) {
        logger.warn('Log message', {
          arg0: `⚠️ ProfileLoader: Failed to parse JSON field`,
          message: e.message,
        });
        return defaultValue;
      }
    };

    return {
      user_id: row.user_id,
      communication_patterns: parseJsonField(
        row.communication_patterns,
        DEFAULT_PROFILE.communication_patterns
      ),
      triggers: parseJsonField(row.triggers, DEFAULT_PROFILE.triggers),
      successful_rewrites: parseJsonField(
        row.successful_rewrites,
        DEFAULT_PROFILE.successful_rewrites
      ),
      intervention_history: parseJsonField(
        row.intervention_history,
        DEFAULT_PROFILE.intervention_history
      ),
      profile_version: row.profile_version || 1,
      last_profile_update: row.last_profile_update,
      is_new: false,
    };
  } catch (err) {
    logger.error('Log message', {
      arg0: `❌ ProfileLoader: Error loading profile for ${userId}:`,
      message: err.message,
    });
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
 * @param {Object} db - Database connection
 * @returns {Promise<Map<string, Object>>} - Map of userId -> profile
 */
async function getProfiles(userIds, db) {
  const profiles = new Map();

  if (!userIds || userIds.length === 0) {
    return profiles;
  }

  const normalizedIds = userIds.map(id => id.toLowerCase());

  try {
    // Batch load for efficiency
    const placeholders = normalizedIds.map((_, i) => `$${i + 1}`).join(', ');
    const result = await db.query(
      `SELECT
        user_id,
        communication_patterns,
        triggers,
        successful_rewrites,
        intervention_history,
        profile_version,
        last_profile_update
      FROM user_context
      WHERE user_id IN (${placeholders})`,
      normalizedIds
    );

    // Parse results
    for (const row of result.rows) {
      const parseJsonField = (field, defaultValue) => {
        if (!field) return defaultValue;
        if (typeof field === 'object') return field;
        try {
          return JSON.parse(field);
        } catch (e) {
          return defaultValue;
        }
      };

      profiles.set(row.user_id, {
        user_id: row.user_id,
        communication_patterns: parseJsonField(
          row.communication_patterns,
          DEFAULT_PROFILE.communication_patterns
        ),
        triggers: parseJsonField(row.triggers, DEFAULT_PROFILE.triggers),
        successful_rewrites: parseJsonField(
          row.successful_rewrites,
          DEFAULT_PROFILE.successful_rewrites
        ),
        intervention_history: parseJsonField(
          row.intervention_history,
          DEFAULT_PROFILE.intervention_history
        ),
        profile_version: row.profile_version || 1,
        last_profile_update: row.last_profile_update,
        is_new: false,
      });
    }

    // Add default profiles for users not found
    for (const userId of normalizedIds) {
      if (!profiles.has(userId)) {
        profiles.set(userId, {
          ...DEFAULT_PROFILE,
          user_id: userId,
          is_new: true,
        });
      }
    }

    logger.debug('Log message', {
      value: `📊 ProfileLoader: Loaded ${profiles.size} profiles`,
    });
    return profiles;
  } catch (err) {
    logger.error('❌ ProfileLoader: Error batch loading profiles', {
      message: err.message,
    });
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
