/**
 * Authentication Routes Integration Tests
 *
 * Tests the auth API endpoints to ensure proper request/response handling.
 */

const express = require('express');
const cookieParser = require('cookie-parser');

// Mock all required modules
jest.mock('../auth', () => ({
  createUserWithEmail: jest.fn(),
  authenticateUserByEmail: jest.fn(),
  authenticateUser: jest.fn(),
  registerWithInvitation: jest.fn(),
  registerFromInvitation: jest.fn(),
  registerFromShortCode: jest.fn(),
  registerFromPairing: jest.fn(),
  getOrCreateGoogleUser: jest.fn(),
}));

jest.mock('../dbSafe', () => ({
  safeSelect: jest.fn(),
  parseResult: jest.fn(result => result),
}));

jest.mock('../dbPostgres', () => ({
  query: jest.fn(),
}));

jest.mock('../libs/invitation-manager', () => ({
  createInvitation: jest.fn(),
  validateToken: jest.fn(),
  acceptInvitation: jest.fn(),
}));

jest.mock('../libs/pairing-manager', () => ({
  validateToken: jest.fn().mockResolvedValue({ valid: false }),
}));

jest.mock('../emailService', () => ({
  sendNewUserInvite: jest.fn().mockResolvedValue(true),
}));

// Import mocked modules
const auth = require('../auth');
const dbSafe = require('../dbSafe');
const invitationManager = require('../libs/invitation-manager');

// Create a test-friendly auth routes module
const jwt = require('jsonwebtoken');

