/**
 * Topics Service Module
 *
 * AI Thread Summaries feature - automatic topic detection,
 * AI-generated summaries, and citation tracking.
 *
 * @module services/topics
 */

const TopicDetector = require('./TopicDetector');
const SummaryGenerator = require('./SummaryGenerator');
const TopicService = require('./TopicService');

// Singleton instance (initialized lazily with AI client)
let topicServiceInstance = null;

/**
 * Get or create TopicService instance
 *
 * @param {Object} aiClient OpenAI client (required on first call)
 * @returns {TopicService}
 */
function getTopicService(aiClient) {
  if (!topicServiceInstance) {
    if (!aiClient) {
      // Try to get from existing client
      try {
        const { getClient } = require('../../core/engine/client');
        aiClient = getClient();
      } catch (e) {
        throw new Error('TopicService requires AI client on first initialization');
      }
    }
    topicServiceInstance = new TopicService(aiClient);
  }
  return topicServiceInstance;
}

module.exports = {
  TopicDetector,
  SummaryGenerator,
  TopicService,
  getTopicService
};
