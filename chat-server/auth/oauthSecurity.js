/**
 * OAuth Security Utilities
 * 
 * Provides PKCE, state validation, and ID token validation for secure OAuth flows.
 * Single source of truth for OAuth security - no duplicates.
 */

const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

/**
 * Generate PKCE code verifier and challenge
 * @returns {Object} { codeVerifier, codeChallenge, codeChallengeMethod }
 */
function generatePKCE() {
  // Generate 128 character code verifier (base64url encoded)
  const codeVerifier = crypto.randomBytes(64).toString('base64url');
  
  // Generate SHA256 hash of code verifier (code challenge)
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
}

/**
 * Verify PKCE code verifier against code challenge
 * @param {string} codeVerifier - The code verifier from client
 * @param {string} codeChallenge - The code challenge stored
 * @returns {boolean} True if verification succeeds
 */
function verifyPKCE(codeVerifier, codeChallenge) {
  if (!codeVerifier || !codeChallenge) {
    return false;
  }
  
  const computedChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  return computedChallenge === codeChallenge;
}

/**
 * OAuth State Store (in-memory with TTL)
 * Stores state parameters with expiration for CSRF protection
 */
class OAuthStateStore {
  constructor() {
    this.store = new Map();
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Store OAuth state with PKCE data
   * @param {string} state - State parameter
   * @param {Object} data - PKCE and other data to store
   * @param {number} ttlMs - Time to live in milliseconds (default: 10 minutes)
   */
  set(state, data, ttlMs = 10 * 60 * 1000) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(state, {
      ...data,
      expiresAt,
    });
  }

  /**
   * Get and remove OAuth state (single use)
   * @param {string} state - State parameter
   * @returns {Object|null} Stored data or null if not found/expired
   */
  get(state) {
    const entry = this.store.get(state);
    
    if (!entry) {
      return null;
    }
    
    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.store.delete(state);
      return null;
    }
    
    // Remove after use (single use)
    this.store.delete(state);
    
    // Return data without expiresAt
    const { expiresAt, ...data } = entry;
    return data;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [state, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(state);
      }
    }
  }

  /**
   * Clear all entries (for testing/shutdown)
   */
  clear() {
    this.store.clear();
  }

  /**
   * Shutdown cleanup interval
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
const stateStore = new OAuthStateStore();

/**
 * Validate Google ID Token
 * @param {string} idToken - Google ID token from token exchange
 * @param {string} clientId - Google OAuth client ID
 * @returns {Promise<Object>} Decoded token payload with user info
 * @throws {Error} If token validation fails
 */
async function validateGoogleIdToken(idToken, clientId) {
  if (!idToken) {
    throw new Error('ID token is required');
  }

  if (!clientId) {
    throw new Error('Client ID is required for token validation');
  }

  const client = new OAuth2Client(clientId);
  
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    
    const payload = ticket.getPayload();
    
    // Validate required claims
    if (!payload.sub) {
      throw new Error('ID token missing sub claim');
    }
    
    if (!payload.email) {
      throw new Error('ID token missing email claim');
    }
    
    // Check email verification status
    if (!payload.email_verified) {
      throw new Error('Google email is not verified');
    }
    
    return {
      sub: payload.sub, // Google user ID
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name,
      picture: payload.picture,
      given_name: payload.given_name,
      family_name: payload.family_name,
    };
  } catch (error) {
    if (error.message.includes('Token used too early')) {
      throw new Error('ID token not yet valid');
    }
    if (error.message.includes('expired')) {
      throw new Error('ID token expired');
    }
    throw new Error(`ID token validation failed: ${error.message}`);
  }
}

module.exports = {
  generatePKCE,
  verifyPKCE,
  stateStore,
  validateGoogleIdToken,
};

