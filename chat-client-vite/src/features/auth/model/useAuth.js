/**
 * useAuth Hook
 *
 * ARCHITECTURE: This hook is a pure interface to AuthContext.
 * It provides a unified API for authentication operations.
 *
 * CRITICAL: AuthContext is the SINGLE SOURCE OF TRUTH for auth state.
 * This hook MUST be used within AuthProvider - no fallbacks.
 * If AuthProvider is missing, it throws immediately (fail fast).
 */

import React from 'react';
import { setUserProperties, setUserID } from '../../../utils/analyticsEnhancements.js';
import { authStorage } from '../../../adapters/storage';
import { useAuthContext } from '../../../context/AuthContext.jsx';

import { useGoogleAuth } from './useGoogleAuth.js';
import { useEmailAuth } from './useEmailAuth.js';

export function useAuth() {
  // Form state (local to this hook - not auth state)
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');

  // CRITICAL: AuthContext is the single source of truth
  // No try/catch - if AuthProvider is missing, fail fast with clear error
  const authContext = useAuthContext();

  // Derive state from AuthContext (single source of truth)
  const isAuthenticated = authContext.isAuthenticated;
  const isCheckingAuth = authContext.isCheckingAuth;
  const authStatus = authContext.authStatus;
  const [error, setError] = React.useState('');

  // Wrapper for setIsAuthenticated that delegates to AuthContext
  const setIsAuthenticatedWrapper = React.useCallback(value => {
    authStorage.setAuthenticated(value);
    // Note: AuthContext manages its own state via FSM
    // This wrapper is for hooks that need to signal auth changes
  }, []);

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

  // handleLogin delegates to AuthContext's login (single source of truth)
  const handleLogin = React.useCallback(
    async (e, _spamFields = {}) => {
      if (e?.preventDefault) e.preventDefault();
      setError('');

      console.log('[useAuth] Calling authContext.login');
      try {
        const result = await authContext.login(email, password);
        console.log('[useAuth] authContext.login result:', result?.success ? 'success' : 'failed');
        if (result.success) {
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
    },
    [email, password, authContext, setError]
  );

  const { isLoggingIn, isSigningUp, handleSignup, handleRegister } = emailAuthResult;

  // handleLogout delegates to AuthContext (single source of truth)
  const handleLogout = React.useCallback(async () => {
    try {
      await authContext.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
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
    // FSM State (from AuthContext - single source of truth)
    authStatus, // 'loading' | 'authenticated' | 'anonymous'
    isAuthenticated, // Derived: authStatus === 'authenticated'
    isCheckingAuth, // Derived: authStatus === 'loading'

    // Form state (local to this hook)
    email,
    password,
    firstName,
    lastName,

    // Action states
    isLoggingIn,
    isSigningUp,
    isGoogleLoggingIn,
    error,

    // Form setters
    setEmail,
    setPassword,
    setFirstName,
    setLastName,
    setError,

    // Actions (delegate to AuthContext)
    handleLogin,
    handleSignup,
    handleRegister,
    handleGoogleLogin,
    handleGoogleCallback,
    handleLogout,
  };
}

export default useAuth;
