/**
 * TopicDetector - Clusters messages into topics using semantic similarity
 *
 * Part of AI Thread Summaries feature.
 *
 * Algorithm:
 * 1. Get message embeddings from PostgreSQL (pgvector)
 * 2. Use DBSCAN-style clustering based on cosine similarity
 * 3. Generate topic title from cluster content
 * 4. Assign category based on keyword analysis
 *
 * @module services/topics/TopicDetector
 */

const pool = require('../../../dbPostgres');

// Category keywords for classification
const CATEGORY_KEYWORDS = {
  medical: ['doctor', 'appointment', 'medication', 'sick', 'fever', 'health', 'hospital', 'therapy', 'dentist'],
  school: ['school', 'homework', 'teacher', 'class', 'grade', 'test', 'exam', 'parent-teacher', 'assignment'],
  activities: ['soccer', 'basketball', 'practice', 'game', 'piano', 'lesson', 'camp', 'birthday', 'party'],
  logistics: ['pickup', 'drop off', 'dropoff', 'schedule', 'time', 'weekend', 'holiday', 'vacation'],
  financial: ['money', 'pay', 'cost', 'expense', 'bill', '$', 'fee', 'reimburse'],
  general: [] // fallback
};

class TopicDetector {
  /**
   * @param {Object} options Configuration options
   * @param {number} options.minMessages Minimum messages to form a topic (default: 3)
   * @param {number} options.similarityThreshold Cosine similarity threshold (default: 0.75)
   * @param {number} options.maxTopics Maximum topics to detect per run (default: 10)
   */
  constructor(options = {}) {
    this.minMessages = options.minMessages || 3;
    this.similarityThreshold = options.similarityThreshold || 0.75;
    this.maxTopics = options.maxTopics || 10;
  }

  /**
   * Detect topics in a room's conversation
   *
   * @param {string} roomId Room to analyze
   * @param {Object} options Query options
   * @param {Date} options.since Only analyze messages after this date
   * @param {number} options.limit Maximum messages to analyze (default: 200)
   * @returns {Promise<Array<TopicCandidate>>} Detected topic candidates
   */
  async detectTopics(roomId, options = {}) {
    const { since, limit = 200 } = options;

    try {
      // 1. Get messages with embeddings
      const messages = await this._getMessagesWithEmbeddings(roomId, { since, limit });

      if (messages.length < this.minMessages) {
        console.log(`[TopicDetector] Not enough messages (${messages.length}) for topic detection`);
        return [];
      }

      // 2. Cluster messages using similarity
      const clusters = await this._clusterMessages(messages);

      // 3. Generate topic candidates from clusters
      const topics = [];
      for (const cluster of clusters) {
        if (cluster.length >= this.minMessages) {
          const topic = await this._createTopicCandidate(cluster, roomId);
          topics.push(topic);
        }
      }

      // 4. Sort by message count and limit
      topics.sort((a, b) => b.messageIds.length - a.messageIds.length);
      return topics.slice(0, this.maxTopics);

    } catch (error) {
      console.error('[TopicDetector] Error detecting topics:', error);
      throw error;
    }
  }

