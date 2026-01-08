/**
 * Auth Login Routes
 *
 * REFACTORED: Route handler is now thin - delegates to AuthService
 */
const express = require('express');
const router = express.Router();
const { setAuthCookie, clearAuthCookie } = require('../../middleware/auth');
const { honeypotCheck } = require('../../middleware/spamProtection');
const { loginRateLimit } = require('./utils');
const { LOGIN_RESULT_TYPES } = require('../../src/services/auth/authService');

const { defaultLogger: defaultLogger } = require('../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'login',
});

// AuthService will be injected via routeManager
let authService;

router.setService = function (service) {
  authService = service;
};

router.post('/login', loginRateLimit, honeypotCheck('website'), async (req, res) => {
  if (!authService) {
    logger.error('❌ AuthService is not initialized!');
    return res.status(500).json({ error: 'Authentication service not available' });
  }

  try {
    const { email, username, password, trustDevice, verificationCode } = req.body;

    // Delegate to AuthService
    const result = await authService.authenticateUser(
      { email, username, password, trustDevice, verificationCode },
      req
    );

    // Handle different result types
    switch (result.type) {
      case LOGIN_RESULT_TYPES.SUCCESS:
        setAuthCookie(res, result.token);
        return res.json({
          success: true,
          user: result.user,
          token: result.token,
          security: result.security,
        });

      case LOGIN_RESULT_TYPES.BLOCKED:
        return res.status(403).json({ error: result.error, code: result.code });

      case LOGIN_RESULT_TYPES.STEP_UP_REQUIRED:
        return res.status(403).json({
          error: result.error,
          code: result.code,
          requiresVerification: result.requiresVerification,
        });

      case LOGIN_RESULT_TYPES.INVALID_CODE:
        return res.status(401).json({
          error: result.error,
          code: result.code,
          requiresVerification: result.requiresVerification,
        });

      case LOGIN_RESULT_TYPES.INVALID_CREDENTIALS:
      case LOGIN_RESULT_TYPES.ACCOUNT_NOT_FOUND:
      case LOGIN_RESULT_TYPES.OAUTH_ONLY:
        return res.status(401).json({ error: result.error, code: result.code });

      default:
        return res.status(500).json({ error: 'Unexpected login result' });
    }
  } catch (error) {
    logger.error('Login error', {
      error: error,
    });

    // CRITICAL: Check for database connection errors using centralized classifier
    // These should return 503 Service Unavailable, not 500 or authentication errors
    const {
      isDatabaseConnectionError,
      getDatabaseErrorResponse,
      getDatabaseErrorStatusCode,
    } = require('../../src/utils/databaseErrorClassifier');

    if (isDatabaseConnectionError(error)) {
      logger.warn('[login] Database connection error during login', {
        arg0: error.code || error.message,
      });
      const errorResponse = getDatabaseErrorResponse(error);
      const statusCode = getDatabaseErrorStatusCode(error);
      return res.status(statusCode).json(errorResponse);
    }

    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
