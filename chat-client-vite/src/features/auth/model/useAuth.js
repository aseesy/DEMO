/**
 * useAuth Hook
 *
 * Main authentication hook that composes smaller focused hooks:
 * - useSessionVerification: Session verification on mount
 * - useEmailAuth: Email/password authentication
 * - useGoogleAuth: Google OAuth authentication
 *
 * This hook orchestrates authentication state and provides a unified API.
 * CRITICAL: Uses AuthContext for auth state to ensure synchronization with ChatRoom.
 */

import React from 'react';
import { apiPost, apiGet } from '../../../apiClient.js';
import { setUserProperties, setUserID } from '../../../utils/analyticsEnhancements.js';
import { authStorage } from '../../../adapters/storage';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import { calculateUserProperties } from './useSessionVerification.js';

import { useGoogleAuth } from './useGoogleAuth.js';
import { useEmailAuth } from './useEmailAuth.js';

export function useAuth() {
  // Form state
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');

  // CRITICAL: Use AuthContext for auth state instead of local state
  // This ensures synchronization with ChatRoom and prevents auth state mismatches
  // Gracefully handle case where AuthContext is not available (e.g., in tests)
  let authContext = null;
  try {
    authContext = useAuthContext();
  } catch (err) {
    // AuthContext not available (e.g., in tests) - use local state as fallback
    console.warn('[useAuth] AuthContext not available, using local state');
  }

  // Use AuthContext state if available, otherwise use local state
  const [localIsAuthenticated, setLocalIsAuthenticated] = React.useState(false);
  const [localIsCheckingAuth, setLocalIsCheckingAuth] = React.useState(false);
  const isAuthenticated = authContext?.isAuthenticated ?? localIsAuthenticated;
  const isCheckingAuth = authContext?.isCheckingAuth ?? localIsCheckingAuth;
  const [error, setError] = React.useState('');

  // Session verification when AuthContext is not available (e.g., in tests)
  React.useEffect(() => {
    if (authContext) {
      // AuthContext handles session verification
      return;
    }

    const verifySession = async () => {
      setLocalIsCheckingAuth(true);
      try {
        const token = authStorage.getToken();
        if (!token) {
          setLocalIsCheckingAuth(false);
          return;
        }

        const response = await apiGet('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setLocalIsAuthenticated(true);
            authStorage.setAuthenticated(true);
            if (data.user?.email) {
              setUserID(data.user.email);
              setUserProperties(calculateUserProperties(data.user, false));
            }
          } else {
            authStorage.clearAuth();
            setLocalIsAuthenticated(false);
          }
        } else {
          authStorage.clearAuth();
          setLocalIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error verifying session:', err);
        const storedAuth = authStorage.isAuthenticated();
        setLocalIsAuthenticated(storedAuth);
      } finally {
        setLocalIsCheckingAuth(false);
      }
    };

    const storedToken = authStorage.getToken();
    if (storedToken) {
      verifySession();
    } else {
      setLocalIsCheckingAuth(false);
    }
  }, [authContext]);

  // Wrapper for setIsAuthenticated that updates both AuthContext (if available) and local state
  const setIsAuthenticatedWrapper = React.useCallback(
    value => {
      authStorage.setAuthenticated(value);
      // Update local state if AuthContext is not available
      if (!authContext) {
        setLocalIsAuthenticated(value);
      }
    },
    [authContext]
  );

  // Compose Google auth
  const { isGoogleLoggingIn, handleGoogleLogin, handleGoogleCallback } = useGoogleAuth({
    setIsAuthenticated: setIsAuthenticatedWrapper,
    setError,
  });

  // Compose email auth - use AuthContext's login function if available
  // Otherwise fall back to useEmailAuth's commandLogin
  const emailAuthResult = useEmailAuth({
    email,
    password,
    firstName,
    lastName,
    setIsAuthenticated: setIsAuthenticatedWrapper,
    setError,
  });

  // Override handleLogin to use AuthContext's login if available
  const handleLogin = React.useCallback(
    async (e, spamFields = {}) => {
      if (e?.preventDefault) e.preventDefault();
      setError('');

      // Use AuthContext's login if available (preferred)
      if (authContext?.login) {
        console.log('[useAuth] Calling authContext.login');
        try {
          const result = await authContext.login(email, password);
          console.log('[useAuth] authContext.login result:', result?.success ? 'success' : 'failed', result?.error);
          if (result.success) {
            // Update local state if AuthContext is not managing it
            if (!authContext) {
              setLocalIsAuthenticated(true);
            }
            return { success: true, user: result.user };
          } else {
            const errorMsg = result.error?.userMessage || result.error || 'Login failed';
            setError(errorMsg);
            return { success: false, error: result.error };
          }
        } catch (err) {
          const errorMsg = err.message || 'Login failed';
          setError(errorMsg);
          return { success: false, error: err };
        }
      }

      // Fallback to useEmailAuth's handleLogin (updates local state)
      const result = await emailAuthResult.handleLogin(e, spamFields);
      // Safety check: ensure result is defined before accessing properties
      if (result && result.success && !authContext) {
        setLocalIsAuthenticated(true);
      }
      // Return result or a default error object if undefined
      return result || { success: false, error: 'Login failed' };
    },
    [email, password, authContext, setError, emailAuthResult]
  );

  const { isLoggingIn, isSigningUp, handleSignup, handleRegister } = emailAuthResult;

  // Handle logout
  const handleLogout = React.useCallback(async () => {
    try {
      await apiPost('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Use AuthContext's logout if available, otherwise clear storage
      if (authContext?.logout) {
        await authContext.logout();
      } else {
        authStorage.clearAuth();
      }
      setUserID(null);
      setUserProperties({});
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setError('');
    }
  }, [authContext]);

  return {
    // State
    email,
    password,
    firstName,
    lastName,
    isAuthenticated,
    isCheckingAuth,
    isLoggingIn,
    isSigningUp,
    isGoogleLoggingIn,
    error,

    // Setters
    setEmail,
    setPassword,
    setFirstName,
    setLastName,
    setError,

    // Actions
    handleLogin,
    handleSignup,
    handleRegister,
    handleGoogleLogin,
    handleGoogleCallback,
    handleLogout,
  };
}

export default useAuth;
