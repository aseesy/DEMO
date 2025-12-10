/**
 * RoomId Value Object
 * 
 * Immutable, validated room identifier wrapper.
 * Provides type safety for room IDs.
 * 
 * @module domain/valueObjects/RoomId
 */

'use strict';

class RoomId {
  /**
   * Create a RoomId value object
   * @param {string} value - Room ID string
   * @throws {Error} If room ID is invalid
   */
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error(`Invalid RoomId: ${value} - must be a non-empty string`);
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error(`Invalid RoomId: ${value} - cannot be empty`);
    }

    this.value = trimmed;
    
    // Make immutable
    Object.freeze(this);
  }

  /**
   * Check if room ID string is valid
   * @param {string} roomId - Room ID to validate
   * @returns {boolean} True if valid
   */
  static isValid(roomId) {
    if (!roomId || typeof roomId !== 'string') {
      return false;
    }
    return roomId.trim().length > 0;
  }

  /**
   * Compare two RoomId objects for equality
   * @param {RoomId} other - Other RoomId object to compare
   * @returns {boolean} True if equal
   */
  equals(other) {
    if (!(other instanceof RoomId)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Convert to string
   * @returns {string} Room ID string
   */
  toString() {
    return this.value;
  }

  /**
   * Convert to JSON (for serialization)
   * @returns {string} Room ID string
   */
  toJSON() {
    return this.value;
  }
}

module.exports = RoomId;

