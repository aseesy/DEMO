/**
 * Default Action Handler
 *
 * Handles unknown or unrecognized actions - defaults to STAY_SILENT behavior.
 *
 * @module liaizen/core/response/handlers/DefaultActionHandler
 */

const { defaultLogger } = require('../../../../infrastructure/logging/logger');
const { ActionHandler } = require('./ActionHandler');

const logger = defaultLogger.child({ module: 'defaultActionHandler' });

/**
 * Default handler for unknown actions
 * Falls back to STAY_SILENT behavior for safety
 */
class DefaultActionHandler extends ActionHandler {
  /**
   * Process unknown action
   *
   * @param {Object} context - Processing context
   * @param {Object} context.result - Parsed AI response
   * @returns {Promise<null>} Always returns null (allow message)
   */
  async process(context) {
    const action = context.result?.action || 'UNKNOWN';
    logger.warn('Unknown action from AI, defaulting to STAY_SILENT', {
      action,
      messageId: context.message?.id,
    });
    return null;
  }
}

module.exports = { DefaultActionHandler };
