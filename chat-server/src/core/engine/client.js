/**
 * Shared OpenAI Client
 *
 * Single instance of OpenAI client used across all AI mediation modules.
 * Provides rate limiting (Redis-based for multi-instance support), retry logic, and centralized error handling.
 */

const OpenAI = require('openai');
const {
  checkRateLimit: redisCheckRateLimit,
  isRedisAvailable,
} = require('../../infrastructure/database/redisClient');
const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'openaiClient' });

// Singleton instance
let openaiInstance = null;

const { RATE_LIMIT, TIME } = require('../../infrastructure/config/constants');

// Fallback in-memory rate limiting (only used if Redis unavailable)
const inMemoryRateLimitState = {
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
      logger.warn('OpenAI API key not configured, AI features will be disabled');
      return null;
    }

    const { AI } = require('../../infrastructure/config/constants');
    openaiInstance = new OpenAI({
      apiKey: apiKey,
      maxRetries: RATE_LIMIT.MAX_RETRIES,
      timeout: AI.TIMEOUT_MS,
    });

    logger.info('OpenAI client initialized');
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
 * Check rate limit using Redis (multi-instance support) with in-memory fallback
 * @returns {Promise<boolean>} True if request is allowed
 */
async function checkRateLimit() {
  // Use Redis if available (works across multiple server instances)
  if (isRedisAvailable()) {
    try {
      const windowSeconds = Math.floor(RATE_LIMIT.WINDOW_MS / 1000);
      const result = await redisCheckRateLimit(
        'openai:global',
        RATE_LIMIT.MAX_REQUESTS_PER_WINDOW,
        windowSeconds
      );

      if (!result.allowed) {
        logger.warn('OpenAI rate limit reached (Redis)', {
          count: result.count,
          maxRequests: RATE_LIMIT.MAX_REQUESTS_PER_WINDOW,
          resetAt: new Date(result.resetAt).toISOString(),
        });
        return false;
      }

      logger.debug('Rate limit check passed (Redis)', {
        count: result.count,
        remaining: result.remaining,
      });
      return true;
    } catch (error) {
      logger.warn('Redis rate limit check failed, falling back to in-memory', {
        error: error.message,
      });
      // Fall through to in-memory fallback
    }
  }

  // Fallback: In-memory rate limiting (single instance only)
  return checkRateLimitSync();
}

/**
 * DEPRECATED: Old synchronous checkRateLimit function
 * Now used only as fallback when Redis unavailable
 * @deprecated Use the async checkRateLimit() function instead
 */
function checkRateLimitSync() {
  const now = Date.now();

  // Reset window if expired
  if (now - inMemoryRateLimitState.windowStart >= inMemoryRateLimitState.windowMs) {
    inMemoryRateLimitState.requestCount = 0;
    inMemoryRateLimitState.windowStart = now;
  }

  // Check if under limit
  if (inMemoryRateLimitState.requestCount >= inMemoryRateLimitState.maxRequestsPerWindow) {
    logger.warn('OpenAI rate limit reached (sync fallback)', {
      count: inMemoryRateLimitState.requestCount,
      maxRequests: inMemoryRateLimitState.maxRequestsPerWindow,
    });
    return false;
  }

  inMemoryRateLimitState.requestCount++;
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

  // Check rate limit (async now - uses Redis)
  const rateLimitAllowed = await checkRateLimit();
  if (!rateLimitAllowed) {
    throw new Error('Rate limit exceeded, please try again later');
  }

  try {
    const startTime = Date.now();
    const response = await client.chat.completions.create(params);
    const duration = Date.now() - startTime;

    logger.debug('OpenAI request completed', {
      duration,
      model: params.model,
      tokens: response.usage?.total_tokens || 'unknown',
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
    });

    return response;
  } catch (error) {
    logger.error('OpenAI API error', {
      error: error.message,
      status: error.status,
      code: error.code,
      model: params.model,
    });

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
 * @returns {Promise<Object>} Rate limit stats
 */
async function getRateLimitStats() {
  if (isRedisAvailable()) {
    try {
      const windowSeconds = Math.floor(RATE_LIMIT.WINDOW_MS / 1000);
      const result = await redisCheckRateLimit(
        'openai:global',
        RATE_LIMIT.MAX_REQUESTS_PER_WINDOW,
        windowSeconds
      );
      return {
        requestCount: result.count,
        maxRequests: RATE_LIMIT.MAX_REQUESTS_PER_WINDOW,
        windowMs: RATE_LIMIT.WINDOW_MS,
        remaining: result.remaining,
        resetAt: result.resetAt,
        percentUsed: ((result.count / RATE_LIMIT.MAX_REQUESTS_PER_WINDOW) * 100).toFixed(1),
        usingRedis: true,
      };
    } catch (error) {
      logger.warn('Failed to get Redis rate limit stats', { error: error.message });
    }
  }

  // Fallback to in-memory stats
  return {
    requestCount: inMemoryRateLimitState.requestCount,
    maxRequests: inMemoryRateLimitState.maxRequestsPerWindow,
    windowMs: inMemoryRateLimitState.windowMs,
    percentUsed: (
      (inMemoryRateLimitState.requestCount / inMemoryRateLimitState.maxRequestsPerWindow) *
      100
    ).toFixed(1),
    usingRedis: false,
  };
}

module.exports = {
  getClient,
  isConfigured,
  createChatCompletion,
  getRateLimitStats,
};
