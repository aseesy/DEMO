/**
 * Profile Persister
 *
 * Handles saving and updating user communication profiles.
 * Implements atomic updates to prevent data loss.
 *
 * Updated: 2024-12-23 to use normalized tables via PostgresCommunicationRepository
 *
 * Feature: 002-sender-profile-mediation
 */

const { PostgresCommunicationRepository } = require('../../../repositories/postgres');

const { defaultLogger: defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'profilePersister',
});

// Singleton repository instance
const communicationRepo = new PostgresCommunicationRepository();

/**
 * Update a user's communication profile
 *
 * CQS NOTE: Returns updated profile for caller convenience (avoids separate query).
 * Use profileLoader.loadProfile() to query separately if needed.
 *
 * @param {string} userId - User ID (username)
 * @param {Object} updates - Profile fields to update
 * @param {Object} db - Database connection - kept for backward compatibility, but not used
 * @returns {Promise<Object>} - Updated profile (for convenience)
 */
async function updateProfile(userId, updates, db) {
  if (!userId) {
    throw new Error('userId is required');
  }

  try {
    // Update communication patterns if provided
    if (updates.communication_patterns !== undefined) {
      await communicationRepo.updateCommunicationPatterns(userId, updates.communication_patterns);
    }

    // Update triggers if provided
    if (updates.triggers !== undefined) {
      const triggers = updates.triggers;
      // Record each topic and phrase as individual triggers
      if (triggers.topics) {
        for (const topic of triggers.topics) {
          await communicationRepo.recordTrigger(userId, 'topic', topic, triggers.intensity || 0.5);
        }
      }
      if (triggers.phrases) {
        for (const phrase of triggers.phrases) {
          await communicationRepo.recordTrigger(
            userId,
            'phrase',
            phrase,
            triggers.intensity || 0.5
          );
        }
      }
    }

    // Note: successful_rewrites and intervention_history are updated via
    // recordAcceptedRewrite and recordIntervention respectively

    logger.debug('Log message', {
      value: `✅ ProfilePersister: Updated profile for ${userId}`,
    });

    // Return the updated profile
    return communicationRepo.getCommunicationProfile(userId);
  } catch (err) {
    logger.error('Log message', {
      arg0: `❌ ProfilePersister: Error updating profile for ${userId}:`,
      message: err.message,
    });
    throw err;
  }
}

/**
 * Record an AI intervention for a user
 *
 * CQS NOTE: Returns updated intervention history for caller convenience.
 * The returned history includes computed statistics (totals, rates).
 *
 * @param {string} userId - User ID
 * @param {Object} interventionData - Intervention details
 * @param {Object} db - Database connection - kept for backward compatibility, but not used
 * @returns {Promise<Object>} - Updated intervention history (for convenience)
 */
async function recordIntervention(userId, interventionData, db) {
  if (!userId) {
    throw new Error('userId is required');
  }

  try {
    // Record the intervention using the repository
    const stats = await communicationRepo.recordIntervention(userId, interventionData);

    // Build the response in the expected format
    const history = {
      total_interventions: stats.total_interventions || 0,
      accepted_count: stats.accepted_count || 0,
      rejected_count: stats.rejected_count || 0,
      acceptance_rate:
        stats.total_interventions > 0 ? stats.accepted_count / stats.total_interventions : 0,
      last_intervention: stats.last_intervention_at,
    };

    logger.debug('Log message', {
      value: `✅ ProfilePersister: Recorded intervention for ${userId} (total: ${history.total_interventions})`,
    });
    return history;
  } catch (err) {
    logger.error('Log message', {
      arg0: `❌ ProfilePersister: Error recording intervention for ${userId}:`,
      message: err.message,
    });
    throw err;
  }
}

/**
 * Record when a user accepts an AI rewrite suggestion
 *
 * CQS NOTE: Returns updated rewrites and history for caller convenience.
 * Includes computed acceptance rate statistics.
 *
 * @param {string} userId - User ID
 * @param {Object} rewriteData - Rewrite details {original, rewrite, tip}
 * @param {Object} db - Database connection - kept for backward compatibility, but not used
 * @returns {Promise<Object>} - Updated rewrites and history (for convenience)
 */
async function recordAcceptedRewrite(userId, rewriteData, db) {
  if (!userId) {
    throw new Error('userId is required');
  }

  try {
    // Record the accepted rewrite using the repository
    const stats = await communicationRepo.recordAcceptedRewrite(userId, rewriteData);

    // Get the updated profile for the full response
    const profile = await communicationRepo.getCommunicationProfile(userId);

    logger.debug('Log message', {
      value: `✅ ProfilePersister: Recorded accepted rewrite for ${userId} (total accepted: ${stats.accepted_count})`,
    });

    return {
      successful_rewrites: profile.successful_rewrites,
      intervention_history: profile.intervention_history,
    };
  } catch (err) {
    logger.error('Log message', {
      arg0: `❌ ProfilePersister: Error recording accepted rewrite for ${userId}:`,
      message: err.message,
    });
    throw err;
  }
}

module.exports = {
  updateProfile,
  recordIntervention,
  recordAcceptedRewrite,
};
