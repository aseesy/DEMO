/**
 * Stay Silent Action Handler
 *
 * Handles STAY_SILENT action - allows message to pass through without intervention.
 *
 * @module liaizen/core/response/handlers/StaySilentHandler
 */

const { defaultLogger } = require('../../../infrastructure/logging/logger');
const { ActionHandler } = require('./ActionHandler');

const logger = defaultLogger.child({ module: 'staySilentHandler' });

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
    logger.debug('STAY_SILENT action - allowing message', {
      messageId: context.message?.id,
    });
    return null;
  }
}

module.exports = { StaySilentHandler };
