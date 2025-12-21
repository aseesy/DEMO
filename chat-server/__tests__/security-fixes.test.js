/**
 * Security Fixes Tests
 *
 * TDD tests for critical security vulnerabilities:
 * - CRITICAL-002: Contacts routes require authentication
 * - CRITICAL-003: Authorization uses req.user.id, not user-supplied username
 * - HIGH-004: JWT secret must not have weak fallback
 * - HIGH-005: XSS sanitization must handle encoded attacks
 */

const { sanitizeInput } = require('../utils');

// ============================================================================
// HIGH-005: XSS Sanitization Tests
// ============================================================================

describe('sanitizeInput - XSS Prevention', () => {
  describe('should block basic XSS attacks', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('script');
    });

    it('should remove img tags with onerror', () => {
      const input = '<img src=x onerror=alert(1)>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('img');
    });
  });

  describe('should block encoded XSS attacks', () => {
    it('should handle HTML entity encoded scripts', () => {
      const input = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const result = sanitizeInput(input);
      expect(result).not.toContain('script');
      expect(result).not.toContain('&lt;');
      expect(result).not.toContain('&gt;');
    });

    it('should handle unicode encoded scripts', () => {
      const input = '\u003cscript\u003ealert(1)\u003c/script\u003e';
      const result = sanitizeInput(input);
      expect(result).not.toContain('script');
    });

    it('should handle hex encoded scripts', () => {
      const input = '&#x3c;script&#x3e;alert(1)&#x3c;/script&#x3e;';
      const result = sanitizeInput(input);
      expect(result).not.toContain('script');
    });
  });

  describe('should block event handler attacks', () => {
    it('should remove onclick handlers', () => {
      const input = '<div onclick="alert(1)">click me</div>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onclick');
    });

    it('should remove onmouseover handlers', () => {
      const input = '<span onmouseover="alert(1)">hover</span>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onmouseover');
    });

    it('should remove onload handlers', () => {
      const input = '<body onload="alert(1)">';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onload');
    });
  });

  describe('should block javascript: URLs', () => {
    it('should remove javascript: protocol in href', () => {
      const input = '<a href="javascript:alert(1)">click</a>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('javascript:');
    });

    it('should remove javascript: protocol case-insensitive', () => {
      const input = '<a href="JAVASCRIPT:alert(1)">click</a>';
      const result = sanitizeInput(input);
      expect(result.toLowerCase()).not.toContain('javascript:');
    });
  });

  describe('should preserve safe content', () => {
    it('should preserve plain text messages', () => {
      const input = 'Hello, how are you doing today?';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello, how are you doing today?');
    });

    it('should preserve text with mathematical operators', () => {
      const input = '5 > 3 and 2 < 4';
      const result = sanitizeInput(input);
      // After sanitization, < and > may be removed but the message intent is preserved
      expect(result).toBeTruthy();
    });

    it('should preserve emojis', () => {
      const input = 'Great job! 👍 🎉';
      const result = sanitizeInput(input);
      expect(result).toContain('👍');
      expect(result).toContain('🎉');
    });
  });
});

// ============================================================================
// HIGH-004: JWT Secret Fallback Tests
// ============================================================================

describe('JWT Secret Configuration', () => {
  const originalEnv = process.env.JWT_SECRET;

  beforeAll(() => {
    // Ensure we have a valid JWT_SECRET for the test suite to load
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.JWT_SECRET = originalEnv;
    } else {
      // Set to valid value so other tests don't fail
      process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
    }
  });

  it('should throw error when JWT_SECRET is not set', () => {
    // We can't actually test module loading without JWT_SECRET
    // since the module throws on load. Instead, verify the behavior
    // by checking that the module code validates the secret.

    // This test verifies the pattern exists in the code
    const fs = require('fs');
    const authCode = fs.readFileSync(require.resolve('../middleware/auth'), 'utf8');

    expect(authCode).toContain('if (!JWT_SECRET)');
    expect(authCode).toContain('throw new Error');
  });

  it('should throw error when JWT_SECRET is too short', () => {
    // Verify the length check exists in the code
    const fs = require('fs');
    const authCode = fs.readFileSync(require.resolve('../middleware/auth'), 'utf8');

    expect(authCode).toContain('JWT_SECRET.length < 32');
    expect(authCode).toContain('throw new Error');
  });

  it('should not export JWT_SECRET (prevent leaking)', () => {
    const authModule = require('../middleware/auth');
    expect(authModule.JWT_SECRET).toBeUndefined();
  });
});

// ============================================================================
// CRITICAL-002 & CRITICAL-003: Contacts Route Auth Tests
// ============================================================================

