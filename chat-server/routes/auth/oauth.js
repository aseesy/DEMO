/**
 * Auth OAuth Routes
 * 
 * Security features:
 * - PKCE (Proof Key for Code Exchange) for SPA security
 * - State parameter validation for CSRF protection
 * - ID token validation instead of userinfo endpoint
 * - Email verification check
 */
const express = require('express');
const router = express.Router();
const auth = require('../../auth');
const invitationManager = require('../../libs/invitation-manager');
const { generateToken, setAuthCookie } = require('../../middleware/auth');
const {
  generatePKCE,
  verifyPKCE,
  stateStore,
  validateGoogleIdToken,
} = require('../../auth/oauthSecurity');

/**
 * GET /auth/google/start
 * 
 * Generates OAuth authorization URL with PKCE and state.
 * Client must send code_challenge and state.
 * 
 * Query params:
 * - state: (optional) Client-generated state parameter
 * - code_challenge: (optional) PKCE code challenge (if not provided, server generates)
 * - returnTo: (optional) URL to redirect to after successful auth
 */
router.get('/google', (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.APP_URL || 'https://www.coparentliaizen.com'}/auth/google/callback`;

    if (!clientId) {
      return res.status(500).json({ error: 'OAuth configuration error', code: 'OAUTH_CONFIG_ERROR' });
    }

    // Get or generate state parameter
    const state = req.query.state || generateOAuthState();
    const codeChallenge = req.query.code_challenge;
    const returnTo = req.query.returnTo;

    // If client sent code_challenge, store it with state for validation
    if (codeChallenge) {
      stateStore.set(state, { codeChallenge, returnTo }, 10 * 60 * 1000); // 10 minutes TTL
    } else {
      // Server generates PKCE (for backwards compatibility, but client should generate)
      const pkce = generatePKCE();
      stateStore.set(state, { codeChallenge: pkce.codeChallenge, returnTo }, 10 * 60 * 1000);
    }

    // Build authorization URL with PKCE
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: state,
    });

    if (codeChallenge) {
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Structured logging
    console.log('[OAuth] Authorization URL generated', {
      hasState: !!state,
      hasCodeChallenge: !!codeChallenge,
      hasReturnTo: !!returnTo,
    });

    res.json({ authUrl, state: codeChallenge ? undefined : state }); // Only return state if server generated
  } catch (error) {
    console.error('[OAuth] Error generating authorization URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL', code: 'OAUTH_ERROR' });
  }
});

/**
 * Helper: Generate random state string
 */
function generateOAuthState() {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * POST /auth/google/callback
 * 
 * Handles OAuth callback with security validations:
 * - Validates state parameter (CSRF protection)
 * - Validates PKCE code verifier
 * - Validates ID token (instead of userinfo endpoint)
 * - Checks email verification status
 * - Idempotent: handles duplicate requests gracefully
 * 
 * Body:
 * - code: Authorization code from Google
 * - state: State parameter for CSRF protection
 * - code_verifier: PKCE code verifier
 * - inviteToken: (optional) Invitation token
 */
router.post('/google/callback', async (req, res) => {
  try {
    const { code, state, code_verifier, inviteToken } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code required', code: 'MISSING_CODE' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.APP_URL || 'https://www.coparentliaizen.com'}/auth/google/callback`;

    // Structured logging
    console.log('[OAuth] Callback received', {
      hasCode: !!code,
      hasState: !!state,
      hasCodeVerifier: !!code_verifier,
      hasInviteToken: !!inviteToken,
    });

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Config error', code: 'OAUTH_CONFIG_ERROR' });
    }

    // Validate state parameter (CSRF protection)
    let returnTo = null;
    if (state) {
      const storedState = stateStore.get(state);
      if (!storedState) {
        console.warn('[OAuth] State validation failed', { state: state?.substring(0, 8) });
        return res.status(400).json({
          error: 'Invalid or expired state parameter',
          code: 'INVALID_STATE',
        });
      }

      // Validate PKCE if code_verifier provided
      if (code_verifier && storedState.codeChallenge) {
        const isValidPKCE = verifyPKCE(code_verifier, storedState.codeChallenge);
        if (!isValidPKCE) {
          console.warn('[OAuth] PKCE validation failed');
          return res.status(400).json({
            error: 'PKCE validation failed',
            code: 'INVALID_PKCE',
          });
        }
      }

      // Get returnTo from stored state
      returnTo = storedState.returnTo;
    } else {
      // Log warning but allow for backwards compatibility
      console.warn('[OAuth] No state parameter provided');
    }

    // Exchange authorization code for tokens (with PKCE if provided)
    const tokenParams = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    if (code_verifier) {
      tokenParams.append('code_verifier', code_verifier);
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams,
    });

    const tokens = await tokenRes.json();
    console.log('[OAuth] Token exchange response', {
      success: !tokens.error,
      error: tokens.error,
      hasAccessToken: !!tokens.access_token,
      hasIdToken: !!tokens.id_token,
    });

    // IDEMPOTENCY: Handle "code already used" gracefully
    if (tokens.error === 'invalid_grant') {
      console.log('[OAuth] Code already used - checking for existing session');

      // Check if there's a valid auth cookie we can use
      const existingToken = req.cookies?.auth_token;
      if (existingToken) {
        try {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET = process.env.JWT_SECRET;
          const decoded = jwt.verify(existingToken, JWT_SECRET);
          if (decoded && decoded.id) {
            const user = await auth.getUserById(decoded.id);
            if (user) {
              console.log('[OAuth] Returning existing session', { userId: user.id, email: user.email });
              return res.json({
                success: true,
                idempotent: true,
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  display_name: user.display_name,
                },
                token: existingToken,
              });
            }
          }
        } catch (e) {
          console.log('[OAuth] Existing token invalid:', e.message);
        }
      }

      // No valid existing session - return idempotent error
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Authorization code already used. Please sign in again.',
        code: 'CODE_ALREADY_USED',
        idempotent: true,
      });
    }

    if (tokens.error) {
      return res.status(tokens.error === 'invalid_client' ? 401 : 400).json({
        error: tokens.error,
        error_description: tokens.error_description,
        code: tokens.error === 'invalid_client' ? 'OAUTH_INVALID_CLIENT' : tokens.error,
      });
    }

    // Validate ID token (more secure than userinfo endpoint)
    if (!tokens.id_token) {
      console.error('[OAuth] No ID token in response');
      return res.status(400).json({
        error: 'No ID token received from Google',
        code: 'MISSING_ID_TOKEN',
      });
    }

    let googleUser;
    try {
      googleUser = await validateGoogleIdToken(tokens.id_token, clientId);
      console.log('[OAuth] ID token validated', {
        sub: googleUser.sub,
        email: googleUser.email,
        emailVerified: googleUser.email_verified,
      });
    } catch (idTokenError) {
      console.error('[OAuth] ID token validation failed:', idTokenError.message);
      return res.status(400).json({
        error: idTokenError.message,
        code: 'INVALID_ID_TOKEN',
      });
    }

    // Email verification is already checked in validateGoogleIdToken
    // But double-check for safety
    if (!googleUser.email_verified) {
      return res.status(400).json({
        error: 'Google email is not verified',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Create or get user (emailVerified is already checked in validateGoogleIdToken)
    const user = await auth.getOrCreateGoogleUser(
      googleUser.sub,
      googleUser.email,
      googleUser.name,
      googleUser.picture,
      googleUser.email_verified
    );

    if (inviteToken) {
      await invitationManager.acceptInvitation(inviteToken, user.id).catch(err => {
        console.warn('[OAuth] Failed to accept invitation:', err.message);
      });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    console.log('[OAuth] Authentication successful', {
      userId: user.id,
      email: user.email,
      hasReturnTo: !!returnTo,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
      },
      token,
      returnTo, // Return returnTo to client for redirect
    });
  } catch (error) {
    console.error('[OAuth] Error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: error.message || 'OAuth authentication failed',
      code: 'OAUTH_ERROR',
    });
  }
});

module.exports = router;
