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
 * @param {string} expiresIn - Token expiration (default: '30d' for legacy, '15m' for new)
 * @param {boolean} useShortLived - If true, use short-lived token (15m) for Phase 2
 * @returns {string} JWT token
 */
function generateToken(user, expiresIn = '30d', useShortLived = false) {
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

  // Phase 2: Use short-lived tokens by default when useShortLived is true
  const tokenExpiry = useShortLived ? '15m' : expiresIn;
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: tokenExpiry });
}

/**
 * Set auth cookie on response
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 * @param {number} maxAgeDays - Cookie max age in days (default: 30)
 * 
 * Security settings:
 * - httpOnly: true (prevents XSS)
 * - secure: true in production (HTTPS only)
 * - sameSite: 'lax' (CSRF protection, allows top-level navigation)
 * - path: '/' (available site-wide)
 * - __Host- prefix: not used (requires exact domain match, may break subdomains)
 */
function setAuthCookie(res, token, maxAgeDays = 30) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
  };

  // Note: __Host- prefix requires Secure=true, Path=/, and no Domain
  // We could use it if we want strict domain isolation, but it may break subdomain usage
  // For now, use standard cookie name for compatibility
  res.cookie('auth_token', token, cookieOptions);
}

/**
 * Clear auth cookie on response
 * @param {Object} res - Express response object
 */
function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
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
