/**
 * DEV-ONLY Testing Routes
 *
 * ⚠️ CRITICAL: These routes are ONLY available in development mode
 * ⚠️ They are DISABLED in production for security
 *
 * Provides fast authentication testing without email/OAuth flows.
 * Useful for testing auth guards, redirects, and session management.
 */

const express = require('express');
const router = express.Router();
const { setAuthCookie } = require('../middleware/auth');
const { generateToken } = require('../middleware/auth');
const dbSafe = require('../dbSafe');
const { createUser } = require('../auth/user');
const { getUser } = require('../auth/user');

const { defaultLogger: defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'dev',
});

/**
 * Check if dev routes should be enabled
 * Only enabled in development and on localhost/internal IPs
 */
function isDevModeAllowed(req) {
  // Must be development mode
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // Check if request is from localhost or internal IP
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const hostname = req.get('host') || '';

  // Allow localhost, 127.0.0.1, ::1, and internal IPs (10.x, 172.16-31.x, 192.168.x)
  const isLocalhost =
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1') ||
    /^10\./.test(ip) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
    /^192\.168\./.test(ip);

  return isLocalhost;
}

/**
 * Middleware to block dev routes in production or from non-localhost
 */
function devOnlyMiddleware(req, res, next) {
  if (!isDevModeAllowed(req)) {
    logger.warn('[DEV] Blocked dev route access', {
      ...{
        ip: req.ip,
        hostname: req.get('host'),
        env: process.env.NODE_ENV,
      },
    });
    return res.status(403).json({
      error: 'Dev routes are only available in development mode on localhost',
      code: 'DEV_ROUTES_DISABLED',
    });
  }
  next();
}

/**
 * Log dev route usage for audit
 */
function logDevUsage(action, details) {
  logger.debug('[DEV] Dev route used', {
    ...{
      action,
      timestamp: new Date().toISOString(),
      ...details,
    },
  });
}

// Apply dev-only middleware to all routes
router.use(devOnlyMiddleware);

/**
 * POST /__dev/login
 *
 * Impersonate/create session for a user by email
 *
 * Request:
 * {
 *   "email": "test@example.com",
 *   "firstName": "Test",  // Optional
 *   "lastName": "User"    // Optional
 * }
 *
 * Behavior:
 * - Finds user by email, or creates if doesn't exist
 * - Creates a normal JWT session cookie (same as real login)
 * - Returns user object and token
 *
 * This allows testing 80% of auth flows without signup/login UI.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'EMAIL_REQUIRED',
      });
    }

    const emailLower = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    logDevUsage('impersonate_login', {
      email: emailLower,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Try to find existing user
    let user = await getUser(emailLower);
    let wasJustCreated = false;

    if (!user) {
      // User doesn't exist - create it
      logger.debug('Log message', {
        value: `[DEV] Creating new user: ${emailLower}`,
      });

      user = await createUser(
        emailLower,
        null, // No password for dev users
        {}, // No context
        null, // No Google ID
        null, // No OAuth provider
        {
          firstName: firstName || 'Test',
          lastName: lastName || 'User',
          displayName:
            firstName && lastName
              ? `${firstName} ${lastName}`
              : firstName || emailLower.split('@')[0],
        }
      );

      wasJustCreated = true;

      logDevUsage('user_created', {
        userId: user.id,
        email: emailLower,
      });
    } else {
      // Update last_login for existing user
      await dbSafe.safeUpdate('users', { last_login: new Date().toISOString() }, { id: user.id });

      logDevUsage('user_found', {
        userId: user.id,
        email: emailLower,
      });
    }

    // Generate token (same as real login)
    const token = generateToken(user);

    // Set auth cookie (same as real login)
    setAuthCookie(res, token);

    // Return success with user and token
    res.json({
      success: true,
      message: wasJustCreated ? 'Created and logged in as new user' : 'Logged in as existing user',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        displayName: user.displayName || user.display_name,
      },
      token,
      dev: true, // Flag to indicate this is a dev session
    });
  } catch (error) {
    logger.error('[DEV] Login error', {
      error: error,
    });
    logDevUsage('login_error', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: error.message || 'Failed to create dev session',
      code: 'DEV_LOGIN_ERROR',
    });
  }
});

/**
 * POST /__dev/logout
 *
 * Clear dev session (same as real logout)
 */
router.post('/logout', async (req, res) => {
  logDevUsage('logout', {
    ip: req.ip,
  });

  // Clear auth cookie
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  res.json({
    success: true,
    message: 'Logged out',
  });
});

/**
 * GET /__dev/me
 *
 * Get current user info (requires authentication)
 * Useful for testing auth guards
 */
router.get('/me', async (req, res) => {
  // Check for token
  const token =
    req.cookies.auth_token ||
    (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

  if (!token) {
    return res.status(401).json({
      error: 'Not authenticated',
      code: 'NOT_AUTHENTICATED',
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    // Get user from database
    const userResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const user = users[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: user.display_name,
      },
      dev: true,
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }

    logger.error('[DEV] Me error', {
      error: error,
    });
    res.status(500).json({
      error: error.message || 'Failed to get user info',
      code: 'DEV_ME_ERROR',
    });
  }
});

/**
 * GET /__dev/status
 *
 * Check if dev routes are enabled and accessible
 */
router.get('/status', (req, res) => {
  res.json({
    enabled: true,
    environment: process.env.NODE_ENV || 'development',
    localhost: isDevModeAllowed(req),
    message: 'Dev routes are enabled',
  });
});

module.exports = router;
