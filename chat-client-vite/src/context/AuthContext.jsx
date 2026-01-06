import React from 'react';
import { apiGet, apiPost, onAuthFailure } from '../apiClient.js';
import { getErrorMessage, logError } from '../utils/errorHandler.jsx';
import { setUserProperties, setUserID } from '../utils/analyticsEnhancements.js';

// Storage adapter for abstracting localStorage
import { storage, StorageKeys, authStorage } from '../adapters/storage';
// TokenManager for synchronized token access
import { tokenManager } from '../utils/tokenManager.js';

// Shared auth utilities - single source of truth
import { calculateUserProperties } from '../features/auth/model/useSessionVerification.js';
import { logUserTransform } from '../utils/dataTransformDebug.js';

/**
 * AuthContext - Centralized authentication state management
 *
 * ARCHITECTURE: Finite State Machine (FSM) for auth status
 * States: LOADING -> AUTHENTICATED | ANONYMOUS
 *
 * The auth status is deterministic - no timers or "grace periods".
 * While in LOADING state, the app should show a loading indicator
 * and not make authenticated API calls.
 *
 * MIGRATION NOTE: Email is now the primary identifier.
 * The `username` field is kept for backward compatibility but always equals `email`.
 * All new code should use `email` instead of `username`.
 */

const AuthContext = React.createContext(null);

/**
 * Auth Status FSM States
 */
export const AuthStatus = {
  LOADING: 'loading', // Initial state, verifying session
  AUTHENTICATED: 'authenticated', // User is logged in
  ANONYMOUS: 'anonymous', // User is not logged in
};

/**
 * Check if a JWT token is expired
 * Abstracted into a function that can be replaced with a TokenService
 */
