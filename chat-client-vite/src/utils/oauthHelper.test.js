/**
 * oauthHelper.js Unit Tests
 *
 * Tests OAuth utility functions including:
 * - State parameter generation and validation
 * - OAuth error parsing
 * - Session storage management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateOAuthState,
  storeOAuthState,
  validateOAuthState,
  clearOAuthState,
  parseOAuthError,
} from './oauthHelper.js';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _getStore: () => store,
  };
})();

// Mock crypto.getRandomValues
const mockCrypto = {
  getRandomValues: vi.fn(array => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 4294967296);
    }
    return array;
  }),
};

describe('OAuth Helper', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', mockSessionStorage);
    vi.stubGlobal('crypto', mockCrypto);
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('generateOAuthState', () => {
    it('should generate a non-empty state string', () => {
      const state = generateOAuthState();

      expect(state).toBeTruthy();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should generate different states on each call', () => {
      const state1 = generateOAuthState();
      const state2 = generateOAuthState();

      // Very high probability they're different (random)
      expect(state1).not.toBe(state2);
    });

    it('should use crypto.getRandomValues', () => {
      generateOAuthState();
      expect(mockCrypto.getRandomValues).toHaveBeenCalled();
    });
  });

  describe('storeOAuthState', () => {
    it('should store state in sessionStorage', () => {
      const state = 'test-state-123';

      storeOAuthState(state);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('oauth_state', state);
    });

    it('should store timestamp in sessionStorage', () => {
      const state = 'test-state-123';
      const beforeTime = Date.now();

      storeOAuthState(state);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'oauth_state_timestamp',
        expect.any(String)
      );

      const storedTimestamp = parseInt(mockSessionStorage._getStore()['oauth_state_timestamp'], 10);
      expect(storedTimestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(storedTimestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('validateOAuthState', () => {
    it('should return true for valid state within time limit', () => {
      const state = 'valid-state';
      mockSessionStorage._getStore()['oauth_state'] = state;
      mockSessionStorage._getStore()['oauth_state_timestamp'] = Date.now().toString();

      const result = validateOAuthState(state);

      expect(result).toBe(true);
    });

    it('should return false when no stored state exists', () => {
      const result = validateOAuthState('any-state');
      expect(result).toBe(false);
    });

    it('should return false when stored state is missing', () => {
      mockSessionStorage._getStore()['oauth_state_timestamp'] = Date.now().toString();

      const result = validateOAuthState('any-state');

      expect(result).toBe(false);
    });

    it('should return false when timestamp is missing', () => {
      mockSessionStorage._getStore()['oauth_state'] = 'stored-state';

      const result = validateOAuthState('stored-state');

      expect(result).toBe(false);
    });

    it('should return false when state has expired (> 10 minutes)', () => {
      const state = 'expired-state';
      mockSessionStorage._getStore()['oauth_state'] = state;
      // Set timestamp to 11 minutes ago
      const expiredTime = Date.now() - 11 * 60 * 1000;
      mockSessionStorage._getStore()['oauth_state_timestamp'] = expiredTime.toString();

      const result = validateOAuthState(state);

      expect(result).toBe(false);
    });

    it('should return true when state is exactly at 10 minute limit', () => {
      const state = 'edge-state';
      mockSessionStorage._getStore()['oauth_state'] = state;
      // Set timestamp to exactly 10 minutes ago minus 1ms
      const edgeTime = Date.now() - (10 * 60 * 1000 - 1);
      mockSessionStorage._getStore()['oauth_state_timestamp'] = edgeTime.toString();

      const result = validateOAuthState(state);

      expect(result).toBe(true);
    });

    it('should return false when states do not match', () => {
      mockSessionStorage._getStore()['oauth_state'] = 'stored-state';
      mockSessionStorage._getStore()['oauth_state_timestamp'] = Date.now().toString();

      const result = validateOAuthState('different-state');

      expect(result).toBe(false);
    });

    it('should clear state on expiration', () => {
      const state = 'expired-state';
      mockSessionStorage._getStore()['oauth_state'] = state;
      mockSessionStorage._getStore()['oauth_state_timestamp'] = (
        Date.now() -
        11 * 60 * 1000
      ).toString();

      validateOAuthState(state);

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('oauth_state');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('oauth_state_timestamp');
    });

    it('should clear state on mismatch', () => {
      mockSessionStorage._getStore()['oauth_state'] = 'stored-state';
      mockSessionStorage._getStore()['oauth_state_timestamp'] = Date.now().toString();

      validateOAuthState('different-state');

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('oauth_state');
    });
  });

  describe('clearOAuthState', () => {
    it('should remove oauth_state from sessionStorage', () => {
      clearOAuthState();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('oauth_state');
    });

    it('should remove oauth_state_timestamp from sessionStorage', () => {
      clearOAuthState();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('oauth_state_timestamp');
    });
  });

  describe('parseOAuthError', () => {
    describe('known errors', () => {
      it('should parse access_denied error', () => {
        const result = parseOAuthError('access_denied', 'User denied access');

        expect(result.code).toBe('access_denied');
        expect(result.userMessage).toContain('cancelled');
        expect(result.retryable).toBe(true);
        expect(result.action).toBe('try_again');
      });

      it('should parse server_error', () => {
        const result = parseOAuthError('server_error', 'Internal error');

        expect(result.code).toBe('server_error');
        expect(result.userMessage).toContain('temporarily unavailable');
        expect(result.retryable).toBe(true);
      });

      it('should parse invalid_request error', () => {
        const result = parseOAuthError('invalid_request', 'Bad request');

        expect(result.code).toBe('invalid_request');
        expect(result.retryable).toBe(true);
      });

      it('should parse invalid_client error', () => {
        const result = parseOAuthError('invalid_client', 'Client not found');

        expect(result.code).toBe('invalid_client');
        expect(result.userMessage).toContain('configuration error');
        expect(result.action).toBe('contact_support');
        expect(result.retryable).toBe(false);
      });

      it('should parse invalid_grant error', () => {
        const result = parseOAuthError('invalid_grant', 'Grant expired');

        expect(result.code).toBe('invalid_grant');
        expect(result.userMessage).toContain('expired');
        expect(result.retryable).toBe(true);
      });

      it('should parse unauthorized_client error', () => {
        const result = parseOAuthError('unauthorized_client', 'Not authorized');

        expect(result.code).toBe('unauthorized_client');
        expect(result.retryable).toBe(false);
        expect(result.action).toBe('contact_support');
      });

      it('should parse unsupported_response_type error', () => {
        const result = parseOAuthError('unsupported_response_type', 'Not supported');

        expect(result.code).toBe('unsupported_response_type');
        expect(result.retryable).toBe(false);
      });

      it('should parse invalid_scope error', () => {
        const result = parseOAuthError('invalid_scope', 'Scope not allowed');

        expect(result.code).toBe('invalid_scope');
        expect(result.retryable).toBe(false);
      });
    });

    describe('unknown errors', () => {
      it('should handle unknown error codes', () => {
        const result = parseOAuthError('some_new_error', 'Description');

        expect(result.code).toBe('some_new_error');
        expect(result.description).toBe('Description');
        expect(result.retryable).toBe(true);
        expect(result.action).toBe('retry');
      });

      it('should use error description for unknown errors', () => {
        const result = parseOAuthError('unknown', 'Custom error description');

        expect(result.userMessage).toContain('Custom error description');
      });

      it('should handle null error code', () => {
        const result = parseOAuthError(null, 'Some description');

        expect(result.message).toBe('Unknown OAuth error');
        expect(result.retryable).toBe(true);
      });

      it('should handle undefined error code', () => {
        const result = parseOAuthError(undefined, undefined);

        expect(result.userMessage).toContain('error occurred');
        expect(result.retryable).toBe(true);
      });

      it('should handle empty strings', () => {
        const result = parseOAuthError('', '');

        expect(result.message).toBe('Unknown OAuth error');
      });
    });

    describe('result structure', () => {
      it('should always include code field', () => {
        const result = parseOAuthError('access_denied', 'desc');
        expect(result.code).toBe('access_denied');
      });

      it('should always include description field', () => {
        const result = parseOAuthError('access_denied', 'User cancelled');
        expect(result.description).toBe('User cancelled');
      });

      it('should always include message field', () => {
        const result = parseOAuthError('access_denied', 'desc');
        expect(result.message).toBeDefined();
        expect(typeof result.message).toBe('string');
      });

      it('should always include userMessage field', () => {
        const result = parseOAuthError('access_denied', 'desc');
        expect(result.userMessage).toBeDefined();
        expect(typeof result.userMessage).toBe('string');
      });

      it('should always include action field', () => {
        const result = parseOAuthError('access_denied', 'desc');
        expect(result.action).toBeDefined();
      });

      it('should always include retryable field', () => {
        const result = parseOAuthError('access_denied', 'desc');
        expect(typeof result.retryable).toBe('boolean');
      });
    });

    describe('user-friendly messages', () => {
      it('should provide actionable message for access_denied', () => {
        const result = parseOAuthError('access_denied', '');
        expect(result.userMessage).toContain('try again');
      });

      it('should suggest email/password alternative for server errors', () => {
        const result = parseOAuthError('server_error', '');
        expect(result.userMessage).toContain('email/password');
      });

      it('should direct to support for configuration errors', () => {
        const result = parseOAuthError('invalid_client', '');
        expect(result.userMessage).toContain('contact support');
      });
    });
  });
});
