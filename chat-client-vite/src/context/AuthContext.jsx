import React from 'react';
import { apiGet, apiPost, onAuthFailure } from '../apiClient.js';
import { getErrorMessage, logError } from '../utils/errorHandler.jsx';
import { setUserProperties, setUserID } from '../utils/analyticsEnhancements.js';

// Storage adapter for abstracting localStorage
import { storage, StorageKeys, authStorage } from '../adapters/storage';

// Shared auth utilities - single source of truth
import { calculateUserProperties } from '../features/auth/model/useSessionVerification.js';

/**
 * AuthContext - Centralized authentication state management
 *
 * Provides:
 * - Centralized auth state (isAuthenticated, username, email, token)
 * - Token management (storage, validation, expiration)
 * - Session verification on mount
 * - State synchronization across tabs
 * - Loading states to prevent race conditions
 * - Auth guards for API calls
 */

const AuthContext = React.createContext(null);

/**
 * Check if a JWT token is expired
 */
function isTokenExpired(token) {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch (error) {
    // If we can't parse the token, consider it expired
    return true;
  }
}

/**
 * AuthProvider component
 */
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [username, setUsername] = React.useState(null);
  const [email, setEmail] = React.useState(null);
  const [token, setToken] = React.useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isSigningUp, setIsSigningUp] = React.useState(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = React.useState(false);
  const [error, setError] = React.useState(null);

  /**
   * Load auth state from storage
   */
  const loadAuthState = React.useCallback(() => {
    const storedToken = authStorage.getToken();
    const storedUsername = authStorage.getUsername();
    const storedEmail = storage.getString(StorageKeys.USER_EMAIL);
    const storedIsAuthenticated = authStorage.isAuthenticated();

    // Validate token if present
    if (storedToken && isTokenExpired(storedToken)) {
      // Token expired, clear everything
      clearAuthState();
      return { isAuthenticated: false, username: null, email: null, token: null };
    }

    return {
      isAuthenticated: storedIsAuthenticated && storedToken && storedUsername,
      username: storedUsername,
      email: storedEmail,
      token: storedToken,
    };
  }, []);

  /**
   * Clear auth state
   */
  const clearAuthState = React.useCallback(() => {
    authStorage.clearAuth();
    setIsAuthenticated(false);
    setUsername(null);
    setEmail(null);
    setToken(null);
  }, []);

  /**
   * Verify session with server
   */
  const verifySession = React.useCallback(async () => {
    setIsCheckingAuth(true);
    setError(null);

    try {
      const storedToken = authStorage.getToken();

      if (!storedToken) {
        setIsCheckingAuth(false);
        return;
      }

      // Check token expiration first
      if (isTokenExpired(storedToken)) {
        clearAuthState();
        setIsCheckingAuth(false);
        return;
      }

      const response = await apiGet('/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const { authenticated, user } = data;

        if (authenticated && user) {
          setIsAuthenticated(true);
          setToken(storedToken);
          authStorage.setAuthenticated(true);

          if (user.username) {
            setUsername(user.username);
            authStorage.setUsername(user.username);
            setUserID(user.username);
            setUserProperties(calculateUserProperties(user, false));
          }

          if (user.email) {
            setEmail(user.email);
            storage.set(StorageKeys.USER_EMAIL, user.email);
          }
        } else {
          clearAuthState();
        }
      } else {
        clearAuthState();
      }
    } catch (err) {
      console.error('Error verifying session:', err);
      // On error, try to restore from storage if available
      const storedState = loadAuthState();
      if (storedState.isAuthenticated) {
        // Use stored state but mark as potentially stale
        setIsAuthenticated(storedState.isAuthenticated);
        setUsername(storedState.username);
        setEmail(storedState.email);
        setToken(storedState.token);
      } else {
        clearAuthState();
      }
    } finally {
      setIsCheckingAuth(false);
    }
  }, [clearAuthState, loadAuthState]);

  /**
   * Login with email/password
   */
  const login = React.useCallback(async (email, password) => {
    setIsLoggingIn(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const response = await apiPost('/api/auth/login', {
        email: cleanEmail,
        password: cleanPassword,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorInfo = getErrorMessage(data, { statusCode: response.status });
        setError(errorInfo.userMessage);
        return { success: false, error: errorInfo };
      }

      // Success - extract user at boundary, then work with it directly
      const { user, token } = data;

      setIsAuthenticated(true);
      authStorage.setAuthenticated(true);

      if (user?.username) {
        setUsername(user.username);
        authStorage.setUsername(user.username);
        setUserID(user.username);
        setUserProperties(calculateUserProperties(user, false));
      }

      setEmail(cleanEmail);
      storage.set(StorageKeys.USER_EMAIL, cleanEmail);

      if (token) {
        setToken(token);
        authStorage.setToken(token);
      }

      if (user) {
        storage.set(StorageKeys.CHAT_USER, user);
      }

      return { success: true, user };
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0 });
      setError(errorInfo.userMessage);
      logError(err, { endpoint: '/api/auth/login', operation: 'login' });
      return { success: false, error: errorInfo };
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  /**
   * Signup with email/password
   */
  const signup = React.useCallback(async (email, password, username = null) => {
    setIsSigningUp(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const response = await apiPost('/api/auth/signup', {
        email: cleanEmail,
        password: cleanPassword,
        context: {},
      });

      const data = await response.json();

      if (!response.ok) {
        const errorInfo = getErrorMessage(data, { statusCode: response.status });
        setError(errorInfo.userMessage);
        return { success: false, error: errorInfo };
      }

      // Success - extract user at boundary, then work with it directly
      const { user, token } = data;

      setIsAuthenticated(true);
      authStorage.setAuthenticated(true);

      if (user?.username) {
        setUsername(user.username);
        authStorage.setUsername(user.username);
        setUserID(user.username);
        setUserProperties(calculateUserProperties(user, true));
      }

      if (user) {
        storage.set(StorageKeys.CHAT_USER, user);
      }

      setEmail(cleanEmail);
      storage.set(StorageKeys.USER_EMAIL, cleanEmail);

      if (token) {
        setToken(token);
        authStorage.setToken(token);
      }

      return { success: true, user };
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0 });
      setError(errorInfo.userMessage);
      logError(err, { endpoint: '/api/auth/signup', operation: 'signup' });
      return { success: false, error: errorInfo };
    } finally {
      setIsSigningUp(false);
    }
  }, []);

  /**
   * Logout
   */
  const logout = React.useCallback(async () => {
    try {
      await apiPost('/api/auth/logout');
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  /**
   * Verify session on mount
   */
  React.useEffect(() => {
    verifySession();
  }, [verifySession]);

  /**
   * Sync auth state across tabs
   */
  React.useEffect(() => {
    const handleStorageChange = e => {
      if (
        e.key === StorageKeys.AUTH_TOKEN ||
        e.key === 'auth_token_backup' ||
        e.key === StorageKeys.IS_AUTHENTICATED ||
        e.key === 'isAuthenticated'
      ) {
        // Auth state changed in another tab, re-verify
        verifySession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [verifySession]);

  /**
   * Check token expiration periodically
   */
  React.useEffect(() => {
    if (!token) return;

    const checkExpiration = () => {
      if (isTokenExpired(token)) {
        // Token expired, verify session (will clear if invalid)
        verifySession();
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkExpiration, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token, verifySession]);

  /**
   * Listen for auth failures from API calls (401 errors)
   * When the token is invalid/expired, clear auth state to trigger re-login
   */
  React.useEffect(() => {
    return onAuthFailure(detail => {
      console.log('Auth failure detected on endpoint:', detail.endpoint);
      // Clear invalid auth state - this will trigger redirect to login
      clearAuthState();
    });
  }, [clearAuthState]);

  const value = {
    // State
    isAuthenticated,
    username,
    email,
    token,
    isCheckingAuth,
    isLoggingIn,
    isSigningUp,
    isGoogleLoggingIn,
    error,

    // Actions
    login,
    signup,
    logout,
    verifySession,
    clearAuthState,
    setError,

    // Helpers
    isTokenExpired: () => isTokenExpired(token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuthContext() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

// Note: requireAuth HOC removed - unused
// React Router handles route protection via route configuration

export default AuthContext;
