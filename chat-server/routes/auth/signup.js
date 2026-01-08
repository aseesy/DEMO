/**
 * Auth Signup Routes
 *
 * This module handles signup/registration with clear separation:
 * - Schema validation via Zod middleware
 * - Error classification centralized
 * - Business logic focused in handlers
 * - Safe user responses (no tokens, no PII)
 */

const express = require('express');
const router = express.Router();
const auth = require('../../auth');
const emailService = require('../../emailService');
const { generateToken, setAuthCookie } = require('../../middleware/auth');
const { honeypotCheck, rejectDisposableEmail } = require('../../middleware/spamProtection');
const { signupRateLimit } = require('./utils');
const { signupSchema, registerSchema } = require('./signupSchemas');
const validateSchema = require('./validateSchema');
const { sanitizeUserResponse } = require('./sanitizeUser');
const { mapPostgresErrorToRegistrationError } = require('./errorMapper');
const { defaultLogger } = require('../../src/infrastructure/logging/logger');
const { getPasswordError, getPasswordRequirements } = require('../../libs/password-validator');

/**
 * POST /signup - Create new user account
 */
router.post(
  '/signup',
  signupRateLimit,
  validateSchema(signupSchema), // Schema validation middleware (validates + coerces)
  honeypotCheck('website'),
  rejectDisposableEmail,
  async (req, res) => {
    const logger = defaultLogger.child({ route: '/signup', requestId: req.id || 'unknown' });
    const { email, password, firstName, lastName, context } = req.body;

    // Additional password validation (context-specific checks: email local-part, app name)
    // Schema already validates min/max length, but password policy needs email context
    const passwordError = getPasswordError(password, email);
    if (passwordError) {
      return res.status(400).json({
        error: passwordError,
        requirements: getPasswordRequirements(),
      });
    }

    // Step 1: Create user
    let user;
    try {
      user = await auth.createUserWithEmail(email, password, context || {}, null, null, {
        firstName,
        lastName,
      });
      logger.info('User created successfully', { userId: user.id });
    } catch (error) {
      // CRITICAL: Check for database connection errors first
      const {
        isDatabaseConnectionError,
        getDatabaseErrorResponse,
        getDatabaseErrorStatusCode,
      } = require('../../src/utils/databaseErrorClassifier');

      if (isDatabaseConnectionError(error)) {
        logger.warn('Database connection error during signup', { errorCode: error.code });
        const errorResponse = getDatabaseErrorResponse(error);
        const statusCode = getDatabaseErrorStatusCode(error);
        return res.status(statusCode).json(errorResponse);
      }

      // Map PostgreSQL errors to registration errors
      const mapped = mapPostgresErrorToRegistrationError(error);
      logger.warn('Signup error', { errorCode: mapped.code, errorType: mapped.type });
      return res.status(mapped.status).json(mapped.body);
    }

    // Step 2: Generate token and set cookie (httpOnly, secure, sameSite)
    const token = generateToken(user);
    setAuthCookie(res, token);

    // Step 3: Return success with sanitized user (NO TOKEN in JSON)
    const safeUser = sanitizeUserResponse(user);
    res.json({ success: true, user: safeUser });
  }
);

/**
 * POST /register - Create user account with co-parent invitation
 */
router.post(
  '/register',
  signupRateLimit,
  validateSchema(registerSchema), // Schema validation middleware (validates + coerces)
  honeypotCheck('website'),
  rejectDisposableEmail,
  async (req, res) => {
    const logger = defaultLogger.child({ route: '/register', requestId: req.id || 'unknown' });
    const { email, password, firstName, lastName, coParentEmail, context } = req.body;

    // Cannot invite self (validated in schema, but double-check for safety)
    if (email.toLowerCase() === coParentEmail.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot invite yourself', code: 'REG_002' });
    }

    // Additional password validation (context-specific checks: email local-part, app name)
    // Schema already validates min/max length, but password policy needs email context
    const passwordError = getPasswordError(password, email);
    if (passwordError) {
      return res.status(400).json({
        error: passwordError,
        requirements: getPasswordRequirements(),
      });
    }

    // Step 1: Register with invitation
    let result;
    try {
      result = await auth.registerWithInvitation(
        {
          email,
          password,
          firstName,
          lastName,
          coParentEmail,
          context: context || {},
        },
        require('../../dbPostgres')
      );
      logger.info('User registered with invitation', { userId: result.user.id });
    } catch (error) {
      // CRITICAL: Check for database connection errors using centralized classifier
      const {
        isDatabaseConnectionError,
        getDatabaseErrorResponse,
        getDatabaseErrorStatusCode,
      } = require('../../src/utils/databaseErrorClassifier');

      if (isDatabaseConnectionError(error)) {
        logger.warn('Database connection error during register', { errorCode: error.code });
        const errorResponse = getDatabaseErrorResponse(error);
        const statusCode = getDatabaseErrorStatusCode(error);
        return res.status(statusCode).json(errorResponse);
      }

      // Map PostgreSQL errors to registration errors
      const mapped = mapPostgresErrorToRegistrationError(error);
      logger.warn('Register error', { errorCode: mapped.code, errorType: mapped.type });
      return res.status(mapped.status).json(mapped.body);
    }

    // Step 2: Generate token and set cookie (httpOnly, secure, sameSite)
    const token = generateToken(result.user);
    setAuthCookie(res, token);

    // Step 3: Send invitation email (non-blocking, with error logging)
    if (!result.invitation.isExistingUser) {
      sendInvitationEmail(result.invitation, result.user, logger);
    }

    // Step 4: Return success with sanitized user (NO TOKEN in JSON)
    const safeUser = sanitizeUserResponse(result.user);
    // Sanitize invitation (remove token from response)
    const safeInvitation = {
      id: result.invitation.id,
      inviteeEmail: result.invitation.inviteeEmail,
      isExistingUser: result.invitation.isExistingUser,
      expiresAt: result.invitation.expiresAt,
      // Exclude: token, shortCode (sensitive)
    };
    res.json({
      success: true,
      user: safeUser,
      invitation: safeInvitation,
    });
  }
);

/**
 * Send invitation email (non-blocking, fire-and-forget)
 * @param {Object} invitation - Invitation data
 * @param {Object} user - Inviting user
 * @param {Object} logger - Logger instance
 */
async function sendInvitationEmail(invitation, user, logger) {
  try {
    const inviteUrl = `${process.env.APP_URL || 'https://coparentliaizen.com'}/accept-invite?token=${invitation.token}`;
    await emailService.sendNewUserInvite(
      invitation.inviteeEmail,
      user.displayName || user.firstName || 'Co-Parent',
      inviteUrl,
      invitation.shortCode
    );
    logger.info('Invitation email sent', { invitationId: invitation.id });
  } catch (err) {
    // Log but don't fail the request - background operation
    logger.warn('Failed to send invitation email', { 
      invitationId: invitation.id,
      error: err.message,
      errorCode: err.code,
    });
  }
}

module.exports = router;
