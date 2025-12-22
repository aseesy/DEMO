/**
 * AI Client Interface
 *
 * Defines the contract for AI service operations.
 * Abstracts the AI provider (OpenAI, Anthropic, etc.) from the core domain.
 *
 * @interface IAIClient
 */

/**
 * @typedef {Object} Message
 * @property {'system'|'user'|'assistant'} role - Message role
 * @property {string} content - Message content
 */

/**
 * @typedef {Object} CompletionParams
 * @property {string} model - Model identifier
 * @property {Array<Message>} messages - Conversation messages
 * @property {number} [max_tokens] - Maximum response tokens
 * @property {number} [temperature] - Sampling temperature (0-2)
 */

/**
 * @typedef {Object} CompletionResponse
 * @property {Array<{message: {content: string}}>} choices - Response choices
 * @property {Object} [usage] - Token usage statistics
 */

/**
 * AI client interface for completion operations
 *
 * Implementations:
 * - OpenAIClient (production)
 * - MockAIClient (testing)
 *
 * @example
 * // Implementation must provide:
 * const aiClient = {
 *   isConfigured: () => true,
 *   createChatCompletion: async (params) => ({ choices: [...] }),
 *   getRateLimitStats: () => ({ requestCount: 0, maxRequests: 100 }),
 * };
 */
const IAIClient = {
  /**
   * Check if AI client is configured and ready
   * @returns {boolean} True if API key is set and client is ready
   */
  isConfigured: () => {
    throw new Error('IAIClient.isConfigured must be implemented');
  },

  /**
   * Create a chat completion
   * @param {CompletionParams} params - Completion parameters
   * @returns {Promise<CompletionResponse>} Completion response
   */
  createChatCompletion: async (/* params */) => {
    throw new Error('IAIClient.createChatCompletion must be implemented');
  },

  /**
   * Get rate limit statistics
   * @returns {Object} Rate limit stats
   */
  getRateLimitStats: () => {
    throw new Error('IAIClient.getRateLimitStats must be implemented');
  },
};

module.exports = { IAIClient };
