/**
 * PostgreSQL Communication Repository
 *
 * Provides access to AI communication and intervention data from normalized tables:
 * - communication_profiles (tone patterns, vocabulary)
 * - communication_triggers (conflict triggers)
 * - intervention_rewrites (accepted AI rewrites)
 * - intervention_statistics (intervention counts and rates)
 *
 * Actor: AI/Coaching Team
 * Responsibility: CRUD for AI learning data
 *
 * @module repositories/postgres/PostgresCommunicationRepository
 */

const { PostgresGenericRepository } = require('./PostgresGenericRepository');
const { withTransaction } = require('../../../dbSafe');

/**
 * PostgreSQL Communication Repository
 * Provides unified access to AI communication learning data
 */
class PostgresCommunicationRepository {
  constructor() {
    this.profiles = new PostgresGenericRepository('communication_profiles');
    this.triggers = new PostgresGenericRepository('communication_triggers');
    this.rewrites = new PostgresGenericRepository('intervention_rewrites');
    this.statistics = new PostgresGenericRepository('intervention_statistics');
    this.users = new PostgresGenericRepository('users');
  }

  /**
   * Get numeric user ID from username
   * @private
   */
  async _getUserId(username) {
    if (!username) return null;
    const user = await this.users.findOne({
      username: username.toLowerCase(),
    });
    return user ? user.id : null;
  }

  /**
   * Get complete communication profile for a user
   * Aggregates data from all AI-related normalized tables
   *
   * @param {string} username - Username
   * @returns {Promise<Object>} Complete AI profile
   */
  async getCommunicationProfile(username) {
    const userId = await this._getUserId(username);
    if (!userId) {
      return this._defaultProfile(username);
    }

    const [profile, triggers, rewrites, statistics] = await Promise.all([
      this.profiles.findOne({ user_id: userId }),
      this.triggers.find({ user_id: userId }, { limit: 20 }),
      // Only fetch accepted rewrites for successful_rewrites
      this.rewrites.find({ user_id: userId, outcome: 'accepted' }, { limit: 50 }),
      this.statistics.findOne({ user_id: userId }),
    ]);

    return {
      user_id: username.toLowerCase(),
      communication_patterns: profile
        ? {
            tone_tendencies: profile.tone_tendencies || [],
            common_phrases: [],
            avg_message_length: profile.avg_message_length || 0,
            message_count: 0,
            vocabulary_complexity: profile.vocabulary_complexity,
            emoji_usage: profile.emoji_usage,
          }
        : this._defaultProfile().communication_patterns,
      triggers: {
        topics: triggers.filter(t => t.trigger_type === 'topic').map(t => t.trigger_value),
        phrases: triggers.filter(t => t.trigger_type === 'phrase').map(t => t.trigger_value),
        intensity: triggers.length > 0
          ? triggers.reduce((sum, t) => sum + parseFloat(t.intensity || 0), 0) / triggers.length
          : 0,
      },
      successful_rewrites: rewrites.map(r => ({
        original: r.original_text,
        rewrite: r.rewrite_text,
        tip: r.pattern_detected,
        accepted_at: r.created_at,
      })),
      intervention_history: statistics
        ? {
            total_interventions: statistics.total_interventions || 0,
            accepted_count: statistics.accepted_count || 0,
            rejected_count: statistics.rejected_count || 0,
            acceptance_rate:
              statistics.total_interventions > 0
                ? statistics.accepted_count / statistics.total_interventions
                : 0,
            last_intervention: statistics.last_intervention_at,
          }
        : this._defaultProfile().intervention_history,
      profile_version: profile ? profile.profile_version : 1,
      last_profile_update: profile ? profile.last_updated : null,
      is_new: !profile && !statistics,
    };
  }

  /**
   * Update communication patterns
   *
   * @param {string} username - Username
   * @param {Object} patterns - Communication patterns to update
   * @returns {Promise<Object>} Updated profile row
   */
  async updateCommunicationPatterns(username, patterns) {
    const userId = await this._getUserId(username);
    if (!userId) {
      throw new Error(`User not found: ${username}`);
    }

    const data = {
      tone_tendencies: patterns.tone_tendencies || [],
      avg_message_length: patterns.avg_message_length || 0,
      vocabulary_complexity: patterns.vocabulary_complexity,
      emoji_usage: patterns.emoji_usage,
      last_updated: new Date().toISOString(),
    };

    const existing = await this.profiles.findOne({ user_id: userId });
    if (existing) {
      data.profile_version = (existing.profile_version || 1) + 1;
      return this.profiles.update({ user_id: userId }, data);
    } else {
      return this.profiles.create({
        user_id: userId,
        ...data,
        profile_version: 1,
        created_at: new Date().toISOString(),
      });
    }
  }

