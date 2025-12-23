/**
 * useEmailAuth Hook
 *
 * Manages email/password authentication state and delegates to pure command functions.
 * This hook follows Command-Query Separation (CQS):
 * - Command functions (in utils/authQueries.js) handle API calls
 * - This hook manages state mutations
 */

import React from 'react';
import { setUserProperties, setUserID } from '../../../utils/analyticsEnhancements.js';
import { commandLogin, commandSignup, commandRegister } from '../../../utils/authQueries.js';
import { storage, StorageKeys, authStorage } from '../../../adapters/storage';
import { calculateUserProperties } from './useSessionVerification.js';

/**
 * Apply successful auth result to state and storage
 * @param {Object} result - Auth result from command
 * @param {boolean} isNewUser - Whether this is a new user signup
 * @param {Function} setUsername - State setter
 * @param {Function} setIsAuthenticated - State setter
 */
function applyAuthSuccess(result, isNewUser, setUsername, setIsAuthenticated) {
  setIsAuthenticated(true);

  if (result.user?.username) {
    setUsername(result.user.username);
    authStorage.setUsername(result.user.username);
    setUserID(result.user.username);
    const userProperties = calculateUserProperties(result.user, isNewUser);
    setUserProperties(userProperties);
  }

  authStorage.setAuthenticated(true);

  if (result.cleanEmail) {
    storage.set(StorageKeys.USER_EMAIL, result.cleanEmail);
  }

  if (result.token) {
    authStorage.setToken(result.token);
  }

  if (result.user) {
    storage.set(StorageKeys.CHAT_USER, result.user);
  }
}

export function useEmailAuth({
  email,
  password,
  username,
  setUsername,
  setIsAuthenticated,
  setError,
}) {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isSigningUp, setIsSigningUp] = React.useState(false);

  /**
   * Handle email/password login
   * Command: Updates loading state, calls API, applies result to state
   */
  const handleLogin = React.useCallback(
    async (e, spamFields = {}) => {
      if (e?.preventDefault) e.preventDefault();
      setError('');
      setIsLoggingIn(true);

      const result = await commandLogin({
        email,
        password,
        honeypotValue: spamFields.website || '',
      });

      if (result.validationError) {
        setError(result.error);
        setIsLoggingIn(false);
        return;
      }

      if (!result.success) {
        setError(result.error);
        setIsLoggingIn(false);
        return { success: false, error: result, action: result.action };
      }

      // Apply successful auth to state
      applyAuthSuccess(result, false, setUsername, setIsAuthenticated);
      setIsLoggingIn(false);

      return { success: true, user: result.user };
    },
    [email, password, setUsername, setIsAuthenticated, setError]
  );

  /**
   * Handle signup
   * Command: Updates loading state, calls API, applies result to state
   */
  const handleSignup = React.useCallback(
    async (e, spamFields = {}) => {
      if (e?.preventDefault) e.preventDefault();
      setError('');
      setIsSigningUp(true);

      const result = await commandSignup({
        email,
        password,
        username,
        honeypotValue: spamFields.website || '',
      });

      if (result.validationError) {
        setError(result.error);
        setIsSigningUp(false);
        return;
      }

      if (!result.success) {
        setError(result.error);
        setIsSigningUp(false);
        return { success: false, error: result, action: result.action };
      }

      // Apply successful auth to state
      applyAuthSuccess(result, true, setUsername, setIsAuthenticated);
      setIsSigningUp(false);

      return { success: true, user: result.user };
    },
    [email, password, username, setUsername, setIsAuthenticated, setError]
  );

  /**
   * Register new user with co-parent invitation
   * Command: Updates loading state, calls API, applies result to state
   */
  const handleRegister = React.useCallback(
    async (e, coParentEmail) => {
      if (e?.preventDefault) e.preventDefault();
      setError('');
      setIsSigningUp(true);

      const result = await commandRegister({
        email,
        password,
        username,
        coParentEmail,
      });

      if (result.validationError) {
        setError(result.error);
        setIsSigningUp(false);
        return;
      }

      if (!result.success) {
        setError(result.error);
        setIsSigningUp(false);
        return { success: false, error: result, action: result.action };
      }

      // Apply successful auth to state
      applyAuthSuccess(result, true, setUsername, setIsAuthenticated);

      // Store pending invitation if one was created
      if (result.invitation) {
        storage.set(StorageKeys.PENDING_SENT_INVITATION, {
          inviteeEmail: result.invitation.inviteeEmail,
          isExistingUser: result.invitation.isExistingUser,
        });
      }

      setIsSigningUp(false);

      return { success: true, user: result.user, invitation: result.invitation };
    },
    [email, password, username, setUsername, setIsAuthenticated, setError]
  );

  return {
    isLoggingIn,
    isSigningUp,
    handleLogin,
    handleSignup,
    handleRegister,
  };
}

export default useEmailAuth;
