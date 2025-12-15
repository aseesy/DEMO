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
const {
  honeypotCheck,
  rateLimit,
  recaptchaVerify,
  rejectDisposableEmail
} = require('../middleware/spamProtection');

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Rate limiting for signup endpoints (3 signups per hour per IP)
const signupRateLimit = rateLimit({
  windowMs: 3600000, // 1 hour
  maxRequests: 3,
  message: 'Too many signup attempts. Please try again later.'
});

// Rate limiting for login (10 attempts per 15 minutes per IP)
const loginRateLimit = rateLimit({
  windowMs: 900000, // 15 minutes
  maxRequests: 10,
  message: 'Too many login attempts. Please try again in a few minutes.'
});

/**
 * POST /api/auth/signup
 * Sign up (create new account with email)
 * Protected by rate limiting, honeypot, and disposable email check
 */
router.post('/signup', signupRateLimit, honeypotCheck('website'), rejectDisposableEmail, async (req, res) => {
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
 * Protected by rate limiting, honeypot, and disposable email check
 */
router.post('/register', signupRateLimit, honeypotCheck('website'), rejectDisposableEmail, async (req, res) => {
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
 * Protected by rate limiting to prevent brute force attacks
 */
router.post('/login', loginRateLimit, honeypotCheck('website'), async (req, res) => {
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

  // Validate OAuth configuration
  if (!clientId) {
    console.error('❌ GOOGLE_CLIENT_ID is not set in environment variables');
    return res.status(500).json({ 
      error: 'OAuth configuration error',
      message: 'Google OAuth client ID is not configured. Please contact support.',
      code: 'OAUTH_CONFIG_ERROR'
    });
  }

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

    // Validate OAuth configuration
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || 'https://coparentliaizen.com'}/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('❌ OAuth configuration missing:', { 
        hasClientId: !!clientId, 
        hasClientSecret: !!clientSecret 
      });
      return res.status(500).json({ 
        error: 'OAuth configuration error',
        message: 'Google OAuth credentials are not configured. Please contact support.',
        code: 'OAUTH_CONFIG_ERROR'
      });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();
    if (tokens.error) {
      console.error('❌ Google OAuth token exchange failed:', tokens);
      // Provide more helpful error message for invalid_client
      if (tokens.error === 'invalid_client') {
        return res.status(401).json({ 
          error: 'invalid_client',
          message: 'OAuth client configuration error. Please verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct.',
          code: 'OAUTH_INVALID_CLIENT',
          details: 'Check Railway environment variables and Google Cloud Console configuration'
        });
      }
      return res.status(400).json({ 
        error: tokens.error,
        message: tokens.error_description || 'Failed to exchange code',
        code: tokens.error
      });
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

/**
 * POST /api/auth/register-from-invite
 * Register a new user from an invitation token
 */
router.post('/register-from-invite', async (req, res) => {
  try {
    const { token: inviteToken, email, password, displayName, context } = req.body;

    // Validation
    if (!inviteToken) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }
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

    // Register from invitation
    const result = await auth.registerFromInvitation({
      token: inviteToken,
      email: cleanEmail,
      password,
      displayName,
      context: context || {}
    }, db);

    // Generate JWT token
    const token = generateToken(result.user);

    // Set httpOnly cookie
    setAuthCookie(res, token);

    res.json({
      success: true,
      user: result.user,
      coParent: result.coParent,
      sharedRoom: result.sharedRoom,
      token
    });

  } catch (error) {
    console.error('Register from invite error:', error);

    if (error.message === 'Email already exists') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('does not match')) {
      return res.status(400).json({ error: 'Email does not match the invitation' });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/register-with-invite
 * Unified endpoint that handles both token and short code registration
 * Used by AcceptInvitationPage for new user registration
 *
 * Body parameters:
 * - email: User's email (required)
 * - password: User's password (required)
 * - username: User's display name (required)
 * - inviteToken: Invitation token (optional, provide either this or inviteCode)
 * - inviteCode: Short invite code e.g., LZ-ABC123 (optional, provide either this or inviteToken)
 */
router.post('/register-with-invite', async (req, res) => {
  try {
    const { email, password, username, inviteToken, inviteCode } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (!inviteToken && !inviteCode) {
      return res.status(400).json({ error: 'Either inviteToken or inviteCode is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    let result;

    if (inviteCode) {
      // Register using short code (no email matching required)
      result = await auth.registerFromShortCode({
        shortCode: inviteCode,
        email: cleanEmail,
        password,
        displayName: username,
        context: {}
      }, db);
    } else {
      // Register using token - DUAL-SYSTEM FALLBACK (Feature 009)
      // Try invitations table first (old system)
      console.log(`🔵 Checking invitation token in dual-system...`);

      let invitationValidation = await invitationManager.validateToken(inviteToken, db);

      if (!invitationValidation.valid && invitationValidation.code === 'INVALID_TOKEN') {
        // Token not found in invitations table, try pairing_sessions table (new system)
        console.log(`⚠️ Token not found in invitations table, checking pairing_sessions...`);
        const pairingValidation = await pairingManager.validateToken(inviteToken, db);

        if (pairingValidation.valid) {
          // Found in pairing_sessions - use pairing registration
          console.log(`✅ Token found in pairing_sessions, using registerFromPairing`);
          result = await auth.registerFromPairing({
            token: inviteToken,
            email: cleanEmail,
            password,
            displayName: username,
            context: {}
          }, db);
        } else {
          // Not found in either system
          console.log(`❌ Token not found in either system`);
          result = await auth.registerFromInvitation({
            token: inviteToken,
            email: cleanEmail,
            password,
            displayName: username,
            context: {}
          }, db);
        }
      } else {
        // Found in invitations table - use invitation registration
        console.log(`✅ Token found in invitations table, using registerFromInvitation`);
        result = await auth.registerFromInvitation({
          token: inviteToken,
          email: cleanEmail,
          password,
          displayName: username,
          context: {}
        }, db);
      }
    }

    // Generate JWT token
    const token = generateToken(result.user);

    // Set httpOnly cookie
    setAuthCookie(res, token);

    res.json({
      success: true,
      user: result.user,
      coParent: result.coParent,
      sharedRoom: result.sharedRoom,
      token
    });

  } catch (error) {
    console.error('Register with invite error:', error);

    // Handle registration errors with proper codes
    if (error.code === 'REG_001' || error.message === 'Email already exists') {
      return res.status(409).json({ error: 'An account with this email already exists', code: 'REG_001' });
    }
    if (error.code === 'REG_002' || error.message.includes('Invalid')) {
      return res.status(400).json({ error: error.message, code: error.code || 'INVALID_TOKEN' });
    }
    if (error.code === 'REG_003' || error.message.includes('expired')) {
      return res.status(400).json({ error: error.message, code: error.code || 'EXPIRED' });
    }
    if (error.code === 'REG_004' || error.message.includes('already accepted')) {
      return res.status(400).json({ error: error.message, code: error.code || 'ALREADY_ACCEPTED' });
    }
    if (error.message.includes('does not match')) {
      return res.status(400).json({ error: 'Email does not match the invitation', code: 'EMAIL_MISMATCH' });
    }

    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
