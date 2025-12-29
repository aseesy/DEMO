/**
 * Auth Signup Routes
 *
 * This module handles signup/registration with clear separation:
 * - Validation logic in signupValidation.js
 * - Error classification centralized
 * - Business logic focused in handlers
 */

const express = require('express');
const router = express.Router();
const auth = require('../../auth');
const emailService = require('../../emailService');
const { generateToken, setAuthCookie } = require('../../middleware/auth');
const { honeypotCheck, rejectDisposableEmail } = require('../../middleware/spamProtection');
const { signupRateLimit } = require('./utils');
const {
  validateSignupInput,
  validateRegisterInput,
  classifySignupError,
} = require('./signupValidation');

/**
 * POST /signup - Create new user account
 */
router.post(
  '/signup',
  signupRateLimit,
  honeypotCheck('website'),
  rejectDisposableEmail,
  async (req, res) => {
    // Step 1: Validate input
    const validation = validateSignupInput(req.body);
    if (!validation.valid) {
      return res.status(validation.status).json(validation.error);
    }

    const { email, password, firstName, lastName } = validation.cleanData;

    // Step 2: Create user
    let user;
    try {
      user = await auth.createUserWithEmail(email, password, req.body.context || {}, null, null, {
        firstName,
        lastName,
      });
    } catch (error) {
      const classified = classifySignupError(error);
      return res.status(classified.status).json(classified.body);
    }

    // Step 3: Generate token and set cookie
    const token = generateToken(user);
    setAuthCookie(res, token);

    // Step 4: Return success
    res.json({ success: true, user, token });
  }
);

/**
 * POST /register - Create user account with co-parent invitation
 */
router.post(
  '/register',
  signupRateLimit,
  honeypotCheck('website'),
  rejectDisposableEmail,
  async (req, res) => {
    // Step 1: Validate input
    const validation = validateRegisterInput(req.body);
    if (!validation.valid) {
      return res.status(validation.status).json(validation.error);
    }

    const { email, password, firstName, lastName, coParentEmail } = validation.cleanData;

    // Step 2: Register with invitation
    let result;
    try {
      result = await auth.registerWithInvitation(
        {
          email,
          password,
          firstName,
          lastName,
          coParentEmail,
          context: req.body.context || {},
        },
        require('../../dbPostgres')
      );
    } catch (error) {
      const classified = classifySignupError(error);
      return res.status(classified.status).json(classified.body);
    }

    // Step 3: Generate token and set cookie
    const token = generateToken(result.user);
    setAuthCookie(res, token);

    // Step 4: Send invitation email (non-blocking)
    if (!result.invitation.isExistingUser) {
      sendInvitationEmail(result.invitation, result.user);
    }

    // Step 5: Return success
    res.json({
      success: true,
      user: result.user,
      invitation: result.invitation,
      token,
    });
  }
);

/**
 * Send invitation email (non-blocking, fire-and-forget)
 * @param {Object} invitation - Invitation data
 * @param {Object} user - Inviting user
 */
async function sendInvitationEmail(invitation, user) {
  try {
    const inviteUrl = `${process.env.APP_URL || 'https://coparentliaizen.com'}/accept-invite?token=${invitation.token}`;
    await emailService.sendNewUserInvite(
      invitation.inviteeEmail,
      user.displayName || user.username,
      inviteUrl,
      invitation.shortCode
    );
  } catch (err) {
    // Log but don't fail the request
    console.error('Invite email error:', err);
  }
}

module.exports = router;
