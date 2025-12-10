/**
 * Email Value Object
 * 
 * Immutable, validated email address wrapper.
 * Provides type safety and automatic validation.
 * 
 * @module domain/valueObjects/Email
 */

'use strict';

class Email {
  /**
   * Create an Email value object
   * @param {string} value - Email address string
   * @throws {Error} If email is invalid
   */
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error(`Invalid email: ${value} - must be a non-empty string`);
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error(`Invalid email: ${value} - cannot be empty`);
    }

    if (!Email.isValid(trimmed)) {
      throw new Error(`Invalid email: ${trimmed}`);
    }

    // Normalize to lowercase
    this.value = trimmed.toLowerCase();
    
    // Make immutable
    Object.freeze(this);
  }

  /**
   * Check if email string is valid
   * @param {string} email - Email address to validate
   * @returns {boolean} True if valid
   */
  static isValid(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // RFC 5322 compliant regex (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Compare two Email objects for equality
   * @param {Email} other - Other Email object to compare
   * @returns {boolean} True if equal
   */
  equals(other) {
    if (!(other instanceof Email)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Convert to string
   * @returns {string} Email address string
   */
  toString() {
    return this.value;
  }

  /**
   * Convert to JSON (for serialization)
   * @returns {string} Email address string
   */
  toJSON() {
    return this.value;
  }
}

module.exports = Email;

