/**
 * Thread Embeddings Module
 *
 * Handles embedding generation for semantic search:
 * - Generate embeddings for text
 */

/**
 * Generate embedding for text
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<Array<number>|null>} Embedding vector or null if failed
 */
async function generateEmbeddingForText(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }

  try {
    // Use the OpenAI client from core/engine/client
    const coreOpenaiClient = require('../../core/engine/client');
    const client = coreOpenaiClient.getClient();

    if (!client) {
      return null;
    }

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.trim(),
    });

    if (!response.data || !response.data[0] || !response.data[0].embedding) {
      return null;
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ Failed to generate embedding:', error.message);
    return null;
  }
}

module.exports = {
  generateEmbeddingForText,
};

