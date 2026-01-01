/**
 * Authentication Service
 *
 * Actor: Authentication & Authorization
 * Responsibility: Handle user authentication, risk assessment, and session management
 *
 * Encapsulates all login business logic:
 * - User authentication (email/username + password)
 * - Adaptive authentication (risk scoring, step-up auth)
 * - Login attempt tracking
 * - Token generation
 * - Device trust management
 */

const { BaseService } = require('../BaseService');
const { ValidationError, AuthenticationError } = require('../errors');
const auth = require('../../../auth');
const adaptiveAuth = require('../../../libs/adaptive-auth');
const emailService = require('../../../emailService');
const { generateToken } = require('../../../middleware/auth');

/**
 * Login result types
 */
const LOGIN_RESULT_TYPES = {
  SUCCESS: 'success',
  BLOCKED: 'blocked',
  STEP_UP_REQUIRED: 'step_up_required',
  INVALID_CODE: 'invalid_code',
  INVALID_CREDENTIALS: 'invalid_credentials',
  ACCOUNT_NOT_FOUND: 'account_not_found',
  OAUTH_ONLY: 'oauth_only',
};

class AuthService extends BaseService {
  constructor() {
    super(); // No default table - manages authentication state
  }

  /**
   * Authenticate user and handle full login flow
   *
   * @param {Object} credentials - Login credentials
   * @param {string} [credentials.email] - User email
   * @param {string} [credentials.username] - Username (alternative to email)
   * @param {string} credentials.password - User password
   * @param {boolean} [credentials.trustDevice] - Whether to trust the device
   * @param {string} [credentials.verificationCode] - Step-up verification code (if required)
   * @param {Object} req - Express request object (for IP, user-agent, etc.)
   * @returns {Promise<Object>} Login result with type, user, token, security info, or error
   */
  async authenticateUser(credentials, req) {
    const { email, username, password, trustDevice, verificationCode } = credentials;
    const loginEmail = email ? email.trim().toLowerCase() : null;

    // Validate input
    if (!password || (!loginEmail && !username)) {
      throw new ValidationError('Missing credentials', 'credentials');
    }

    // Step 1: Pre-authentication risk assessment
    const preAuthRisk = await adaptiveAuth.calculateRiskScore(
      { email: loginEmail || username },
      req,
      null
    );

    // Block if critical risk
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

      return {
        type: LOGIN_RESULT_TYPES.BLOCKED,
        error: 'Suspicious activity blocked',
        code: 'LOGIN_BLOCKED',
      };
    }

