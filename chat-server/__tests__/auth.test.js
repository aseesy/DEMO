/**
 * Authentication Tests
 *
 * Critical tests for user registration, login, and session sync.
 * These tests ensure the core auth functionality works reliably.
 */

const jwt = require('jsonwebtoken');

// Mock modules before requiring auth
jest.mock('../dbSafe', () => ({
  safeSelect: jest.fn(),
  safeInsert: jest.fn(),
  safeUpdate: jest.fn(),
  parseResult: jest.fn(result => result),
  withTransaction: jest.fn(),
}));

jest.mock('../dbPostgres', () => ({
  query: jest.fn(),
}));

jest.mock('../roomManager', () => ({
  createPrivateRoom: jest.fn().mockResolvedValue({ roomId: 'test-room-123' }),
  getUserRoom: jest.fn().mockResolvedValue({ roomId: 'test-room-123' }),
  addUserToRoom: jest.fn().mockResolvedValue(true),
  getRoom: jest.fn().mockResolvedValue({ roomId: 'test-room-123', name: 'Test Room' }),
  createCoParentRoom: jest.fn().mockResolvedValue({ roomId: 'coparent-room-123' }),
}));

jest.mock('../libs/invitation-manager', () => ({
  createInvitation: jest.fn().mockResolvedValue({
    invitation: { id: 1, expires_at: new Date(Date.now() + 86400000).toISOString() },
    token: 'test-invite-token',
    isExistingUser: false,
  }),
  validateToken: jest
    .fn()
    .mockResolvedValue({
      valid: true,
      invitation: { id: 1, invitee_email: 'test@example.com', inviter_id: 1 },
      inviterName: 'Test User',
      inviterEmail: 'inviter@example.com',
    }),
  acceptInvitation: jest.fn().mockResolvedValue({ invitation: { id: 1 }, inviterId: 1 }),
}));

jest.mock('../libs/pairing-manager', () => ({
  validateToken: jest.fn().mockResolvedValue({ valid: false }),
}));

jest.mock('../libs/notification-manager', () => ({
  createInvitationNotification: jest.fn().mockResolvedValue(true),
  createInvitationAcceptedNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/utils/neo4jClient', () => ({
  createUserNode: jest.fn().mockResolvedValue(true),
  createCoParentRelationship: jest.fn().mockResolvedValue(true),
}));

const dbSafe = require('../dbSafe');
const auth = require('../auth');
const { generateToken, authenticate, optionalAuth } = require('../middleware/auth');

// Get JWT_SECRET from environment (set in jest.setup.js)
const JWT_SECRET = process.env.JWT_SECRET;

