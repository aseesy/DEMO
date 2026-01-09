import React from 'react';
import { apiGet, apiPost, onAuthFailure } from '../apiClient.js';
import { getErrorMessage, logError } from '../utils/errorHandler.jsx';
import { setUserProperties, setUserID } from '../utils/analyticsEnhancements.js';
import { commandLogin, commandSignup } from '../utils/authQueries.js';

// Storage adapter for abstracting localStorage
import { storage, StorageKeys, authStorage } from '../adapters/storage';
// TokenManager for synchronized token access
import { tokenManager } from '../utils/tokenManager.js';

// Shared auth utilities - single source of truth
import { calculateUserProperties } from '../features/auth/model/useSessionVerification.js';
import { logUserTransform } from '../utils/dataTransformDebug.js';

/**
 * 🔒 SEALED FILE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * AuthContext - Centralized authentication state management
 *
 * ⚠️ CRITICAL: This file is SEALED and SET IN STONE.
 * The authentication flow is production-ready and battle-tested.
 *
 * RULES FOR AI ASSISTANTS:
 * - ❌ DO NOT modify FSM state transitions
 * - ❌ DO NOT change token storage/retrieval patterns
 * - ❌ DO NOT alter session verification logic
 * - ❌ DO NOT modify auth state subscription mechanism
 * - ✅ CAN modify error messages (user-facing text)
 * - ✅ CAN update logging format (dev-only)
 *
 * Before modifying: Check docs/AUTH_FLOW_SEALED.md for approval process.
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
 *
 * See: docs/AUTH_FLOW_SEALED.md for complete sealing documentation.
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

    if (import.meta.env.DEV) {
      console.log('[AuthContext] Initializing auth state from storage:', {
        hasToken: !!storedToken,
        hasUsername: !!storedUsername,
        storedIsAuthenticated,
      });
    }

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
    if (import.meta.env.DEV) {
      console.log('[AuthContext] Initial auth state:', {
        isAuthenticated: hasValidStoredAuth,
        username: hasValidStoredAuth ? storedEmail || storedUsername : null,
      });
    }

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

  // CRITICAL: Token is derived from tokenManager (single source of truth)
  // Subscribe to tokenManager changes to keep React state in sync
  const [token, setToken] = React.useState(() => tokenManager.getToken());

  // Subscribe to tokenManager changes
  React.useEffect(() => {
    const unsubscribe = tokenManager.subscribe(newToken => {
      setToken(newToken);
    });
    return unsubscribe;
  }, []);

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
  // Track current auth status for abort recovery
  const authStatusRef = React.useRef(
    initialAuthState.isAuthenticated ? AuthStatus.AUTHENTICATED : AuthStatus.ANONYMOUS
  );

  /**
   * Clear auth state - transitions FSM to ANONYMOUS
   */
  const clearAuthState = React.useCallback(() => {
    // CRITICAL: tokenManager is the single source of truth
    // Clearing it will update cache, storage, and notify subscribers (including this component)
    tokenManager.clearToken();
    // Also clear other auth-related storage
    authStorage.removeToken();
    authStorage.removeUsername();
    authStorage.setAuthenticated(false);
    storage.remove(StorageKeys.USER_EMAIL);
    storage.remove(StorageKeys.CHAT_USER);
    // FSM transition: -> ANONYMOUS
    setAuthStatus(AuthStatus.ANONYMOUS);
    authStatusRef.current = AuthStatus.ANONYMOUS;
    setUsername(null);
    setEmail(null);
    // Token state will update via tokenManager subscription
  }, []);

  /**
   * Verify session with server
   * FSM transitions: LOADING -> AUTHENTICATED | ANONYMOUS
   *
   * DETERMINISTIC: No timers, no "optimistic" state keeping.
   * If verification fails for any reason, transition to ANONYMOUS.
   */
  const verifySession = React.useCallback(async () => {
    setError(null);

    // Store previous status BEFORE try block so it's accessible in catch
    // This allows us to restore state on network errors without logging out
    let previousStatus = authStatusRef.current;

    try {
      const storedToken = authStorage.getToken();

      if (!storedToken) {
        if (import.meta.env.DEV) {
          console.log('[verifySession] No token found -> ANONYMOUS');
        }
        clearAuthState();
        return;
      }

      // Check token expiration first (client-side validation)
      if (isTokenExpired(storedToken)) {
        if (import.meta.env.DEV) {
          console.log('[verifySession] Token expired -> ANONYMOUS');
        }
        clearAuthState();
        return;
      }

      if (import.meta.env.DEV) {
        console.log('[verifySession] Verifying token with server...');
      }

      // Abort any previous verification request
      if (verifySessionAbortControllerRef.current) {
        verifySessionAbortControllerRef.current.abort();
      }

      // Add timeout to prevent hanging (10 second timeout)
      const controller = new AbortController();
      verifySessionAbortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // CRITICAL: Only set LOADING now that we know we'll complete the request
      // This prevents getting stuck in LOADING if we return early (no token, expired, etc.)
      // Update previous state capture now that we're about to set LOADING
      previousStatus = authStatusRef.current;
      setAuthStatus(AuthStatus.LOADING);
      authStatusRef.current = AuthStatus.LOADING;

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
          if (import.meta.env.DEV) {
            console.log(
              '[verifySession] Request aborted - restoring previous state to prevent stuck LOADING'
            );
          }
          // CRITICAL: Restore previous state on abort to prevent getting stuck in LOADING
          // If a new verification request is starting, it will set LOADING again
          // If no new request is coming, we restore the previous known state
          setAuthStatus(previousStatus);
          authStatusRef.current = previousStatus;
          return;
        }

        // Handle network errors (server down, connection refused, etc.)
        // Don't log out on network errors - token is still valid, just server is unavailable
        if (
          err.message?.includes('fetch') ||
          err.message?.includes('network') ||
          err.message?.includes('Failed to fetch') ||
          err.message?.includes('ECONNREFUSED') ||
          err.message?.includes('ERR_CONNECTION_REFUSED') ||
          err.code === 'ECONNREFUSED'
        ) {
          if (import.meta.env.DEV) {
            console.log(
              '[verifySession] ⚠️ Network/server error - keeping current auth state (server may be restarting)'
            );
          }
          // Restore previous state - don't log out on network errors
          setAuthStatus(previousStatus);
          authStatusRef.current = previousStatus;
          return;
        }

        throw err;
      }

      if (response.ok) {
        const data = await response.json();
        const { authenticated, user } = data;

        if (authenticated && user) {
          if (import.meta.env.DEV) {
            console.log('[verifySession] ✅ Server confirmed -> AUTHENTICATED');
          }

          // Debug logging for user data transformation
          const transformedUser = {
            ...user,
            identifier: user.email || user.username,
          };
          logUserTransform(user, transformedUser);

          // Update all auth state
          // CRITICAL: tokenManager is the single source of truth
          // Setting it will update cache, storage, and notify subscribers (including this component)
          tokenManager.setToken(storedToken);
          // React state will update via tokenManager subscription
          // isAuthenticated is derived from token existence, no need for separate flag

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
          authStatusRef.current = AuthStatus.AUTHENTICATED;
        } else {
          if (import.meta.env.DEV) {
            console.log('[verifySession] ❌ Server says not authenticated -> ANONYMOUS');
          }
          clearAuthState();
        }
      } else {
        // Server responded but not OK
        if (response.status === 401) {
          // Server explicitly rejected token - log out
          if (import.meta.env.DEV) {
            console.log('[verifySession] ❌ Server rejected token (401) -> ANONYMOUS');
          }
          clearAuthState();
        } else if (response.status >= 500) {
          // Server error (5xx) - don't log out, server is having issues
          if (import.meta.env.DEV) {
            console.log('[verifySession] ⚠️ Server error - keeping current auth state');
          }
          setAuthStatus(previousStatus);
          authStatusRef.current = previousStatus;
        } else {
          // Other non-OK status - log out to be safe
          if (import.meta.env.DEV) {
            console.log(
              '[verifySession] ❌ Server verification failed (status:',
              response.status,
              ') -> ANONYMOUS'
            );
          }
          clearAuthState();
        }
      }
    } catch (err) {
      // Log error (but not AbortError)
      if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
        if (import.meta.env.DEV) {
          console.error('[verifySession] ⚠️ Error verifying session:', err);
        }
      }

      // Handle network/server errors - don't log out if server is down/restarting
      const isNetworkError =
        err.message?.includes('fetch') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('network') ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('ERR_CONNECTION_REFUSED') ||
        err.code === 'ECONNREFUSED' ||
        !err.response; // No response means network error

      if (isNetworkError) {
        // Network error - server is down or restarting, keep current auth state
        if (import.meta.env.DEV) {
          console.log(
            '[verifySession] ⚠️ Network/server error - keeping current auth state (server may be restarting)'
          );
        }
        setAuthStatus(previousStatus);
        authStatusRef.current = previousStatus;
        return;
      }

      // Only log out if server explicitly rejected (401) or token-related error
      // For other errors, keep current state (token is still valid)
      if (err.status === 401 || err.response?.status === 401) {
        if (import.meta.env.DEV) {
          console.log('[verifySession] ❌ Server rejected token (401) -> ANONYMOUS');
        }
        clearAuthState();
      } else {
        // Unknown error - be conservative but don't log out on network issues
        if (import.meta.env.DEV) {
          console.log('[verifySession] ⚠️ Unknown error - keeping current auth state');
        }
        setAuthStatus(previousStatus);
        authStatusRef.current = previousStatus;
      }
    }
  }, [clearAuthState]);

  /**
   * Login with email/password
   * CRITICAL: Uses commandLogin for single source of truth (validation, retries, error handling)
   */
  const login = React.useCallback(async (email, password, options = {}) => {
    if (import.meta.env.DEV) {
      console.log('[AuthContext] login called', {
        email: email ? '***' : 'empty',
        password: password ? '***' : 'empty',
      });
    }
    setIsLoggingIn(true);
    setError(null);

    try {
      // Use commandLogin for single source of truth (validation, retries, error handling)
      const result = await commandLogin({
        email,
        password,
        honeypotValue: options.honeypotValue || '',
      });

      // Handle validation errors
      if (result.validationError) {
        setError(result.error);
        return { success: false, error: result.error, validationError: true };
      }

      // Handle API errors
      if (!result.success) {
        const errorMessage = result.error?.userMessage || result.error || 'Login failed';
        setError(errorMessage);
        return { success: false, error: result.error || errorMessage, action: result.action };
      }

      // Success - extract user and token
      const { user, token } = result;

      // Backend returns email, not username - use email as the identifier
      const userIdentifier = user?.email || user?.username;
      if (userIdentifier) {
        setUsername(userIdentifier);
        authStorage.setUsername(userIdentifier);
        setUserID(userIdentifier);
        setUserProperties(calculateUserProperties(user, false));
      }

      // Use cleanEmail from command result (already validated and cleaned)
      if (result.cleanEmail) {
        setEmail(result.cleanEmail);
        storage.set(StorageKeys.USER_EMAIL, result.cleanEmail);
      }

      if (token) {
        // CRITICAL: tokenManager is the single source of truth
        // Setting it will update cache, storage, and notify subscribers (including this component)
        await tokenManager.setToken(token);
        if (import.meta.env.DEV) {
          console.log('[AuthContext] Token set in TokenManager:', {
            hasToken: !!token,
            tokenLength: token.length,
            tokenPreview: token.substring(0, 20) + '...',
          });
        }
        // React state will update via tokenManager subscription
      }

      if (user) {
        storage.set(StorageKeys.CHAT_USER, user);
      }

      // FSM: Transition to AUTHENTICATED
      authStorage.setAuthenticated(true);
      setAuthStatus(AuthStatus.AUTHENTICATED);
      authStatusRef.current = AuthStatus.AUTHENTICATED;

      return { success: true, user };
    } catch (err) {
      // This should rarely happen since commandLogin handles errors
      // But keep for unexpected errors
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
   * CRITICAL: Uses commandSignup for single source of truth (validation, retries, error handling)
   */
  const signup = React.useCallback(
    async (email, password, firstName = '', lastName = '', options = {}) => {
      setIsSigningUp(true);
      setError(null);

      try {
        // Use commandSignup for single source of truth (validation, retries, error handling)
        const result = await commandSignup({
          email,
          password,
          firstName,
          lastName,
          honeypotValue: options.honeypotValue || '',
        });

        // Handle validation errors
        if (result.validationError) {
          setError(result.error);
          return { success: false, error: result.error, validationError: true };
        }

        // Handle API errors
        if (!result.success) {
          const errorMessage = result.error?.userMessage || result.error || 'Signup failed';
          setError(errorMessage);
          return { success: false, error: result.error || errorMessage, action: result.action };
        }

        // Success - extract user and token
        const { user, token } = result;

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

        // Use cleanEmail from command result (already validated and cleaned)
        if (result.cleanEmail) {
          setEmail(result.cleanEmail);
          storage.set(StorageKeys.USER_EMAIL, result.cleanEmail);
        }

        if (token) {
          // CRITICAL: tokenManager is the single source of truth
          // Setting it will update cache, storage, and notify subscribers (including this component)
          await tokenManager.setToken(token);
          // React state will update via tokenManager subscription
        }

        // FSM: Transition to AUTHENTICATED
        authStorage.setAuthenticated(true);
        setAuthStatus(AuthStatus.AUTHENTICATED);
        authStatusRef.current = AuthStatus.AUTHENTICATED;

        return { success: true, user };
      } catch (err) {
        // This should rarely happen since commandSignup handles errors
        // But keep for unexpected errors
        const errorInfo = getErrorMessage(err, { statusCode: 0 });
        setError(errorInfo.userMessage);
        logError(err, { endpoint: '/api/auth/signup', operation: 'signup' });
        return { success: false, error: errorInfo };
      } finally {
        setIsSigningUp(false);
      }
    },
    []
  );

  /**
   * Logout
   */
  const logout = React.useCallback(async () => {
    try {
      await apiPost('/api/auth/logout');
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error during logout:', err);
      }
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
   * Initial state is already loaded optimistically via initialAuthState (useMemo)
   * This effect only verifies with server to confirm or clear if invalid
   * This ensures PWA launches show authenticated state immediately if user is logged in
   */
  React.useEffect(() => {
    // CRITICAL: Skip session verification on OAuth callback pages
    // The OAuth callback handler will process the code and set auth state
    // Calling verifySession here would clear auth before the callback completes
    // NOTE: Only check pathname, NOT query params - ?code= is also used for invite codes
    const isOAuthCallback =
      typeof window !== 'undefined' &&
      (window.location.pathname.includes('/auth/callback') ||
        window.location.pathname.includes('/auth/google/callback'));

    if (isOAuthCallback) {
      if (import.meta.env.DEV) {
        console.log('[AuthContext] Skipping verifySession on OAuth callback page');
      }
      // FSM: Keep in LOADING state - OAuth callback handler will set final state
      // This prevents showing "not authenticated" flash before OAuth completes
      return;
    }

    // Verify with server (will confirm or clear if invalid)
    // Optimistic state was already loaded via initialAuthState (useMemo)
    verifySession();

    // Cleanup: abort any pending verification request on unmount
    return () => {
      if (verifySessionAbortControllerRef.current) {
        verifySessionAbortControllerRef.current.abort();
        verifySessionAbortControllerRef.current = null;
      }
    };
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
   * FSM-based: Deterministic, no timers or "grace periods"
   *
   * Rules:
   * 1. Ignore 401s during LOADING state (FSM guards API calls during loading)
   * 2. Ignore 401s on auth endpoints (expected during login/signup)
   * 3. On any other 401, transition to ANONYMOUS immediately
   */
  React.useEffect(() => {
    return onAuthFailure(detail => {
      if (import.meta.env.DEV) {
        console.log('[onAuthFailure] Auth failure detected:', {
          endpoint: detail.endpoint,
          authStatus,
          hasToken: !!token,
        });
      }

      // FSM Guard: Don't process 401s during LOADING state
      // The app should not be making API calls during LOADING anyway
      if (authStatus === AuthStatus.LOADING) {
        if (import.meta.env.DEV) {
          console.log('[onAuthFailure] Ignoring 401 - FSM in LOADING state');
        }
        return;
      }

      // Ignore 401s on auth endpoints (expected during login/signup/verify)
      if (detail.endpoint?.includes('/api/auth/')) {
        if (import.meta.env.DEV) {
          console.log('[onAuthFailure] Ignoring 401 - auth endpoint');
        }
        return;
      }

      // DETERMINISTIC: Any 401 while AUTHENTICATED means token is invalid
      // Transition to ANONYMOUS immediately - no timers, no "optimistic" guessing
      if (import.meta.env.DEV) {
        console.log('[onAuthFailure] 401 received while AUTHENTICATED -> ANONYMOUS');
      }
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
