/**
 * Error Handler Registry
 *
 * Registry for error handlers implementing Strategy Pattern.
 * Enables extensibility without modifying existing code (Open-Closed Principle).
 *
 * @module utils/errorHandlers/ErrorHandlerRegistry
 */

import { InvalidTokenHandler } from './InvalidTokenHandler.js';
import { InvalidCodeHandler } from './InvalidCodeHandler.js';
import { AlreadyAcceptedHandler } from './AlreadyAcceptedHandler.js';
import { ExpiredHandler } from './ExpiredHandler.js';
import { CancelledHandler } from './CancelledHandler.js';
import { Reg001Handler } from './Reg001Handler.js';
import { Reg002Handler } from './Reg002Handler.js';
import { Reg003Handler } from './Reg003Handler.js';
import { Reg004Handler } from './Reg004Handler.js';
import { Reg008Handler } from './Reg008Handler.js';
import { NetworkErrorHandler } from './NetworkErrorHandler.js';
import { DefaultErrorHandler } from './DefaultErrorHandler.js';

/**
 * Registry for error handlers
 * Handles registration and lookup of error handlers
 */
class ErrorHandlerRegistry {
  constructor() {
    this.handlers = new Map();
    this.defaultHandler = new DefaultErrorHandler();

    // Register default handlers
    this.register('INVALID_TOKEN', new InvalidTokenHandler());
    this.register('INVALID_CODE', new InvalidCodeHandler());
    this.register('ALREADY_ACCEPTED', new AlreadyAcceptedHandler());
    this.register('EXPIRED', new ExpiredHandler());
    this.register('CANCELLED', new CancelledHandler());
    this.register('REG_001', new Reg001Handler());
    this.register('REG_002', new Reg002Handler());
    this.register('REG_003', new Reg003Handler());
    this.register('REG_004', new Reg004Handler());
    this.register('REG_008', new Reg008Handler());
    this.register('NETWORK_ERROR', new NetworkErrorHandler());
  }

  /**
   * Register an error handler
   *
   * @param {string} code - Error code (e.g., 'INVALID_TOKEN', 'EXPIRED')
   * @param {ErrorHandler} handler - Handler instance
   */
  register(code, handler) {
    if (!code) {
      throw new Error('Error code is required');
    }
    if (!handler || typeof handler.getMessage !== 'function') {
      throw new Error('Handler must be an ErrorHandler instance with getMessage() method');
    }

    this.handlers.set(code.toUpperCase(), handler);
    console.log(`✅ ErrorHandlerRegistry: Registered handler for code "${code}"`);
  }

  /**
   * Get handler for an error code
   *
   * @param {string} code - Error code
   * @returns {ErrorHandler} Handler instance or default handler
   */
  get(code) {
    if (!code) {
      return this.defaultHandler;
    }

    return this.handlers.get(code.toUpperCase()) || this.defaultHandler;
  }

  /**
   * Check if a handler is registered for an error code
   *
   * @param {string} code - Error code
   * @returns {boolean} True if handler exists
   */
  has(code) {
    if (!code) {
      return false;
    }
    return this.handlers.has(code.toUpperCase());
  }

  /**
   * Get all registered error codes
   *
   * @returns {string[]} Array of registered error codes
   */
  getRegisteredCodes() {
    return Array.from(this.handlers.keys());
  }
}

// Create singleton instance
const registry = new ErrorHandlerRegistry();

export { ErrorHandlerRegistry, registry };