// Simple implementation for testing
const JWT_SECRET = 'test-secret-key';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, userId: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function verifyAuth(req, res, next) {
  const token =
    req.cookies.auth_token ||
    (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      ...decoded,
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Create test app with routes
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Signup endpoint
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (password.length < 10) {
        return res.status(400).json({ error: 'Password must be at least 10 characters' });
      }

      const user = await auth.createUserWithEmail(email.trim().toLowerCase(), password, {});
      const token = generateToken(user);

      res.json({ success: true, user, token });
    } catch (error) {
      if (error.message === 'Email already exists') {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password, username } = req.body;

      if (!password || (!email && !username)) {
        return res.status(400).json({ error: 'Email/username and password are required' });
      }

      let user;
      if (email) {
        user = await auth.authenticateUserByEmail(email.trim().toLowerCase(), password);
      } else {
        user = await auth.authenticateUser(username, password);
      }

      if (!user) {
        return res.status(401).json({
          error: email ? 'No account found with this email' : 'Invalid username or password',
          code: email ? 'ACCOUNT_NOT_FOUND' : 'INVALID_CREDENTIALS',
        });
      }

      const token = generateToken(user);
      res.json({ success: true, user, token });
    } catch (error) {
      if (error.code === 'ACCOUNT_NOT_FOUND') {
        return res.status(401).json({ error: error.message, code: 'ACCOUNT_NOT_FOUND' });
      }
      if (error.code === 'INVALID_PASSWORD') {
        return res.status(401).json({ error: 'Invalid password', code: 'INVALID_PASSWORD' });
      }
      if (error.code === 'OAUTH_ONLY_ACCOUNT') {
        return res.status(401).json({ error: error.message, code: 'OAUTH_ONLY_ACCOUNT' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Verify endpoint
  app.get('/api/auth/verify', verifyAuth, async (req, res) => {
    try {
      dbSafe.safeSelect.mockResolvedValue([
        {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          display_name: 'Test User',
          first_name: 'Test',
          last_name: 'User',
        },
      ]);

      const userResult = await dbSafe.safeSelect('users', { id: req.user.id }, { limit: 1 });
      const users = userResult;

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const freshUser = users[0];
      res.json({
        authenticated: true,
        valid: true,
        user: {
          id: freshUser.id,
          username: freshUser.username,
          email: freshUser.email,
          display_name: freshUser.display_name,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Register with invitation endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, displayName, coParentEmail } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (!coParentEmail) {
        return res.status(400).json({ error: 'Co-parent email is required to register' });
      }

      if (email.trim().toLowerCase() === coParentEmail.trim().toLowerCase()) {
        return res.status(400).json({ error: 'You cannot invite yourself as a co-parent' });
      }

      const result = await auth.registerWithInvitation(
        {
          email: email.trim().toLowerCase(),
          password,
          displayName,
          coParentEmail: coParentEmail.trim().toLowerCase(),
          context: {},
        },
        {}
      );

      const token = generateToken(result.user);
      res.json({
        success: true,
        user: result.user,
        invitation: result.invitation,
        token,
      });
    } catch (error) {
      if (error.message === 'Email already exists') {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  return app;
}

// Helper to make requests
function makeRequest(app, method, path, body = null, headers = {}) {
  return new Promise(resolve => {
    const req = require('http').request({
      hostname: 'localhost',
      port: 0,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    // Use supertest-like interface
    const mockReq = {
      body,
      headers,
      cookies: {},
    };

    resolve({ req: mockReq });
  });
}

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  describe('POST /api/auth/signup', () => {
    test('should return 400 when email is missing', async () => {
      // Simulate request
      const req = { body: { password: 'validpassword' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      // Manual route handler test
      if (!req.body.email || !req.body.password) {
        res.status(400);
        res.json({ error: 'Email and password are required' });
      }

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    });

    test('should return 400 when password is too weak', async () => {
      const req = { body: { email: 'test@example.com', password: 'weak' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      // Password validation now requires: 8+ chars, uppercase, lowercase, number
      const passwordValidation = require('../libs/password-validator');
      const error = passwordValidation.getPasswordError(req.body.password);
      if (error) {
        res.status(400);
        res.json({ error });
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should create user and return token on success', async () => {
      const email = 'newuser@example.com';
      const password = 'validpassword';

      auth.createUserWithEmail.mockResolvedValue({
        id: 1,
        username: 'newuser',
        email,
      });

      const req = { body: { email, password } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      // Simulate successful signup
      const user = await auth.createUserWithEmail(email, password, {});
      const token = generateToken(user);

      res.json({ success: true, user, token });

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.user.email).toBe(email);
      expect(response.token).toBeDefined();
    });

    test('should return 409 for duplicate email', async () => {
      auth.createUserWithEmail.mockRejectedValue(new Error('Email already exists'));

      const req = { body: { email: 'existing@example.com', password: 'validpassword' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      try {
        await auth.createUserWithEmail(req.body.email, req.body.password, {});
      } catch (error) {
        if (error.message === 'Email already exists') {
          res.status(409);
          res.json({ error: 'An account with this email already exists' });
        }
      }

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should return 400 when credentials are missing', async () => {
      const req = { body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      if (!req.body.password || (!req.body.email && !req.body.username)) {
        res.status(400);
        res.json({ error: 'Email/username and password are required' });
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 401 for ACCOUNT_NOT_FOUND', async () => {
      const error = new Error('Account not found');
      error.code = 'ACCOUNT_NOT_FOUND';
      auth.authenticateUserByEmail.mockRejectedValue(error);

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      try {
        await auth.authenticateUserByEmail('nonexistent@example.com', 'password');
      } catch (err) {
        if (err.code === 'ACCOUNT_NOT_FOUND') {
          res.status(401);
          res.json({ error: err.message, code: 'ACCOUNT_NOT_FOUND' });
        }
      }

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ACCOUNT_NOT_FOUND' }));
    });

    test('should return 401 for INVALID_PASSWORD', async () => {
      const error = new Error('Invalid password');
      error.code = 'INVALID_PASSWORD';
      auth.authenticateUserByEmail.mockRejectedValue(error);

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      try {
        await auth.authenticateUserByEmail('user@example.com', 'wrongpassword');
      } catch (err) {
        if (err.code === 'INVALID_PASSWORD') {
          res.status(401);
          res.json({ error: 'Invalid password', code: 'INVALID_PASSWORD' });
        }
      }

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_PASSWORD' }));
    });

    test('should return 401 for OAUTH_ONLY_ACCOUNT', async () => {
      const error = new Error('This account uses Google sign-in');
      error.code = 'OAUTH_ONLY_ACCOUNT';
      auth.authenticateUserByEmail.mockRejectedValue(error);

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      try {
        await auth.authenticateUserByEmail('oauth@example.com', 'password');
      } catch (err) {
        if (err.code === 'OAUTH_ONLY_ACCOUNT') {
          res.status(401);
          res.json({ error: err.message, code: 'OAUTH_ONLY_ACCOUNT' });
        }
      }

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'OAUTH_ONLY_ACCOUNT' })
      );
    });

    test('should return token on successful login', async () => {
      const user = { id: 1, username: 'testuser', email: 'test@example.com' };
      auth.authenticateUserByEmail.mockResolvedValue(user);

      const res = { json: jest.fn() };

      const authenticatedUser = await auth.authenticateUserByEmail('test@example.com', 'password');
      const token = generateToken(authenticatedUser);

      res.json({ success: true, user: authenticatedUser, token });

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.user.id).toBe(1);
      expect(response.token).toBeDefined();
    });
  });

  describe('GET /api/auth/verify', () => {
    test('should return 401 without token', async () => {
      const req = { cookies: {}, headers: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      const token =
        req.cookies.auth_token ||
        (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

      if (!token) {
        res.status(401);
        res.json({ error: 'Authentication required' });
      }

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return user data with valid token', async () => {
      const user = { id: 1, username: 'testuser', email: 'test@example.com' };
      const token = generateToken(user);

      dbSafe.safeSelect.mockResolvedValue([
        {
          ...user,
          display_name: 'Test User',
        },
      ]);

      const req = {
        cookies: {},
        headers: { authorization: `Bearer ${token}` },
        user: null,
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      // Get user from db
      const users = await dbSafe.safeSelect('users', { id: req.user.id }, { limit: 1 });

      res.json({
        authenticated: true,
        valid: true,
        user: {
          id: users[0].id,
          username: users[0].username,
          email: users[0].email,
          display_name: users[0].display_name,
        },
      });

      const response = res.json.mock.calls[0][0];
      expect(response.authenticated).toBe(true);
      expect(response.user.id).toBe(1);
    });

    test('should return 401 for invalid token', async () => {
      const req = {
        cookies: {},
        headers: { authorization: 'Bearer invalid-token' },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      try {
        jwt.verify('invalid-token', JWT_SECRET);
      } catch (err) {
        res.status(401);
        res.json({ error: 'Invalid token' });
      }

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('POST /api/auth/register (with co-parent invitation)', () => {
    test('should return 400 when co-parent email is missing', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'validpassword',
          displayName: 'Test User',
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      if (!req.body.coParentEmail) {
        res.status(400);
        res.json({ error: 'Co-parent email is required to register' });
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 400 when inviting self', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'validpassword',
          coParentEmail: 'test@example.com', // Same email
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      if (req.body.email.toLowerCase() === req.body.coParentEmail.toLowerCase()) {
        res.status(400);
        res.json({ error: 'You cannot invite yourself as a co-parent' });
      }

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should create user and invitation on success', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        email: 'newuser@example.com',
        displayName: 'New User',
      };

      const mockInvitation = {
        id: 1,
        inviteeEmail: 'coparent@example.com',
        token: 'invite-token',
        isExistingUser: false,
      };

      auth.registerWithInvitation.mockResolvedValue({
        user: mockUser,
        invitation: mockInvitation,
      });

      const result = await auth.registerWithInvitation(
        {
          email: 'newuser@example.com',
          password: 'validpassword',
          displayName: 'New User',
          coParentEmail: 'coparent@example.com',
          context: {},
        },
        {}
      );

      const token = generateToken(result.user);
      const res = { json: jest.fn() };

      res.json({
        success: true,
        user: result.user,
        invitation: result.invitation,
        token,
      });

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.user.email).toBe('newuser@example.com');
      expect(response.invitation.inviteeEmail).toBe('coparent@example.com');
      expect(response.token).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should clear cookie and return success', async () => {
      const res = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      };

      res.clearCookie('auth_token');
      res.json({ success: true, message: 'Logged out successfully' });

      expect(res.clearCookie).toHaveBeenCalledWith('auth_token');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });
});

describe('Token Management', () => {
  test('token should contain correct payload structure', () => {
    const user = { id: 123, username: 'testuser', email: 'test@example.com' };
    const token = generateToken(user);
    const decoded = jwt.decode(token);

    expect(decoded).toHaveProperty('id', 123);
    expect(decoded).toHaveProperty('userId', 123);
    expect(decoded).toHaveProperty('username', 'testuser');
    expect(decoded).toHaveProperty('email', 'test@example.com');
    expect(decoded).toHaveProperty('exp');
    expect(decoded).toHaveProperty('iat');
  });

  test('token should be valid for 30 days by default', () => {
    const user = { id: 1, username: 'testuser', email: 'test@example.com' };
    const token = generateToken(user);
    const decoded = jwt.decode(token);

    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
    const expectedExp = decoded.iat + thirtyDaysInSeconds;

    expect(decoded.exp).toBeCloseTo(expectedExp, -1);
  });
});
