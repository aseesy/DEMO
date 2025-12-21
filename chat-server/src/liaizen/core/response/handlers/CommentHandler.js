/**
 * Comment Action Handler
 *
 * Handles COMMENT action - adds optional comment without blocking message.
 *
 * @module liaizen/core/response/handlers/CommentHandler
 */

const { ActionHandler } = require('./ActionHandler');
const { buildCommentResult } = require('../resultBuilder');

/**
 * Handler for COMMENT action
 * Returns comment result if comment is available and not rate-limited
 */
class CommentHandler extends ActionHandler {
  /**
   * Process COMMENT action
   *
   * @param {Object} context - Processing context
   * @param {Object} context.result - Parsed AI response
   * @param {Object} context.message - Original message
   * @param {boolean} context.shouldLimitComments - Whether to limit comments
   * @returns {Promise<Object|null>} Comment result or null
   */
  async process(context) {
    const { result, message, shouldLimitComments } = context;

    if (shouldLimitComments) {
      console.log('💬 AI Mediator: Skipping comment due to frequency limit');
      return null;
    }

    if (!result.intervention?.comment) {
      console.error('❌ COMMENT action but no comment text');
      return null;
    }

    console.log('💬 AI Mediator: Adding comment');
    return buildCommentResult({
      commentText: result.intervention.comment,
      message,
      result,
    });
  }
}

module.exports = { CommentHandler };