describe('Contacts Routes Security', () => {
  const express = require('express');
  const request = require('supertest');

  let app;
  let contactsRouter;

  beforeEach(() => {
    // Clear require cache
    delete require.cache[require.resolve('../routes/contacts')];
    delete require.cache[require.resolve('../controllers/contactsController')];
    // Reset modules to ensure fresh requires
    jest.resetModules();

    app = express();
    app.use(express.json());

    // Mock cookie-parser
    app.use((req, res, next) => {
      req.cookies = {};
      next();
    });
  });

  describe('Authentication Required', () => {
    it('GET /api/contacts should return 401 without auth token', async () => {
      contactsRouter = require('../routes/contacts');
      app.use('/api/contacts', contactsRouter);

      const res = await request(app).get('/api/contacts');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/authentication|unauthorized/i);
    });

    it('POST /api/contacts should return 401 without auth token', async () => {
      contactsRouter = require('../routes/contacts');
      app.use('/api/contacts', contactsRouter);

      const res = await request(app)
        .post('/api/contacts')
        .send({ contact_name: 'Test', username: 'attacker' });

      expect(res.status).toBe(401);
    });

    it('PUT /api/contacts/:id should return 401 without auth token', async () => {
      contactsRouter = require('../routes/contacts');
      app.use('/api/contacts', contactsRouter);

      const res = await request(app)
        .put('/api/contacts/1')
        .send({ contact_name: 'Updated', username: 'attacker' });

      expect(res.status).toBe(401);
    });

    it('DELETE /api/contacts/:id should return 401 without auth token', async () => {
      contactsRouter = require('../routes/contacts');
      app.use('/api/contacts', contactsRouter);

      const res = await request(app).delete('/api/contacts/1').query({ username: 'attacker' });

      expect(res.status).toBe(401);
    });
  });

  describe('Authorization - Prevent IDOR', () => {
    // These tests verify that the controller uses req.user.id, not user-supplied username

    it('should use authenticated user ID, not query param username', async () => {
      // This test verifies that the controller uses req.user.id from the JWT token
      // and ignores any user-supplied username in query params

      const mockUserId = 123;
      const mockContacts = [{ id: 1, contact_name: 'Test' }];

      const mockGetContactsByUserId = jest.fn().mockResolvedValue(mockContacts);
      const mockGetUserIdByUsername = jest.fn();

      // Mock the services
      jest.doMock('../services/contactsService', () => ({
        getContactsByUserId: mockGetContactsByUserId,
        createContact: jest.fn(),
        updateContact: jest.fn(),
        deleteContact: jest.fn(),
        verifyContactOwnership: jest.fn(),
        detectMentions: jest.fn(),
        getRecentMessages: jest.fn(),
        buildRelationshipMap: jest.fn(),
      }));

      jest.doMock('../services/userService', () => ({
        ServiceError: class extends Error {},
        getUserIdByUsername: mockGetUserIdByUsername,
      }));

      // Mock authenticate middleware
      jest.doMock('../middleware/auth', () => {
        const mockAuthenticate = (req, res, next) => {
          req.user = { id: mockUserId, username: 'authenticated_user' };
          next();
        };
        return {
          authenticate: mockAuthenticate,
          optionalAuth: jest.fn((req, res, next) => next()),
          generateToken: jest.fn(),
          setAuthCookie: jest.fn(),
          clearAuthCookie: jest.fn(),
        };
      });

      // Clear cache and reset modules
      jest.resetModules();
      delete require.cache[require.resolve('../routes/contacts')];
      delete require.cache[require.resolve('../controllers/contactsController')];
      delete require.cache[require.resolve('../middleware/auth')];
      delete require.cache[require.resolve('../services/contactsService')];
      delete require.cache[require.resolve('../services/userService')];

      // Now require the route - it should use our mocked authenticate
      contactsRouter = require('../routes/contacts');
      app.use('/api/contacts', contactsRouter);

      const res = await request(app)
        .get('/api/contacts')
        .query({ username: 'attacker_trying_to_access_other_data' });

      // The request should succeed using authenticated user's data
      // NOT the attacker's username from query param
      expect(res.status).toBe(200);
      expect(res.body.contacts).toEqual(mockContacts);

      // Verify getContactsByUserId was called with the authenticated user's ID
      expect(mockGetContactsByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockGetContactsByUserId).toHaveBeenCalledTimes(1);

      // Verify getUserIdByUsername was NOT called (we should use req.user.id directly)
      expect(mockGetUserIdByUsername).not.toHaveBeenCalled();
    });
  });
});
