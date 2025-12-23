/**
 * MessageValidationService - Business Logic Layer
 *
 * Responsibility: Validate messages and make traffic control decisions
 *
 * Why this exists:
 * - Separates business logic (conflict detection, analysis) from UI and transport
 * - If we change the analysis engine, only this service changes
 * - Can be tested independently without UI or network concerns
 * - View layer doesn't need to know about conflict detection
 *
 * Single Responsibility: Validation and traffic control only
 */

import { analyzeMessage, shouldSendMessage } from '../../utils/messageAnalyzer.js';
import { DEFAULT_SENDER_PROFILE, DEFAULT_RECEIVER_PROFILE } from '../../utils/profileBuilder.js';

/**
 * MessageValidationService
 *
 * Handles message analysis and traffic control decisions
 */
export class MessageValidationService {
  /**
   * Validate a message and determine if it should be sent
   *
   * This is the "Traffic Control" logic - decides if message is safe to send
   *
   * @param {string} messageText - Message to validate
   * @param {Object} [options] - Validation options
   * @param {Object} [options.senderProfile] - Sender context
   * @param {Object} [options.receiverProfile] - Receiver context
   * @returns {Promise<Object>} Validation result
   * @returns {Promise<Object>} result.shouldSend - Whether message should be sent
   * @returns {Promise<Object>} result.reason - Reason for decision
   * @returns {Promise<Object>} result.observerData - Observer card data if intervention needed
   * @returns {Promise<Object>} result.analysis - Full analysis result
   */
  async validateMessage(messageText, options = {}) {
    const senderProfile = options.senderProfile || DEFAULT_SENDER_PROFILE;
    const receiverProfile = options.receiverProfile || DEFAULT_RECEIVER_PROFILE;

    try {
      // Analyze the message using Observer/Mediator framework
      const analysis = await analyzeMessage(messageText, senderProfile, receiverProfile);

      // Traffic Control: Decide if message should be sent
      const decision = shouldSendMessage(analysis);

      return {
        shouldSend: decision.shouldSend,
        reason: decision.reason,
        observerData: decision.observerData,
        analysis: analysis,
      };
    } catch (error) {
      console.error('[MessageValidationService] Error validating message:', error);
      // Fail open - allow message through on error
      return {
        shouldSend: true,
        reason: 'validation_error',
        observerData: null,
        analysis: null,
        error: error.message,
      };
    }
  }

  /**
   * Quick check for obviously safe messages (no API call)
   *
   * Uses local pattern matching to quickly identify safe messages
   * without making an API call to the analysis service.
   *
   * @param {string} messageText - Message to check
   * @returns {Object} Quick check result
   * @returns {boolean} result.shouldSend - Whether message should be sent
   * @returns {string} result.reason - Reason for decision
   * @returns {boolean} result.needsFullAnalysis - Whether full analysis is needed
   */
  quickCheck(messageText) {
    // Use the already imported shouldSendMessage function
    const quickResult = shouldSendMessage({
      action: 'QUICK_CHECK',
      messageText: messageText.trim(),
    });

    return {
      shouldSend: quickResult.shouldSend,
      reason: quickResult.reason,
      needsFullAnalysis: !quickResult.shouldSend || quickResult.reason === 'needs_analysis',
    };
  }
}

/**
 * Create a MessageValidationService instance
 * @returns {MessageValidationService}
 */
export function createMessageValidationService() {
  return new MessageValidationService();
}