    // Step 2: Authenticate user credentials
    // MIGRATION: Always use email-based authentication
    // If username provided without email, the legacy function will convert it
    let user;
    try {
      if (loginEmail) {
        user = await auth.authenticateUserByEmail(loginEmail, password);
      } else if (username) {
        // Legacy path: username provided instead of email
        // authenticateUser now redirects to authenticateUserByEmail internally
        console.warn('[AuthService] Login attempted with username instead of email - consider updating client');
        user = await auth.authenticateUser(username, password);
      } else {
        throw new ValidationError('Email is required for login', 'email');
      }
    } catch (authError) {
      // CRITICAL: Check for database connection errors first
      // These should be distinguished from authentication errors
      const isDbError = 
        authError.code === 'ECONNREFUSED' ||
        authError.code === 'ECONNRESET' ||
        authError.code === 'ETIMEDOUT' ||
        authError.code === '08000' || // PostgreSQL connection_exception
        authError.code === '08003' || // PostgreSQL connection_does_not_exist
        authError.code === '08006' || // PostgreSQL connection_failure
        authError.message?.toLowerCase().includes('connection') ||
        authError.message?.toLowerCase().includes('database') ||
        authError.message?.toLowerCase().includes('postgresql') ||
        authError.message?.toLowerCase().includes('econnrefused');
      
      if (isDbError) {
        // Don't record as failed login attempt - it's a system error
        console.warn('[AuthService] Database connection error during authentication:', authError.code || authError.message);
        throw new Error('DATABASE_NOT_READY');
      }
      
      // Record failed attempt
      const recordPromise = adaptiveAuth.recordLoginAttempt({
        email: loginEmail || username,
        success: false,
        deviceFingerprint: preAuthRisk.deviceFingerprint,
        ipAddress: preAuthRisk.clientIP,
        userAgent: req.headers['user-agent'],
        riskScore: preAuthRisk.score,
        riskLevel: preAuthRisk.riskLevel,
      });
      if (recordPromise && typeof recordPromise.catch === 'function') {
        recordPromise.catch(() => {
          // Ignore errors recording login attempt (non-critical)
        });
      }

      // Handle specific authentication errors
      if (authError.message === 'Invalid password') {
        return {
          type: LOGIN_RESULT_TYPES.INVALID_CREDENTIALS,
          error: 'Invalid password',
          code: 'INVALID_PASSWORD',
        };
      }

      if (authError.message === 'Account not found' || authError.code === 'ACCOUNT_NOT_FOUND') {
        return {
          type: LOGIN_RESULT_TYPES.ACCOUNT_NOT_FOUND,
          error: 'Account not found',
          code: 'ACCOUNT_NOT_FOUND',
        };
      }

      if (authError.code === 'OAUTH_ONLY_ACCOUNT') {
        return {
          type: LOGIN_RESULT_TYPES.OAUTH_ONLY,
          error: authError.message,
          code: 'OAUTH_ONLY_ACCOUNT',
        };
      }

      // Re-throw unexpected errors
      throw authError;
    }

    if (!user) {
      return {
        type: LOGIN_RESULT_TYPES.INVALID_CREDENTIALS,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      };
    }

    // Step 3: Post-authentication risk assessment
    const postAuthRisk = await adaptiveAuth.calculateRiskScore({ email: user.email }, req, user.id);

    // Step 4: Handle step-up authentication if required
    if (postAuthRisk.action === 'step_up_auth') {
      if (verificationCode) {
        // Verify the code
        const isValid = await adaptiveAuth.verifyStepUpCode(user.id, verificationCode);
        if (!isValid) {
          return {
            type: LOGIN_RESULT_TYPES.INVALID_CODE,
            error: 'Invalid code',
            code: 'INVALID_VERIFICATION_CODE',
            requiresVerification: true,
          };
        }
        // Code is valid, continue with login
      } else {
        // Generate and send verification code
        const code = await adaptiveAuth.generateStepUpCode(user.id, 'email');
        try {
          await emailService.sendVerificationCode(user.email, code, {
            reason: 'Unusual activity',
            ip: postAuthRisk.clientIP,
          });
        } catch (err) {
          // Log but don't fail - code generation succeeded
          console.error('[AuthService] Failed to send verification code:', err);
        }

        return {
          type: LOGIN_RESULT_TYPES.STEP_UP_REQUIRED,
          error: 'Verification required',
          code: 'STEP_UP_REQUIRED',
          requiresVerification: true,
        };
      }
    }

    // Step 5: Record successful login attempt
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

    // Step 6: Trust device if requested
    if (trustDevice) {
      await adaptiveAuth.trustDevice(user.id, postAuthRisk.deviceFingerprint);
    }

    // Step 7: Generate token and format response
    const token = generateToken(user);

    return {
      type: LOGIN_RESULT_TYPES.SUCCESS,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        first_name: user.first_name,
      },
      token,
      security: {
        riskLevel: postAuthRisk.riskLevel,
        newDevice: postAuthRisk.signals.some(s => s.signal === 'NEW_DEVICE'),
      },
    };
  }

  /**
   * Format user data for API response
   * @param {Object} user - User object from database
   * @returns {Object} Formatted user data
   */
  formatUserResponse(user) {
    return {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      first_name: user.first_name,
    };
  }
}

// Export singleton instance
const authService = new AuthService();

module.exports = { authService, AuthService, LOGIN_RESULT_TYPES };
