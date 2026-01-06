/**
 * Narrative Memory Service
 *
 * Part of the Dual-Brain AI Mediator architecture.
 * Handles PostgreSQL operations for semantic memory:
 * - Store and retrieve message embeddings
 * - Manage user narrative profiles (beliefs, triggers, patterns)
 * - Find semantically similar messages using cosine similarity
 *
 * Uses REAL[] arrays instead of pgvector for compatibility with
 * Railway's base PostgreSQL (which doesn't have pgvector extension).
 */

const pool = require('../../../dbPostgres');
const openaiClient = require('../engine/client');

// Helper to run queries
const query = (sql, params) => pool.query(sql, params);

// Embedding model configuration
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding for text using OpenAI
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]|null>} Embedding vector or null if failed
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }

  const client = openaiClient.getClient();
  if (!client) {
    console.warn('⚠️ NarrativeMemory: OpenAI client not configured');
    return null;
  }

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim().slice(0, 8000), // Limit input length
    });

    if (!response.data?.[0]?.embedding) {
      console.warn('⚠️ NarrativeMemory: Empty embedding response');
      return null;
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ NarrativeMemory: Failed to generate embedding:', error.message);
    return null;
  }
}

/**
 * Store embedding for a message
 * @param {string} messageId - Message ID
 * @param {string} text - Message text
 * @returns {Promise<boolean>} True if stored successfully
 */
async function storeMessageEmbedding(messageId, text) {
  if (!messageId || !text) {
    return false;
  }

  const embedding = await generateEmbedding(text);
  if (!embedding) {
    return false;
  }

  try {
    // Store embedding as REAL array
    await query(
      `UPDATE messages
       SET embedding = $1::real[],
           embedding_generated_at = NOW()
       WHERE id = $2`,
      [embedding, messageId]
    );
    return true;
  } catch (error) {
    console.error('❌ NarrativeMemory: Failed to store embedding:', error.message);
    return false;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} Cosine similarity (-1 to 1, higher is more similar)
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Find semantically similar messages in a room
 * @param {string} queryText - Text to find similar messages for
 * @param {number|null} userId - Optional user ID to filter by sender
 * @param {string} roomId - Room ID to search in
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array<{id: string, text: string, similarity: number, timestamp: Date}>>}
 */
async function findSimilarMessages(queryText, userId, roomId, limit = 5) {
  if (!queryText || !roomId) {
    return [];
  }

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(queryText);
  if (!queryEmbedding) {
    return [];
  }

  try {
    // Get messages with embeddings from the room
    // Limit to recent messages (last 6 months) for performance
    let sql = `
      SELECT id, text, embedding, timestamp, username
      FROM messages
      WHERE room_id = $1
        AND embedding IS NOT NULL
        AND timestamp > NOW() - INTERVAL '6 months'
    `;
    const params = [roomId];

    if (userId) {
      // Get username for user
      const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length > 0) {
        sql += ` AND username = $${params.length + 1}`;
        params.push(userResult.rows[0].email);
      }
    }

    sql += ' ORDER BY timestamp DESC LIMIT 200'; // Pre-filter to recent messages

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return [];
    }

    // Calculate similarity scores in JavaScript
    // (More efficient than computing in PostgreSQL without pgvector)
    const messagesWithSimilarity = result.rows
      .map(row => ({
        id: row.id,
        text: row.text,
        timestamp: row.timestamp,
        username: row.username,
        similarity: cosineSimilarity(queryEmbedding, row.embedding),
      }))
      .filter(m => m.similarity > 0.5) // Only return reasonably similar messages
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return messagesWithSimilarity;
  } catch (error) {
    console.error('❌ NarrativeMemory: Failed to find similar messages:', error.message);
    return [];
  }
}

/**
 * Get user's narrative profile for a room
 * @param {number} userId - User ID
 * @param {string} roomId - Room ID
 * @returns {Promise<Object|null>} User narrative profile or null
 */
