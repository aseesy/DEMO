/**
 * Username Value Object
 * 
 * IMPORTANT: This represents a DATABASE username (unique identifier),
 * NOT a display name or first name. Database usernames are:
 * - Auto-generated from email (e.g., "alice123")
 * - Lowercase, alphanumeric
 * - Unique across the system
 * - Used for authentication and database lookups
 * 
 * For display names, use the display_name field in the users table.
 * 
 * Immutable, validated username wrapper.
 * Provides type safety and automatic normalization.
 * 
 * @module domain/valueObjects/Username
 */

'use strict';

class Username {
  /**
   * Create a Username value object
   * @param {string} value - Username string
   * @throws {Error} If username is invalid
   */
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error(`Invalid username: ${value} - must be a non-empty string`);
    }

    const trimmed = value.trim();
    
    if (trimmed.length < 3) {
      throw new Error(`Invalid username: ${trimmed} - must be at least 3 characters`);
    }

    if (trimmed.length > 50) {
      throw new Error(`Invalid username: ${trimmed} - must be less than 50 characters`);
    }

    // Normalize to lowercase
    this.value = trimmed.toLowerCase();
    
    // Make immutable
    Object.freeze(this);
  }

  /**
   * Check if username string is valid
   * @param {string} username - Username to validate
   * @returns {boolean} True if valid
   */
  static isValid(username) {
    if (!username || typeof username !== 'string') {
      return false;
    }

    const trimmed = username.trim();
    return trimmed.length >= 3 && trimmed.length <= 50;
  }

  /**
   * Compare two Username objects for equality
   * @param {Username} other - Other Username object to compare
   * @returns {boolean} True if equal
   */
  equals(other) {
    if (!(other instanceof Username)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Convert to string
   * @returns {string} Username string
   */
  toString() {
    return this.value;
  }

  /**
   * Convert to JSON (for serialization)
   * @returns {string} Username string
   */
  toJSON() {
    return this.value;
  }
}

module.exports = Username;