describe('Authentication Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Password Hashing', () => {
    test('hashPassword should hash password securely', async () => {
      const password = 'testPassword123';
      const hash = await auth.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash prefix
    });

    test('hashPassword should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await auth.hashPassword(password);
      const hash2 = await auth.hashPassword(password);

      expect(hash1).not.toBe(hash2); // Salt should differ
    });

    test('hashPassword should reject empty password', async () => {
      await expect(auth.hashPassword('')).rejects.toThrow('Password must be a non-empty string');
    });

    test('hashPassword should reject null password', async () => {
      await expect(auth.hashPassword(null)).rejects.toThrow('Password must be a non-empty string');
    });

    test('comparePassword should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await auth.hashPassword(password);

      const isValid = await auth.comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    test('comparePassword should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await auth.hashPassword(password);

      const isValid = await auth.comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    test('comparePassword should handle null/undefined inputs', async () => {
      const isValid1 = await auth.comparePassword(null, 'hash');
      const isValid2 = await auth.comparePassword('password', null);

      expect(isValid1).toBe(false);
      expect(isValid2).toBe(false);
    });
  });

  describe('User Creation (createUserWithEmail)', () => {
    test('should create user with valid email and password', async () => {
      const email = 'newuser@example.com';
      const password = 'securePassword123';

      // Mock no existing user
      dbSafe.safeSelect.mockResolvedValue([]);
      dbSafe.safeInsert.mockResolvedValue(1);

      const user = await auth.createUserWithEmail(email, password, {});

      expect(user).toBeDefined();
      expect(user.id).toBe(1);
      expect(user.email).toBe(email.toLowerCase());
      expect(user.username).toBeDefined();
      expect(dbSafe.safeInsert).toHaveBeenCalled();
    });

    test('should reject duplicate email', async () => {
      const email = 'existing@example.com';
      const password = 'securePassword123';

      // Mock existing user
      dbSafe.safeSelect.mockResolvedValue([{ id: 1, email }]);

      await expect(auth.createUserWithEmail(email, password, {})).rejects.toThrow(
        'Email already exists'
      );
    });

    test('should generate username from email', async () => {
      const email = 'john.doe@example.com';
      const password = 'securePassword123';

      dbSafe.safeSelect.mockResolvedValue([]);
      dbSafe.safeInsert.mockResolvedValue(1);

      const user = await auth.createUserWithEmail(email, password, {});

      // Username should be derived from email (johndoe or similar)
      expect(user.username).toBeDefined();
      expect(user.username.length).toBeGreaterThan(0);
    });

    test('should handle username conflicts with suffix', async () => {
      const email = 'test@example.com';
      const password = 'securePassword123';

      dbSafe.safeSelect.mockResolvedValue([]);

      // First insert fails with unique constraint, second succeeds
      dbSafe.safeInsert
        .mockRejectedValueOnce({ code: '23505', constraint: 'users_username_key' })
        .mockResolvedValueOnce(1);

      const user = await auth.createUserWithEmail(email, password, {});

      expect(user).toBeDefined();
      expect(user.id).toBe(1);
    });
  });

  describe('User Authentication (authenticateUserByEmail)', () => {
    test('should authenticate valid user', async () => {
      const email = 'valid@example.com';
      const password = 'correctpassword';
      const hashedPassword = await auth.hashPassword(password);

      dbSafe.safeSelect
        .mockResolvedValueOnce([
          {
            id: 1,
            username: 'validuser',
            email,
            password_hash: hashedPassword,
          },
        ])
        .mockResolvedValueOnce([]); // user_context query

      dbSafe.safeUpdate.mockResolvedValue(true);

      const user = await auth.authenticateUserByEmail(email, password);

      expect(user).toBeDefined();
      expect(user.id).toBe(1);
      expect(user.email).toBe(email);
    });

    test('should throw ACCOUNT_NOT_FOUND for non-existent email', async () => {
      dbSafe.safeSelect.mockResolvedValue([]);

      try {
        await auth.authenticateUserByEmail('nonexistent@example.com', 'password');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.code).toBe('ACCOUNT_NOT_FOUND');
        expect(error.message).toBe('Account not found');
      }
    });

    test('should throw OAUTH_ONLY_ACCOUNT for OAuth users', async () => {
      dbSafe.safeSelect.mockResolvedValue([
        {
          id: 1,
          username: 'oauthuser',
          email: 'oauth@example.com',
          password_hash: null,
          google_id: 'google-123',
        },
      ]);

      try {
        await auth.authenticateUserByEmail('oauth@example.com', 'password');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.code).toBe('OAUTH_ONLY_ACCOUNT');
      }
    });

    test('should throw INVALID_PASSWORD for wrong password', async () => {
      const email = 'user@example.com';
      const correctPassword = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hashedPassword = await auth.hashPassword(correctPassword);

      dbSafe.safeSelect.mockResolvedValue([
        {
          id: 1,
          username: 'testuser',
          email,
          password_hash: hashedPassword,
        },
      ]);

      try {
        await auth.authenticateUserByEmail(email, wrongPassword);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.code).toBe('INVALID_PASSWORD');
      }
    });
  });

  describe('JWT Token Generation and Verification', () => {
    test('generateToken should create valid JWT', () => {
      const user = { id: 1, username: 'testuser', email: 'test@example.com' };
      const token = generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token structure
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });

    test('generateToken should include user data in payload', () => {
      const user = { id: 123, username: 'testuser', email: 'test@example.com' };
      const token = generateToken(user);

      const decoded = jwt.verify(token, JWT_SECRET);

      expect(decoded.id).toBe(123);
      expect(decoded.userId).toBe(123);
      expect(decoded.username).toBe('testuser');
      expect(decoded.email).toBe('test@example.com');
    });

    test('generateToken should set expiration', () => {
      const user = { id: 1, username: 'testuser', email: 'test@example.com' };
      const token = generateToken(user, '1h');

      const decoded = jwt.verify(token, JWT_SECRET);

      expect(decoded.exp).toBeDefined();
      // Token should expire approximately 1 hour from now
      const oneHourFromNow = Math.floor(Date.now() / 1000) + 3600;
      expect(decoded.exp).toBeCloseTo(oneHourFromNow, -1);
    });
  });

  describe('Authentication Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        cookies: {},
        headers: {},
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
    });

    test('authenticate should reject request without token', () => {
      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('authenticate should accept valid token from Authorization header', () => {
      const user = { id: 1, username: 'testuser', email: 'test@example.com' };
      const token = generateToken(user);
      mockReq.headers.authorization = `Bearer ${token}`;

      authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(1);
    });

    test('authenticate should accept valid token from cookie', () => {
      const user = { id: 1, username: 'testuser', email: 'test@example.com' };
      const token = generateToken(user);
      mockReq.cookies.auth_token = token;

      authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });

    test('authenticate should reject invalid token', () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    test('authenticate should reject expired token', () => {
      const user = { id: 1, username: 'testuser', email: 'test@example.com' };
      // Create expired token
      const token = jwt.sign(
        { ...user, exp: Math.floor(Date.now() / 1000) - 3600 }, // 1 hour ago
        JWT_SECRET
      );
      mockReq.headers.authorization = `Bearer ${token}`;

      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      // Note: The middleware returns 'Invalid token' for all JWT errors including expiration
      // This is acceptable behavior as it doesn't leak information about token validity
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/Token expired|Invalid token/),
        })
      );
    });

    test('optionalAuth should allow request without token', () => {
      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    test('optionalAuth should set user with valid token', () => {
      const user = { id: 1, username: 'testuser', email: 'test@example.com' };
      const token = generateToken(user);
      mockReq.headers.authorization = `Bearer ${token}`;

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(1);
    });

    test('optionalAuth should continue without error for invalid token', () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });
  });

  describe('Registration Error Codes', () => {
    test('RegistrationError codes should be defined', () => {
      expect(auth.RegistrationError.EMAIL_EXISTS.code).toBe('REG_001');
      expect(auth.RegistrationError.INVALID_TOKEN.code).toBe('REG_002');
      expect(auth.RegistrationError.EXPIRED.code).toBe('REG_003');
      expect(auth.RegistrationError.ALREADY_ACCEPTED.code).toBe('REG_004');
      expect(auth.RegistrationError.ROOM_FAILED.code).toBe('REG_005');
    });

    test('createRegistrationError should create error with code', () => {
      const error = auth.createRegistrationError(
        auth.RegistrationError.EMAIL_EXISTS,
        'test@example.com'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('REG_001');
      expect(error.details).toBe('test@example.com');
    });
  });

  describe('User Existence Check', () => {
    test('userExists should return true for existing user', async () => {
      dbSafe.safeSelect.mockResolvedValue([{ id: 1, username: 'existinguser' }]);

      const exists = await auth.userExists('existinguser');

      expect(exists).toBe(true);
    });

    test('userExists should return false for non-existing user', async () => {
      dbSafe.safeSelect.mockResolvedValue([]);

      const exists = await auth.userExists('nonexistentuser');

      expect(exists).toBe(false);
    });

    test('userExists should be case-insensitive', async () => {
      dbSafe.safeSelect.mockResolvedValue([{ id: 1, username: 'testuser' }]);

      await auth.userExists('TESTUSER');

      expect(dbSafe.safeSelect).toHaveBeenCalledWith(
        'users',
        { username: 'testuser' },
        { limit: 1 }
      );
    });
  });

  describe('Display Name Disambiguation', () => {
    test('getDisambiguatedDisplay should return display name when no duplicate', () => {
      const user = { id: 1, display_name: 'John', email: 'john@example.com' };
      const otherUsers = [{ id: 2, display_name: 'Jane', email: 'jane@example.com' }];

      const display = auth.getDisambiguatedDisplay(user, otherUsers);

      expect(display).toBe('John');
    });

    test('getDisambiguatedDisplay should add email domain for duplicates', () => {
      const user = { id: 1, display_name: 'John', email: 'john@gmail.com' };
      const otherUsers = [{ id: 2, display_name: 'John', email: 'john@yahoo.com' }];

      const display = auth.getDisambiguatedDisplay(user, otherUsers);

      expect(display).toBe('John (gmail)');
    });

    test('disambiguateContacts should add email domain to duplicate names', () => {
      const contacts = [
        { id: 1, contact_name: 'John', contact_email: 'john@gmail.com' },
        { id: 2, contact_name: 'John', contact_email: 'john@yahoo.com' },
        { id: 3, contact_name: 'Jane', contact_email: 'jane@example.com' },
      ];

      const result = auth.disambiguateContacts(contacts);

      expect(result[0].displayName).toBe('John (gmail)');
      expect(result[1].displayName).toBe('John (yahoo)');
      expect(result[2].displayName).toBe('Jane');
    });
  });
});

