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
  // CRITICAL: Initialize auth state synchronously from storage
  // This ensures PWA launches show authenticated state immediately
  // This runs during component initialization, before first render
  const initialAuthState = React.useMemo(() => {
    const storedToken = authStorage.getToken();
    const storedUsername = authStorage.getUsername();
    // Try to get email from storage, with fallback to stored user object
    let storedEmail = storage.getString(StorageKeys.USER_EMAIL);
    if (!storedEmail) {
      // Fallback: try to get email from stored user object (for users who logged in before email storage was added)
      const storedUser = storage.get(StorageKeys.CHAT_USER);
      if (storedUser?.email) {
        storedEmail = storedUser.email;
        // Migrate: store the email for future loads
        storage.set(StorageKeys.USER_EMAIL, storedEmail);
      }
    }
    const storedIsAuthenticated = authStorage.isAuthenticated();

    console.log('[AuthContext] Initializing auth state from storage:', {
      hasToken: !!storedToken,
      hasUsername: !!storedUsername,
      storedIsAuthenticated,
    });

    // Check if token is expired using the same logic as isTokenExpired
    if (storedToken) {
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        const exp = payload.exp * 1000;
        const isExpired = Date.now() >= exp;
        if (isExpired) {
          console.log('[AuthContext] Token expired, clearing auth');
          // Token expired
          return { isAuthenticated: false, username: null, email: null, token: null };
        }
        console.log('[AuthContext] Token valid, expires:', new Date(exp).toLocaleString());
      } catch (error) {
        console.warn('[AuthContext] Invalid token format:', error);
        // Invalid token
        return { isAuthenticated: false, username: null, email: null, token: null };
      }
    }

    // If we have valid stored auth, use it for initial state
    const hasValidStoredAuth = storedIsAuthenticated && storedToken && storedUsername;
    console.log('[AuthContext] Initial auth state:', {
      isAuthenticated: hasValidStoredAuth,
      username: hasValidStoredAuth ? storedUsername : null,
    });

    return {
      isAuthenticated: hasValidStoredAuth,
      username: hasValidStoredAuth ? storedUsername : null,
      email: hasValidStoredAuth ? storedEmail : null,
      token: hasValidStoredAuth ? storedToken : null,
    };
  }, []); // Empty deps - only run once on mount

  const [isAuthenticated, setIsAuthenticated] = React.useState(initialAuthState.isAuthenticated);
  const [username, setUsername] = React.useState(initialAuthState.username);
  const [email, setEmail] = React.useState(initialAuthState.email);
  const [token, setToken] = React.useState(initialAuthState.token);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isSigningUp, setIsSigningUp] = React.useState(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = React.useState(false);
  const [error, setError] = React.useState(null);

  /**
   * Load auth state from storage
   * This provides initial state while session verification is in progress
   */
  const loadAuthState = React.useCallback(() => {
    const storedToken = authStorage.getToken();
    const storedUsername = authStorage.getUsername();
    // Try to get email from storage, with fallback to stored user object
    let storedEmail = storage.getString(StorageKeys.USER_EMAIL);
    if (!storedEmail) {
      // Fallback: try to get email from stored user object
      const storedUser = storage.get(StorageKeys.CHAT_USER);
      if (storedUser?.email) {
        storedEmail = storedUser.email;
        storage.set(StorageKeys.USER_EMAIL, storedEmail);
      }
    }
    const storedIsAuthenticated = authStorage.isAuthenticated();

    // CRITICAL: If there's no token, clear all auth state immediately
    // This prevents stale isAuthenticated flags from causing redirect loops
    if (!storedToken) {
      if (storedIsAuthenticated) {
        console.log(
          '[loadAuthState] No token but isAuthenticated flag exists - clearing stale auth'
        );
        authStorage.clearAuth();
      }
      setIsAuthenticated(false);
      setUsername(null);
      setEmail(null);
      setToken(null);
      return { isAuthenticated: false, username: null, email: null, token: null };
    }

    // Validate token if present
    if (isTokenExpired(storedToken)) {
      // Token expired, clear everything
      console.log('[loadAuthState] Token expired, clearing auth');
      authStorage.clearAuth();
      setIsAuthenticated(false);
      setUsername(null);
      setEmail(null);
      setToken(null);
      return { isAuthenticated: false, username: null, email: null, token: null };
    }

    // If we have a valid token and username, set initial state optimistically
    // This allows the app to show authenticated UI while verification completes
    // The verifySession will confirm or clear this state
    const hasValidStoredAuth = storedToken && storedUsername && !isTokenExpired(storedToken);

    if (hasValidStoredAuth) {
      // Set initial state from storage (will be verified by verifySession)
      setIsAuthenticated(true);
      setUsername(storedUsername);
      setEmail(storedEmail);
      setToken(storedToken);
    } else {
      // Invalid state - clear it
      if (storedIsAuthenticated) {
        console.log('[loadAuthState] Invalid auth state (missing token/username), clearing');
        authStorage.clearAuth();
      }
      setIsAuthenticated(false);
      setUsername(null);
      setEmail(null);
      setToken(null);
    }

    return {
      isAuthenticated: hasValidStoredAuth,
      username: hasValidStoredAuth ? storedUsername : null,
      email: hasValidStoredAuth ? storedEmail : null,
      token: hasValidStoredAuth ? storedToken : null,
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
        console.log('[verifySession] No token found, clearing auth');
        setIsCheckingAuth(false);
        clearAuthState();
        return;
      }

      // Check token expiration first
      if (isTokenExpired(storedToken)) {
        console.log('[verifySession] Token expired, clearing auth');
        clearAuthState();
        setIsCheckingAuth(false);
        return;
      }

      console.log('[verifySession] Verifying token with server...');

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      let response;
      try {
        response = await apiGet('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          console.warn('[verifySession] ⚠️ Verification timeout - using optimistic auth state');
          // On timeout, keep optimistic state if token exists
          const storedState = loadAuthState();
          if (storedState.isAuthenticated && storedState.token) {
            setIsAuthenticated(storedState.isAuthenticated);
            setUsername(storedState.username);
            setEmail(storedState.email);
            setToken(storedState.token);
            setIsCheckingAuth(false);
            return;
          }
        }
        throw err; // Re-throw other errors
      }

      if (response.ok) {
        const data = await response.json();
        const { authenticated, user } = data;

        if (authenticated && user) {
          console.log('[verifySession] ✅ Server confirmed authentication');
          setIsAuthenticated(true);
          setToken(storedToken);
          authStorage.setAuthenticated(true);

          // Backend returns email, not username - use email as the identifier
          const userIdentifier = user.email || user.username;
          if (userIdentifier) {
            setUsername(userIdentifier);
            authStorage.setUsername(userIdentifier);
            setUserID(userIdentifier);
            setUserProperties(calculateUserProperties(user, false));
          }

          if (user.email) {
            setEmail(user.email);
            storage.set(StorageKeys.USER_EMAIL, user.email);
          }
        } else {
          console.log('[verifySession] ❌ Server says not authenticated, clearing auth');
          clearAuthState();
        }
      } else {
        console.log('[verifySession] ❌ Server verification failed, clearing auth');
        clearAuthState();
      }
    } catch (err) {
      console.error('[verifySession] ⚠️ Error verifying session:', err);
      // CRITICAL: On network errors, keep optimistic auth state
      // This prevents showing landing page when user has valid stored credentials
      // but network is temporarily unavailable
      const storedState = loadAuthState();
      if (storedState.isAuthenticated && storedState.token) {
        console.log(
          '[verifySession] ⚠️ Network error but stored auth exists - keeping optimistic state'
        );
        // Keep the optimistic state - don't clear auth on network errors
        // The user should still be able to use the app if they have valid stored credentials
        setIsAuthenticated(storedState.isAuthenticated);
        setUsername(storedState.username);
        setEmail(storedState.email);
        setToken(storedState.token);
      } else {
        console.log('[verifySession] ❌ No stored auth, clearing state');
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

      // Backend returns email, not username - use email as the identifier
      const userIdentifier = user?.email || user?.username;
      if (userIdentifier) {
        setUsername(userIdentifier);
        authStorage.setUsername(userIdentifier);
        setUserID(userIdentifier);
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

      // Backend returns email, not username - use email as the identifier
      const userIdentifier = user?.email || user?.username;
      if (userIdentifier) {
        setUsername(userIdentifier);
        authStorage.setUsername(userIdentifier);
        setUserID(userIdentifier);
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
   * Initialize auth state on mount
   * Load from storage first (optimistic), then verify with server
   * This ensures PWA launches show authenticated state immediately if user is logged in
   */
  React.useEffect(() => {
    // Load initial state from storage (optimistic - shows logged in state immediately)
    loadAuthState();
    // Then verify with server (will confirm or clear if invalid)
    verifySession();
  }, [loadAuthState, verifySession]);

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
   *
   * CRITICAL: Don't clear auth if verifySession is in progress - this prevents race conditions
   * where a 401 happens during initial verification but the token is actually valid.
   */
  React.useEffect(() => {
    return onAuthFailure(detail => {
      console.log('[onAuthFailure] Auth failure detected on endpoint:', detail.endpoint, {
        isCheckingAuth,
        isAuthenticated,
        hasToken: !!token,
      });

      // CRITICAL: Don't clear auth if we're currently verifying the session
      // This prevents race conditions where:
      // 1. verifySession starts (isCheckingAuth = true)
      // 2. Another API call happens before verification completes
      // 3. That call gets 401 (maybe token is being refreshed server-side)
      // 4. onAuthFailure tries to clear auth while verifySession is still running
      // 5. verifySession completes successfully, but auth was already cleared
      if (isCheckingAuth) {
        console.log('[onAuthFailure] Ignoring 401 - session verification in progress');
        return;
      }

      // Also ignore 401s on auth endpoints (they're expected during login/signup)
      if (detail.endpoint?.includes('/api/auth/')) {
        console.log('[onAuthFailure] Ignoring 401 - auth endpoint');
        return;
      }

      console.log('[onAuthFailure] Clearing auth state due to 401 error');
      // Clear invalid auth state - this will trigger redirect to login
      clearAuthState();
    });
  }, [clearAuthState, isCheckingAuth, isAuthenticated, token]);

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
