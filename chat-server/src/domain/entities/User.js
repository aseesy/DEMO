/**
 * User Domain Entity
 *
 * Represents a co-parent using the platform (authenticated individual).
 * Encapsulates business rules for user operations.
 *
 * @module domain/entities/User
 */

'use strict';

const { Email } = require('../valueObjects');
const { Username } = require('../valueObjects');

class User {
  /**
   * Create a User entity
   * @param {Object} params - User properties
   * @param {number} params.id - User ID
   * @param {string|Email} params.email - User email
   * @param {string|Username} params.username - Database username (unique identifier)
   * @param {string} [params.displayName] - Display name shown to other users
   * @param {string} [params.firstName] - First name
   * @param {string} [params.lastName] - Last name
   * @param {string} [params.passwordHash] - Hashed password
   * @param {string} [params.googleId] - Google OAuth ID
   * @param {Date} [params.createdAt] - Creation timestamp
   * @param {Date} [params.lastLogin] - Last login timestamp
   */
  constructor({
    id,
    email,
    username,
    displayName = null,
    firstName = null,
    lastName = null,
    passwordHash = null,
    googleId = null,
    createdAt = new Date(),
    lastLogin = null,
  }) {
    if (!id && id !== 0) {
      throw new Error('User ID is required');
    }

    this.id = id;
    this.email = email instanceof Email ? email : new Email(email);
    this.username = username instanceof Username ? username : new Username(username);
    this.displayName = displayName;
    this.firstName = firstName;
    this.lastName = lastName;
    this.passwordHash = passwordHash;
    this.googleId = googleId;
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.lastLogin = lastLogin ? (lastLogin instanceof Date ? lastLogin : new Date(lastLogin)) : null;

    // Make immutable (prevent direct property modification)
    Object.freeze(this);
  }

  /**
   * Get the user's full name
   * @returns {string} Full name or display name or email
   */
  getFullName() {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    if (this.displayName) {
      return this.displayName;
    }
    return this.email.toString();
  }

  /**
   * Check if user has a password (not OAuth-only)
   * @returns {boolean} True if has password
   */
  hasPassword() {
    return !!this.passwordHash;
  }

  /**
   * Check if user is OAuth-only (no password)
   * @returns {boolean} True if OAuth-only
   */
  isOAuthOnly() {
    return !!this.googleId && !this.passwordHash;
  }

  /**
   * Update last login timestamp
   * @returns {User} New User instance with updated lastLogin
   */
  updateLastLogin() {
    return new User({
      ...this.toPlainObject(),
      lastLogin: new Date(),
    });
  }

  /**
   * Convert to plain object (for serialization)
   * @returns {Object} Plain object representation
   */
  toPlainObject() {
    return {
      id: this.id,
      email: this.email.toString(),
      username: this.username.toString(),
      displayName: this.displayName,
      firstName: this.firstName,
      lastName: this.lastName,
      passwordHash: this.passwordHash,
      googleId: this.googleId,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin,
    };
  }

  /**
   * Create User from database row
   * @param {Object} row - Database row
   * @returns {User} User entity
   */
  static fromDatabaseRow(row) {
    return new User({
      id: row.id,
      email: row.email,
      username: row.username,
      displayName: row.display_name,
      firstName: row.first_name,
      lastName: row.last_name,
      passwordHash: row.password_hash,
      googleId: row.google_id,
      createdAt: row.created_at,
      lastLogin: row.last_login,
    });
  }

  /**
   * Create User from API data
   * @param {Object} data - API data
   * @returns {User} User entity
   */
  static fromApiData(data) {
    return new User({
      id: data.id,
      email: data.email,
      username: data.username,
      displayName: data.displayName || data.display_name,
      firstName: data.firstName || data.first_name,
      lastName: data.lastName || data.last_name,
      passwordHash: data.passwordHash || data.password_hash,
      googleId: data.googleId || data.google_id,
      createdAt: data.createdAt || data.created_at,
      lastLogin: data.lastLogin || data.last_login,
    });
  }
}

module.exports = User;

