/**
 * Auth Login Routes
 *
 * REFACTORED: Route handler is now thin - delegates to AuthService
 */
const express = require('express');
const router = express.Router();
const { setAuthCookie, clearAuthCookie, verifyAuth } = require('../../middleware/auth');
const { honeypotCheck } = require('../../middleware/spamProtection');
const { loginRateLimit } = require('./utils');
const { LOGIN_RESULT_TYPES } = require('../../src/services/auth/authService');

// AuthService will be injected via routeManager
let authService;

router.setService = function (service) {
  authService = service;
};

router.post('/login', loginRateLimit, honeypotCheck('website'), async (req, res) => {
  if (!authService) {
    console.error('❌ AuthService is not initialized!');
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
    console.error('Login error:', error);
    
    // CRITICAL: Check for database connection errors
    // These should return 503 Service Unavailable, not 500 or authentication errors
    const isDbError = 
      error.message === 'DATABASE_NOT_READY' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === '08000' || // PostgreSQL connection_exception
      error.code === '08003' || // PostgreSQL connection_does_not_exist
      error.code === '08006' || // PostgreSQL connection_failure
      error.message?.toLowerCase().includes('connection') ||
      error.message?.toLowerCase().includes('database') ||
      error.message?.toLowerCase().includes('postgresql') ||
      error.message?.toLowerCase().includes('econnrefused');
    
    if (isDbError) {
      console.warn('[login] Database connection error during login:', error.code || error.message);
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        code: 'DATABASE_NOT_READY',
        message: 'Database connection is being established. Please try again in a moment.',
        retryAfter: 5,
      });
    }
    
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