  /**
   * Add or update a trigger
   *
   * @param {string} username - Username
   * @param {string} triggerType - 'topic' | 'phrase' | 'pattern'
   * @param {string} triggerValue - The trigger text
   * @param {number} intensity - Intensity 0-1
   * @returns {Promise<Object>} Created/updated trigger
   */
  async recordTrigger(username, triggerType, triggerValue, intensity = 0.5) {
    const userId = await this._getUserId(username);
    if (!userId) {
      throw new Error(`User not found: ${username}`);
    }

    const existing = await this.triggers.findOne({
      user_id: userId,
      trigger_type: triggerType,
      trigger_value: triggerValue,
    });

    const now = new Date().toISOString();

    if (existing) {
      // Update existing trigger
      return this.triggers.update(
        { id: existing.id },
        {
          intensity: Math.min(1, (parseFloat(existing.intensity) + intensity) / 2),
          detection_count: (existing.detection_count || 1) + 1,
          last_detected: now,
        }
      );
    } else {
      // Create new trigger
      return this.triggers.create({
        user_id: userId,
        trigger_type: triggerType,
        trigger_value: triggerValue,
        intensity,
        detection_count: 1,
        last_detected: now,
        created_at: now,
      });
    }
  }

  /**
   * Record an intervention
   *
   * @param {string} username - Username
   * @param {Object} interventionData - Intervention details
   * @returns {Promise<Object>} Updated statistics
   */
  async recordIntervention(username, interventionData) {
    const userId = await this._getUserId(username);
    if (!userId) {
      throw new Error(`User not found: ${username}`);
    }

    const now = new Date().toISOString();
    const existing = await this.statistics.findOne({ user_id: userId });

    if (existing) {
      await this.statistics.update(
        { user_id: userId },
        {
          total_interventions: (existing.total_interventions || 0) + 1,
          last_intervention_at: now,
          updated_at: now,
        }
      );
    } else {
      await this.statistics.create({
        user_id: userId,
        total_interventions: 1,
        accepted_count: 0,
        rejected_count: 0,
        modified_count: 0,
        ignored_count: 0,
        last_intervention_at: now,
        created_at: now,
        updated_at: now,
      });
    }

    // Return the updated stats
    return this.statistics.findOne({ user_id: userId });
  }

  /**
   * Record an accepted rewrite
   *
   * @param {string} username - Username
   * @param {Object} rewriteData - { original, rewrite, tip, roomId }
   * @returns {Promise<Object>} Updated stats
   */
  async recordAcceptedRewrite(username, rewriteData) {
    const userId = await this._getUserId(username);
    if (!userId) {
      throw new Error(`User not found: ${username}`);
    }

    const now = new Date().toISOString();

    return withTransaction(async () => {
      // Record the rewrite
      await this.rewrites.create({
        user_id: userId,
        original_text: rewriteData.original,
        rewrite_text: rewriteData.rewrite,
        outcome: 'accepted',
        pattern_detected: rewriteData.tip || null,
        room_id: rewriteData.roomId || null,
        created_at: now,
      });

      // Update statistics
      const stats = await this.statistics.findOne({ user_id: userId });
      if (stats) {
        await this.statistics.update(
          { user_id: userId },
          {
            accepted_count: (stats.accepted_count || 0) + 1,
            updated_at: now,
          }
        );
      } else {
        await this.statistics.create({
          user_id: userId,
          total_interventions: 1,
          accepted_count: 1,
          rejected_count: 0,
          modified_count: 0,
          ignored_count: 0,
          last_intervention_at: now,
          created_at: now,
          updated_at: now,
        });
      }

      // Return updated stats
      return this.statistics.findOne({ user_id: userId });
    });
  }

  /**
   * Record a rejected rewrite
   *
   * @param {string} username - Username
   * @param {Object} rewriteData - { original, rewrite, tip, roomId }
   * @returns {Promise<Object>} Updated stats
   */
  async recordRejectedRewrite(username, rewriteData) {
    const userId = await this._getUserId(username);
    if (!userId) {
      throw new Error(`User not found: ${username}`);
    }

    const now = new Date().toISOString();

    return withTransaction(async () => {
      // Record the rejection
      await this.rewrites.create({
        user_id: userId,
        original_text: rewriteData.original,
        rewrite_text: rewriteData.rewrite,
        outcome: 'rejected',
        pattern_detected: rewriteData.tip || null,
        room_id: rewriteData.roomId || null,
        created_at: now,
      });

      // Update statistics
      const stats = await this.statistics.findOne({ user_id: userId });
      if (stats) {
        await this.statistics.update(
          { user_id: userId },
          {
            rejected_count: (stats.rejected_count || 0) + 1,
            updated_at: now,
          }
        );
      } else {
        // Create stats row if it doesn't exist (consistent with recordAcceptedRewrite)
        await this.statistics.create({
          user_id: userId,
          total_interventions: 1,
          accepted_count: 0,
          rejected_count: 1,
          modified_count: 0,
          ignored_count: 0,
          last_intervention_at: now,
          created_at: now,
          updated_at: now,
        });
      }

      return this.statistics.findOne({ user_id: userId });
    });
  }

  /**
   * Get default profile structure
   * @private
   */
  _defaultProfile(username = null) {
    return {
      user_id: username ? username.toLowerCase() : null,
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
      is_new: true,
    };
  }
}

module.exports = { PostgresCommunicationRepository };
