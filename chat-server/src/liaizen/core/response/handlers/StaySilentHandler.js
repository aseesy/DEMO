/**
 * Stay Silent Action Handler
 *
 * Handles STAY_SILENT action - allows message to pass through without intervention.
 *
 * @module liaizen/core/response/handlers/StaySilentHandler
 */

const { ActionHandler } = require('./ActionHandler');

/**
 * Handler for STAY_SILENT action
 * Returns null to allow message through
 */
class StaySilentHandler extends ActionHandler {
  /**
   * Process STAY_SILENT action
   *
   * @param {Object} context - Processing context
   * @returns {Promise<null>} Always returns null to allow message
   */
  async process(context) {
    console.log('🤖 AI Mediator: STAY_SILENT - allowing message');
    return null;
  }
}

module.exports = { StaySilentHandler };

