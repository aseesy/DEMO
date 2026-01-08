/**
 * 🔒 SEALED FILE - DO NOT MODIFY WITHOUT APPROVAL
 * 
 * useAuth Hook
 *
 * ⚠️ CRITICAL: This file is SEALED and SET IN STONE.
 * This hook provides the interface between UI and AuthContext.
 * 
 * RULES FOR AI ASSISTANTS:
 * - ❌ DO NOT modify AuthContext delegation pattern
 * - ❌ DO NOT change return value API (used by components)
 * - ✅ CAN modify UI-facing error messages
 * - ✅ CAN update form field handling (if UI changes)
 * 
 * Before modifying: Check docs/AUTH_FLOW_SEALED.md for approval process.
 * 
 * ARCHITECTURE: This hook is a pure interface to AuthContext.
 * It provides a unified API for authentication operations.
 *
 * CRITICAL: AuthContext is the SINGLE SOURCE OF TRUTH for auth state.
 * This hook MUST be used within AuthProvider - no fallbacks.
 * If AuthProvider is missing, it throws immediately (fail fast).
 * 
 * See: docs/AUTH_FLOW_SEALED.md for complete sealing documentation.
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
    async (e, spamFields = {}) => {
      if (e?.preventDefault) e.preventDefault();
      setError('');

      if (import.meta.env.DEV) {
        console.log('[useAuth] Calling authContext.login');
      }
      try {
        const result = await authContext.login(email, password, {
          honeypotValue: spamFields.website || '',
        });
        if (import.meta.env.DEV) {
          console.log('[useAuth] authContext.login result:', result?.success ? 'success' : 'failed');
        }
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

  const { isLoggingIn, isSigningUp, handleRegister } = emailAuthResult;

  // handleSignup delegates to AuthContext's signup (single source of truth)
  const handleSignup = React.useCallback(
    async (e, spamFields = {}) => {
      if (e?.preventDefault) e.preventDefault();
      setError('');

      if (import.meta.env.DEV) {
        console.log('[useAuth] Calling authContext.signup');
      }
      try {
        const result = await authContext.signup(email, password, firstName, lastName, {
          honeypotValue: spamFields.website || '',
        });
        if (import.meta.env.DEV) {
          console.log('[useAuth] authContext.signup result:', result?.success ? 'success' : 'failed');
        }
        if (result.success) {
          return { success: true, user: result.user };
        } else {
          const errorMsg = result.error?.userMessage || result.error || 'Signup failed';
          setError(errorMsg);
          return { success: false, error: result.error };
        }
      } catch (err) {
        const errorMsg = err.message || 'Signup failed';
        setError(errorMsg);
        return { success: false, error: err };
      }
    },
    [email, password, firstName, lastName, authContext, setError]
  );

  // handleLogout delegates to AuthContext (single source of truth)
  const handleLogout = React.useCallback(async () => {
    try {
      await authContext.logout();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Logout error:', err);
      }
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