  /**
   * Find which existing topic a new message belongs to
   *
   * @param {Object} message Message with embedding
   * @param {string} roomId Room ID
   * @returns {Promise<string|null>} Topic ID or null if no match
   */
  async assignMessageToTopic(message, roomId) {
    try {
      // Get existing topics with their centroid embeddings
      const existingTopics = await this._getExistingTopicCentroids(roomId);

      if (existingTopics.length === 0) {
        return null;
      }

      // Get message embedding
      const embedding = await this._getMessageEmbedding(message.id);
      if (!embedding) {
        return null;
      }

      // Find best matching topic
      let bestMatch = null;
      let bestSimilarity = this.similarityThreshold;

      for (const topic of existingTopics) {
        const similarity = await this._cosineSimilarity(embedding, topic.centroid);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = topic.id;
        }
      }

      return bestMatch;

    } catch (error) {
      console.error('[TopicDetector] Error assigning message to topic:', error);
      return null;
    }
  }

  /**
   * Get messages with embeddings from database
   * @private
   */
  async _getMessagesWithEmbeddings(roomId, { since, limit }) {
    let query = `
      SELECT m.id, m.text, m.user_email, m.timestamp, m.embedding
      FROM messages m
      WHERE m.room_id = $1
        AND m.type IN ('user', 'message')
        AND m.embedding IS NOT NULL
        AND LENGTH(m.text) > 10
    `;
    const params = [roomId];

    if (since) {
      query += ` AND m.timestamp > $${params.length + 1}`;
      params.push(since);
    }

    query += ` ORDER BY m.timestamp DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Cluster messages using DBSCAN-style algorithm with pgvector
   * @private
   */
  async _clusterMessages(messages) {
    const clusters = [];
    const visited = new Set();
    const noise = [];

    for (const message of messages) {
      if (visited.has(message.id)) continue;
      visited.add(message.id);

      // Find neighbors using pgvector similarity
      const neighbors = await this._findNeighbors(message, messages);

      if (neighbors.length < this.minMessages - 1) {
        noise.push(message);
      } else {
        // Start a new cluster
        const cluster = [message];

        // Expand cluster with neighbors
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor.id)) {
            visited.add(neighbor.id);
            cluster.push(neighbor);

            // Check neighbor's neighbors for expansion
            const neighborNeighbors = await this._findNeighbors(neighbor, messages);
            if (neighborNeighbors.length >= this.minMessages - 1) {
              for (const nn of neighborNeighbors) {
                if (!visited.has(nn.id)) {
                  neighbors.push(nn);
                }
              }
            }
          }
        }

        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Find similar messages using pgvector
   * @private
   */
  async _findNeighbors(message, allMessages) {
    const neighbors = [];

    for (const other of allMessages) {
      if (other.id === message.id) continue;

      // Calculate cosine similarity using pgvector operator
      const similarity = await this._calculateSimilarity(message.embedding, other.embedding);

      if (similarity >= this.similarityThreshold) {
        neighbors.push(other);
      }
    }

    return neighbors;
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @private
   */
  async _calculateSimilarity(embedding1, embedding2) {
    // pgvector stores as string, convert to arrays if needed
    const vec1 = typeof embedding1 === 'string' ? JSON.parse(embedding1) : embedding1;
    const vec2 = typeof embedding2 === 'string' ? JSON.parse(embedding2) : embedding2;

    // Cosine similarity = dot product / (magnitude1 * magnitude2)
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
  }

  /**
   * Create a topic candidate from a cluster of messages
   * @private
   */
  async _createTopicCandidate(cluster, roomId) {
    // Sort by timestamp
    cluster.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Extract key terms for title
    const title = this._generateTitle(cluster);

    // Determine category
    const category = this._determineCategory(cluster);

    // Calculate confidence based on cluster coherence
    const confidence = await this._calculateClusterConfidence(cluster);

    return {
      title,
      category,
      messageIds: cluster.map(m => m.id),
      messageCount: cluster.length,
      confidence,
      firstMessageAt: cluster[0].timestamp,
      lastMessageAt: cluster[cluster.length - 1].timestamp,
      roomId
    };
  }

  /**
   * Generate a topic title from cluster messages
   * @private
   */
  _generateTitle(cluster) {
    // Combine message texts
    const allText = cluster.map(m => m.text).join(' ').toLowerCase();

    // Find most common meaningful words
    const words = allText.split(/\s+/)
      .filter(w => w.length > 3)
      .filter(w => !['this', 'that', 'with', 'from', 'have', 'will', 'what', 'when', 'they', 'them', 'been', 'were', 'your', 'just', 'about'].includes(w));

    const wordCounts = {};
    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }

    // Get top 3 words
    const topWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

    if (topWords.length === 0) {
      return 'General Discussion';
    }

    return topWords.join(' & ');
  }

  /**
   * Determine topic category based on keywords
   * @private
   */
  _determineCategory(cluster) {
    const allText = cluster.map(m => m.text).join(' ').toLowerCase();

    let bestCategory = 'general';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (category === 'general') continue;

      let score = 0;
      for (const keyword of keywords) {
        if (allText.includes(keyword)) {
          score++;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    return bestCategory;
  }

  /**
   * Calculate cluster confidence based on internal similarity
   * @private
   */
  async _calculateClusterConfidence(cluster) {
    if (cluster.length < 2) return 0.5;

    let totalSimilarity = 0;
    let comparisons = 0;

    // Sample pairs for efficiency
    const sampleSize = Math.min(cluster.length, 10);
    const samples = cluster.slice(0, sampleSize);

    for (let i = 0; i < samples.length; i++) {
      for (let j = i + 1; j < samples.length; j++) {
        const similarity = await this._calculateSimilarity(
          samples[i].embedding,
          samples[j].embedding
        );
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0.5;
  }

  /**
   * Get existing topic centroids for a room
   * @private
   */
  async _getExistingTopicCentroids(roomId) {
    // Get topics with their message embeddings averaged
    const result = await pool.query(`
      SELECT ts.id, ts.title,
             AVG(m.embedding) as centroid
      FROM topic_summaries ts
      JOIN topic_messages tm ON ts.id = tm.topic_id
      JOIN messages m ON tm.message_id = m.id
      WHERE ts.room_id = $1 AND ts.is_archived = FALSE
      GROUP BY ts.id, ts.title
    `, [roomId]);

    return result.rows;
  }

  /**
   * Get embedding for a single message
   * @private
   */
  async _getMessageEmbedding(messageId) {
    const result = await pool.query(
      'SELECT embedding FROM messages WHERE id = $1',
      [messageId]
    );
    return result.rows[0]?.embedding;
  }

  /**
   * Calculate cosine similarity (wrapper for external use)
   * @private
   */
  async _cosineSimilarity(embedding1, embedding2) {
    return this._calculateSimilarity(embedding1, embedding2);
  }
}

module.exports = TopicDetector;
