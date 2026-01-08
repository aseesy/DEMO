/**
 * Invitation Factory
 *
 * Factory for creating pairing invitations using Strategy Pattern.
 * Enables extensibility without modifying existing code (Open-Closed Principle).
 *
 * @module pairing-manager/InvitationFactory
 */

const { EmailInvitationCreator } = require('./creators/EmailInvitationCreator');
const { LinkInvitationCreator } = require('./creators/LinkInvitationCreator');
const { CodeInvitationCreator } = require('./creators/CodeInvitationCreator');

const { defaultLogger: defaultLogger } = require('../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'InvitationFactory',
});

/**
 * Factory for invitation creators
 * Handles registration and creation of pairing invitations
 */
class InvitationFactory {
  constructor() {
    this.creators = new Map();

    // Register default creators
    this.register('email', new EmailInvitationCreator());
    this.register('link', new LinkInvitationCreator());
    this.register('code', new CodeInvitationCreator());
  }

  /**
   * Register an invitation creator
   *
   * @param {string} type - Invitation type (e.g., 'email', 'link', 'code')
   * @param {InvitationCreator} creator - Creator instance
   */
  register(type, creator) {
    if (!type) {
      throw new Error('Invitation type is required');
    }
    if (!creator || typeof creator.create !== 'function') {
      throw new Error('Creator must be an InvitationCreator instance with create() method');
    }

    this.creators.set(type.toLowerCase(), creator);
    logger.debug('Log message', {
      value: `✅ InvitationFactory: Registered creator for type "${type}"`,
    });
  }

  /**
   * Create an invitation using the appropriate creator
   *
   * @param {string} type - Invitation type
   * @param {Object} params - Creation parameters
   * @param {Object} db - Database connection
   * @returns {Promise<Object>} Created pairing session
   */
  async create(type, params, db) {
    if (!type) {
      throw new Error('Invitation type is required');
    }

    const creator = this.creators.get(type.toLowerCase());
    if (!creator) {
      throw new Error(
        `Unknown invitation type: ${type}. Registered types: ${Array.from(this.creators.keys()).join(', ')}`
      );
    }

    return creator.create(params, db);
  }

  /**
   * Check if a creator is registered for a type
   *
   * @param {string} type - Invitation type
   * @returns {boolean} True if creator exists
   */
  has(type) {
    if (!type) {
      return false;
    }
    return this.creators.has(type.toLowerCase());
  }

  /**
   * Get all registered invitation types
   *
   * @returns {string[]} Array of registered types
   */
  getRegisteredTypes() {
    return Array.from(this.creators.keys());
  }
}

// Create singleton instance
const factory = new InvitationFactory();

module.exports = {
  InvitationFactory,
  factory,
};