async function getUserNarrativeProfile(userId, roomId) {
  if (!userId || !roomId) {
    return null;
  }

  try {
    const result = await query(
      `SELECT
         id,
         user_id,
         room_id,
         core_values,
         known_triggers,
         communication_patterns,
         recurring_complaints,
         conflict_themes,
         last_analyzed_at,
         message_count_analyzed,
         created_at,
         updated_at
       FROM user_narrative_profiles
       WHERE user_id = $1 AND room_id = $2`,
      [userId, roomId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('❌ NarrativeMemory: Failed to get user profile:', error.message);
    return null;
  }
}

/**
 * Update or create user's narrative profile
 * @param {number} userId - User ID
 * @param {string} roomId - Room ID
 * @param {Object} analysis - Profile analysis data
 * @param {string[]} [analysis.core_values] - User's core values
 * @param {string[]} [analysis.known_triggers] - Known trigger phrases/topics
 * @param {Object} [analysis.communication_patterns] - Communication pattern scores
 * @param {string[]} [analysis.recurring_complaints] - Recurring complaints
 * @param {string[]} [analysis.conflict_themes] - Conflict themes
 * @param {number} [analysis.message_count_analyzed] - Number of messages analyzed
 * @returns {Promise<boolean>} True if updated successfully
 */
async function updateNarrativeProfile(userId, roomId, analysis) {
  if (!userId || !roomId || !analysis) {
    return false;
  }

  try {
    // Generate profile embedding from concatenated profile text
    const profileText = [
      ...(analysis.core_values || []),
      ...(analysis.known_triggers || []),
      ...(analysis.recurring_complaints || []),
      ...(analysis.conflict_themes || []),
    ].join(' ');

    const profileEmbedding = profileText ? await generateEmbedding(profileText) : null;

    // Upsert the profile
    await query(
      `INSERT INTO user_narrative_profiles (
         user_id,
         room_id,
         core_values,
         known_triggers,
         communication_patterns,
         recurring_complaints,
         conflict_themes,
         profile_embedding,
         last_analyzed_at,
         message_count_analyzed
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::real[], NOW(), $9)
       ON CONFLICT (user_id, room_id)
       DO UPDATE SET
         core_values = COALESCE($3, user_narrative_profiles.core_values),
         known_triggers = COALESCE($4, user_narrative_profiles.known_triggers),
         communication_patterns = COALESCE($5, user_narrative_profiles.communication_patterns),
         recurring_complaints = COALESCE($6, user_narrative_profiles.recurring_complaints),
         conflict_themes = COALESCE($7, user_narrative_profiles.conflict_themes),
         profile_embedding = COALESCE($8::real[], user_narrative_profiles.profile_embedding),
         last_analyzed_at = NOW(),
         message_count_analyzed = COALESCE($9, user_narrative_profiles.message_count_analyzed),
         updated_at = NOW()`,
      [
        userId,
        roomId,
        JSON.stringify(analysis.core_values || []),
        JSON.stringify(analysis.known_triggers || []),
        JSON.stringify(analysis.communication_patterns || {}),
        JSON.stringify(analysis.recurring_complaints || []),
        JSON.stringify(analysis.conflict_themes || []),
        profileEmbedding,
        analysis.message_count_analyzed || 0,
      ]
    );

    return true;
  } catch (error) {
    console.error('❌ NarrativeMemory: Failed to update profile:', error.message);
    return false;
  }
}

/**
 * Get all user narrative profiles in a room (for both co-parents)
 * @param {string} roomId - Room ID
 * @returns {Promise<Object[]>} Array of user profiles
 */
async function getRoomNarrativeProfiles(roomId) {
  if (!roomId) {
    return [];
  }

  try {
    const result = await query(
      `SELECT
         unp.*,
         u.email,
         u.first_name,
         u.display_name
       FROM user_narrative_profiles unp
       JOIN users u ON unp.user_id = u.id
       WHERE unp.room_id = $1`,
      [roomId]
    );

    return result.rows;
  } catch (error) {
    console.error('❌ NarrativeMemory: Failed to get room profiles:', error.message);
    return [];
  }
}

/**
 * Find stale profiles that need re-analysis
 * @param {number} staleDays - Number of days after which a profile is considered stale
 * @param {number} limit - Maximum number of profiles to return
 * @returns {Promise<Array<{user_id: number, room_id: string, last_analyzed_at: Date}>>}
 */
async function findStaleProfiles(staleDays = 7, limit = 100) {
  try {
    const result = await query(
      `SELECT user_id, room_id, last_analyzed_at
       FROM user_narrative_profiles
       WHERE last_analyzed_at IS NULL
          OR last_analyzed_at < NOW() - INTERVAL '${staleDays} days'
       ORDER BY last_analyzed_at ASC NULLS FIRST
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    console.error('❌ NarrativeMemory: Failed to find stale profiles:', error.message);
    return [];
  }
}

/**
 * Get messages without embeddings for a room (for backfill)
 * @param {string} roomId - Room ID
 * @param {number} limit - Maximum number of messages to return
 * @returns {Promise<Array<{id: string, text: string}>>}
 */
async function getMessagesWithoutEmbeddings(roomId, limit = 50) {
  try {
    const result = await query(
      `SELECT id, text
       FROM messages
       WHERE room_id = $1
         AND embedding IS NULL
         AND text IS NOT NULL
         AND text != ''
       ORDER BY timestamp DESC
       LIMIT $2`,
      [roomId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('❌ NarrativeMemory: Failed to get messages without embeddings:', error.message);
    return [];
  }
}

/**
 * Batch store embeddings for multiple messages (for backfill)
 * Processes in batches with rate limiting
 * @param {Array<{id: string, text: string}>} messages - Messages to embed
 * @param {Object} options - Options
 * @param {number} [options.batchSize=10] - Number of embeddings to generate per batch
 * @param {number} [options.delayMs=1000] - Delay between batches in milliseconds
 * @param {Function} [options.onProgress] - Progress callback (processed, total)
 * @returns {Promise<{success: number, failed: number}>}
 */
async function batchStoreEmbeddings(messages, options = {}) {
  const { batchSize = 10, delayMs = 1000, onProgress } = options;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    // Process batch in parallel
    const results = await Promise.all(
      batch.map(async msg => {
        const stored = await storeMessageEmbedding(msg.id, msg.text);
        return stored ? 'success' : 'failed';
      })
    );

    success += results.filter(r => r === 'success').length;
    failed += results.filter(r => r === 'failed').length;

    if (onProgress) {
      onProgress(i + batch.length, messages.length);
    }

    // Rate limit between batches
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return { success, failed };
}

module.exports = {
  // Core operations
  generateEmbedding,
  storeMessageEmbedding,
  findSimilarMessages,

  // Profile operations
  getUserNarrativeProfile,
  updateNarrativeProfile,
  getRoomNarrativeProfiles,
  findStaleProfiles,

  // Backfill operations
  getMessagesWithoutEmbeddings,
  batchStoreEmbeddings,

  // Utility
  cosineSimilarity,

  // Constants (for testing)
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
};
