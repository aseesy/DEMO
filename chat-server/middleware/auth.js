/**
 * Authentication Middleware
 *
 * Provides JWT-based authentication middleware for Express routes.
 * Supports both cookie-based and header-based token authentication.
 */

const jwt = require('jsonwebtoken');

// JWT_SECRET must be set in environment - no weak fallback allowed
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set');
}

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

/**
 * Express middleware to verify JWT token from cookie or Authorization header.
 * If valid, it attaches the user payload to req.user.
 * Returns 401 if no token or invalid token.
 *
 * This is the standard authentication middleware for all secure API routes.
 * Alias: verifyAuth (for backward compatibility with server.js)
 */
function authenticate(req, res, next) {
  try {
    // Check for token in cookie or Authorization header
    const token =
      req.cookies.auth_token ||
      (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user payload to the request object.
    // The JWT payload may contain either 'id' or 'userId' depending on where it was generated.
    // We normalize to always have both for compatibility.
    const userId = decoded.userId || decoded.id;
    req.user = {
      ...decoded,
      id: userId,
      userId: userId,
    };

    next();
  } catch (err) {
    // Handle specific JWT errors
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    // For other errors, return a generic 401
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication middleware
 * Tries to authenticate but doesn't fail if token is missing or invalid.
 * Sets req.user if authenticated, otherwise req.user is undefined.
 */
function optionalAuth(req, res, next) {
  try {
    // Check for token in cookie or Authorization header
    const token =
      req.cookies.auth_token ||
      (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Normalize to always have both id and userId
        const userId = decoded.userId || decoded.id;
        req.user = {
          ...decoded,
          id: userId,
          userId: userId,
        };
      } catch (err) {
        // Token invalid or expired - silently continue without auth
        req.user = undefined;
      }
    }
    // No token - continue without auth
    next();
  } catch (err) {
    // Any other error - continue without auth
    next();
  }
}

/**
 * Generate JWT token for a user
 * @param {Object} user - User object with id, username, email
 * @param {string} expiresIn - Token expiration (default: '30d')
 * @returns {string} JWT token
 */
function generateToken(user, expiresIn = '30d') {
  // Use email as primary identifier (migrated from username)
  // Username is optional - only include if present
  const payload = {
    id: user.id,
    userId: user.id,
    email: user.email, // Required - primary identifier
  };
  
  // Include username only if present (for backward compatibility)
  if (user.username) {
    payload.username = user.username;
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Set auth cookie on response
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 * @param {number} maxAgeDays - Cookie max age in days (default: 30)
 */
function setAuthCookie(res, token, maxAgeDays = 30) {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
  });
}

/**
 * Clear auth cookie on response
 * @param {Object} res - Express response object
 */
function clearAuthCookie(res) {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

module.exports = {
  authenticate,
  verifyAuth: authenticate, // Alias for backward compatibility
  optionalAuth,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  // Note: JWT_SECRET intentionally not exported to prevent leaking
};
