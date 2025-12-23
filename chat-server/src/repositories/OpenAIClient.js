/**
 * OpenAI Client Implementation
 *
 * Implements IAIClient interface using OpenAI SDK.
 * This is the infrastructure layer - it knows about the specific AI provider.
 */

const OpenAI = require('openai');
const { RATE_LIMIT, AI } = require('../infrastructure/config/constants');

// Singleton instance
let openaiInstance = null;

// Rate limiting state
const rateLimitState = {
  requestCount: 0,
  windowStart: Date.now(),
  windowMs: RATE_LIMIT.WINDOW_MS,
  maxRequestsPerWindow: RATE_LIMIT.MAX_REQUESTS_PER_WINDOW,
};

/**
 * Get or create OpenAI client instance
 * @returns {OpenAI|null} OpenAI client instance
 */
function getClient() {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY || '';

    if (!apiKey || apiKey.trim() === '') {
      console.warn('⚠️  OpenAI API key not configured - AI features will be disabled');
      return null;
    }

    openaiInstance = new OpenAI({
      apiKey: apiKey,
      maxRetries: RATE_LIMIT.MAX_RETRIES,
      timeout: AI.TIMEOUT_MS,
    });

    console.log('✅ OpenAI client initialized');
  }

  return openaiInstance;
}

/**
 * Check rate limit and update state
 * @returns {boolean} True if request is allowed
 */
function checkRateLimit() {
  const now = Date.now();

  // Reset window if expired
  if (now - rateLimitState.windowStart >= rateLimitState.windowMs) {
    rateLimitState.requestCount = 0;
    rateLimitState.windowStart = now;
  }

  // Check if under limit
  if (rateLimitState.requestCount >= rateLimitState.maxRequestsPerWindow) {
    console.warn('⚠️  OpenAI rate limit reached, request rejected');
    return false;
  }

  rateLimitState.requestCount++;
  return true;
}

/**
 * OpenAI implementation of IAIClient
 */
const OpenAIClientImpl = {
  /**
   * Check if AI client is configured and ready
   * @returns {boolean} True if API key is set
   */
  isConfigured() {
    const apiKey = process.env.OPENAI_API_KEY || '';
    return apiKey && apiKey.trim() !== '';
  },

  /**
   * Create a chat completion
   * @param {Object} params - Completion parameters
   * @returns {Promise<Object>} Completion response
   */
  async createChatCompletion(params) {
    const client = getClient();

    if (!client) {
      throw new Error('OpenAI client not configured');
    }

    // Check rate limit
    if (!checkRateLimit()) {
      throw new Error('Rate limit exceeded, please try again later');
    }

    try {
      const startTime = Date.now();
      const response = await client.chat.completions.create(params);
      const duration = Date.now() - startTime;

      console.log(
        `✅ OpenAI request completed in ${duration}ms (model: ${params.model}, tokens: ${response.usage?.total_tokens || 'unknown'})`
      );

      return response;
    } catch (error) {
      console.error('❌ OpenAI API error:', error.message);

      // Provide helpful error messages
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded, please try again later');
      } else if (error.status === 401) {
        throw new Error('OpenAI API key is invalid');
      } else if (error.status >= 500) {
        throw new Error('OpenAI service temporarily unavailable');
      } else {
        throw error;
      }
    }
  },

  /**
   * Get rate limit statistics
   * @returns {Object} Rate limit stats
   */
  getRateLimitStats() {
    return {
      requestCount: rateLimitState.requestCount,
      maxRequests: rateLimitState.maxRequestsPerWindow,
      windowMs: rateLimitState.windowMs,
      percentUsed: (
        (rateLimitState.requestCount / rateLimitState.maxRequestsPerWindow) *
        100
      ).toFixed(1),
    };
  },

  /**
   * Get the raw OpenAI client (for migration/backward compatibility)
   * @returns {OpenAI|null} OpenAI client instance
   */
  getRawClient() {
    return getClient();
  },
};

module.exports = { OpenAIClient: OpenAIClientImpl };
