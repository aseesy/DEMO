/**
 * Auth OAuth Routes
 */
const express = require('express');
const router = express.Router();
const auth = require('../../auth');
const invitationManager = require('../../libs/invitation-manager');
const { generateToken, setAuthCookie } = require('../../middleware/auth');

router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.APP_URL || 'https://www.coparentliaizen.com'}/auth/google/callback`;

  if (!clientId)
    return res.status(500).json({ error: 'OAuth configuration error', code: 'OAUTH_CONFIG_ERROR' });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('email profile')}&access_type=offline&prompt=consent`;
  res.json({ authUrl });
});

/**
 * IDEMPOTENCY: This endpoint handles duplicate requests gracefully.
 *
 * Scenarios:
 * 1. User refreshes the callback page → code already used → return existing session if valid
 * 2. Network retry → same code sent twice → return existing session if valid
 * 3. React StrictMode double mount → same code sent twice → return existing session if valid
 *
 * If code is already used (invalid_grant) but user has valid session, return that session.
 * If code is already used and no valid session, return idempotent error.
 */
router.post('/google/callback', async (req, res) => {
  try {
    const { code, inviteToken } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.APP_URL || 'https://www.coparentliaizen.com'}/auth/google/callback`;

    console.log('[OAuth] Google callback received:', {
      hasCode: !!code,
      codeLength: code?.length,
      redirectUri,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
    });

    if (!clientId || !clientSecret)
      return res.status(500).json({ error: 'Config error', code: 'OAUTH_CONFIG_ERROR' });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    console.log('[OAuth] Token exchange response:', {
      success: !tokens.error,
      error: tokens.error,
      errorDescription: tokens.error_description,
      hasAccessToken: !!tokens.access_token,
    });

    // IDEMPOTENCY: Handle "code already used" gracefully
    if (tokens.error === 'invalid_grant') {
      console.log('[OAuth] Code already used (invalid_grant) - checking for existing session');

      // Check if there's a valid auth cookie we can use
      const existingToken = req.cookies?.auth_token;
      if (existingToken) {
        try {
          const { verifyToken } = require('../../middleware/auth');
          const decoded = verifyToken(existingToken);
          if (decoded && decoded.id) {
            const user = await auth.getUserById(decoded.id);
            if (user) {
              console.log('[OAuth] Returning existing session for user:', user.email);
              return res.json({
                success: true,
                idempotent: true, // Signal that this is a cached response
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
      // This tells the client: "code was used, but you're not authenticated"
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Authorization code already used. Please sign in again.',
        code: 'CODE_ALREADY_USED',
        idempotent: true, // Signal that retry won't help
      });
    }

    if (tokens.error)
      return res.status(tokens.error === 'invalid_client' ? 401 : 400).json({
        error: tokens.error,
        error_description: tokens.error_description,
        code: tokens.error === 'invalid_client' ? 'OAUTH_INVALID_CLIENT' : tokens.error,
      });

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userRes.json();
    if (!googleUser.email || !googleUser.id)
      return res.status(400).json({ error: 'Invalid Google data', code: 'INVALID_GOOGLE_USER' });

    const user = await auth.getOrCreateGoogleUser(
      googleUser.id,
      googleUser.email,
      googleUser.name,
      googleUser.picture
    );
    if (inviteToken) await invitationManager.acceptInvitation(inviteToken, user.id).catch(() => {});

    const token = generateToken(user);
    setAuthCookie(res, token);
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
      },
      token,
    });
  } catch (error) {
    console.error('[OAuth] Error:', error);
    res.status(500).json({ error: error.message, code: 'OAUTH_ERROR' });
  }
});

module.exports = router;
