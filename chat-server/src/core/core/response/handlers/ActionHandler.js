/**
 * Action Handler Base Class
 *
 * Base class for all action handlers in the response processing system.
 * Implements Strategy Pattern for Open-Closed Principle compliance.
 *
 * @module liaizen/core/response/handlers/ActionHandler
 */

/**
 * Base class for action handlers
 * All action handlers must extend this class and implement process()
 */
class ActionHandler {
  /**
   * Process the action with the given context
   *
   * @param {Object} context - Processing context
   * @param {Object} context.result - Parsed AI response
   * @param {Object} context.message - Original message
   * @param {Object} context.roleContext - Role context
   * @param {Map} context.participantProfiles - Participant profiles
   * @param {string} context.roomId - Room ID
   * @param {Object} context.policyState - Policy state
   * @param {Object} context.parsedMessage - Code Layer parsed message
   * @param {Object} context.languageAnalysis - Language analysis
   * @param {boolean} context.shouldLimitComments - Whether to limit comments
   * @returns {Promise<Object|null>} Processed result or null
   */
  async process(context) {
    throw new Error('process() must be implemented by subclass');
  }
}

module.exports = { ActionHandler };

