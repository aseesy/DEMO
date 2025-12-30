/**
 * Conversation Analyzer Interface
 *
 * Defines the contract for AI-powered conversation analysis.
 * Abstracts AI provider and prompt details from the core domain.
 *
 * @interface IConversationAnalyzer
 */

/**
 * @typedef {Object} ThreadSuggestion
 * @property {'new_thread'|'existing_thread'|'none'} action - Suggested action
 * @property {string|null} threadTitle - Suggested title if new_thread
 * @property {string|null} threadId - Thread ID if existing_thread
 * @property {number} confidence - Confidence score (0-100)
 * @property {string} reasoning - Explanation of the decision
 */

/**
 * @typedef {Object} ConversationAnalysis
 * @property {Array<Object>} suggestions - Suggested threads
 * @property {Array<Object>} createdThreads - Actually created threads
 */

/**
 * Conversation analyzer interface for AI-powered thread analysis
 *
 * Implementations:
 * - AIThreadAnalyzer (production - uses OpenAI)
 * - MockConversationAnalyzer (testing)
 *
 * @example
 * // Implementation must provide:
 * const analyzer = {
 *   suggestThreadForMessage: async (message, recentMessages, roomId, getThreads) => ({ action, threadTitle, ... }),
 *   analyzeConversationHistory: async (roomId, limit, dependencies) => ({ suggestions, createdThreads }),
 *   autoAssignMessageToThread: async (message, getThreads, addMessage) => ({ threadId, ... }),
 * };
 */
const IConversationAnalyzer = {
  /**
   * Suggest if a message should start a new thread or belong to an existing thread
   * @param {Object} message - Message object with username and text
   * @param {Array<Object>} recentMessages - Recent messages for context
   * @param {string} roomId - Room ID
   * @param {Function} getThreadsForRoom - Function to get existing threads
   * @returns {Promise<ThreadSuggestion|null>} Suggestion or null if no suggestion
   */
  suggestThreadForMessage: async (/* message, recentMessages, roomId, getThreadsForRoom */) => {
    throw new Error('IConversationAnalyzer.suggestThreadForMessage must be implemented');
  },

  /**
   * Analyze conversation history to identify recurring topics and create threads
   * @param {string} roomId - Room ID to analyze
   * @param {number} limit - Maximum number of messages to analyze
   * @param {Object} dependencies - Required functions (getThreadsForRoom, createThread, etc.)
   * @returns {Promise<ConversationAnalysis>} Analysis results with suggestions and created threads
   */
  analyzeConversationHistory: async (/* roomId, limit, dependencies */) => {
    throw new Error('IConversationAnalyzer.analyzeConversationHistory must be implemented');
  },

  /**
   * Auto-assign a message to the best matching existing thread using keyword matching
   * @param {Object} message - Message object with id, text, roomId
   * @param {Function} getThreadsForRoom - Function to get existing threads
   * @param {Function} addMessageToThread - Function to add message to thread
   * @returns {Promise<Object|null>} Assignment result with threadId, threadTitle, category, score
   */
  autoAssignMessageToThread: async (/* message, getThreadsForRoom, addMessageToThread */) => {
    throw new Error('IConversationAnalyzer.autoAssignMessageToThread must be implemented');
  },
};

module.exports = { IConversationAnalyzer };

