const dbSafe = require('../../../../dbSafe');

/**
 * Communication Stats Manager
 * Tracks positive communication streaks and total stats for each user in each room
 * Updated to use PostgreSQL via dbSafe
 */

/**
 * Update stats when a message is sent successfully (no intervention needed)
 * @param {number} userId - Database ID of the user
 * @param {string} roomId - Room ID where message was sent
 * @param {boolean} hadIntervention - Whether AI intervened on this message
 */
async function updateCommunicationStats(userId, roomId, hadIntervention) {
  try {
    console.log(`[communicationStats] updateCommunicationStats called: userId=${userId}, roomId=${roomId}, hadIntervention=${hadIntervention}`);
    const now = new Date().toISOString();

    // Get or create stats record for this user-room combination
    const statsResult = await dbSafe.safeSelect(
      'communication_stats',
      {
        user_id: userId,
        room_id: roomId,
      },
      { limit: 1 }
    );

    const stats = dbSafe.parseResult(statsResult);
    console.log(`[communicationStats] Existing stats found: ${stats.length > 0 ? 'yes' : 'no'}`);

    if (stats.length === 0) {
      // Create new stats record
      await dbSafe.safeInsert('communication_stats', {
        user_id: userId,
        room_id: roomId,
        current_streak: hadIntervention ? 0 : 1,
        best_streak: hadIntervention ? 0 : 1,
        total_positive_messages: hadIntervention ? 0 : 1,
        total_messages: 1,
        total_interventions: hadIntervention ? 1 : 0,
        last_message_date: now,
        last_intervention_date: hadIntervention ? now : null,
        updated_at: now,
      });

      console.log(
        `📊 Created communication stats for user ${userId} in room ${roomId}: ${hadIntervention ? 'intervention' : '+1 streak'}`
      );
    } else {
      // Update existing stats
      const currentStats = stats[0];

      let newStreak = currentStats.current_streak;
      let newBestStreak = currentStats.best_streak;
      let newTotalPositive = currentStats.total_positive_messages;
      let newTotalInterventions = currentStats.total_interventions;

      if (hadIntervention) {
        // Intervention breaks the streak - add current streak to total
        console.log(
          `🚫 Streak ended for user ${userId}: was at ${currentStats.current_streak}, adding to total`
        );
        newStreak = 0;
        newTotalInterventions += 1;
      } else {
        // No intervention - increment streak
        newStreak = currentStats.current_streak + 1;
        newTotalPositive += 1;

        // Update best streak if current exceeds it
        if (newStreak > newBestStreak) {
          newBestStreak = newStreak;
          console.log(`🎉 New best streak for user ${userId}: ${newBestStreak}!`);
        } else {
          console.log(`✅ Streak continues for user ${userId}: ${newStreak}`);
        }
      }

      // Update the stats
      await dbSafe.safeUpdate(
        'communication_stats',
        {
          current_streak: newStreak,
          best_streak: newBestStreak,
          total_positive_messages: newTotalPositive,
          total_messages: currentStats.total_messages + 1,
          total_interventions: newTotalInterventions,
          last_message_date: now,
          last_intervention_date: hadIntervention ? now : currentStats.last_intervention_date,
          updated_at: now,
        },
        {
          user_id: userId,
          room_id: roomId,
        }
      );

      console.log(
        `📊 Updated stats for user ${userId}: streak=${newStreak}, best=${newBestStreak}, positive=${newTotalPositive}, interventions=${newTotalInterventions}`
      );
    }

    return true;
  } catch (error) {
    console.error('Error updating communication stats:', error);
    return false;
  }
}

/**
 * Get communication stats for a user across all rooms
 * @param {number} userId - Database ID of the user
 * @returns {Object} Aggregated stats
 */
async function getUserStats(userId) {
  try {
    console.log(`[communicationStats] getUserStats called for userId: ${userId}`);
    const statsResult = await dbSafe.safeSelect('communication_stats', {
      user_id: userId,
    });

    const stats = dbSafe.parseResult(statsResult);
    console.log(`[communicationStats] Found ${stats.length} stats records for userId ${userId}`);

    if (stats.length === 0) {
      console.log(`[communicationStats] No stats found for userId ${userId}, returning zeros`);
      return {
        currentStreak: 0,
        bestStreak: 0,
        totalPositive: 0,
        totalMessages: 0,
        totalInterventions: 0,
        successRate: 0,
      };
    }

    // Aggregate stats across all rooms
    const aggregated = stats.reduce(
      (acc, stat) => {
        return {
          currentStreak: Math.max(acc.currentStreak, stat.current_streak),
          bestStreak: Math.max(acc.bestStreak, stat.best_streak),
          totalPositive: acc.totalPositive + stat.total_positive_messages,
          totalMessages: acc.totalMessages + stat.total_messages,
          totalInterventions: acc.totalInterventions + stat.total_interventions,
        };
      },
      {
        currentStreak: 0,
        bestStreak: 0,
        totalPositive: 0,
        totalMessages: 0,
        totalInterventions: 0,
      }
    );

    // Calculate success rate (percentage of messages without intervention)
    aggregated.successRate =
      aggregated.totalMessages > 0
        ? Math.round((aggregated.totalPositive / aggregated.totalMessages) * 100)
        : 0;

    console.log(`[communicationStats] Aggregated stats for userId ${userId}:`, aggregated);
    return aggregated;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}

/**
 * Get communication stats for a specific user in a specific room
 * @param {number} userId - Database ID of the user
 * @param {string} roomId - Room ID
 * @returns {Object} Room-specific stats
 */
async function getRoomStats(userId, roomId) {
  try {
    const statsResult = await dbSafe.safeSelect(
      'communication_stats',
      {
        user_id: userId,
        room_id: roomId,
      },
      { limit: 1 }
    );

    const stats = dbSafe.parseResult(statsResult);

    if (stats.length === 0) {
      return {
        currentStreak: 0,
        bestStreak: 0,
        totalPositive: 0,
        totalMessages: 0,
        totalInterventions: 0,
        successRate: 0,
      };
    }

    const stat = stats[0];

    return {
      currentStreak: stat.current_streak,
      bestStreak: stat.best_streak,
      totalPositive: stat.total_positive_messages,
      totalMessages: stat.total_messages,
      totalInterventions: stat.total_interventions,
      successRate:
        stat.total_messages > 0
          ? Math.round((stat.total_positive_messages / stat.total_messages) * 100)
          : 0,
      lastMessageDate: stat.last_message_date,
      lastInterventionDate: stat.last_intervention_date,
    };
  } catch (error) {
    console.error('Error getting room stats:', error);
    return null;
  }
}

module.exports = {
  updateCommunicationStats,
  getUserStats,
  getRoomStats,
};
