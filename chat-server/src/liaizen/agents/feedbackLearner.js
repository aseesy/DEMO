const dbSafe = require('../../../dbSafe');

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
  try {
    const db = await require('../../../db').getDb();
    
    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);
    if (users.length === 0) return;

    const userId = users[0].id;

    // Check if feedback table exists, create if not
    try {
      await dbSafe.safeSelect('user_feedback', { user_id: userId }, { limit: 1 });
    } catch (e) {
      // Table doesn't exist, create it
      db.run(`
        CREATE TABLE IF NOT EXISTS user_feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          feedback_type TEXT NOT NULL,
          context_json TEXT,
          reason TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      db.run(`CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(user_id)`);
      require('../../../db').saveDatabase();
    }

    // Record feedback
    await dbSafe.safeInsert('user_feedback', {
      user_id: userId,
      feedback_type: feedbackType,
      context_json: JSON.stringify(context),
      reason: reason,
      created_at: new Date().toISOString()
    });

    require('./db').saveDatabase();
    console.log(`📝 Recorded ${feedbackType} feedback from ${username}`);

  } catch (error) {
    console.error('Error recording explicit feedback:', error.message);
  }
}

/**
 * Record implicit feedback (user ignored suggestion, didn't use rewrite, etc.)
 * @param {string} username - User
 * @param {string} implicitType - 'ignored_suggestion', 'skipped_rewrite', 'sent_anyway'
 * @param {Object} context - Context about what was ignored
 */
async function recordImplicitFeedback(username, implicitType, context) {
  try {
    await recordExplicitFeedback(username, `implicit_${implicitType}`, context);
  } catch (error) {
    console.error('Error recording implicit feedback:', error.message);
  }
}

/**
 * Get feedback summary for a user to inform adaptation
 * @param {string} username - Username
 * @returns {Promise<Object>} - Feedback summary
 */
async function getFeedbackSummary(username) {
  try {
    const db = await require('../../../db').getDb();
    
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);
    if (users.length === 0) return null;

    const userId = users[0].id;

    // Get recent feedback (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const feedbackResult = await dbSafe.safeSelect('user_feedback', {
      user_id: userId
    }, {
      orderBy: 'created_at',
      orderDirection: 'DESC',
      limit: 50
    });

    const feedbacks = dbSafe.parseResult(feedbackResult);

    // Analyze feedback patterns
    const feedbackCounts = {};
    const recentNegative = [];
    const recentPositive = [];

    feedbacks.forEach(f => {
      feedbackCounts[f.feedback_type] = (feedbackCounts[f.feedback_type] || 0) + 1;
      
      if (f.feedback_type === 'not_helpful' || f.feedback_type === 'flag' || f.feedback_type.startsWith('implicit_')) {
        recentNegative.push(f);
      } else if (f.feedback_type === 'helpful') {
        recentPositive.push(f);
      }
    });

    return {
      totalFeedback: feedbacks.length,
      feedbackCounts: feedbackCounts,
      recentNegative: recentNegative.slice(0, 10),
      recentPositive: recentPositive.slice(0, 10),
      negativeRatio: feedbacks.length > 0 ? recentNegative.length / feedbacks.length : 0,
      lastFeedback: feedbacks[0] || null
    };

  } catch (error) {
    console.error('Error getting feedback summary:', error.message);
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
      confidence: 0
    };
  }

  // If high negative ratio, be more conservative
  const shouldBeConservative = summary.negativeRatio > 0.5;
  
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
    confidence: Math.min(100, summary.totalFeedback * 10),
    reasoning: `Based on ${summary.totalFeedback} feedback points, ${shouldBeConservative ? 'being more conservative' : 'maintaining moderate approach'}`
  };
}

module.exports = {
  recordExplicitFeedback,
  recordImplicitFeedback,
  getFeedbackSummary,
  generateAdaptationRecommendations
};

