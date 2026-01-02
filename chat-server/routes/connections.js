/**
 * Connections Routes
 * @di-pattern: injected
 *
 * Handles email-based invitation and connection management.
 * Includes contact form, sending invitations, validating tokens,
 * and accepting/signing up via invitation.
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();

const dbSafe = require('../dbSafe');
const {
  validateEmail,
  emailExists,
  getUserByEmail,
} = require('../connectionManager/emailValidation');
const {
  generateInviteToken,
  validateConnectionToken,
} = require('../connectionManager/tokenService');
const { createPendingConnection } = require('../connectionManager/pendingConnections');
const { acceptPendingConnection } = require('../connectionManager/connectionAcceptance');
const emailService = require('../emailService');
const { getPasswordError, getPasswordRequirements } = require('../libs/password-validator');
const {
  honeypotCheck,
  rateLimit,
  recaptchaVerify,
  rejectDisposableEmail,
} = require('../middleware/spamProtection');

// Helper references - set from server.js
let auth;
let autoCompleteOnboardingTasks;

router.setHelpers = function (helpers) {
  auth = helpers.auth;
  autoCompleteOnboardingTasks = helpers.autoCompleteOnboardingTasks;
};

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Spam protection middleware for contact form
const contactFormProtection = [
  honeypotCheck('website'), // Honeypot field
  rateLimit({
    // Rate limit: 5 submissions per hour per IP
    windowMs: 3600000,
    maxRequests: 5,
    message: 'Too many contact form submissions. Please try again later.',
  }),
  rejectDisposableEmail, // Block disposable emails
  recaptchaVerify({ minScore: 0.5, action: 'contact' }), // reCAPTCHA v3
];

// ========================================
// Contact Form
// ========================================

/**
 * POST /api/contact
 * Contact form endpoint (public - no authentication required)
 * Protected by honeypot, rate limiting, disposable email check, and reCAPTCHA
 */
router.post('/contact', contactFormProtection, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'All fields are required (name, email, subject, message)',
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Validate message length
    if (message.trim().length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters' });
    }

    // Send email via email service
    const result = await emailService.sendContactForm({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });

    console.log(`📧 Contact form submitted by ${name} <${email}>: ${subject}`);

    res.json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you within 24-48 hours.",
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({
      error: 'Failed to send message. Please try emailing us directly at info@liaizen.com',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ========================================
// Email-based Invitation & Connection APIs
// ========================================

/**
 * POST /api/invite
 * Send invitation by email
 */
router.post('/invite', async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get inviter user
    const inviter = await auth.getUser(username);
    if (!inviter || !inviter.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email already exists in database
    const emailExistsResult = await emailExists(email);
    const inviteeUser = emailExistsResult ? await getUserByEmail(email) : null;

    // Create pending connection
    const connection = await createPendingConnection(inviter.id, email);

    // Send appropriate email based on whether user exists
    if (emailExists && inviteeUser) {
      // Existing user - send connection request notification
      await emailService.sendExistingUserInvite(
        email,
        inviter.username,
        process.env.APP_NAME || 'Co-Parent Chat'
      );
    } else {
      // New user - send invitation with token link
      await emailService.sendNewUserInvite(
        email,
        inviter.username,
        connection.token,
        process.env.APP_NAME || 'Co-Parent Chat'
      );
    }

    res.json({
      success: true,
      message: emailExistsResult
        ? 'Connection request sent to existing user'
        : 'Invitation email sent to new user',
      isExistingUser: emailExistsResult,
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/join
 * Validate connection token (for join page)
 */
router.get('/join', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const connection = await validateConnectionToken(token);

    if (!connection) {
      return res.status(404).json({
        error: 'Invalid or expired invitation token',
        valid: false,
      });
    }

    // Check if invitee email has an account
    const inviteeUser = await getUserByEmail(connection.inviteeEmail);

    res.json({
      valid: true,
      inviteeEmail: connection.inviteeEmail,
      inviteeHasAccount: !!inviteeUser,
      expiresAt: connection.expiresAt,
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/join/accept
 * Accept invitation and create connection (used after signup/login)
 */
router.post('/join/accept', async (req, res) => {
  try {
    const { token, username } = req.body;

    if (!token || !username) {
      return res.status(400).json({ error: 'Token and username are required' });
    }

    // Validate token
    const connection = await validateConnectionToken(token);
    if (!connection) {
      return res.status(404).json({ error: 'Invalid or expired invitation token' });
    }

    // Get user
    const user = await auth.getUser(username);
    if (!user || !user.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify email matches (if user has email set)
    if (user.email && user.email.toLowerCase() !== connection.inviteeEmail.toLowerCase()) {
      return res.status(403).json({
        error: 'This invitation was sent to another email address. Please log out and try again.',
      });
    }

    // If user doesn't have email set, set it now (from invitation)
    if (!user.email) {
      // Update user email using safe update
      await dbSafe.safeUpdate('users', { email: connection.inviteeEmail }, { id: user.id });
    }

    // Accept connection
    const result = await acceptPendingConnection(token, user.id);

    // Auto-complete onboarding tasks for both users after accepting invite
    if (autoCompleteOnboardingTasks) {
      try {
        await autoCompleteOnboardingTasks(user.id);
        // Also complete tasks for the inviter
        const connectionRefetch = await validateConnectionToken(token);
        if (connectionRefetch && connectionRefetch.inviterId) {
          await autoCompleteOnboardingTasks(connectionRefetch.inviterId);
        }
      } catch (error) {
        console.error('Error auto-completing onboarding tasks after invite acceptance:', error);
        // Don't fail the request if this fails
      }
    }

    res.json({
      success: true,
      message: 'Connection created successfully',
      roomId: result.inviterRoom,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/signup-with-token
 * Signup with email from invitation token
 */
router.post('/auth/signup-with-token', async (req, res) => {
  try {
    const { username, password, token, context } = req.body;

    if (!username || !password || !token) {
      return res.status(400).json({ error: 'Username, password, and token are required' });
    }

    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 2-20 characters' });
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      return res.status(400).json({
        error: passwordError,
        requirements: getPasswordRequirements(),
      });
    }

    // Validate token
    const connection = await validateConnectionToken(token);
    if (!connection) {
      return res.status(404).json({ error: 'Invalid or expired invitation token' });
    }

    // Create user with email from invitation
    const user = await auth.createUser(username, password, context || {}, connection.inviteeEmail);

    // Immediately accept the connection
    await acceptPendingConnection(token, user.id);

    res.json({
      success: true,
      user,
      message: 'Account created and connection established',
    });
  } catch (error) {
    if (error.message === 'Username already exists' || error.message === 'Email already exists') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
