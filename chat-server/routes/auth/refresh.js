/**
 * Refresh Token Routes
 * 
 * Handles refresh token rotation and access token renewal.
 * Part of Phase 2: Data Model & Session Management
 */

const express = require('express');
const router = express.Router();
const {
  refreshTokenService,
  generateAccessToken,
  clearAuthCookies,
  setAuthCookies,
  sessionService,
} = require('../../middleware/authEnhanced');
const dbPostgres = require('../../dbPostgres');

/**
 * POST /api/auth/refresh
 * 
 * Refresh access token using refresh token.
 * Implements token rotation for security.
 * 
 * Body:
 * - refreshToken: (optional) Refresh token (can also be in cookie)
 * 
 * Returns:
 * - accessToken: New short-lived access token
 * - refreshToken: New rotated refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    // Get refresh token from body or cookie
    const refreshToken = req.body.refreshToken || req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED',
      });
    }

    // Validate and use refresh token (this marks it as used)
    const tokenRecord = await refreshTokenService.validateAndUse(refreshToken);
    if (!tokenRecord) {
      clearAuthCookies(res);
      return res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    // Get user
    const userResult = await dbPostgres.query('SELECT * FROM users WHERE id = $1', [
      tokenRecord.user_id,
    ]);
    if (userResult.rows.length === 0) {
      clearAuthCookies(res);
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const user = userResult.rows[0];

    // Check user status
    if (user.status !== 'active') {
      clearAuthCookies(res);
      await refreshTokenService.revokeAllUserTokens(user.id);
      return res.status(403).json({
        error: 'Account is not active',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // Rotate refresh token (revoke old, create new)
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { token: newRefreshToken } = await refreshTokenService.rotateToken(refreshToken, {
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      ipAddress,
      userAgent,
    });

    // Generate new access token
    const newAccessToken = generateAccessToken(user, tokenRecord.session_id);

    // Update session last seen if session exists
    if (tokenRecord.session_id) {
      try {
        await sessionService.updateLastSeen(tokenRecord.session_id);
      } catch (err) {
        console.warn('[Refresh] Failed to update session:', err.message);
      }
    }

    // Set new cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    // Structured logging
    console.log('[Auth] Token refreshed', {
      userId: user.id,
      sessionId: tokenRecord.session_id,
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('[Auth] Refresh error:', {
      message: error.message,
      stack: error.stack,
    });

    clearAuthCookies(res);

    res.status(500).json({
      error: error.message || 'Token refresh failed',
      code: 'REFRESH_ERROR',
    });
  }
});

module.exports = router;

