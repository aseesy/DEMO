/**
 * Graph Context - Neo4j Integration for AI Mediation
 *
 * Provides relationship insights from the graph database to enhance
 * AI mediation responses with historical context and patterns.
 *
 * This module connects Neo4j relationship data to the AI mediator,
 * enabling more attuned and personalized coaching responses.
 *
 * Key Insights Provided:
 * - Relationship duration and history
 * - Communication intensity (message counts)
 * - Intervention patterns (how often AI has helped)
 * - Relationship health indicators
 */

const neo4jClient = require('../../utils/neo4jClient');

/**
 * Get comprehensive relationship context for AI mediation
 *
 * @param {number} senderId - Sender's PostgreSQL user ID
 * @param {number} receiverId - Receiver's PostgreSQL user ID
 * @param {string} roomId - Room ID for the conversation
 * @returns {Promise<Object>} Relationship context for AI
 */
async function getRelationshipContext(senderId, receiverId, roomId) {
  if (!neo4jClient.isAvailable()) {
    console.log('⚠️  GraphContext: Neo4j not available, skipping graph insights');
    return null;
  }

  try {
    // Get relationship metrics from Neo4j
    const metrics = await getRelationshipMetrics(senderId, receiverId, roomId);

    if (!metrics) {
      return null;
    }

    // Calculate relationship insights
    const insights = analyzeRelationship(metrics);

    return {
      metrics,
      insights,
      formattedContext: formatForAI(metrics, insights),
    };
  } catch (error) {
    console.error('❌ GraphContext: Failed to get relationship context:', error.message);
    return null;
  }
}

/**
 * Fetch relationship metrics from Neo4j
 */
async function getRelationshipMetrics(senderId, receiverId, roomId) {
  try {
    const query = `
      MATCH (sender:User {userId: $senderId})-[r:CO_PARENT_WITH]->(receiver:User {userId: $receiverId})
      WHERE r.roomId = $roomId AND r.active = true
      RETURN
        r.messageCount as messageCount,
        r.interventionCount as interventionCount,
        r.lastInteraction as lastInteraction,
        r.createdAt as relationshipCreatedAt,
        sender.username as senderUsername,
        receiver.username as receiverUsername
    `;

    const result = await neo4jClient._executeCypher(query, {
      senderId: require('neo4j-driver').int(senderId),
      receiverId: require('neo4j-driver').int(receiverId),
      roomId,
    });

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    return {
      messageCount: record.get('messageCount') || 0,
      interventionCount: record.get('interventionCount') || 0,
      lastInteraction: record.get('lastInteraction'),
      relationshipCreatedAt: record.get('relationshipCreatedAt'),
      senderUsername: record.get('senderUsername'),
      receiverUsername: record.get('receiverUsername'),
    };
  } catch (error) {
    console.error('❌ GraphContext: Neo4j query failed:', error.message);
    return null;
  }
}

/**
 * Analyze relationship metrics to derive insights
 */
function analyzeRelationship(metrics) {
  const insights = {
    relationshipAge: null,
    communicationIntensity: 'unknown',
    interventionRate: 0,
    interventionTrend: 'unknown',
    healthIndicator: 'unknown',
  };

  // Calculate relationship age
  if (metrics.relationshipCreatedAt) {
    const createdDate = new Date(metrics.relationshipCreatedAt);
    const now = new Date();
    const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

    if (daysDiff < 7) {
      insights.relationshipAge = 'new (less than a week)';
    } else if (daysDiff < 30) {
      insights.relationshipAge = 'recent (less than a month)';
    } else if (daysDiff < 90) {
      insights.relationshipAge = 'established (1-3 months)';
    } else if (daysDiff < 365) {
      insights.relationshipAge = 'mature (3-12 months)';
    } else {
      insights.relationshipAge = 'long-term (over a year)';
    }
  }

  // Determine communication intensity
  const msgCount = metrics.messageCount || 0;
  if (msgCount < 10) {
    insights.communicationIntensity = 'minimal';
  } else if (msgCount < 50) {
    insights.communicationIntensity = 'light';
  } else if (msgCount < 200) {
    insights.communicationIntensity = 'moderate';
  } else if (msgCount < 500) {
    insights.communicationIntensity = 'active';
  } else {
    insights.communicationIntensity = 'very active';
  }

  // Calculate intervention rate (interventions per 100 messages)
  if (msgCount > 0) {
    insights.interventionRate = Math.round((metrics.interventionCount / msgCount) * 100);
  }

  // Determine relationship health based on intervention rate
  if (insights.interventionRate === 0) {
    insights.healthIndicator = 'excellent';
  } else if (insights.interventionRate < 5) {
    insights.healthIndicator = 'healthy';
  } else if (insights.interventionRate < 15) {
    insights.healthIndicator = 'needs support';
  } else if (insights.interventionRate < 30) {
    insights.healthIndicator = 'challenging';
  } else {
    insights.healthIndicator = 'high-conflict';
  }

  return insights;
}