describe('Registration with Invitation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registerWithInvitation should reject when inviting self', async () => {
    const params = {
      email: 'test@example.com',
      password: 'validpassword',
      displayName: 'Test User',
      coParentEmail: 'test@example.com', // Same email
    };

    await expect(auth.registerWithInvitation(params, {})).rejects.toThrow(
      'You cannot invite yourself as a co-parent'
    );
  });

  test('registerWithInvitation should require co-parent email', async () => {
    const params = {
      email: 'test@example.com',
      password: 'validpassword',
      displayName: 'Test User',
      coParentEmail: null,
    };

    await expect(auth.registerWithInvitation(params, {})).rejects.toThrow(
      'Co-parent email is required'
    );
  });

  test('registerWithInvitation should require database connection', async () => {
    const params = {
      email: 'test@example.com',
      password: 'validpassword',
      displayName: 'Test User',
      coParentEmail: 'coparent@example.com',
    };

    await expect(auth.registerWithInvitation(params, null)).rejects.toThrow(
      'Database connection is required'
    );
  });
});

describe('Session Verification Integration', () => {
  test('getUser should return user with context and room', async () => {
    const username = 'testuser';

    dbSafe.safeSelect
      .mockResolvedValueOnce([
        {
          id: 1,
          username,
          email: 'test@example.com',
          display_name: 'Test User',
        },
      ])
      .mockResolvedValueOnce([
        {
          user_id: username,
          co_parent: 'Co-Parent Name',
          children: '[]',
          contacts: '[]',
        },
      ]);

    const user = await auth.getUser(username);

    expect(user).toBeDefined();
    expect(user.id).toBe(1);
    expect(user.username).toBe(username);
    expect(user.context).toBeDefined();
    expect(user.context.coParentName).toBe('Co-Parent Name');
  });

  test('getUser should return null for non-existent user', async () => {
    dbSafe.safeSelect.mockResolvedValue([]);

    const user = await auth.getUser('nonexistent');

    expect(user).toBeNull();
  });
});
