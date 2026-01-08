/**
 * Signup/Register Integration Tests
 * 
 * 6 must-pass tests for production hardening:
 * 1. signup success
 * 2. signup duplicate email → 409 REG_001
 * 3. signup invalid email → 400
 * 4. signup weak/common password → 400 + requirements
 * 5. register cannot invite self → 400
 * 6. register success → returns invitation object
 */

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

// Mock dependencies
jest.mock('../../auth', () => ({
  createUserWithEmail: jest.fn(),
  registerWithInvitation: jest.fn(),
}));

jest.mock('../../dbPostgres', () => ({
  query: jest.fn(),
}));

jest.mock('../../libs/invitation-manager', () => ({
  createInvitation: jest.fn(),
}));

jest.mock('../../emailService', () => ({
  sendNewUserInvite: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../middleware/spamProtection', () => ({
  honeypotCheck: jest.fn(() => (req, res, next) => next()),
  rejectDisposableEmail: jest.fn(() => (req, res, next) => next()),
}));

jest.mock('../../routes/auth/utils', () => ({
  signupRateLimit: jest.fn(() => (req, res, next) => next()),
}));

// Import after mocks
const auth = require('../../auth');
const { createInvitation } = require('../../libs/invitation-manager');
const signupRoutes = require('../../routes/auth/signup');

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', signupRoutes);
  return app;
}

describe('Signup/Register Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('1. Signup Success', () => {
    it('should create user successfully and return sanitized user (no token)', async () => {
      const mockUser = {
        id: 123,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        room: { roomId: 456, roomName: "John Doe's Room" },
      };

      auth.createUserWithEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'securepassword123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: 123,
          email: 'test@example.com',
          displayName: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      // CRITICAL: Token should NOT be in JSON response
      expect(response.body.token).toBeUndefined();

      // Cookie should be set
      expect(response.headers['set-cookie']).toBeDefined();
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(c => c.includes('auth_token'))).toBe(true);

      expect(auth.createUserWithEmail).toHaveBeenCalledWith(
        'test@example.com',
        'securepassword123',
        {},
        null,
        null,
        { firstName: 'John', lastName: 'Doe' }
      );
    });
  });

  describe('2. Signup Duplicate Email → 409 REG_001', () => {
    it('should return 409 with REG_001 code for duplicate email', async () => {
      const duplicateError = new Error('Email already exists');
      duplicateError.code = 'REG_001';
      auth.createUserWithEmail.mockRejectedValue(duplicateError);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'existing@example.com',
          password: 'securepassword123',
          firstName: 'Jane',
          lastName: 'Smith',
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: 'Email already exists',
        code: 'REG_001',
      });
    });
  });

  describe('3. Signup Invalid Email → 400', () => {
    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'not-an-email',
          password: 'securepassword123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid email');
      expect(response.body.code).toBe('VAL_002');
    });

    it('should return 400 for email exceeding 254 characters', async () => {
      const longEmail = 'a'.repeat(250) + '@example.com'; // > 254 chars
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: longEmail,
          password: 'securepassword123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('254');
    });
  });

  describe('4. Signup Weak/Common Password → 400 + Requirements', () => {
    it('should return 400 for password shorter than 10 characters', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'short',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('10 characters');
      expect(response.body.requirements).toBeDefined();
    });

    it('should return 400 for common/blocked password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('common');
      expect(response.body.requirements).toBeDefined();
    });

    it('should return 400 for password containing email local-part', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'john@example.com',
          password: 'johnpassword123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('email username');
      expect(response.body.requirements).toBeDefined();
    });

    it('should return 400 for password containing app name', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'liaizenpassword123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('application name');
      expect(response.body.requirements).toBeDefined();
    });
  });

  describe('5. Register Cannot Invite Self → 400', () => {
    it('should return 400 when trying to invite yourself', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'securepassword123',
          firstName: 'Test',
          lastName: 'User',
          coParentEmail: 'test@example.com', // Same email
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Cannot invite yourself',
        code: 'REG_002',
      });

      // Should not call registerWithInvitation
      expect(auth.registerWithInvitation).not.toHaveBeenCalled();
    });
  });

  describe('6. Register Success → Returns Invitation Object', () => {
    it('should create user and invitation successfully, return sanitized response', async () => {
      const mockUser = {
        id: 456,
        email: 'inviter@example.com',
        firstName: 'Alice',
        lastName: 'Parent',
        displayName: 'Alice Parent',
        room: { roomId: 789, roomName: "Alice Parent's Room" },
      };

      const mockInvitation = {
        id: 1001,
        token: 'secret-invitation-token',
        inviteeEmail: 'invitee@example.com',
        isExistingUser: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        shortCode: 'ABC123',
      };

      auth.registerWithInvitation.mockResolvedValue({
        user: mockUser,
        invitation: mockInvitation,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'inviter@example.com',
          password: 'securepassword123',
          firstName: 'Alice',
          lastName: 'Parent',
          coParentEmail: 'invitee@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: 456,
          email: 'inviter@example.com',
          displayName: 'Alice Parent',
          firstName: 'Alice',
          lastName: 'Parent',
        },
        invitation: {
          id: 1001,
          inviteeEmail: 'invitee@example.com',
          isExistingUser: false,
          expiresAt: mockInvitation.expiresAt,
        },
      });

      // CRITICAL: Token should NOT be in JSON response
      expect(response.body.token).toBeUndefined();

      // Invitation token should NOT be in response
      expect(response.body.invitation.token).toBeUndefined();
      expect(response.body.invitation.shortCode).toBeUndefined();

      // Cookie should be set
      expect(response.headers['set-cookie']).toBeDefined();

      expect(auth.registerWithInvitation).toHaveBeenCalledWith(
        {
          email: 'inviter@example.com',
          password: 'securepassword123',
          firstName: 'Alice',
          lastName: 'Parent',
          coParentEmail: 'invitee@example.com',
          context: {},
        },
        expect.anything() // dbPostgres
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle PostgreSQL unique constraint violation (23505)', async () => {
      const dbError = new Error('duplicate key value violates unique constraint');
      dbError.code = '23505';
      dbError.constraint = 'users_email_key';
      auth.createUserWithEmail.mockRejectedValue(dbError);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'securepassword123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: 'Email already exists',
        code: 'REG_001',
      });
    });

    it('should return 500 GEN_500 for unknown errors without leaking details', async () => {
      const unknownError = new Error('Database connection failed: ECONNREFUSED');
      unknownError.code = 'ECONNREFUSED';
      auth.createUserWithEmail.mockRejectedValue(unknownError);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'securepassword123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error',
        code: 'GEN_500',
      });

      // Should NOT leak error.message
      expect(response.body.error).not.toContain('ECONNREFUSED');
      expect(response.body.error).not.toContain('Database connection');
    });

    it('should trim and lowercase email input', async () => {
      const mockUser = {
        id: 999,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
      };

      auth.createUserWithEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: '  TEST@EXAMPLE.COM  ', // Whitespace and uppercase
          password: 'securepassword123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(200);
      // Verify email was cleaned (trim + lowercase)
      expect(auth.createUserWithEmail).toHaveBeenCalledWith(
        'test@example.com', // Cleaned email
        'securepassword123',
        {},
        null,
        null,
        { firstName: 'Test', lastName: 'User' }
      );
    });

    it('should enforce max length on names (60 characters)', async () => {
      const longName = 'A'.repeat(61); // 61 characters
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'securepassword123',
          firstName: longName,
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('60');
    });
  });
});
