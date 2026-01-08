/**
 * Intervention Learning System
 *
 * Tracks intervention outcomes and learns what works for each user.
 * Adapts coaching style based on past success patterns.
 *
 * Features:
 * - Track intervention outcomes (accepted, rejected, modified)
 * - Learn user preferences (rewrites vs comments, metaphors, etc.)
 * - Identify successful patterns
 * - Store in database for persistence
 *
 * Feature: Contextual Awareness Improvements - Phase 2
 */

const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'interventionLearning',
});

/**
 * Record an intervention outcome
 * @param {string} userId - User ID
 * @param {Object} outcomeData - Outcome details
 * @param {Object} db - Database connection
 * @returns {Promise<Object>} - Updated learning data
 */
async function recordInterventionOutcome(userId, outcomeData, db) {
  if (!userId || !outcomeData) {
    throw new Error('userId and outcomeData are required');
  }

  const normalizedId = userId.toLowerCase();
  const now = new Date().toISOString();

  try {
    // Get current intervention learning data from user_context
    const result = await db.query(
      `SELECT intervention_learning FROM user_context WHERE user_id = $1`,
      [normalizedId]
    );

    let learningData = {
      successful_interventions: [],
      unsuccessful_interventions: [],
      user_preferences: {
        prefers_rewrites_over_comments: null,
        likes_metaphors: null,
        dislikes_clinical_language: null,
        preferred_validation_style: null,
      },
      pattern_success_rates: {},
      last_updated: now,
    };

    if (result.rowCount > 0 && result.rows[0].intervention_learning) {
      const existing = result.rows[0].intervention_learning;
      learningData = typeof existing === 'string' ? JSON.parse(existing) : existing;
    }

    // Record the outcome
    const outcome = {
      timestamp: now,
      intervention_type: outcomeData.type || 'unknown', // 'rewrite', 'comment', 'validation'
      pattern: outcomeData.pattern || 'unknown', // 'schedule_conflict', 'blame_attack', etc.
      outcome: outcomeData.outcome || 'unknown', // 'accepted', 'rejected', 'modified'
      user_feedback: outcomeData.feedback || null, // 'helpful', 'unhelpful', 'too_clinical', etc.
      original_message_preview: (outcomeData.original_message || '').substring(0, 50),
      rewrite_preview: (outcomeData.rewrite || '').substring(0, 50),
    };

    // Add to appropriate list
    if (outcome.outcome === 'accepted' || outcome.user_feedback === 'helpful') {
      learningData.successful_interventions.push(outcome);
      // Keep last 50 successful
      if (learningData.successful_interventions.length > 50) {
        learningData.successful_interventions = learningData.successful_interventions.slice(-50);
      }
    } else if (outcome.outcome === 'rejected' || outcome.user_feedback === 'unhelpful') {
      learningData.unsuccessful_interventions.push(outcome);
      // Keep last 50 unsuccessful
      if (learningData.unsuccessful_interventions.length > 50) {
        learningData.unsuccessful_interventions =
          learningData.unsuccessful_interventions.slice(-50);
      }
    }

    // Update user preferences based on outcomes
    updateUserPreferences(learningData, outcome);

    // Update pattern success rates
    updatePatternSuccessRates(learningData, outcome);

    learningData.last_updated = now;

    // Save to database
    await db.query(
      `INSERT INTO user_context (user_id, intervention_learning, last_profile_update, updated_at)
       VALUES ($1, $2::jsonb, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       intervention_learning = $2::jsonb,
       last_profile_update = $3,
       updated_at = NOW()`,
      [normalizedId, JSON.stringify(learningData), now]
    );

    logger.debug('Log message', {
      value: `✅ InterventionLearning: Recorded ${outcome.outcome} outcome for ${userId}`,
    });
    return learningData;
  } catch (err) {
    logger.error('Log message', {
      arg0: `❌ InterventionLearning: Error recording outcome for ${userId}:`,
      message: err.message,
    });
    throw err;
  }
}

/**
 * Update user preferences based on intervention outcomes
 * @param {Object} learningData - Current learning data
 * @param {Object} outcome - New outcome
 */
function updateUserPreferences(learningData, outcome) {
  const prefs = learningData.user_preferences;

  // Prefers rewrites over comments
  if (outcome.intervention_type === 'rewrite' && outcome.outcome === 'accepted') {
    if (prefs.prefers_rewrites_over_comments === null) {
      prefs.prefers_rewrites_over_comments = true;
    } else if (prefs.prefers_rewrites_over_comments === false) {
      // Update if we see more evidence
      prefs.prefers_rewrites_over_comments = true;
    }
  } else if (outcome.intervention_type === 'comment' && outcome.outcome === 'accepted') {
    if (prefs.prefers_rewrites_over_comments === null) {
      prefs.prefers_rewrites_over_comments = false;
    }
  }

  // Likes metaphors (if insight contains metaphor and was accepted)
  if (outcome.user_feedback && outcome.user_feedback.includes('metaphor')) {
    if (outcome.outcome === 'accepted') {
      prefs.likes_metaphors = true;
    } else {
      prefs.likes_metaphors = false;
    }
  }

  // Dislikes clinical language
  if (
    outcome.user_feedback &&
    (outcome.user_feedback.includes('clinical') ||
      outcome.user_feedback.includes('therapist') ||
      outcome.user_feedback.includes('too formal'))
  ) {
    prefs.dislikes_clinical_language = true;
  }

  // Preferred validation style
  if (outcome.user_feedback && outcome.user_feedback.includes('validation')) {
    if (outcome.outcome === 'accepted') {
      // Extract style preference if mentioned
      if (
        outcome.user_feedback.includes('down to earth') ||
        outcome.user_feedback.includes('friend')
      ) {
        prefs.preferred_validation_style = 'down_to_earth';
      } else if (
        outcome.user_feedback.includes('brief') ||
        outcome.user_feedback.includes('short')
      ) {
        prefs.preferred_validation_style = 'brief';
      }
    }
  }
}

