/**
 * Refresh Token Service
 *
 * Manages refresh tokens with rotation support.
 * Tokens are stored as SHA-256 hashes for security.
 *
 * Part of Phase 2: Data Model & Session Management
 */

const crypto = require('crypto');
const { BaseService } = require('../BaseService');
const { NotFoundError, ValidationError } = require('../errors');
const { PostgresGenericRepository } = require('../../repositories/postgres/PostgresGenericRepository');

class RefreshTokenService extends BaseService {
  constructor() {
    super(null, new PostgresGenericRepository('refresh_tokens'));
    this.tokenRepository = this.repository;
  }

  /**
   * Generate a secure refresh token
   * @returns {string} Random token (64 bytes, base64url encoded)
   */
  generateToken() {
    return crypto.randomBytes(64).toString('base64url');
  }

  /**
   * Hash a refresh token (SHA-256)
   * @param {string} token - Plain token
   * @returns {string} SHA-256 hash
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create a new refresh token
   * @param {Object} params
   * @param {number} params.userId - User ID
   * @param {number} [params.sessionId] - Associated session ID
   * @param {Date} params.expiresAt - Expiration date
   * @param {string} [params.ipAddress] - Client IP address
   * @param {string} [params.userAgent] - Client user agent
   * @returns {Promise<Object>} { token: plainToken, record: tokenRecord }
   */
  async createToken({ userId, sessionId = null, expiresAt, ipAddress = null, userAgent = null }) {
    if (!userId || !expiresAt) {
      throw new ValidationError('userId and expiresAt are required');
    }

    const plainToken = this.generateToken();
    const tokenHash = this.hashToken(plainToken);

    const record = await this.tokenRepository.create({
      user_id: userId,
      session_id: sessionId,
      token_hash: tokenHash,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return { token: plainToken, record };
  }

  /**
   * Find refresh token by hash
   * @param {string} tokenHash - Hashed token
   * @returns {Promise<Object|null>} Token record or null
   */
  async findByHash(tokenHash) {
    if (!tokenHash) {
      return null;
    }

    const token = await this.tokenRepository.findOne({
      token_hash: tokenHash,
    });

    if (!token) {
      return null;
    }

    // Check if expired
    if (new Date(token.expires_at) < new Date()) {
      return null;
    }

    // Check if revoked
    if (token.revoked_at) {
      return null;
    }

    return token;
  }

  /**
   * Validate and use a refresh token (for rotation)
   * @param {string} plainToken - Plain refresh token
   * @returns {Promise<Object|null>} Token record or null if invalid
   */
  async validateAndUse(plainToken) {
    if (!plainToken) {
      return null;
    }

    const tokenHash = this.hashToken(plainToken);
    const token = await this.findByHash(tokenHash);

    if (!token) {
      return null;
    }

    // Update last_used_at
    await this.tokenRepository.updateById(token.id, {
      last_used_at: new Date().toISOString(),
    });

    return await this.tokenRepository.findById(token.id);
  }

  /**
   * Rotate refresh token (revoke old, create new)
   * @param {string} oldToken - Old refresh token (plain)
   * @param {Object} params - Parameters for new token
   * @param {Date} params.expiresAt - Expiration for new token
   * @param {string} [params.ipAddress] - Client IP
   * @param {string} [params.userAgent] - Client user agent
   * @returns {Promise<Object>} { token: newPlainToken, record: newTokenRecord }
   */
  async rotateToken(oldToken, { expiresAt, ipAddress = null, userAgent = null }) {
    const oldTokenRecord = await this.validateAndUse(oldToken);
    if (!oldTokenRecord) {
      throw new ValidationError('Invalid or expired refresh token');
    }

    // Revoke old token
    await this.tokenRepository.updateById(oldTokenRecord.id, {
      revoked_at: new Date().toISOString(),
    });

    // Create new token linked to old one
    const { token: newPlainToken, record: newRecord } = await this.createToken({
      userId: oldTokenRecord.user_id,
      sessionId: oldTokenRecord.session_id,
      expiresAt,
      ipAddress,
      userAgent,
    });

    // Link new token to old one (rotation chain)
    await this.tokenRepository.updateById(newRecord.id, {
      rotated_from_id: oldTokenRecord.id,
    });

    const updatedRecord = await this.tokenRepository.findById(newRecord.id);

    return { token: newPlainToken, record: updatedRecord };
  }

  /**
   * Revoke a refresh token
   * @param {string} plainToken - Plain token
   * @returns {Promise<void>}
   */
  async revokeToken(plainToken) {
    if (!plainToken) {
      return;
    }

    const tokenHash = this.hashToken(plainToken);
    const token = await this.findByHash(tokenHash);
    if (token) {
      await this.tokenRepository.updateById(token.id, {
        revoked_at: new Date().toISOString(),
      });
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of tokens revoked
   */
  async revokeAllUserTokens(userId) {
    const result = await this.query(
      `UPDATE refresh_tokens 
       SET revoked_at = $1 
       WHERE user_id = $2 AND revoked_at IS NULL`,
      [new Date().toISOString(), userId]
    );
    return result.rowCount || 0;
  }

  /**
   * Clean up expired refresh tokens (called periodically)
   * @returns {Promise<number>} Number of tokens deleted
   */
  async cleanupExpiredTokens() {
    const result = await this.query(
      `DELETE FROM refresh_tokens 
       WHERE expires_at < $1 
          OR (revoked_at IS NOT NULL AND revoked_at < $2)`,
      [
        new Date().toISOString(),
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      ]
    );
    return result.rowCount || 0;
  }
}

module.exports = { RefreshTokenService };

