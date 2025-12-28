/**
 * Shared OpenAI Client
 *
 * Single instance of OpenAI client used across all AI mediation modules.
 * Provides rate limiting, retry logic, and centralized error handling.
 */

const OpenAI = require('openai');

// Singleton instance
let openaiInstance = null;

const { RATE_LIMIT, TIME } = require('../../infrastructure/config/constants');

// Rate limiting state
const rateLimitState = {
  requestCount: 0,
  windowStart: Date.now(),
  windowMs: RATE_LIMIT.WINDOW_MS,
  maxRequestsPerWindow: RATE_LIMIT.MAX_REQUESTS_PER_WINDOW,
};

/**
 * Get or create OpenAI client instance
 * @returns {OpenAI} OpenAI client instance
 */
function getClient() {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY || '';

    if (!apiKey || apiKey.trim() === '') {
      console.warn('⚠️  OpenAI API key not configured - AI features will be disabled');
      return null;
    }

    const { AI } = require('../../infrastructure/config/constants');
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
 * Check if API key is configured
 * @returns {boolean} True if API key is available
 */
function isConfigured() {
  const apiKey = process.env.OPENAI_API_KEY || '';
  return apiKey && apiKey.trim() !== '';
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
 * Make a chat completion request with rate limiting and error handling
 * @param {Object} params - OpenAI chat completion parameters
 * @returns {Promise<Object>} Completion response
 */
async function createChatCompletion(params) {
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
}

/**
 * Get rate limit statistics
 * @returns {Object} Rate limit stats
 */
function getRateLimitStats() {
  return {
    requestCount: rateLimitState.requestCount,
    maxRequests: rateLimitState.maxRequestsPerWindow,
    windowMs: rateLimitState.windowMs,
    percentUsed: (
      (rateLimitState.requestCount / rateLimitState.maxRequestsPerWindow) *
      100
    ).toFixed(1),
  };
}

module.exports = {
  getClient,
  isConfigured,
  createChatCompletion,
  getRateLimitStats,
};
