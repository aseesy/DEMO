/* global jest, describe, beforeEach, it, expect */
/**
 * Authentication Service Unit Tests
 *
 * Tests the authentication service methods to ensure proper
 * user authentication, risk assessment, and login flow handling.
 */

const { authService, LOGIN_RESULT_TYPES } = require('../../src/services/auth/authService');
const auth = require('../../auth');
const adaptiveAuth = require('../../libs/adaptive-auth');
const emailService = require('../../emailService');
const { generateToken } = require('../../middleware/auth');

// Mock dependencies
jest.mock('../../auth');
jest.mock('../../libs/adaptive-auth');
jest.mock('../../emailService');

// Mock middleware/auth before requiring authService
jest.mock('../../middleware/auth', () => ({
  generateToken: jest.fn(),
  setAuthCookie: jest.fn(),
  clearAuthCookie: jest.fn(),
  verifyAuth: jest.fn(),
}));

describe('AuthService', () => {
  let mockReq;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Express request object
    mockReq = {
      headers: {
        'user-agent': 'Mozilla/5.0 Test Browser',
      },
      body: {},
    };
  });

  describe('authenticateUser', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      display_name: 'Test User',
    };

    const mockPreAuthRisk = {
      riskLevel: 'LOW',
      score: 10,
      deviceFingerprint: 'test-fingerprint',
      clientIP: '127.0.0.1',
      action: 'allow',
      signals: [],
    };

    const mockPostAuthRisk = {
      riskLevel: 'LOW',
      score: 10,
      deviceFingerprint: 'test-fingerprint',
      clientIP: '127.0.0.1',
      action: 'allow',
      signals: [],
    };

    describe('Input Validation', () => {
      it('should throw ValidationError if password is missing', async () => {
        await expect(
          authService.authenticateUser({ email: 'test@example.com' }, mockReq)
        ).rejects.toThrow('Missing credentials');
      });

      it('should throw ValidationError if both email and username are missing', async () => {
        await expect(
          authService.authenticateUser({ password: 'password123' }, mockReq)
        ).rejects.toThrow('Missing credentials');
      });
    });

    describe('Pre-Authentication Risk Assessment', () => {
      it('should block login if pre-auth risk is CRITICAL', async () => {
        adaptiveAuth.calculateRiskScore.mockResolvedValueOnce({
          ...mockPreAuthRisk,
          riskLevel: 'CRITICAL',
        });

        const result = await authService.authenticateUser(mockCredentials, mockReq);

        expect(result.type).toBe(LOGIN_RESULT_TYPES.BLOCKED);
        expect(result.error).toBe('Suspicious activity blocked');
        expect(result.code).toBe('LOGIN_BLOCKED');
        expect(adaptiveAuth.recordLoginAttempt).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            success: false,
            riskLevel: 'CRITICAL',
          })
        );
        expect(auth.authenticateUserByEmail).not.toHaveBeenCalled();
      });
    });

    describe('User Authentication', () => {
      beforeEach(() => {
        adaptiveAuth.calculateRiskScore.mockResolvedValue(mockPreAuthRisk);
      });

      it('should authenticate user by email successfully', async () => {
        auth.authenticateUserByEmail.mockResolvedValue(mockUser);
        adaptiveAuth.calculateRiskScore
          .mockResolvedValueOnce(mockPreAuthRisk) // Pre-auth
          .mockResolvedValueOnce(mockPostAuthRisk); // Post-auth
        generateToken.mockReturnValue('mock-jwt-token');

        const result = await authService.authenticateUser(mockCredentials, mockReq);

        expect(result.type).toBe(LOGIN_RESULT_TYPES.SUCCESS);
        expect(result.user).toEqual({
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          display_name: mockUser.display_name,
        });
        expect(result.token).toBe('mock-jwt-token');
        expect(auth.authenticateUserByEmail).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
        expect(adaptiveAuth.recordLoginAttempt).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUser.id,
            email: mockUser.email,
            success: true,
          })
        );
      });

      it('should authenticate user by username successfully', async () => {
        auth.authenticateUser.mockResolvedValue(mockUser);
        adaptiveAuth.calculateRiskScore
          .mockResolvedValueOnce(mockPreAuthRisk) // Pre-auth
          .mockResolvedValueOnce(mockPostAuthRisk); // Post-auth
        generateToken.mockReturnValue('mock-jwt-token');

        const result = await authService.authenticateUser(
          { username: 'testuser', password: 'password123' },
          mockReq
        );

        expect(result.type).toBe(LOGIN_RESULT_TYPES.SUCCESS);
        expect(auth.authenticateUser).toHaveBeenCalledWith('testuser', 'password123');
        expect(auth.authenticateUserByEmail).not.toHaveBeenCalled();
      });

      it('should return INVALID_CREDENTIALS for invalid password', async () => {
        const authError = new Error('Invalid password');
        auth.authenticateUserByEmail.mockRejectedValue(authError);

        const result = await authService.authenticateUser(mockCredentials, mockReq);

        expect(result.type).toBe(LOGIN_RESULT_TYPES.INVALID_CREDENTIALS);
        expect(result.error).toBe('Invalid password');
        expect(result.code).toBe('INVALID_PASSWORD');
        expect(adaptiveAuth.recordLoginAttempt).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
      });

      it('should return ACCOUNT_NOT_FOUND for non-existent account', async () => {
        const authError = new Error('Account not found');
        auth.authenticateUserByEmail.mockRejectedValue(authError);

        const result = await authService.authenticateUser(mockCredentials, mockReq);

        expect(result.type).toBe(LOGIN_RESULT_TYPES.ACCOUNT_NOT_FOUND);
        expect(result.error).toBe('Account not found');
        expect(result.code).toBe('ACCOUNT_NOT_FOUND');
      });

      it('should return ACCOUNT_NOT_FOUND for ACCOUNT_NOT_FOUND error code', async () => {
        const authError = { message: 'User not found', code: 'ACCOUNT_NOT_FOUND' };
        auth.authenticateUserByEmail.mockRejectedValue(authError);

        const result = await authService.authenticateUser(mockCredentials, mockReq);

        expect(result.type).toBe(LOGIN_RESULT_TYPES.ACCOUNT_NOT_FOUND);
        expect(result.code).toBe('ACCOUNT_NOT_FOUND');
      });

      it('should return OAUTH_ONLY for OAuth-only accounts', async () => {
        const authError = {
          message: 'This account can only be accessed via OAuth',
          code: 'OAUTH_ONLY_ACCOUNT',
        };
        auth.authenticateUserByEmail.mockRejectedValue(authError);

        const result = await authService.authenticateUser(mockCredentials, mockReq);

        expect(result.type).toBe(LOGIN_RESULT_TYPES.OAUTH_ONLY);
        expect(result.error).toBe('This account can only be accessed via OAuth');
        expect(result.code).toBe('OAUTH_ONLY_ACCOUNT');
      });

      it('should return INVALID_CREDENTIALS if user is null', async () => {
        auth.authenticateUserByEmail.mockResolvedValue(null);
        adaptiveAuth.calculateRiskScore
          .mockResolvedValueOnce(mockPreAuthRisk) // Pre-auth
          .mockResolvedValueOnce(mockPostAuthRisk); // Post-auth

        const result = await authService.authenticateUser(mockCredentials, mockReq);

        expect(result.type).toBe(LOGIN_RESULT_TYPES.INVALID_CREDENTIALS);
        expect(result.error).toBe('Invalid credentials');
        expect(result.code).toBe('INVALID_CREDENTIALS');
      });

      it('should re-throw unexpected authentication errors', async () => {
        const unexpectedError = new Error('Database connection failed');
        auth.authenticateUserByEmail.mockRejectedValue(unexpectedError);

        await expect(authService.authenticateUser(mockCredentials, mockReq)).rejects.toThrow(
          'Database connection failed'
        );
      });
    });

    describe('Post-Authentication Risk Assessment', () => {
      beforeEach(() => {
        adaptiveAuth.calculateRiskScore.mockResolvedValueOnce(mockPreAuthRisk);
        auth.authenticateUserByEmail.mockResolvedValue(mockUser);
      });

      it('should require step-up auth if post-auth risk is HIGH', async () => {
        adaptiveAuth.calculateRiskScore.mockResolvedValueOnce({
          ...mockPostAuthRisk,
          action: 'step_up_auth',
          riskLevel: 'HIGH',
        });
        adaptiveAuth.generateStepUpCode.mockResolvedValue('123456');
        emailService.sendVerificationCode.mockResolvedValue();

        const result = await authService.authenticateUser(mockCredentials, mockReq);

        expect(result.type).toBe(LOGIN_RESULT_TYPES.STEP_UP_REQUIRED);
        expect(result.error).toBe('Verification required');
        expect(result.code).toBe('STEP_UP_REQUIRED');
        expect(result.requiresVerification).toBe(true);
        expect(adaptiveAuth.generateStepUpCode).toHaveBeenCalledWith(mockUser.id, 'email');
        expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
          mockUser.email,
          '123456',
          expect.objectContaining({
            reason: 'Unusual activity',
          })
        );
        expect(adaptiveAuth.recordLoginAttempt).not.toHaveBeenCalledWith(
          expect.objectContaining({ success: true })
        );
      });

      it('should continue login if step-up code is valid', async () => {
        adaptiveAuth.calculateRiskScore.mockResolvedValueOnce({
          ...mockPostAuthRisk,
          action: 'step_up_auth',
        });
        adaptiveAuth.verifyStepUpCode.mockResolvedValue(true);
        generateToken.mockReturnValue('mock-jwt-token');

        const result = await authService.authenticateUser(
          { ...mockCredentials, verificationCode: '123456' },
          mockReq
        );

        expect(result.type).toBe(LOGIN_RESULT_TYPES.SUCCESS);
        expect(adaptiveAuth.verifyStepUpCode).toHaveBeenCalledWith(mockUser.id, '123456');
        expect(adaptiveAuth.generateStepUpCode).not.toHaveBeenCalled();
      });

      it('should return INVALID_CODE if step-up code is invalid', async () => {
        adaptiveAuth.calculateRiskScore.mockResolvedValueOnce({
          ...mockPostAuthRisk,
          action: 'step_up_auth',
        });
        adaptiveAuth.verifyStepUpCode.mockResolvedValue(false);

        const result = await authService.authenticateUser(
          { ...mockCredentials, verificationCode: 'wrong-code' },
          mockReq
        );

        expect(result.type).toBe(LOGIN_RESULT_TYPES.INVALID_CODE);
        expect(result.error).toBe('Invalid code');
        expect(result.code).toBe('INVALID_VERIFICATION_CODE');
        expect(result.requiresVerification).toBe(true);
      });

      it('should handle email service failure gracefully when sending verification code', async () => {
        adaptiveAuth.calculateRiskScore.mockResolvedValueOnce({
          ...mockPostAuthRisk,
          action: 'step_up_auth',
        });
        adaptiveAuth.generateStepUpCode.mockResolvedValue('123456');
        emailService.sendVerificationCode.mockRejectedValue(new Error('Email service down'));

        const result = await authService.authenticateUser(mockCredentials, mockReq);

        // Should still return STEP_UP_REQUIRED even if email fails
        expect(result.type).toBe(LOGIN_RESULT_TYPES.STEP_UP_REQUIRED);
        expect(adaptiveAuth.generateStepUpCode).toHaveBeenCalled();
      });
    });

    describe('Successful Login Flow', () => {
      beforeEach(() => {
        adaptiveAuth.calculateRiskScore
          .mockResolvedValueOnce(mockPreAuthRisk) // Pre-auth
          .mockResolvedValueOnce(mockPostAuthRisk); // Post-auth
        auth.authenticateUserByEmail.mockResolvedValue(mockUser);
        generateToken.mockReturnValue('mock-jwt-token');
      });

      it('should record successful login attempt', async () => {
        await authService.authenticateUser(mockCredentials, mockReq);

        expect(adaptiveAuth.recordLoginAttempt).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUser.id,
            email: mockUser.email,
            success: true,
            deviceFingerprint: mockPostAuthRisk.deviceFingerprint,
            ipAddress: mockPostAuthRisk.clientIP,
            userAgent: mockReq.headers['user-agent'],
            riskScore: mockPostAuthRisk.score,
            riskLevel: mockPostAuthRisk.riskLevel,
          })
        );
      });

      it('should trust device if trustDevice is true', async () => {
        await authService.authenticateUser({ ...mockCredentials, trustDevice: true }, mockReq);

        expect(adaptiveAuth.trustDevice).toHaveBeenCalledWith(
          mockUser.id,
          mockPostAuthRisk.deviceFingerprint
        );
      });

      it('should not trust device if trustDevice is false', async () => {
        await authService.authenticateUser({ ...mockCredentials, trustDevice: false }, mockReq);

        expect(adaptiveAuth.trustDevice).not.toHaveBeenCalled();
      });

      it('should generate token for successful login', async () => {
        await authService.authenticateUser(mockCredentials, mockReq);

        expect(generateToken).toHaveBeenCalledWith(mockUser);
      });

      it('should return security information in success result', async () => {
        const highRiskPostAuth = {
          ...mockPostAuthRisk,
          riskLevel: 'MEDIUM',
          signals: [{ signal: 'NEW_DEVICE' }],
        };
        adaptiveAuth.calculateRiskScore
          .mockResolvedValueOnce(mockPreAuthRisk)
          .mockResolvedValueOnce(highRiskPostAuth);

        const result = await authService.authenticateUser(mockCredentials, mockReq);

        expect(result.type).toBe(LOGIN_RESULT_TYPES.SUCCESS);
        expect(result.security).toEqual({
          riskLevel: 'MEDIUM',
          newDevice: true,
        });
      });

      it('should return false for newDevice if no NEW_DEVICE signal', async () => {
        const noNewDeviceRisk = {
          ...mockPostAuthRisk,
          signals: [{ signal: 'UNUSUAL_TIME' }],
        };
        adaptiveAuth.calculateRiskScore
          .mockResolvedValueOnce(mockPreAuthRisk)
          .mockResolvedValueOnce(noNewDeviceRisk);

        const result = await authService.authenticateUser(mockCredentials, mockReq);

        expect(result.security.newDevice).toBe(false);
      });
    });
  });

  describe('formatUserResponse', () => {
    it('should format user data correctly', () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        display_name: 'Test User',
        password_hash: 'should-not-be-included',
        other_field: 'should-not-be-included',
      };

      const formatted = authService.formatUserResponse(user);

      expect(formatted).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        display_name: 'Test User',
      });
      expect(formatted).not.toHaveProperty('password_hash');
      expect(formatted).not.toHaveProperty('other_field');
    });
  });
});
