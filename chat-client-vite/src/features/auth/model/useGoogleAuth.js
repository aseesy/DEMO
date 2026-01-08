/**
 * useGoogleAuth Hook
 *
 * Handles Google OAuth authentication:
 * - Initiate OAuth flow
 * - Handle OAuth callback
 * - CSRF state validation
 */

import React from 'react';
import { apiGet, apiPost } from '../../../apiClient.js';
import { setUserProperties, setUserID } from '../../../utils/analyticsEnhancements.js';
import {
  getErrorMessage,
  logError,
  retryWithBackoff,
  isRetryableError,
} from '../../../utils/errorHandler.jsx';
import {
  generateOAuthState,
  storeOAuthState,
  validateOAuthState,
  clearOAuthState,
  generatePKCEAsync,
  getStoredCodeVerifier,
} from '../../../utils/oauthHelper.js';
import { storage, StorageKeys, authStorage } from '../../../adapters/storage';
import { tokenManager } from '../../../utils/tokenManager.js';
import { calculateUserProperties } from './useSessionVerification.js';

export function useGoogleAuth({ setIsAuthenticated, setError }) {
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = React.useState(false);

  const handleGoogleLogin = React.useCallback(async () => {
    console.log('[useGoogleAuth] handleGoogleLogin called');
    setError('');
    setIsGoogleLoggingIn(true);

    try {
      // Generate PKCE code verifier and challenge (required for SPA security)
      const pkce = await generatePKCEAsync();
      
      // Generate state parameter for CSRF protection
      const state = generateOAuthState();
      
      // Store state and PKCE code verifier for callback validation
      storeOAuthState(state, pkce);

      // Get returnTo URL if available
      const returnTo = storage.getString(StorageKeys.RETURN_URL);

      // Build query parameters for OAuth start
      const params = new URLSearchParams({
        state: state,
        code_challenge: pkce.codeChallenge,
      });
      if (returnTo) {
        params.append('returnTo', returnTo);
      }

      console.log('[useGoogleAuth] Making API call to /api/auth/google');
      const response = await retryWithBackoff(
        () => apiGet(`/api/auth/google?${params.toString()}`),
        {
          maxRetries: 2,
          shouldRetry: (error, statusCode) => {
            if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
              return false;
            }
            return isRetryableError(error, statusCode);
          },
        }
      );
      console.log('[useGoogleAuth] API response status:', response.status);

      const data = await response.json();
      console.log('[useGoogleAuth] API response data:', data);

      if (!response.ok) {
        const errorInfo = getErrorMessage(data, {
          statusCode: response.status,
          endpoint: '/api/auth/google',
        });
        logError(data, { endpoint: '/api/auth/google', operation: 'initiate_oauth' });
        clearOAuthState();

        if (data.code === 'OAUTH_CONFIG_ERROR' || response.status === 500) {
          errorInfo.userMessage =
            'Google sign-in is not configured. Please contact support or use email/password sign-in.';
          errorInfo.action = 'use_email_password';
        }

        setError(errorInfo.userMessage);
        setIsGoogleLoggingIn(false);
        return { success: false, error: errorInfo };
      }

      // Server should include state in authUrl, but ensure it's there
      const authUrl = data.authUrl.includes('state=')
        ? data.authUrl
        : `${data.authUrl}&state=${encodeURIComponent(state)}`;

      console.log('[useGoogleAuth] Redirecting to:', authUrl);
      window.location.href = authUrl;
      return { success: true, redirecting: true };
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/auth/google' });
      logError(err, { endpoint: '/api/auth/google', operation: 'initiate_oauth' });
      clearOAuthState();
      setError(errorInfo.userMessage);
      setIsGoogleLoggingIn(false);
      return { success: false, error: errorInfo };
    }
  }, [setError]);

  const handleGoogleCallback = React.useCallback(
    async (code, state = null) => {
      setIsGoogleLoggingIn(true);
      setError('');

      try {
        // Validate state parameter (client-side CSRF check)
        if (state) {
          if (!validateOAuthState(state)) {
            logError(new Error('OAuth state mismatch'), {
              endpoint: '/api/auth/google/callback',
              operation: 'oauth_callback',
              security: true,
            });
            setError('Security validation failed. Please try signing in again.');
            clearOAuthState();
            setIsGoogleLoggingIn(false);
            return false;
          }
        }

        // Get stored PKCE code verifier
        const codeVerifier = getStoredCodeVerifier();

        // Prepare callback payload
        const payload = { code };
        if (state) {
          payload.state = state;
        }
        if (codeVerifier) {
          payload.code_verifier = codeVerifier;
        }

        // Get invite token if available
        const inviteToken = storage.getString(StorageKeys.INVITATION_TOKEN);
        if (inviteToken) {
          payload.inviteToken = inviteToken;
        }

        const response = await retryWithBackoff(
          () => apiPost('/api/auth/google/callback', payload),
          {
            maxRetries: 2,
            shouldRetry: (error, statusCode) => {
              if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
                return false;
              }
              return isRetryableError(error, statusCode);
            },
          }
        );

        // Clear OAuth state and PKCE after successful request
        clearOAuthState();

        let data;
        try {
          data = await response.json();
        } catch (_jsonError) {
          const text = await response.text();
          console.error('Invalid JSON response from OAuth callback:', text);
          logError(new Error('Invalid JSON response'), {
            endpoint: '/api/auth/google/callback',
            responseText: text,
          });
          setError('Server returned an invalid response. Please try again.');
          setIsGoogleLoggingIn(false);
          return false;
        }

        if (!response.ok) {
          const errorInfo = getErrorMessage(data, {
            statusCode: response.status,
            endpoint: '/api/auth/google/callback',
          });
          logError(data, { endpoint: '/api/auth/google/callback', operation: 'oauth_callback' });

          // Handle specific error codes
          if (data.code === 'OAUTH_CONFIG_ERROR') {
            errorInfo.userMessage =
              'Google sign-in is not configured. Please contact support or use email/password sign-in.';
          } else if (data.code === 'OAUTH_INVALID_CLIENT') {
            errorInfo.userMessage =
              'OAuth configuration error. Please verify your Google OAuth credentials are correct.';
          } else if (data.code === 'INVALID_STATE') {
            errorInfo.userMessage = 'Security validation failed. Please try signing in again.';
          } else if (data.code === 'INVALID_PKCE') {
            errorInfo.userMessage = 'Security validation failed. Please try signing in again.';
          } else if (data.code === 'INVALID_ID_TOKEN') {
            errorInfo.userMessage = 'Authentication failed. Please try signing in again.';
          } else if (data.code === 'EMAIL_NOT_VERIFIED') {
            errorInfo.userMessage = 'Your Google email is not verified. Please verify your email and try again.';
          } else if (data.code === 'CODE_ALREADY_USED') {
            // IDEMPOTENCY: Code was already used and no existing session
            // This is not retryable - user must start fresh
            errorInfo.userMessage = 'Sign-in session expired. Please try signing in again.';
          } else if (data.code === 'USER_CREATION_ERROR') {
            errorInfo.userMessage =
              'Failed to create your account. Please try again or contact support.';
          } else if (data.code === 'INVALID_USER_DATA') {
            errorInfo.userMessage = 'Account creation issue. Please try again or contact support.';
          } else if (data.code === 'TOKEN_GENERATION_ERROR') {
            errorInfo.userMessage = 'Authentication failed. Please try signing in again.';
          } else if (data.code === 'MISSING_ID_TOKEN') {
            errorInfo.userMessage = 'Authentication failed. Please try signing in again.';
          } else if (data.error?.includes('already used')) {
            errorInfo.userMessage =
              'This sign-in link has already been used. Please try signing in again.';
          } else if (data.error?.includes('expired')) {
            errorInfo.userMessage = 'The sign-in session expired. Please try again.';
          }

          setError(errorInfo.userMessage);
          setIsGoogleLoggingIn(false);
          return false;
        }

        // Success - set authentication state
        setIsAuthenticated(true);
        if (data.user?.email) {
          setUserID(data.user.email);
          const userProperties = calculateUserProperties(data.user, false);
          setUserProperties(userProperties);
        }
        authStorage.setAuthenticated(true);
        if (data.user?.email) {
          storage.set(StorageKeys.USER_EMAIL, data.user.email);
        }
        if (data.token) {
          // CRITICAL: Update TokenManager FIRST for immediate API access
          tokenManager.setToken(data.token);
          authStorage.setToken(data.token);
        }
        if (data.user) {
          storage.set(StorageKeys.CHAT_USER, data.user);
        }

        setIsGoogleLoggingIn(false);
        return true;
      } catch (err) {
        const errorInfo = getErrorMessage(err, {
          statusCode: 0,
          endpoint: '/api/auth/google/callback',
        });
        logError(err, { endpoint: '/api/auth/google/callback', operation: 'oauth_callback' });
        setError(errorInfo.userMessage);
        setIsGoogleLoggingIn(false);
        return false;
      }
    },
    [setIsAuthenticated, setError]
  );

  return {
    isGoogleLoggingIn,
    handleGoogleLogin,
    handleGoogleCallback,
  };
}

export default useGoogleAuth;