/**
 * Format relationship context for AI prompt
 */
function formatForAI(metrics, insights) {
  const parts = [];

  // Relationship history
  if (insights.relationshipAge) {
    parts.push(`Co-parenting relationship: ${insights.relationshipAge}`);
  }

  // Communication patterns
  parts.push(
    `Communication level: ${insights.communicationIntensity} (${metrics.messageCount || 0} messages exchanged)`
  );

  // Intervention history
  if (metrics.interventionCount > 0) {
    parts.push(
      `AI coaching history: ${metrics.interventionCount} interventions (${insights.interventionRate}% of messages)`
    );

    // Add guidance based on intervention rate
    if (insights.healthIndicator === 'high-conflict') {
      parts.push(
        'NOTE: This is a high-conflict relationship. Be especially gentle and constructive.'
      );
    } else if (insights.healthIndicator === 'challenging') {
      parts.push('NOTE: This relationship has ongoing challenges. Focus on de-escalation.');
    } else if (insights.healthIndicator === 'needs support') {
      parts.push('NOTE: This relationship benefits from supportive coaching.');
    }
  } else {
    parts.push('AI coaching history: No previous interventions (first-time coaching opportunity)');
  }

  // Recency of interaction
  if (metrics.lastInteraction) {
    const lastDate = new Date(metrics.lastInteraction);
    const now = new Date();
    const hoursDiff = Math.floor((now - lastDate) / (1000 * 60 * 60));

    if (hoursDiff < 1) {
      parts.push('Recent activity: Just now (active conversation)');
    } else if (hoursDiff < 24) {
      parts.push(`Recent activity: ${hoursDiff} hours ago`);
    } else {
      const daysDiff = Math.floor(hoursDiff / 24);
      parts.push(`Recent activity: ${daysDiff} day(s) ago`);
    }
  }

  return parts.join('\n');
}

/**
 * Update relationship metrics after a message or intervention
 *
 * @param {number} userId1 - First user's ID
 * @param {number} userId2 - Second user's ID
 * @param {string} roomId - Room ID
 * @param {Object} update - What to update {incrementMessages, incrementInterventions}
 */
async function updateMetrics(userId1, userId2, roomId, update = {}) {
  if (!neo4jClient.isAvailable()) {
    return false;
  }

  try {
    const setClauses = ['r.lastInteraction = datetime()', 'r.updatedAt = datetime()'];

    if (update.incrementMessages) {
      setClauses.push('r.messageCount = COALESCE(r.messageCount, 0) + 1');
    }

    if (update.incrementInterventions) {
      setClauses.push('r.interventionCount = COALESCE(r.interventionCount, 0) + 1');
    }

    const query = `
      MATCH (u1:User {userId: $userId1})-[r:CO_PARENT_WITH]->(u2:User {userId: $userId2})
      WHERE r.roomId = $roomId AND r.active = true
      SET ${setClauses.join(', ')}
      RETURN r
    `;

    const neo4j = require('neo4j-driver');
    await neo4jClient._executeCypher(query, {
      userId1: neo4j.int(userId1),
      userId2: neo4j.int(userId2),
      roomId,
    });

    return true;
  } catch (error) {
    console.error('❌ GraphContext: Failed to update metrics:', error.message);
    return false;
  }
}

/**
 * Get intervention effectiveness for a user
 * Helps understand what type of coaching works best
 *
 * @param {number} userId - User's PostgreSQL ID
 * @returns {Promise<Object>} Intervention effectiveness data
 */
async function getInterventionEffectiveness(userId) {
  if (!neo4jClient.isAvailable()) {
    return null;
  }

  try {
    // This query would be enhanced with more detailed intervention tracking
    const query = `
      MATCH (u:User {userId: $userId})-[r:CO_PARENT_WITH {active: true}]->()
      RETURN
        sum(r.messageCount) as totalMessages,
        sum(r.interventionCount) as totalInterventions,
        count(r) as relationshipCount
    `;

    const neo4j = require('neo4j-driver');
    const result = await neo4jClient._executeCypher(query, {
      userId: neo4j.int(userId),
    });

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    return {
      totalMessages: record.get('totalMessages') || 0,
      totalInterventions: record.get('totalInterventions') || 0,
      relationshipCount: record.get('relationshipCount') || 0,
      overallInterventionRate:
        record.get('totalMessages') > 0
          ? Math.round((record.get('totalInterventions') / record.get('totalMessages')) * 100)
          : 0,
    };
  } catch (error) {
    console.error('❌ GraphContext: Failed to get intervention effectiveness:', error.message);
    return null;
  }
}

module.exports = {
  getRelationshipContext,
  getRelationshipMetrics,
  analyzeRelationship,
  formatForAI,
  updateMetrics,
  getInterventionEffectiveness,
};
