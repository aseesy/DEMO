/**
 * Action Handler Registry
 *
 * Registry for action handlers implementing Strategy Pattern.
 * Enables extensibility without modifying existing code (Open-Closed Principle).
 *
 * @module liaizen/core/response/handlers/ActionHandlerRegistry
 */

const { defaultLogger } = require('../../../infrastructure/logging/logger');
const { StaySilentHandler } = require('./StaySilentHandler');
const { CommentHandler } = require('./CommentHandler');
const { InterveneHandler } = require('./InterveneHandler');
const { DefaultActionHandler } = require('./DefaultActionHandler');

const logger = defaultLogger.child({ module: 'actionHandlerRegistry' });

/**
 * Registry for action handlers
 * Handles registration and lookup of action handlers
 */
class ActionHandlerRegistry {
  constructor() {
    this.handlers = new Map();
    this.defaultHandler = new DefaultActionHandler();

    // Register default handlers
    this.register('STAY_SILENT', new StaySilentHandler());
    this.register('COMMENT', new CommentHandler());
    this.register('INTERVENE', new InterveneHandler());
  }

  /**
   * Register an action handler
   *
   * @param {string} action - Action name (e.g., 'STAY_SILENT', 'COMMENT', 'INTERVENE')
   * @param {ActionHandler} handler - Handler instance
   */
  register(action, handler) {
    if (!action) {
      throw new Error('Action name is required');
    }
    if (!handler || typeof handler.process !== 'function') {
      throw new Error('Handler must be an ActionHandler instance with process() method');
    }

    const normalizedAction = action.toUpperCase();
    this.handlers.set(normalizedAction, handler);
    logger.debug('Registered action handler', {
      action: normalizedAction,
    });
  }

  /**
   * Get handler for an action
   *
   * @param {string} action - Action name
   * @returns {ActionHandler} Handler instance or default handler
   */
  get(action) {
    if (!action) {
      return this.defaultHandler;
    }

    const normalizedAction = action.toUpperCase();
    return this.handlers.get(normalizedAction) || this.defaultHandler;
  }

  /**
   * Check if a handler is registered for an action
   *
   * @param {string} action - Action name
   * @returns {boolean} True if handler exists
   */
  has(action) {
    if (!action) {
      return false;
    }
    return this.handlers.has(action.toUpperCase());
  }

  /**
   * Get all registered action names
   *
   * @returns {string[]} Array of registered action names
   */
  getRegisteredActions() {
    return Array.from(this.handlers.keys());
  }
}

// Create singleton instance
const registry = new ActionHandlerRegistry();

module.exports = {
  ActionHandlerRegistry,
  registry,
};
