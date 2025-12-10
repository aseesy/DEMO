/**
 * MessageId Value Object
 * 
 * Immutable, validated message identifier wrapper.
 * Provides type safety for message IDs.
 * 
 * @module domain/valueObjects/MessageId
 */

'use strict';

class MessageId {
  /**
   * Create a MessageId value object
   * @param {string} value - Message ID string
   * @throws {Error} If message ID is invalid
   */
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error(`Invalid MessageId: ${value} - must be a non-empty string`);
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error(`Invalid MessageId: ${value} - cannot be empty`);
    }

    this.value = trimmed;
    
    // Make immutable
    Object.freeze(this);
  }

  /**
   * Check if message ID string is valid
   * @param {string} messageId - Message ID to validate
   * @returns {boolean} True if valid
   */
  static isValid(messageId) {
    if (!messageId || typeof messageId !== 'string') {
      return false;
    }
    return messageId.trim().length > 0;
  }

  /**
   * Compare two MessageId objects for equality
   * @param {MessageId} other - Other MessageId object to compare
   * @returns {boolean} True if equal
   */
  equals(other) {
    if (!(other instanceof MessageId)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Convert to string
   * @returns {string} Message ID string
   */
  toString() {
    return this.value;
  }

  /**
   * Convert to JSON (for serialization)
   * @returns {string} Message ID string
   */
  toJSON() {
    return this.value;
  }
}

module.exports = MessageId;

