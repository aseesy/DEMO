/**
 * Auth Identity Service
 *
 * Manages authentication identities in the normalized auth_identities table.
 * Supports multiple authentication methods per user (Google, email/password, etc.).
 *
 * Part of Phase 2: Data Model & Session Management
 */

const { BaseService } = require('../BaseService');
const { NotFoundError, ValidationError } = require('../errors');
const { PostgresGenericRepository } = require('../../repositories/postgres/PostgresGenericRepository');

class AuthIdentityService extends BaseService {
  constructor() {
    super(null, new PostgresGenericRepository('auth_identities'));
    this.identityRepository = this.repository;
  }

  /**
   * Find or create identity by provider and provider_subject
   * @param {Object} params
   * @param {string} params.provider - 'google', 'email_password', etc.
   * @param {string} params.providerSubject - Provider-specific identifier
   * @param {number} params.userId - User ID
   * @param {string} [params.providerEmail] - Email associated with identity
   * @param {boolean} [params.emailVerified] - Whether email is verified
   * @returns {Promise<Object>} Identity record
   */
  async findOrCreateIdentity({ provider, providerSubject, userId, providerEmail, emailVerified = false }) {
    if (!provider || !providerSubject || !userId) {
      throw new ValidationError('provider, providerSubject, and userId are required');
    }

    // Normalize email if provided
    const normalizedEmail = providerEmail ? providerEmail.trim().toLowerCase() : null;
    const normalizedSubject = providerSubject.trim().toLowerCase();

    // Try to find existing identity
    const existing = await this.identityRepository.findOne({
      provider,
      provider_subject: normalizedSubject,
    });

    if (existing) {
      // Update if user_id or email changed (shouldn't happen, but handle gracefully)
      if (existing.user_id !== userId || (normalizedEmail && existing.provider_email !== normalizedEmail)) {
        await this.identityRepository.updateById(existing.id, {
          user_id: userId,
          provider_email: normalizedEmail,
          email_verified: emailVerified,
          updated_at: new Date().toISOString(),
        });
        return await this.identityRepository.findById(existing.id);
      }
      return existing;
    }

    // Create new identity
    return await this.identityRepository.create({
      user_id: userId,
      provider,
      provider_subject: normalizedSubject,
      provider_email: normalizedEmail,
      email_verified: emailVerified,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Find identity by provider and provider_subject
   * @param {string} provider - 'google', 'email_password', etc.
   * @param {string} providerSubject - Provider-specific identifier
   * @returns {Promise<Object|null>} Identity or null if not found
   */
  async findByIdentity(provider, providerSubject) {
    if (!provider || !providerSubject) {
      return null;
    }

    return await this.identityRepository.findOne({
      provider,
      provider_subject: providerSubject.trim().toLowerCase(),
    });
  }

  /**
   * Find all identities for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of identity records
   */
  async findByUserId(userId) {
    if (!userId) {
      return [];
    }

    return await this.query(
      'SELECT * FROM auth_identities WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );
  }

  /**
   * Find user by provider identity (for OAuth login)
   * @param {string} provider - 'google', etc.
   * @param {string} providerSubject - Provider-specific identifier (e.g., Google sub)
   * @returns {Promise<Object|null>} User record or null
   */
  async findUserByIdentity(provider, providerSubject) {
    const identity = await this.findByIdentity(provider, providerSubject);
    if (!identity) {
      return null;
    }

    // Get user from users table
    const userResult = await this.query('SELECT * FROM users WHERE id = $1', [identity.user_id]);
    return userResult.length > 0 ? userResult[0] : null;
  }

  /**
   * Link new identity to existing user
   * @param {number} userId - Existing user ID
   * @param {string} provider - New provider
   * @param {string} providerSubject - New provider subject
   * @param {string} [providerEmail] - Email for new identity
   * @param {boolean} [emailVerified] - Whether email is verified
   * @returns {Promise<Object>} Created identity
   */
  async linkIdentityToUser(userId, provider, providerSubject, providerEmail = null, emailVerified = false) {
    // Check if identity already exists
    const existing = await this.findByIdentity(provider, providerSubject);
    if (existing) {
      if (existing.user_id !== userId) {
        throw new ValidationError('This identity is already linked to another user');
      }
      return existing;
    }

    return await this.findOrCreateIdentity({
      provider,
      providerSubject,
      userId,
      providerEmail,
      emailVerified,
    });
  }

  /**
   * Update email verification status for an identity
   * @param {number} identityId - Identity ID
   * @param {boolean} emailVerified - Verification status
   * @returns {Promise<Object>} Updated identity
   */
  async updateEmailVerification(identityId, emailVerified) {
    return await this.identityRepository.updateById(identityId, {
      email_verified: emailVerified,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Delete an identity (unlink auth method from user)
   * @param {number} identityId - Identity ID
   * @returns {Promise<void>}
   */
  async deleteIdentity(identityId) {
    await this.identityRepository.deleteById(identityId);
  }
}

module.exports = { AuthIdentityService };

