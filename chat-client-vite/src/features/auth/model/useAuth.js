/**
 * useAuth Hook
 *
 * Main authentication hook that composes smaller focused hooks:
 * - useSessionVerification: Session verification on mount
 * - useEmailAuth: Email/password authentication
 * - useGoogleAuth: Google OAuth authentication
 *
 * This hook orchestrates authentication state and provides a unified API.
 */

import React from 'react';
import { apiPost } from '../../../apiClient.js';
import { setUserProperties, setUserID } from '../../../utils/analyticsEnhancements.js';
import { authStorage } from '../../../adapters/storage';

import { useSessionVerification } from './useSessionVerification.js';
import { useGoogleAuth } from './useGoogleAuth.js';
import { useEmailAuth } from './useEmailAuth.js';

export function useAuth() {
  // Form state
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [error, setError] = React.useState('');

  // Compose session verification
  const { isCheckingAuth } = useSessionVerification({
    setIsAuthenticated,
  });

  // Compose Google auth
  const { isGoogleLoggingIn, handleGoogleLogin, handleGoogleCallback } = useGoogleAuth({
    setIsAuthenticated,
    setError,
  });

  // Compose email auth
  const { isLoggingIn, isSigningUp, handleLogin, handleSignup, handleRegister } = useEmailAuth({
    email,
    password,
    firstName,
    lastName,
    setIsAuthenticated,
    setError,
  });

  // Handle logout
  const handleLogout = React.useCallback(async () => {
    try {
      await apiPost('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      authStorage.clearAuth();
      setUserID(null);
      setUserProperties({});
      setIsAuthenticated(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setError('');
    }
  }, []);

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
