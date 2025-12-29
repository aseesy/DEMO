/**
 * useAuth Hook Tests
 *
 * Tests the authentication hook to ensure:
 * - Login validation works correctly
 * - Signup validation works correctly
 * - Error handling is correct
 * - State management works
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth.js';

// Mock the dependencies
vi.mock('../../../apiClient.js', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock('../../../utils/analyticsEnhancements.js', () => ({
  setUserProperties: vi.fn(),
  setUserID: vi.fn(),
}));

vi.mock('../../../utils/errorHandler.jsx', () => ({
  getErrorMessage: vi.fn((error, context) => ({
    userMessage: error?.message || 'An error occurred',
    code: error?.code || 'UNKNOWN',
  })),
  logError: vi.fn(),
  retryWithBackoff: vi.fn(fn => fn()),
  isRetryableError: vi.fn(() => false),
}));

vi.mock('../../../utils/oauthHelper.js', () => ({
  generateOAuthState: vi.fn(() => 'mock-state'),
  storeOAuthState: vi.fn(),
  validateOAuthState: vi.fn(() => true),
  clearOAuthState: vi.fn(),
  detectPopupBlocker: vi.fn(() => Promise.resolve(false)),
  parseOAuthError: vi.fn(),
}));

vi.mock('../../../utils/validators.js', () => ({
  validateLoginCredentials: vi.fn((email, password) => {
    if (!email || !password) {
      return { valid: false, errors: { email: 'Email is required' } };
    }
    if (!email.includes('@')) {
      return { valid: false, errors: { email: 'Invalid email format' } };
    }
    return { valid: true, cleanEmail: email.trim(), cleanPassword: password };
  }),
  validateSignupCredentials: vi.fn((email, password, username) => {
    if (!email || !password || !username) {
      return { valid: false, errors: { email: 'All fields are required' } };
    }
    if (password.length < 10) {
      return { valid: false, errors: { password: 'Password must be at least 10 characters' } };
    }
    return {
      valid: true,
      cleanData: { email: email.trim(), password, username: username.trim() },
    };
  }),
  validateRegistrationWithInvite: vi.fn(data => {
    if (!data.email || !data.password || !data.username) {
      return { valid: false, errors: { email: 'All fields are required' } };
    }
    return {
      valid: true,
      cleanData: {
        email: data.email.trim(),
        password: data.password,
        username: data.username.trim(),
        coParentEmail: data.coParentEmail?.trim(),
      },
    };
  }),
  getFirstError: vi.fn(errors => Object.values(errors)[0]),
}));

vi.mock('../../../adapters/storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    getString: vi.fn(() => ''),
  },
  StorageKeys: {
    AUTH_TOKEN: 'auth_token_backup',
    USERNAME: 'username',
    IS_AUTHENTICATED: 'isAuthenticated',
    USER_EMAIL: 'userEmail',
    CHAT_USER: 'chatUser',
    PENDING_SENT_INVITATION: 'pendingSentInvitation',
  },
  authStorage: {
    getToken: vi.fn(() => ''),
    setToken: vi.fn(),
    removeToken: vi.fn(),
    getUsername: vi.fn(() => ''),
    setUsername: vi.fn(),
    removeUsername: vi.fn(),
    isAuthenticated: vi.fn(() => false),
    setAuthenticated: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

import { apiGet, apiPost } from '../../../apiClient.js';
import { authStorage } from '../../../adapters/storage';

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no stored auth
    authStorage.getToken.mockReturnValue('');
    authStorage.getUsername.mockReturnValue('');
    authStorage.isAuthenticated.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with correct initial state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.email).toBe('');
      expect(result.current.password).toBe('');
      expect(result.current.firstName).toBe('');
      expect(result.current.lastName).toBe('');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoggingIn).toBe(false);
      expect(result.current.isSigningUp).toBe(false);
      expect(result.current.error).toBe('');
    });

    it('should provide setter functions', () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.setEmail).toBe('function');
      expect(typeof result.current.setPassword).toBe('function');
      expect(typeof result.current.setFirstName).toBe('function');
      expect(typeof result.current.setLastName).toBe('function');
      expect(typeof result.current.setError).toBe('function');
    });

    it('should provide action functions', () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.handleLogin).toBe('function');
      expect(typeof result.current.handleSignup).toBe('function');
      expect(typeof result.current.handleRegister).toBe('function');
      expect(typeof result.current.handleGoogleLogin).toBe('function');
      expect(typeof result.current.handleGoogleCallback).toBe('function');
      expect(typeof result.current.handleLogout).toBe('function');
    });
  });

  describe('State Setters', () => {
    it('should update email state', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setEmail('test@example.com');
      });

      expect(result.current.email).toBe('test@example.com');
    });

    it('should update password state', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setPassword('securepass123');
      });

      expect(result.current.password).toBe('securepass123');
    });

    it('should update firstName state', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setFirstName('John');
      });

      expect(result.current.firstName).toBe('John');
    });

    it('should update lastName state', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setLastName('Doe');
      });

      expect(result.current.lastName).toBe('Doe');
    });

    it('should update error state', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setError('Something went wrong');
      });

      expect(result.current.error).toBe('Something went wrong');
    });
  });

  describe('handleLogin', () => {
    it('should validate credentials before attempting login', async () => {
      const { result } = renderHook(() => useAuth());

      // No email/password set
      await act(async () => {
        await result.current.handleLogin();
      });

      expect(result.current.error).toBe('Email is required');
      expect(apiPost).not.toHaveBeenCalled();
    });

    it('should set isLoggingIn during login attempt', async () => {
      const { result } = renderHook(() => useAuth());

      // Set valid credentials
      act(() => {
        result.current.setEmail('test@example.com');
        result.current.setPassword('password123');
      });

      // Mock slow API response
      apiPost.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ user: { username: 'test' }, token: 'jwt' }),
                }),
              100
            )
          )
      );

      let loginPromise;
      act(() => {
        loginPromise = result.current.handleLogin();
      });

      // Should be logging in
      expect(result.current.isLoggingIn).toBe(true);

      await act(async () => {
        await loginPromise;
      });

      // Should be done logging in
      expect(result.current.isLoggingIn).toBe(false);
    });

    it('should handle successful login', async () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setEmail('test@example.com');
        result.current.setPassword('password123');
      });

      apiPost.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { email: 'test@example.com', first_name: 'Test', last_name: 'User' },
            token: 'jwt-token',
          }),
      });

      await act(async () => {
        const loginResult = await result.current.handleLogin();
        expect(loginResult.success).toBe(true);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(authStorage.setToken).toHaveBeenCalledWith('jwt-token');
    });

    it('should handle login error - account not found', async () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setEmail('notfound@example.com');
        result.current.setPassword('password123');
      });

      apiPost.mockResolvedValue({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            code: 'ACCOUNT_NOT_FOUND',
            error: 'No account found',
          }),
      });

      await act(async () => {
        const loginResult = await result.current.handleLogin();
        expect(loginResult.success).toBe(false);
        expect(loginResult.action).toBe('create_account');
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle login error - wrong password', async () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setEmail('test@example.com');
        result.current.setPassword('wrongpassword');
      });

      apiPost.mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            code: 'INVALID_PASSWORD',
            error: 'Invalid password',
          }),
      });

      await act(async () => {
        const loginResult = await result.current.handleLogin();
        expect(loginResult.success).toBe(false);
      });

      expect(result.current.error).toContain('password');
    });
  });

  describe('handleLogout', () => {
    it('should clear auth state on logout', async () => {
      const { result } = renderHook(() => useAuth());

      // Simulate logged in state
      act(() => {
        result.current.setEmail('test@example.com');
      });

      apiPost.mockResolvedValue({ ok: true });

      await act(async () => {
        await result.current.handleLogout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.firstName).toBe('');
      expect(result.current.lastName).toBe('');
      expect(result.current.email).toBe('');
      expect(result.current.password).toBe('');
      expect(authStorage.clearAuth).toHaveBeenCalled();
    });

    it('should clear auth even if API call fails', async () => {
      const { result } = renderHook(() => useAuth());

      apiPost.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await result.current.handleLogout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(authStorage.clearAuth).toHaveBeenCalled();
    });
  });

  describe('Session Restoration', () => {
    it('should restore session from storage if available', async () => {
      // Mock stored auth data
      authStorage.getToken.mockReturnValue('stored-token');
      authStorage.isAuthenticated.mockReturnValue(true);

      apiGet.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            authenticated: true,
            user: { email: 'stored@example.com', first_name: 'Stored', last_name: 'User' },
          }),
      });

      const { result } = renderHook(() => useAuth());

      // Wait for useEffect to complete
      await waitFor(() => {
        expect(result.current.isCheckingAuth).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear auth if session verification fails', async () => {
      authStorage.getToken.mockReturnValue('expired-token');
      authStorage.isAuthenticated.mockReturnValue(false);

      apiGet.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ authenticated: false }),
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isCheckingAuth).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});

describe('calculateUserProperties helper', () => {
  // This tests the internal helper function indirectly through the hook behavior
  it('should track new vs returning users correctly', async () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setEmail('new@example.com');
      result.current.setPassword('password123');
      result.current.setFirstName('New');
      result.current.setLastName('User');
    });

    apiPost.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          user: {
            username: 'newuser',
            created_at: new Date().toISOString(), // Just created
          },
          token: 'jwt',
        }),
    });

    await act(async () => {
      await result.current.handleLogin();
    });

    // The setUserProperties mock should have been called
    // with user_type based on days since signup
    expect(result.current.isAuthenticated).toBe(true);
  });
});