function isTokenExpired(token) {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
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
    // Sync TokenManager with localStorage on mount
    const storedToken = authStorage.getToken();
    if (storedToken) {
      tokenManager.setToken(storedToken);
    }
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

    // Check if token is expired using centralized function
    if (storedToken) {
      if (isTokenExpired(storedToken)) {
        if (import.meta.env.DEV) {
          console.log('[AuthContext] Token expired, clearing auth');
        }
        // Token expired
        return { isAuthenticated: false, username: null, email: null, token: null };
      }
      // Get expiration time for logging
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        const exp = payload.exp * 1000;
        if (import.meta.env.DEV) {
          console.log('[AuthContext] Token valid, expires:', new Date(exp).toLocaleString());
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[AuthContext] Invalid token format:', error);
        }
        // Invalid token
        return { isAuthenticated: false, username: null, email: null, token: null };
      }
    }

    // If we have valid stored auth, use it for initial state
    // CRITICAL: Use email as primary identifier (migrated from username)
    // Username is optional - use email if username not available
    const identifier = storedEmail || storedUsername;
    const hasValidStoredAuth = storedIsAuthenticated && storedToken && identifier;
    console.log('[AuthContext] Initial auth state:', {
      isAuthenticated: hasValidStoredAuth,
      username: hasValidStoredAuth ? storedEmail || storedUsername : null,
    });

    return {
      isAuthenticated: hasValidStoredAuth,
      username: hasValidStoredAuth ? storedEmail || storedUsername : null,
      email: hasValidStoredAuth ? storedEmail || storedUsername : null,
      token: hasValidStoredAuth ? storedToken : null,
    };
  }, []); // Empty deps - only run once on mount

  // FSM: Single source of truth for auth status
  // LOADING: Waiting for session verification
  // AUTHENTICATED: User is logged in (verified by server)
  // ANONYMOUS: User is not logged in
  const [authStatus, setAuthStatus] = React.useState(
    initialAuthState.isAuthenticated ? AuthStatus.LOADING : AuthStatus.ANONYMOUS
  );

  // Derived states from FSM
  const isAuthenticated = authStatus === AuthStatus.AUTHENTICATED;
  const isCheckingAuth = authStatus === AuthStatus.LOADING;

  // MIGRATION: email is the primary identifier, username is kept for backward compatibility
  const [email, setEmail] = React.useState(initialAuthState.email);
  const [token, setToken] = React.useState(initialAuthState.token);
  // username is now an alias for email - kept for backward compatibility with existing components
  const username = email;
  const setUsername = setEmail; // Redirect setUsername calls to setEmail
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isSigningUp, setIsSigningUp] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Derive userId from JWT token for UUID-based ownership checks
  const userId = React.useMemo(() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload.userId || null;
    } catch {
      return null;
    }
  }, [token]);

  // Track AbortController for cleanup on unmount
  const verifySessionAbortControllerRef = React.useRef(null);

  /**
   * Load auth state from storage (pure function - no side effects)
   * Returns the stored auth state for use by verifySession and initialization
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

    // CRITICAL: If there's no token, auth state is invalid
    if (!storedToken) {
      if (storedIsAuthenticated) {
        console.log('[loadAuthState] No token but isAuthenticated flag exists - stale state');
        authStorage.clearAuth();
      }
      return { isAuthenticated: false, username: null, email: null, token: null };
    }

    // Validate token expiration
    if (isTokenExpired(storedToken)) {
      console.log('[loadAuthState] Token expired');
      authStorage.clearAuth();
      return { isAuthenticated: false, username: null, email: null, token: null };
    }

    // CRITICAL: Use email as primary identifier
    const identifier = storedEmail || storedUsername;
    const hasValidStoredAuth = storedToken && identifier && !isTokenExpired(storedToken);

    if (!hasValidStoredAuth) {
      if (storedIsAuthenticated) {
        console.log('[loadAuthState] Invalid auth state (missing token/identifier)');
        authStorage.clearAuth();
      }
      return { isAuthenticated: false, username: null, email: null, token: null };
    }

    // Sync TokenManager with stored token
    tokenManager.setToken(storedToken);

    return {
      isAuthenticated: true,
      username: storedEmail || storedUsername,
      email: storedEmail || storedUsername,
      token: storedToken,
    };
  }, []);

  /**
   * Clear auth state - transitions FSM to ANONYMOUS
   */
  const clearAuthState = React.useCallback(() => {
    // CRITICAL: Clear TokenManager FIRST so apiClient immediately knows token is gone
    tokenManager.clearToken();
    authStorage.clearAuth();
    // FSM transition: -> ANONYMOUS
    setAuthStatus(AuthStatus.ANONYMOUS);
    setUsername(null);
    setEmail(null);
    setToken(null);
  }, []);

  /**
   * Verify session with server
   * FSM transitions: LOADING -> AUTHENTICATED | ANONYMOUS
   *
   * DETERMINISTIC: No timers, no "optimistic" state keeping.
   * If verification fails for any reason, transition to ANONYMOUS.
   */
  const verifySession = React.useCallback(async () => {
    // FSM: Enter LOADING state
    setAuthStatus(AuthStatus.LOADING);
    setError(null);

    try {
      const storedToken = authStorage.getToken();

      if (!storedToken) {
        console.log('[verifySession] No token found -> ANONYMOUS');
        clearAuthState();
        return;
      }

      // Check token expiration first (client-side validation)
      if (isTokenExpired(storedToken)) {
        console.log('[verifySession] Token expired -> ANONYMOUS');
        clearAuthState();
        return;
      }

      console.log('[verifySession] Verifying token with server...');

      // Abort any previous verification request
      if (verifySessionAbortControllerRef.current) {
        verifySessionAbortControllerRef.current.abort();
      }

      // Add timeout to prevent hanging (10 second timeout)
      const controller = new AbortController();
      verifySessionAbortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let response;
      try {
        response = await apiGet('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        verifySessionAbortControllerRef.current = null;
      } catch (err) {
        clearTimeout(timeoutId);
        verifySessionAbortControllerRef.current = null;

        // Handle AbortError (timeout or component unmount)
        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
          console.log('[verifySession] Request aborted -> ANONYMOUS (deterministic)');
          // DETERMINISTIC: On abort, go to ANONYMOUS, not "optimistic"
          clearAuthState();
          return;
        }
        throw err;
      }

      if (response.ok) {
        const data = await response.json();
        const { authenticated, user } = data;

        if (authenticated && user) {
          console.log('[verifySession] ✅ Server confirmed -> AUTHENTICATED');

          // Debug logging for user data transformation
          const transformedUser = {
            ...user,
            identifier: user.email || user.username,
          };
          logUserTransform(user, transformedUser);

          // Update all auth state
          setToken(storedToken);
          tokenManager.setToken(storedToken);
          authStorage.setAuthenticated(true);

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

          // FSM: Transition to AUTHENTICATED
          setAuthStatus(AuthStatus.AUTHENTICATED);
        } else {
          console.log('[verifySession] ❌ Server says not authenticated -> ANONYMOUS');
          clearAuthState();
        }
      } else {
        console.log(
          '[verifySession] ❌ Server verification failed (status:',
          response.status,
          ') -> ANONYMOUS'
        );
        clearAuthState();
      }
    } catch (err) {
      // Log error (but not AbortError)
      if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
        console.error('[verifySession] ⚠️ Error verifying session:', err);
      }
      // DETERMINISTIC: On any error, go to ANONYMOUS
      // No "optimistic" state - if we can't verify, user must re-authenticate
      console.log('[verifySession] ❌ Error occurred -> ANONYMOUS (deterministic)');
      clearAuthState();
    }
  }, [clearAuthState, loadAuthState]);

  /**
   * Login with email/password
   */
  const login = React.useCallback(async (email, password) => {
    console.log('[AuthContext] login called', {
      email: email ? '***' : 'empty',
      password: password ? '***' : 'empty',
    });
    setIsLoggingIn(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    console.log('[AuthContext] Calling apiPost /api/auth/login');

    try {
      const response = await apiPost('/api/auth/login', {
        email: cleanEmail,
        password: cleanPassword,
      });

      console.log('[AuthContext] apiPost response received', {
        ok: response.ok,
        status: response.status,
      });

      const data = await response.json();
      console.log('[AuthContext] Response data parsed', {
        hasUser: !!data.user,
        hasToken: !!data.token,
      });

      if (!response.ok) {
        const errorInfo = getErrorMessage(data, { statusCode: response.status });
        setError(errorInfo.userMessage);
        return { success: false, error: errorInfo };
      }

      // Success - extract user at boundary, then work with it directly
      const { user, token } = data;

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
        // CRITICAL: Update TokenManager FIRST (synchronously) so apiClient can access token immediately
        tokenManager.setToken(token);
        console.log('[AuthContext] Token set in TokenManager:', {
          hasToken: !!token,
          tokenLength: token.length,
          tokenPreview: token.substring(0, 20) + '...',
        });

        setToken(token);
        authStorage.setToken(token);
      }

      if (user) {
        storage.set(StorageKeys.CHAT_USER, user);
      }

      // FSM: Transition to AUTHENTICATED
      authStorage.setAuthenticated(true);
      setAuthStatus(AuthStatus.AUTHENTICATED);

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
  const signup = React.useCallback(async (email, password, _username = null) => {
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
        // CRITICAL: Update TokenManager FIRST (synchronously) so apiClient can access token immediately
        tokenManager.setToken(token);
        setToken(token);
        authStorage.setToken(token);
      }

      // FSM: Transition to AUTHENTICATED
      authStorage.setAuthenticated(true);
      setAuthStatus(AuthStatus.AUTHENTICATED);

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
      // Redirect to sign-in page after logout
      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      }
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

    // CRITICAL: Skip session verification on OAuth callback pages
    // The OAuth callback handler will process the code and set auth state
    // Calling verifySession here would clear auth before the callback completes
    const isOAuthCallback =
      typeof window !== 'undefined' &&
      (window.location.pathname.includes('/auth/callback') ||
        window.location.pathname.includes('/auth/google/callback') ||
        window.location.search.includes('code='));

    if (isOAuthCallback) {
      console.log('[AuthContext] Skipping verifySession on OAuth callback page');
      // FSM: Keep in LOADING state - OAuth callback handler will set final state
      // This prevents showing "not authenticated" flash before OAuth completes
      return;
    }

    // Then verify with server (will confirm or clear if invalid)
    verifySession();

    // Cleanup: abort any pending verification request on unmount
    return () => {
      if (verifySessionAbortControllerRef.current) {
        verifySessionAbortControllerRef.current.abort();
        verifySessionAbortControllerRef.current = null;
      }
    };
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
   * FSM-based: Deterministic, no timers or "grace periods"
   *
   * Rules:
   * 1. Ignore 401s during LOADING state (FSM guards API calls during loading)
   * 2. Ignore 401s on auth endpoints (expected during login/signup)
   * 3. On any other 401, transition to ANONYMOUS immediately
   */
  React.useEffect(() => {
    return onAuthFailure(detail => {
      console.log('[onAuthFailure] Auth failure detected:', {
        endpoint: detail.endpoint,
        authStatus,
        hasToken: !!token,
      });

      // FSM Guard: Don't process 401s during LOADING state
      // The app should not be making API calls during LOADING anyway
      if (authStatus === AuthStatus.LOADING) {
        console.log('[onAuthFailure] Ignoring 401 - FSM in LOADING state');
        return;
      }

      // Ignore 401s on auth endpoints (expected during login/signup/verify)
      if (detail.endpoint?.includes('/api/auth/')) {
        console.log('[onAuthFailure] Ignoring 401 - auth endpoint');
        return;
      }

      // DETERMINISTIC: Any 401 while AUTHENTICATED means token is invalid
      // Transition to ANONYMOUS immediately - no timers, no "optimistic" guessing
      console.log('[onAuthFailure] 401 received while AUTHENTICATED -> ANONYMOUS');
      clearAuthState();
    });
  }, [clearAuthState, authStatus, token]);

  // Memoize context value to prevent unnecessary re-renders
  // Auth state changes infrequently, so this is a good optimization
  const value = React.useMemo(
    () => ({
      // FSM State (single source of truth)
      authStatus, // 'loading' | 'authenticated' | 'anonymous'

      // Derived states (for convenience/backward compatibility)
      isAuthenticated, // authStatus === 'authenticated'
      isCheckingAuth, // authStatus === 'loading'

      // User data
      email, // PRIMARY: Use this for user identification
      username, // DEPRECATED: Alias for email, kept for backward compatibility
      userId, // Numeric user ID from JWT (for UUID-based ownership checks)
      token,

      // Action states
      isLoggingIn,
      isSigningUp,
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
    }),
    [
      authStatus,
      isAuthenticated,
      isCheckingAuth,
      email,
      username,
      userId,
      token,
      isLoggingIn,
      isSigningUp,
      error,
      login,
      signup,
      logout,
      verifySession,
      clearAuthState,
      setError,
    ]
  );

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
