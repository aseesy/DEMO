/**
 * Auth Routes
 *
 * Handles authentication including signup, login, logout, OAuth, and verification.
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const auth = require('../auth');
const dbSafe = require('../dbSafe');
const db = require('../dbPostgres');
const emailService = require('../emailService');
const invitationManager = require('../libs/invitation-manager');
const pairingManager = require('../libs/pairing-manager');
const { verifyAuth, optionalAuth, generateToken, setAuthCookie, clearAuthCookie, JWT_SECRET } = require('../middleware/auth');

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * POST /api/auth/signup
 * Sign up (create new account with email)
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, context } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const user = await auth.createUserWithEmail(cleanEmail, password, context || {});

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      success: true,
      user,
      token
    });
  } catch (error) {
    if (error.message === 'Email already exists') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/register
 * New user registration with required co-parent invitation
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, coParentEmail, context } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!coParentEmail) {
      return res.status(400).json({ error: 'Co-parent email is required to register' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCoParentEmail = coParentEmail.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (!isValidEmail(cleanCoParentEmail)) {
      return res.status(400).json({ error: 'Please enter a valid co-parent email address' });
    }

    if (cleanEmail === cleanCoParentEmail) {
      return res.status(400).json({ error: 'You cannot invite yourself as a co-parent' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const result = await auth.registerWithInvitation({
      email: cleanEmail,
      password,
      displayName,
      coParentEmail: cleanCoParentEmail,
      context: context || {}
    }, db);

    const token = generateToken(result.user);
    setAuthCookie(res, token);

    // Send invitation email to co-parent
    if (!result.invitation.isExistingUser) {
      try {
        const inviteUrl = `${process.env.APP_URL || 'https://coparentliaizen.com'}/accept-invite?token=${result.invitation.token}`;
        await emailService.sendNewUserInvite(
          result.invitation.inviteeEmail,
          result.user.displayName || result.user.username,
          inviteUrl,
          result.invitation.shortCode
        );
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
      }
    }

    res.json({
      success: true,
      user: result.user,
      invitation: {
        id: result.invitation.id,
        inviteeEmail: result.invitation.inviteeEmail,
        shortCode: result.invitation.shortCode,
        isExistingUser: result.invitation.isExistingUser
      },
      token
    });
  } catch (error) {
    if (error.message === 'Email already exists') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    console.log(`🔐 Attempting login for ${email ? 'email: ' + email : 'username: ' + username}`);

    if (!password || (!email && !username)) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    let user;
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      user = await auth.authenticateUserByEmail(cleanEmail, password);
    } else {
      user = await auth.authenticateUser(username, password);
    }

    if (!user) {
      const identifier = email || username;
      console.log(`❌ No user found with ${email ? 'email' : 'username'}: ${identifier}`);
      return res.status(401).json({
        error: email ? 'No account found with this email' : 'Invalid username or password',
        code: email ? 'ACCOUNT_NOT_FOUND' : 'INVALID_CREDENTIALS'
      });
    }

    console.log(`✅ Login successful for user: ${user.username}`);

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid password', code: 'INVALID_PASSWORD' });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/user
 * Get current authenticated user
 */
router.get('/user', verifyAuth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user.id || user.userId,
      username: user.username,
      email: user.email,
      display_name: user.display_name
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * User logout
 */
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/verify
 * Verify authentication token
 */
router.get('/verify', verifyAuth, async (req, res) => {
  try {
    const user = req.user;

    // Get fresh user data from database
    const userResult = await dbSafe.safeSelect('users', { id: user.userId || user.id }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const freshUser = users[0];
    res.json({
      valid: true,
      user: {
        id: freshUser.id,
        username: freshUser.username,
        email: freshUser.email,
        display_name: freshUser.display_name,
        first_name: freshUser.first_name,
        last_name: freshUser.last_name
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || 'https://coparentliaizen.com'}/auth/google/callback`;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent('email profile')}&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.json({ authUrl });
});

/**
 * POST /api/auth/google/callback
 * Handle Google OAuth callback
 */
router.post('/google/callback', async (req, res) => {
  try {
    const { code, inviteToken } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || 'https://coparentliaizen.com'}/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();
    if (tokens.error) {
      return res.status(400).json({ error: tokens.error_description || 'Failed to exchange code' });
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const googleUser = await userInfoResponse.json();

    // Find or create user
    let user = await auth.findOrCreateOAuthUser({
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      provider: 'google',
      providerId: googleUser.id
    });

    // Handle invite token if provided
    if (inviteToken) {
      try {
        await invitationManager.acceptInvitation(inviteToken, user.id);
      } catch (inviteError) {
        console.error('Failed to accept invitation:', inviteError);
      }
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name
      },
      token
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/user/:username
 * Get user by username (public profile)
 */
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      first_name: user.first_name,
      profile_picture: user.profile_picture
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
