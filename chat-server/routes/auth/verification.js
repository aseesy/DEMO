/**
 * Auth Verification and User Routes
 *
 * Handles:
 * - User verification endpoints
 * - Registration from invite (accepting invitations)
 */
const express = require('express');
const router = express.Router();
const auth = require('../../auth');
const dbSafe = require('../../dbSafe');
const db = require('../../dbPostgres');
const { verifyAuth, generateToken, setAuthCookie } = require('../../middleware/auth');
const { getPasswordError, getPasswordRequirements } = require('../../libs/password-validator.js');
const invitationManager = require('../../libs/invitation-manager');
const pairingManager = require('../../libs/pairing-manager');

/**
 * GET /api/auth/user
 * Get current authenticated user info
 */
router.get('/user', verifyAuth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user.id || user.userId,
      username: user.username || user.email, // Use email as fallback (migrated from username)
      email: user.email,
      display_name: user.display_name,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/verify
 * Verify authentication token and return fresh user data
 */
router.get('/verify', verifyAuth, async (req, res) => {
  try {
    const userResult = await dbSafe.safeSelect(
      'users',
      { id: req.user.userId || req.user.id },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const freshUser = users[0];
    res.json({
      authenticated: true,
      valid: true,
      user: {
        id: freshUser.id,
        username: freshUser.username,
        email: freshUser.email,
        display_name: freshUser.display_name,
        first_name: freshUser.first_name,
        last_name: freshUser.last_name,
      },
    });
  } catch (error) {
    // CRITICAL: Check for database connection errors
    // Use centralized database error classifier
    const {
      isDatabaseConnectionError,
      getDatabaseErrorResponse,
      getDatabaseErrorStatusCode,
    } = require('../../src/utils/databaseErrorClassifier');

    if (isDatabaseConnectionError(error)) {
      console.warn('[verify] Database connection error:', error.code || error.message);
      const errorResponse = getDatabaseErrorResponse(error);
      const statusCode = getDatabaseErrorStatusCode(error);
      return res.status(statusCode).json(errorResponse);
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/user/:username
 * Get public user profile by username
 */
router.get('/user/:username', async (req, res) => {
  try {
    const userResult = await dbSafe.safeSelect(
      'users',
      { username: req.params.username.toLowerCase() },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = users[0];
    res.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      first_name: user.first_name,
      profile_picture: user.profile_picture,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/register-from-invite
 * Register a new user from an invitation token (legacy endpoint)
 */
router.post('/register-from-invite', async (req, res) => {
  try {
    const result = await auth.registerFromInvitation(req.body, db);
    const token = generateToken(result.user);
    setAuthCookie(res, token);
    res.json({ success: true, ...result, token });
  } catch (error) {
    if (error.message === 'Email already exists') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/register-with-invite
 * Register a new user who is ACCEPTING an invitation
 *
 * Accepts either:
 * - inviteToken: Long token from email link
 * - inviteCode: Short code like "LZ-ABC123"
 *
 * Tries both invitation system and pairing system for compatibility
 */
router.post('/register-with-invite', async (req, res) => {
  try {
    const { email, password, firstName, lastName, inviteToken, inviteCode, context } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate first and last name
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    if (!inviteToken && !inviteCode) {
      return res.status(400).json({ error: 'Either inviteToken or inviteCode is required' });
    }

    // Validate email format
    const emailLower = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Validate password strength
    const passwordError = getPasswordError(password);
    if (passwordError) {
      return res.status(400).json({
        error: passwordError,
        requirements: getPasswordRequirements(),
      });
    }

    // Check if email already exists
    const existingUser = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    let result;

    // Route to the correct registration function based on what's provided
    if (inviteCode) {
      // Short code provided - try invitation system first, then pairing
      console.log(`[register-with-invite] Attempting registration with code: ${inviteCode}`);

      // Check if it's a valid invitation code (invitations table)
      const inviteValidation = await invitationManager.validateByShortCode(inviteCode, db);

      if (inviteValidation.valid) {
        console.log('[register-with-invite] Valid invitation code, using registerFromShortCode');
        result = await auth.registerFromShortCode(
          {
            shortCode: inviteCode,
            email: emailLower,
            password,
            firstName: firstName?.trim() || '',
            lastName: lastName?.trim() || '',
            context: context || {},
          },
          db
        );
      } else {
        // Try pairing system (pairing_sessions table)
        console.log('[register-with-invite] Checking pairing system for code...');
        const pairingValidation = await pairingManager.validateCode(inviteCode, db);

        if (pairingValidation.valid) {
          console.log('[register-with-invite] Valid pairing code, using registerFromPairingCode');
          result = await auth.registerFromPairingCode(
            {
              code: inviteCode,
              email: emailLower,
              password,
              firstName: firstName?.trim() || '',
              lastName: lastName?.trim() || '',
              context: context || {},
            },
            db
          );
        } else {
          // Neither system recognizes the code
          return res.status(400).json({
            error: 'Invalid or expired invitation code',
            code: 'INVALID_CODE',
          });
        }
      }
    } else if (inviteToken) {
      // Long token provided - try invitation system first, then pairing
      console.log('[register-with-invite] Attempting registration with token');

      // Check if it's a valid invitation token (invitations table)
      const inviteValidation = await invitationManager.validateToken(inviteToken, db);

      if (inviteValidation.valid) {
        console.log('[register-with-invite] Valid invitation token, using registerFromInvitation');
        result = await auth.registerFromInvitation(
          {
            token: inviteToken,
            email: emailLower,
            password,
            firstName: firstName?.trim() || '',
            lastName: lastName?.trim() || '',
            context: context || {},
          },
          db
        );
      } else {
        // Try pairing system (pairing_sessions table)
        console.log('[register-with-invite] Checking pairing system for token...');
        const pairingValidation = await pairingManager.validateToken(inviteToken, db);

        if (pairingValidation.valid) {
          console.log('[register-with-invite] Valid pairing token, using registerFromPairing');
          result = await auth.registerFromPairing(
            {
              token: inviteToken,
              email: emailLower,
              password,
              firstName: firstName?.trim() || '',
              lastName: lastName?.trim() || '',
              context: context || {},
            },
            db
          );
        } else {
          // Neither system recognizes the token
          const errorCode = inviteValidation.code || pairingValidation.code || 'INVALID_TOKEN';
          const errorMsg =
            errorCode === 'EXPIRED'
              ? 'This invitation has expired'
              : errorCode === 'ALREADY_ACCEPTED'
                ? 'This invitation has already been used'
                : 'Invalid or expired invitation';

          return res.status(400).json({
            error: errorMsg,
            code: errorCode,
          });
        }
      }
    }

    // Generate auth token and set cookie
    const token = generateToken(result.user);
    setAuthCookie(res, token);

    console.log(`[register-with-invite] Successfully registered user: ${result.user.email}`);

    res.json({
      success: true,
      user: result.user,
      coParent: result.coParent,
      sharedRoom: result.sharedRoom || result.room,
      token,
    });
  } catch (error) {
    console.error('[register-with-invite] Error:', error);

    // Handle specific error types
    if (error.message === 'Email already exists') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    if (error.message?.includes('expired')) {
      return res.status(400).json({ error: 'This invitation has expired', code: 'EXPIRED' });
    }
    if (error.message?.includes('already accepted') || error.message?.includes('already used')) {
      return res
        .status(400)
        .json({ error: 'This invitation has already been used', code: 'ALREADY_ACCEPTED' });
    }

    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
