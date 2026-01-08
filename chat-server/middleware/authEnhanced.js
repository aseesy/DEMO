/**
 * Enhanced Authentication Middleware (Phase 2)
 *
 * Provides JWT-based authentication with:
 * - Short-lived access tokens (15 minutes)
 * - Refresh tokens with rotation
 * - Server-side session tracking
 *
 * Maintains backward compatibility with legacy long-lived tokens.
 */

const jwt = require('jsonwebtoken');
const { SessionService } = require('../src/services/auth/sessionService');
const { RefreshTokenService } = require('../src/services/auth/refreshTokenService');

const { defaultLogger: defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'authEnhanced',
});

// JWT_SECRET must be set in environment
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set');
}

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

const sessionService = new SessionService();
const refreshTokenService = new RefreshTokenService();

// Token lifetimes
const ACCESS_TOKEN_LIFETIME = '15m'; // Short-lived access tokens
const REFRESH_TOKEN_LIFETIME_DAYS = 30; // Long-lived refresh tokens

/**
 * Generate short-lived access token with session
 * @param {Object} user - User object
 * @param {Object} options - Options
 * @param {string} [options.ipAddress] - Client IP
 * @param {string} [options.userAgent] - Client user agent
 * @returns {Promise<Object>} { accessToken, refreshToken, sessionId }
 */
async function generateTokensWithSession(user, options = {}) {
  const { ipAddress = null, userAgent = null } = options;

  // Generate access token first (needed for session token storage)
  const accessToken = generateAccessToken(user);

  // Create session with access token as identifier
  // Note: Session stores the JWT access token for lookup during validation
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes (matches access token lifetime)
  const session = await sessionService.createSession({
    userId: user.id,
    sessionToken: accessToken, // Store JWT access token for session validation
    expiresAt,
    ipAddress,
    userAgent,
  });

  // Update access token to include session ID
  const accessTokenWithSession = generateAccessToken(user, session.id);

  // Generate refresh token linked to session
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
  const { token: refreshToken } = await refreshTokenService.createToken({
    userId: user.id,
    sessionId: session.id,
    expiresAt: refreshExpiresAt,
    ipAddress,
    userAgent,
  });

  // Update session with final access token (includes session ID)
  await sessionService.sessionRepository.updateById(session.id, {
    session_token: accessTokenWithSession,
  });

  return {
    accessToken: accessTokenWithSession,
    refreshToken,
    sessionId: session.id,
  };
}

/**
 * Generate short-lived access token
 * @param {Object} user - User object
 * @param {number} [sessionId] - Optional session ID
 * @returns {string} JWT access token
 */
function generateAccessToken(user, sessionId = null) {
  const payload = {
    id: user.id,
    userId: user.id,
    email: user.email,
    type: 'access', // Token type
  };

  if (sessionId) {
    payload.sessionId = sessionId;
  }

  if (user.username) {
    payload.username = user.username;
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_LIFETIME });
}

/**
 * Enhanced authenticate middleware with session validation
 */
async function authenticateWithSession(req, res, next) {
  try {
    // Check for token in cookie or Authorization header
    const token =
      req.cookies.auth_token ||
      (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          requiresRefresh: true,
        });
      }
      throw jwtError;
    }

    // If token has sessionId, validate session
    if (decoded.sessionId) {
      const session = await sessionService.findByToken(token);
      if (!session) {
        return res.status(401).json({
          error: 'Session expired or revoked',
          code: 'SESSION_INVALID',
        });
      }

      // Update last seen (async, non-blocking)
      sessionService.updateLastSeen(session.id).catch(err => {
        logger.warn('[Auth] Failed to update last seen', {
          message: err.message,
        });
      });
    }

    // Attach user payload to request
    const userId = decoded.userId || decoded.id;
    req.user = {
      ...decoded,
      id: userId,
      userId: userId,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        requiresRefresh: true,
      });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Set auth cookies (access token and refresh token)
 */
function setAuthCookies(res, accessToken, refreshToken, maxAgeDays = REFRESH_TOKEN_LIFETIME_DAYS) {
  // Access token cookie (short-lived)
  res.cookie('auth_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes (matches access token lifetime)
  });

  // Refresh token cookie (separate, longer-lived)
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh', // Only sent to refresh endpoint
  });
}

/**
 * Clear auth cookies
 */
function clearAuthCookies(res) {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/refresh',
  });
}

module.exports = {
  generateTokensWithSession,
  generateAccessToken,
  authenticateWithSession,
  setAuthCookies,
  clearAuthCookies,
  sessionService,
  refreshTokenService,
  ACCESS_TOKEN_LIFETIME,
  REFRESH_TOKEN_LIFETIME_DAYS,
};