/**
 * Update pattern success rates
 * @param {Object} learningData - Current learning data
 * @param {Object} outcome - New outcome
 */
function updatePatternSuccessRates(learningData, outcome) {
  const pattern = outcome.pattern || 'unknown';
  const rates = learningData.pattern_success_rates || {};

  if (!rates[pattern]) {
    rates[pattern] = {
      total: 0,
      successful: 0,
      failed: 0,
      success_rate: 0,
    };
  }

  rates[pattern].total++;
  if (outcome.outcome === 'accepted' || outcome.user_feedback === 'helpful') {
    rates[pattern].successful++;
  } else if (outcome.outcome === 'rejected' || outcome.user_feedback === 'unhelpful') {
    rates[pattern].failed++;
  }

  rates[pattern].success_rate = rates[pattern].successful / rates[pattern].total;
}

/**
 * Get intervention learning data for a user
 * @param {string} userId - User ID
 * @param {Object} db - Database connection
 * @returns {Promise<Object>} - Learning data
 */
async function getInterventionLearning(userId, db) {
  if (!userId) {
    return getDefaultLearning();
  }

  const normalizedId = userId.toLowerCase();

  try {
    const result = await db.query(
      `SELECT intervention_learning FROM user_context WHERE user_id = $1`,
      [normalizedId]
    );

    if (result.rowCount === 0 || !result.rows[0].intervention_learning) {
      return getDefaultLearning();
    }

    const learning = result.rows[0].intervention_learning;
    return typeof learning === 'string' ? JSON.parse(learning) : learning;
  } catch (err) {
    logger.error('Log message', {
      arg0: `❌ InterventionLearning: Error loading learning for ${userId}:`,
      message: err.message,
    });
    return getDefaultLearning();
  }
}

/**
 * Get default learning data
 * @returns {Object} - Default learning structure
 */
function getDefaultLearning() {
  return {
    successful_interventions: [],
    unsuccessful_interventions: [],
    user_preferences: {
      prefers_rewrites_over_comments: null,
      likes_metaphors: null,
      dislikes_clinical_language: null,
      preferred_validation_style: null,
    },
    pattern_success_rates: {},
    last_updated: null,
  };
}

/**
 * Get coaching recommendations based on learning
 * @param {Object} learningData - Learning data
 * @returns {Array<string>} - Coaching recommendations
 */
function getCoachingRecommendations(learningData) {
  const recommendations = [];
  const prefs = learningData.user_preferences || {};

  // Rewrite preference
  if (prefs.prefers_rewrites_over_comments === true) {
    recommendations.push('User prefers rewrites over comments - prioritize actionable rewrites');
  } else if (prefs.prefers_rewrites_over_comments === false) {
    recommendations.push('User prefers comments over rewrites - use comments when appropriate');
  }

  // Metaphor preference
  if (prefs.likes_metaphors === true) {
    recommendations.push('User responds well to metaphors and analogies');
  } else if (prefs.likes_metaphors === false) {
    recommendations.push('User may not respond well to metaphors - use direct observations');
  }

  // Clinical language
  if (prefs.dislikes_clinical_language === true) {
    recommendations.push('Avoid clinical language - use down-to-earth, friend-like tone');
  }

  // Validation style
  if (prefs.preferred_validation_style === 'down_to_earth') {
    recommendations.push('Use down-to-earth validation style (friend who gets it, not therapist)');
  } else if (prefs.preferred_validation_style === 'brief') {
    recommendations.push('Keep validation brief and concise');
  }

  // Pattern success rates
  const rates = learningData.pattern_success_rates || {};
  const successfulPatterns = Object.entries(rates)
    .filter(([_, data]) => data.success_rate > 0.7)
    .map(([pattern, _]) => pattern);

  if (successfulPatterns.length > 0) {
    recommendations.push(`Successful patterns for this user: ${successfulPatterns.join(', ')}`);
  }

  const failedPatterns = Object.entries(rates)
    .filter(([_, data]) => data.total >= 3 && data.success_rate < 0.3)
    .map(([pattern, _]) => pattern);

  if (failedPatterns.length > 0) {
    recommendations.push(`Avoid these patterns: ${failedPatterns.join(', ')}`);
  }

  return recommendations;
}

/**
 * Format learning data for AI prompt
 * @param {Object} learningData - Learning data
 * @returns {string} - Formatted string for AI prompt
 */
function formatLearningForAI(learningData) {
  if (!learningData || learningData.successful_interventions.length === 0) {
    return '';
  }

  const recommendations = getCoachingRecommendations(learningData);
  if (recommendations.length === 0) {
    return '';
  }

  const parts = [];
  parts.push('=== INTERVENTION LEARNING (adapt coaching based on what works) ===');
  parts.push(...recommendations);
  parts.push('=== END LEARNING ===');

  return parts.join('\n');
}

module.exports = {
  recordInterventionOutcome,
  getInterventionLearning,
  getCoachingRecommendations,
  formatLearningForAI,
  getDefaultLearning,
};
