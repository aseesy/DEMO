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
const {
  getPasswordError,
  getPasswordRequirements,
  validatePasswordDetailed,
  checkPasswordStrength
} = require('../libs/password-validator');
const adaptiveAuth = require('../libs/adaptive-auth');
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

/**
 * GET /api/auth/password-requirements
 * Returns password requirements for frontend display
 * No authentication required - used during signup
 */
router.get('/password-requirements', (req, res) => {
  const requirements = validatePasswordDetailed('');
  res.json({
    minLength: requirements.minLength,
    requirements: requirements.requirements.map(r => ({
      id: r.id,
      label: r.label,
    })),
  });
});

/**
 * POST /api/auth/validate-password
 * Validates a password and returns detailed requirement status
 * Used for real-time validation during signup
 */
router.post('/validate-password', (req, res) => {
  const { password } = req.body;
  const result = validatePasswordDetailed(password);
  const strength = checkPasswordStrength(password);

  res.json({
    valid: result.valid,
    strength: strength,
    requirements: result.requirements,
  });
});

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

    const passwordError = getPasswordError(password);
    if (passwordError) {
      return res.status(400).json({
        error: passwordError,
        requirements: getPasswordRequirements()
      });
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

    const passwordError = getPasswordError(password);
    if (passwordError) {
      return res.status(400).json({
        error: passwordError,
        requirements: getPasswordRequirements()
      });
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
 * User login with adaptive authentication
 * Evaluates risk based on device, location, and behavior patterns
 */
router.post('/login', loginRateLimit, honeypotCheck('website'), async (req, res) => {
  const loginEmail = (req.body.email || '').trim().toLowerCase();
  const { password, username, trustDevice, verificationCode } = req.body;

  try {
    console.log(`🔐 Attempting login for ${loginEmail ? 'email: ' + loginEmail : 'username: ' + username}`);

    if (!password || (!loginEmail && !username)) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    // Pre-auth risk assessment (before we know if credentials are valid)
    const preAuthRisk = await adaptiveAuth.calculateRiskScore(
      { email: loginEmail || username },
      req,
      null
    );

    console.log(`🛡️ Pre-auth risk: ${adaptiveAuth.formatRiskSummary(preAuthRisk)}`);

    // Block if critical risk before even checking credentials
    if (preAuthRisk.riskLevel === 'CRITICAL') {
      await adaptiveAuth.recordLoginAttempt({
        email: loginEmail || username,
        success: false,
        deviceFingerprint: preAuthRisk.deviceFingerprint,
        ipAddress: preAuthRisk.clientIP,
        userAgent: req.headers['user-agent'],
        riskScore: preAuthRisk.score,
        riskLevel: preAuthRisk.riskLevel,
      });

      return res.status(403).json({
        error: 'Login blocked due to suspicious activity. Please try again later or contact support.',
        code: 'LOGIN_BLOCKED',
        riskLevel: preAuthRisk.riskLevel,
      });
    }

    // Authenticate user
    let user;
    try {
      if (loginEmail) {
        user = await auth.authenticateUserByEmail(loginEmail, password);
      } else {
        user = await auth.authenticateUser(username, password);
      }
    } catch (authError) {
      // Record failed attempt
      await adaptiveAuth.recordLoginAttempt({
        email: loginEmail || username,
        success: false,
        deviceFingerprint: preAuthRisk.deviceFingerprint,
        ipAddress: preAuthRisk.clientIP,
        userAgent: req.headers['user-agent'],
        riskScore: preAuthRisk.score,
        riskLevel: preAuthRisk.riskLevel,
      });

      if (authError.message === 'Invalid password') {
        return res.status(401).json({ error: 'Invalid password', code: 'INVALID_PASSWORD' });
      }
      throw authError;
    }

    if (!user) {
      await adaptiveAuth.recordLoginAttempt({
        email: loginEmail || username,
        success: false,
        deviceFingerprint: preAuthRisk.deviceFingerprint,
        ipAddress: preAuthRisk.clientIP,
        userAgent: req.headers['user-agent'],
        riskScore: preAuthRisk.score,
        riskLevel: preAuthRisk.riskLevel,
      });

      return res.status(401).json({
        error: loginEmail ? 'No account found with this email' : 'Invalid username or password',
        code: loginEmail ? 'ACCOUNT_NOT_FOUND' : 'INVALID_CREDENTIALS'
      });
    }

    // Post-auth risk assessment (now we know the user)
    const postAuthRisk = await adaptiveAuth.calculateRiskScore(
      { email: user.email },
      req,
      user.id
    );

    console.log(`🛡️ Post-auth risk: ${adaptiveAuth.formatRiskSummary(postAuthRisk)}`);

    // Handle step-up authentication if required
    if (postAuthRisk.action === 'step_up_auth') {
      // Check if verification code was provided
      if (verificationCode) {
        const isValid = await adaptiveAuth.verifyStepUpCode(user.id, verificationCode);
        if (!isValid) {
          return res.status(401).json({
            error: 'Invalid or expired verification code',
            code: 'INVALID_VERIFICATION_CODE',
            requiresVerification: true,
          });
        }
        // Code valid, proceed with login
      } else {
        // Generate and send verification code
        const code = await adaptiveAuth.generateStepUpCode(user.id, 'email');

        // Send email with code
        try {
          await emailService.sendVerificationCode(user.email, code, {
            reason: 'Unusual login activity detected',
            ip: postAuthRisk.clientIP,
          });
        } catch (emailErr) {
          console.error('Failed to send verification email:', emailErr);
        }

        return res.status(403).json({
          error: 'Additional verification required. Check your email for a verification code.',
          code: 'STEP_UP_REQUIRED',
          requiresVerification: true,
          riskLevel: postAuthRisk.riskLevel,
        });
      }
    }

    // Record successful login
    await adaptiveAuth.recordLoginAttempt({
      userId: user.id,
      email: user.email,
      success: true,
      deviceFingerprint: postAuthRisk.deviceFingerprint,
      ipAddress: postAuthRisk.clientIP,
      userAgent: req.headers['user-agent'],
      riskScore: postAuthRisk.score,
      riskLevel: postAuthRisk.riskLevel,
    });

    // Trust device if requested and login successful
    if (trustDevice) {
      await adaptiveAuth.trustDevice(user.id, postAuthRisk.deviceFingerprint);
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
      token,
      // Include risk info for client-side awareness
      security: {
        riskLevel: postAuthRisk.riskLevel,
        newDevice: postAuthRisk.signals.some(s => s.signal === 'NEW_DEVICE'),
      }
    });
  } catch (error) {
    console.error('Login error:', error);
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
      authenticated: true, // Frontend expects this field
      valid: true, // Keep for backward compatibility
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
  // Use www.coparentliaizen.com since Vercel redirects non-www to www
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || 'https://www.coparentliaizen.com'}/auth/google/callback`;

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
    // Use www.coparentliaizen.com since Vercel redirects non-www to www
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || 'https://www.coparentliaizen.com'}/auth/google/callback`;

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
    
    if (!userInfoResponse.ok) {
      console.error('❌ Failed to get user info from Google:', userInfoResponse.status);
      return res.status(500).json({ 
        error: 'Failed to get user information from Google',
        code: 'GOOGLE_USERINFO_ERROR'
      });
    }
    
    const googleUser = await userInfoResponse.json();
    
    if (!googleUser.email || !googleUser.id) {
      console.error('❌ Invalid Google user data:', googleUser);
      return res.status(400).json({ 
        error: 'Invalid user data from Google',
        code: 'INVALID_GOOGLE_USER'
      });
    }

    // Find or create user using getOrCreateGoogleUser
    let user;
    try {
      user = await auth.getOrCreateGoogleUser(
        googleUser.id,
        googleUser.email,
        googleUser.name,
        googleUser.picture
      );
    } catch (userError) {
      console.error('❌ Error in getOrCreateGoogleUser:', userError);
      console.error('Error stack:', userError.stack);
      return res.status(500).json({ 
        error: 'Failed to create or find user account',
        message: userError.message || 'User creation failed',
        code: 'USER_CREATION_ERROR',
        details: process.env.NODE_ENV === 'development' ? userError.stack : undefined
      });
    }
    
    if (!user) {
      console.error('❌ getOrCreateGoogleUser returned null/undefined');
      return res.status(500).json({ 
        error: 'Failed to create user account',
        message: 'User creation returned no result',
        code: 'USER_CREATION_ERROR'
      });
    }
    
    if (!user.id || !user.username) {
      console.error('❌ Invalid user object returned:', { hasId: !!user.id, hasUsername: !!user.username, user });
      return res.status(500).json({ 
        error: 'Invalid user data',
        message: 'User creation succeeded but returned invalid data',
        code: 'INVALID_USER_DATA'
      });
    }

    // Handle invite token if provided
    if (inviteToken) {
      try {
        await invitationManager.acceptInvitation(inviteToken, user.id);
      } catch (inviteError) {
        console.error('Failed to accept invitation:', inviteError);
        // Don't fail the OAuth flow if invitation fails
      }
    }

    // Generate JWT token
    let token;
    try {
      token = generateToken(user);
    } catch (tokenError) {
      console.error('❌ Error generating token:', tokenError);
      return res.status(500).json({ 
        error: 'Failed to generate authentication token',
        message: tokenError.message || 'Token generation failed',
        code: 'TOKEN_GENERATION_ERROR'
      });
    }
    
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
    console.error('❌ Google OAuth error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'OAuth authentication failed',
      code: 'OAUTH_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

    const passwordError = getPasswordError(password);
    if (passwordError) {
      return res.status(400).json({
        error: passwordError,
        requirements: getPasswordRequirements()
      });
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

    const passwordError = getPasswordError(password);
    if (passwordError) {
      return res.status(400).json({
        error: passwordError,
        requirements: getPasswordRequirements()
      });
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

// ============================================================
// PASSWORD RESET ROUTES
// ============================================================

/**
 * POST /api/auth/forgot-password
 * Request a password reset email
 *
 * Security features:
 * - Rate limited (handled by middleware)
 * - Always returns success (prevents email enumeration)
 * - Invalidates existing tokens for the user
 * - Tokens expire in 1 hour
 */
router.post('/forgot-password', rateLimit('forgot-password', 5, 3600000), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Always respond with success to prevent email enumeration attacks
    const successResponse = {
      message: 'If an account exists with this email, you will receive a password reset link shortly.',
      success: true
    };

    // Find user by email
    const userResult = await db.query(
      'SELECT id, username, email, google_id, password_hash FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      // User not found - still return success to prevent enumeration
      console.log(`[Password Reset] No account found for email: ${normalizedEmail}`);
      return res.json(successResponse);
    }

    const user = userResult.rows[0];

    // Check if this is a Google-only account (no password set)
    if (user.google_id && !user.password_hash) {
      console.log(`[Password Reset] Google-only account attempted reset: ${normalizedEmail}`);
      // Still return success but don't send email (prevents enumeration)
      // In production, you might want to send a different email explaining they should use Google
      return res.json(successResponse);
    }

    // Invalidate any existing password reset tokens for this user
    await db.query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND used_at IS NULL',
      [user.id]
    );

    // Generate a secure random token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Get request metadata for security logging
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Store the token
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, resetToken, expiresAt, ipAddress, userAgent]
    );

    // Send password reset email
    try {
      await emailService.sendPasswordReset(user.email, resetToken, user.username);
      console.log(`[Password Reset] Email sent successfully to: ${normalizedEmail}`);
    } catch (emailError) {
      console.error(`[Password Reset] Failed to send email:`, emailError);
      // Don't expose email failures to the user
    }

    res.json(successResponse);

  } catch (error) {
    console.error('[Password Reset] Error:', error);
    // Return generic error to prevent information leakage
    res.status(500).json({ error: 'An error occurred. Please try again later.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using a valid token
 *
 * Security features:
 * - Token can only be used once
 * - Token expires after 1 hour
 * - Password validation enforced
 * - Token is invalidated after use
 */
router.post('/reset-password', rateLimit('reset-password', 10, 3600000), async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required', code: 'MISSING_TOKEN' });
    }

    if (!password) {
      return res.status(400).json({ error: 'New password is required', code: 'MISSING_PASSWORD' });
    }

    // Validate password strength
    const passwordValidation = validatePasswordDetailed(password);
    if (!passwordValidation.valid) {
      // Find the first unmet requirement for the error message
      const unmetRequirement = passwordValidation.requirements.find(r => !r.met);
      return res.status(400).json({
        error: unmetRequirement ? unmetRequirement.label : 'Password does not meet requirements',
        code: 'WEAK_PASSWORD',
        requirements: getPasswordRequirements(),
        details: passwordValidation.requirements
      });
    }

    // Find the token and associated user
    const tokenResult = await db.query(
      `SELECT prt.*, u.email, u.username
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      console.log(`[Password Reset] Invalid token attempted`);
      return res.status(400).json({
        error: 'Invalid or expired reset link. Please request a new password reset.',
        code: 'INVALID_TOKEN'
      });
    }

    const resetToken = tokenResult.rows[0];

    // Check if token has already been used
    if (resetToken.used_at) {
      console.log(`[Password Reset] Already used token attempted for user: ${resetToken.user_id}`);
      return res.status(400).json({
        error: 'This reset link has already been used. Please request a new password reset.',
        code: 'TOKEN_USED'
      });
    }

    // Check if token has expired
    if (new Date(resetToken.expires_at) < new Date()) {
      console.log(`[Password Reset] Expired token attempted for user: ${resetToken.user_id}`);
      return res.status(400).json({
        error: 'This reset link has expired. Please request a new password reset.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Hash the new password
    const bcrypt = require('bcrypt');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update the user's password
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, resetToken.user_id]
    );

    // Mark the token as used
    await db.query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [resetToken.id]
    );

    // Invalidate all other tokens for this user (security measure)
    await db.query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND id != $2 AND used_at IS NULL',
      [resetToken.user_id, resetToken.id]
    );

    console.log(`[Password Reset] Password successfully reset for user: ${resetToken.user_id}`);

    res.json({
      message: 'Your password has been reset successfully. You can now log in with your new password.',
      success: true
    });

  } catch (error) {
    console.error('[Password Reset] Error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again later.' });
  }
});

/**
 * GET /api/auth/verify-reset-token/:token
 * Verify if a reset token is valid (for frontend validation before showing form)
 */
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token is required' });
    }

    const tokenResult = await db.query(
      `SELECT prt.*, u.email
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.json({ valid: false, error: 'Invalid reset link', code: 'INVALID_TOKEN' });
    }

    const resetToken = tokenResult.rows[0];

    if (resetToken.used_at) {
      return res.json({ valid: false, error: 'This link has already been used', code: 'TOKEN_USED' });
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return res.json({ valid: false, error: 'This link has expired', code: 'TOKEN_EXPIRED' });
    }

    // Return valid status with masked email for UX
    const email = resetToken.email;
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    res.json({
      valid: true,
      email: maskedEmail,
      expiresAt: resetToken.expires_at
    });

  } catch (error) {
    console.error('[Verify Reset Token] Error:', error);
    res.status(500).json({ valid: false, error: 'An error occurred' });
  }
});

module.exports = router;

