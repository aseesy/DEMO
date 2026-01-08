const dbSafe = require('../../../../dbSafe');
const { defaultLogger } = require('../../infrastructure/logging/logger');
const { OperationalError } = require('../../../infrastructure/errors/errors');
const {
  VALIDATION,
  DATABASE,
  ARRAY_LIMITS,
  CONFIDENCE,
  ESCALATION,
} = require('../../../infrastructure/config/constants');

/**
 * Feedback learning system for adaptive improvement
 * Tracks explicit feedback (flags, "not helpful") and implicit feedback (ignored suggestions, rewrites not used)
 */

/**
 * Record explicit feedback from user
 * @param {string} username - User providing feedback
 * @param {string} feedbackType - 'flag', 'not_helpful', 'helpful', 'override'
 * @param {Object} context - Context about what was feedback on
 * @param {string} reason - Optional reason for feedback
 */
async function recordExplicitFeedback(username, feedbackType, context, reason = null) {
  const logger = defaultLogger.child({
    operation: 'recordExplicitFeedback',
    username,
    feedbackType,
  });

  try {
    const db = require('../../../dbPostgres');

    // Get user ID
    const userResult = await dbSafe.safeSelect(
      'users',
      { username: username.toLowerCase() },
      { limit: DATABASE.DEFAULT_LIMIT }
    );
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      logger.warn('User not found for feedback recording', { username });
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          type: 'operational',
        },
      };
    }

    const userId = users[0].id;

    // Schema changes must be done via migrations, not runtime creation
    // user_feedback table is created by migration 001_initial_schema.sql
    // If table is missing, migration needs to be run explicitly

    // Record feedback
    await dbSafe.safeInsert('user_feedback', {
      user_id: userId,
      feedback_type: feedbackType,
      context_json: JSON.stringify(context),
      reason: reason,
      created_at: new Date().toISOString(),
    });

    logger.info('Feedback recorded successfully', {
      userId,
      feedbackType,
      hasReason: !!reason,
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to record explicit feedback', error, {
      username,
      feedbackType,
      hasContext: !!context,
      hasReason: !!reason,
    });

    // Return structured error instead of silent failure
    return {
      success: false,
      error: {
        code: 'FEEDBACK_RECORDING_FAILED',
        message: 'Failed to record feedback',
        type:
          error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' ? 'retryable' : 'operational',
        retryable: error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED',
      },
    };
  }
}

/**
 * Record implicit feedback (user ignored suggestion, didn't use rewrite, etc.)
 * @param {string} username - User
 * @param {string} implicitType - 'ignored_suggestion', 'skipped_rewrite', 'sent_anyway'
 * @param {Object} context - Context about what was ignored
 */
async function recordImplicitFeedback(username, implicitType, context) {
  const logger = defaultLogger.child({
    operation: 'recordImplicitFeedback',
    username,
    implicitType,
  });

  try {
    const result = await recordExplicitFeedback(username, `implicit_${implicitType}`, context);
    if (!result.success) {
      logger.warn('Failed to record implicit feedback', {
        error: result.error,
      });
    }
    return result;
  } catch (error) {
    logger.error('Error recording implicit feedback', error, {
      username,
      implicitType,
    });
    return {
      success: false,
      error: {
        code: 'IMPLICIT_FEEDBACK_RECORDING_FAILED',
        message: 'Failed to record implicit feedback',
        type: 'operational',
      },
    };
  }
}

/**
 * Get feedback summary for a user to inform adaptation
 * @param {string} username - Username
 * @returns {Promise<Object>} - Feedback summary
 */
async function getFeedbackSummary(username) {
  const logger = defaultLogger.child({
    operation: 'getFeedbackSummary',
    username,
  });

  try {
    const userResult = await dbSafe.safeSelect(
      'users',
      { username: username.toLowerCase() },
      { limit: DATABASE.DEFAULT_LIMIT }
    );
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      logger.warn('User not found for feedback summary', { username });
      return null;
    }

    const userId = users[0].id;

    // Get recent feedback (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - VALIDATION.FEEDBACK_LOOKBACK_DAYS);

    const feedbackResult = await dbSafe.safeSelect(
      'user_feedback',
      {
        user_id: userId,
      },
      {
        orderBy: 'created_at',
        orderDirection: 'DESC',
        limit: DATABASE.FEEDBACK_QUERY_LIMIT,
      }
    );

    const feedbacks = dbSafe.parseResult(feedbackResult);

    // Analyze feedback patterns
    const feedbackCounts = {};
    const recentNegative = [];
    const recentPositive = [];

    feedbacks.forEach(f => {
      feedbackCounts[f.feedback_type] = (feedbackCounts[f.feedback_type] || 0) + 1;

      if (
        f.feedback_type === 'not_helpful' ||
        f.feedback_type === 'flag' ||
        f.feedback_type.startsWith('implicit_')
      ) {
        recentNegative.push(f);
      } else if (f.feedback_type === 'helpful') {
        recentPositive.push(f);
      }
    });

    const summary = {
      totalFeedback: feedbacks.length,
      feedbackCounts: feedbackCounts,
      recentNegative: recentNegative.slice(0, ARRAY_LIMITS.RECENT_NEGATIVE_FEEDBACK),
      recentPositive: recentPositive.slice(0, ARRAY_LIMITS.RECENT_POSITIVE_FEEDBACK),
      negativeRatio: feedbacks.length > 0 ? recentNegative.length / feedbacks.length : 0,
      lastFeedback: feedbacks[0] || null,
    };

    logger.debug('Feedback summary retrieved', {
      userId,
      totalFeedback: summary.totalFeedback,
      negativeRatio: summary.negativeRatio,
    });

    return summary;
  } catch (error) {
    logger.error('Error getting feedback summary', error, {
      username,
    });
    return null;
  }
}

/**
 * Learn from feedback and generate adaptation recommendations
 * @param {string} username - Username
 * @returns {Promise<Object>} - Adaptation recommendations
 */
async function generateAdaptationRecommendations(username) {
  const summary = await getFeedbackSummary(username);
  if (!summary || summary.totalFeedback === 0) {
    return {
      interventionFrequency: 'moderate',
      interventionStyle: 'moderate',
      preferredTone: 'warm',
      confidence: 0,
    };
  }

  // If high negative ratio, be more conservative
  const shouldBeConservative = summary.negativeRatio > ESCALATION.CONSERVATIVE_THRESHOLD;

  // Analyze what types of interventions were not helpful
  const unhelpfulTypes = summary.recentNegative
    .map(f => {
      try {
        const context = JSON.parse(f.context_json || '{}');
        return context.interventionType || 'unknown';
      } catch {
        return 'unknown';
      }
    })
    .filter(t => t !== 'unknown');

  const interventionFrequency = shouldBeConservative ? 'minimal' : 'moderate';
  const interventionStyle = shouldBeConservative ? 'gentle' : 'moderate';

  return {
    interventionFrequency: interventionFrequency,
    interventionStyle: interventionStyle,
    preferredTone: 'warm',
    avoidTypes: [...new Set(unhelpfulTypes)],
    confidence: Math.min(
      CONFIDENCE.MAX_CONFIDENCE,
      summary.totalFeedback * CONFIDENCE.FEEDBACK_MULTIPLIER
    ),
    reasoning: `Based on ${summary.totalFeedback} feedback points, ${shouldBeConservative ? 'being more conservative' : 'maintaining moderate approach'}`,
  };
}

module.exports = {
  recordExplicitFeedback,
  recordImplicitFeedback,
  getFeedbackSummary,
  generateAdaptationRecommendations,
};
