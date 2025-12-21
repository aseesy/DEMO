/**
 * Profile Persister
 *
 * Handles saving and updating user communication profiles.
 * Implements atomic updates to prevent data loss.
 *
 * Feature: 002-sender-profile-mediation
 */

/**
 * Update a user's communication profile
 * @param {string} userId - User ID (username)
 * @param {Object} updates - Profile fields to update
 * @param {Object} db - Database connection
 * @returns {Promise<Object>} - Updated profile
 */
async function updateProfile(userId, updates, db) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const normalizedId = userId.toLowerCase();
  const now = new Date().toISOString();

  try {
    // Build SET clause dynamically based on provided updates
    const setClauses = [];
    const values = [normalizedId];
    let paramIndex = 2;

    if (updates.communication_patterns !== undefined) {
      setClauses.push(`communication_patterns = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(updates.communication_patterns));
      paramIndex++;
    }

    if (updates.triggers !== undefined) {
      setClauses.push(`triggers = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(updates.triggers));
      paramIndex++;
    }

    if (updates.successful_rewrites !== undefined) {
      setClauses.push(`successful_rewrites = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(updates.successful_rewrites));
      paramIndex++;
    }

    if (updates.intervention_history !== undefined) {
      setClauses.push(`intervention_history = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(updates.intervention_history));
      paramIndex++;
    }

    // Always update timestamp and version
    setClauses.push(`last_profile_update = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    setClauses.push(`profile_version = COALESCE(profile_version, 0) + 1`);

    if (setClauses.length === 0) {
      console.warn('⚠️ ProfilePersister: No updates provided');
      return null;
    }

    // Upsert: Insert if not exists, update if exists
    const result = await db.query(
      `INSERT INTO user_context (user_id, ${Object.keys(updates)
        .filter(k => updates[k] !== undefined)
        .join(', ')}, last_profile_update, profile_version, updated_at)
       VALUES ($1, ${values
         .slice(1, -1)
         .map((_, i) => `$${i + 2}`)
         .join(', ')}, $${paramIndex - 1}, 1, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       ${setClauses.join(', ')},
       updated_at = NOW()
       RETURNING *`,
      values
    );

    console.log(`✅ ProfilePersister: Updated profile for ${userId}`);
    return result.rows[0];
  } catch (err) {
    console.error(`❌ ProfilePersister: Error updating profile for ${userId}:`, err.message);
    throw err;
  }
}

/**
 * Record an AI intervention for a user
 * @param {string} userId - User ID
 * @param {Object} interventionData - Intervention details
 * @param {Object} db - Database connection
 * @returns {Promise<Object>} - Updated intervention history
 */
async function recordIntervention(userId, interventionData, db) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const normalizedId = userId.toLowerCase();
  const now = new Date().toISOString();

  try {
    // First, get current intervention history
    const current = await db.query(
      `SELECT intervention_history FROM user_context WHERE user_id = $1`,
      [normalizedId]
    );

    let history = {
      total_interventions: 0,
      accepted_count: 0,
      rejected_count: 0,
      acceptance_rate: 0,
      last_intervention: null,
      recent_interventions: [],
    };

    if (current.rowCount > 0 && current.rows[0].intervention_history) {
      const existing = current.rows[0].intervention_history;
      history = typeof existing === 'string' ? JSON.parse(existing) : existing;
    }

    // Update history
    history.total_interventions = (history.total_interventions || 0) + 1;
    history.last_intervention = now;

    // Track recent interventions (keep last 20)
    if (!history.recent_interventions) {
      history.recent_interventions = [];
    }
    history.recent_interventions.unshift({
      timestamp: now,
      type: interventionData.type || 'suggestion',
      escalation_level: interventionData.escalation_level || 'unknown',
      message_preview: (interventionData.original_message || '').substring(0, 50),
    });
    if (history.recent_interventions.length > 20) {
      history.recent_interventions = history.recent_interventions.slice(0, 20);
    }

    // Upsert the updated history
    await db.query(
      `INSERT INTO user_context (user_id, intervention_history, last_profile_update, updated_at)
       VALUES ($1, $2::jsonb, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       intervention_history = $2::jsonb,
       last_profile_update = $3,
       updated_at = NOW()`,
      [normalizedId, JSON.stringify(history), now]
    );

    console.log(
      `✅ ProfilePersister: Recorded intervention for ${userId} (total: ${history.total_interventions})`
    );
    return history;
  } catch (err) {
    console.error(`❌ ProfilePersister: Error recording intervention for ${userId}:`, err.message);
    throw err;
  }
}

/**
 * Record when a user accepts an AI rewrite suggestion
 * @param {string} userId - User ID
 * @param {Object} rewriteData - Rewrite details {original, rewrite, tip}
 * @param {Object} db - Database connection
 * @returns {Promise<Object>} - Updated profile
 */
async function recordAcceptedRewrite(userId, rewriteData, db) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const normalizedId = userId.toLowerCase();
  const now = new Date().toISOString();

  try {
    // Get current successful_rewrites and intervention_history
    const current = await db.query(
      `SELECT successful_rewrites, intervention_history FROM user_context WHERE user_id = $1`,
      [normalizedId]
    );

    let rewrites = [];
    let history = {
      total_interventions: 0,
      accepted_count: 0,
      rejected_count: 0,
      acceptance_rate: 0,
    };

    if (current.rowCount > 0) {
      const row = current.rows[0];
      if (row.successful_rewrites) {
        rewrites =
          typeof row.successful_rewrites === 'string'
            ? JSON.parse(row.successful_rewrites)
            : row.successful_rewrites;
      }
      if (row.intervention_history) {
        history =
          typeof row.intervention_history === 'string'
            ? JSON.parse(row.intervention_history)
            : row.intervention_history;
      }
    }

    // Add the new accepted rewrite (keep last 50)
    rewrites.unshift({
      original: rewriteData.original,
      rewrite: rewriteData.rewrite,
      tip: rewriteData.tip,
      accepted_at: now,
    });
    if (rewrites.length > 50) {
      rewrites = rewrites.slice(0, 50);
    }

    // Update acceptance stats
    history.accepted_count = (history.accepted_count || 0) + 1;
    if (history.total_interventions > 0) {
      history.acceptance_rate = history.accepted_count / history.total_interventions;
    }

    // Upsert
    await db.query(
      `INSERT INTO user_context (user_id, successful_rewrites, intervention_history, last_profile_update, updated_at)
       VALUES ($1, $2::jsonb, $3::jsonb, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       successful_rewrites = $2::jsonb,
       intervention_history = $3::jsonb,
       last_profile_update = $4,
       updated_at = NOW()`,
      [normalizedId, JSON.stringify(rewrites), JSON.stringify(history), now]
    );

    console.log(
      `✅ ProfilePersister: Recorded accepted rewrite for ${userId} (total accepted: ${history.accepted_count})`
    );
    return { successful_rewrites: rewrites, intervention_history: history };
  } catch (err) {
    console.error(
      `❌ ProfilePersister: Error recording accepted rewrite for ${userId}:`,
      err.message
    );
    throw err;
  }
}

module.exports = {
  updateProfile,
  recordIntervention,
  recordAcceptedRewrite,
};
