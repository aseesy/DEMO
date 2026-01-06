import React from 'react';
import {
  getErrorMessage,
  logError,
  retryWithBackoff,
  isRetryableError,
} from '../utils/errorHandler.jsx';
import { sessionStorage as sessionStorageAdapter, StorageKeys } from '../adapters/storage';

/**
 * InvitationContext - Centralized invitation state management
 *
 * Provides:
 * - Invitation token/code persistence in sessionStorage
 * - Token restoration on page load
 * - Multiple invitation handling
 * - Validation state management
 */

const InvitationContext = React.createContext(null);

/**
 * InvitationProvider component
 */
export function InvitationProvider({ children }) {
  const [token, setToken] = React.useState(null);
  const [shortCode, setShortCode] = React.useState(null);
  const [validationResult, setValidationResult] = React.useState(null);
  const [isValidating, setIsValidating] = React.useState(false);
  const [error, setError] = React.useState(null);

  /**
   * Load invitation state from sessionStorage
   */
  const loadInvitationState = React.useCallback(() => {
    const storedToken = sessionStorageAdapter.getString(StorageKeys.INVITATION_TOKEN);
    const storedCode = sessionStorageAdapter.getString(StorageKeys.INVITATION_CODE);

    return {
      token: storedToken || null,
      shortCode: storedCode || null,
    };
  }, []);

  /**
   * Save invitation state to sessionStorage
   */
  const saveInvitationState = React.useCallback((newToken, newCode) => {
    if (newToken) {
      sessionStorageAdapter.set(StorageKeys.INVITATION_TOKEN, newToken);
      setToken(newToken);
    } else {
      sessionStorageAdapter.remove(StorageKeys.INVITATION_TOKEN);
      setToken(null);
    }

    if (newCode) {
      sessionStorageAdapter.set(StorageKeys.INVITATION_CODE, newCode);
      setShortCode(newCode);
    } else {
      sessionStorageAdapter.remove(StorageKeys.INVITATION_CODE);
      setShortCode(null);
    }
  }, []);

  /**
   * Clear invitation state
   */
  const clearInvitationState = React.useCallback(() => {
    sessionStorageAdapter.removeMany([StorageKeys.INVITATION_TOKEN, StorageKeys.INVITATION_CODE]);
    setToken(null);
    setShortCode(null);
    setValidationResult(null);
    setError(null);
  }, []);

  /**
   * Validate invitation token or code
   * IMPORTANT: Always uses the passed parameters, not stored state
   * This ensures URL tokens take priority over cached values
   */
  const validateInvitation = React.useCallback(
    async (inviteToken, inviteCode) => {
      setIsValidating(true);
      setError(null);

      const inviteKey = inviteToken || inviteCode;
      if (!inviteKey) {
        const errorInfo = getErrorMessage({ code: 'TOKEN_REQUIRED' });
        setError(errorInfo);
        setValidationResult({ valid: false, code: 'TOKEN_REQUIRED' });
        setIsValidating(false);
        return { valid: false, code: 'TOKEN_REQUIRED' };
      }

      // CRITICAL FIX: Clear stale sessionStorage if we're validating a new token/code
      // This ensures URL parameters always take priority over cached values
      const currentStoredToken = sessionStorageAdapter.getString(StorageKeys.INVITATION_TOKEN);
      const currentStoredCode = sessionStorageAdapter.getString(StorageKeys.INVITATION_CODE);

      if (inviteToken && currentStoredToken && currentStoredToken !== inviteToken) {
        // New token from URL is different from cached token - clear the cache
        sessionStorageAdapter.removeMany([StorageKeys.INVITATION_TOKEN, StorageKeys.INVITATION_CODE]);
      } else if (inviteCode && currentStoredCode && currentStoredCode !== inviteCode) {
        // New code from URL is different from cached code - clear the cache
        sessionStorageAdapter.removeMany([StorageKeys.INVITATION_TOKEN, StorageKeys.INVITATION_CODE]);
      }

      // Save the current token/code to sessionStorage
      if (inviteToken) {
        saveInvitationState(inviteToken, null);
      } else if (inviteCode) {
        saveInvitationState(null, inviteCode);
      }

      try {
        const { apiGet } = await import('../apiClient.js');

        // Use invitations API endpoints (matches how ChatRoom.jsx creates invitations)
        // The /api/invitations/create creates entries in the invitations table,
        // so we validate against the same table using these endpoints
        const endpoint = inviteCode
          ? `/api/invitations/validate-code/${encodeURIComponent(inviteCode)}`
          : `/api/invitations/validate/${encodeURIComponent(inviteToken)}`;

        const response = await retryWithBackoff(() => apiGet(endpoint), {
          maxRetries: 3,
          shouldRetry: (error, statusCode) => {
            // Don't retry 4xx errors (except 429 rate limit)
            if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
              return false;
            }
            return isRetryableError(error, statusCode);
          },
        });

        const data = await response.json();

        if (!response.ok) {
          const errorInfo = getErrorMessage(data, { statusCode: response.status, endpoint });
          logError(data, {
            endpoint,
            operation: 'validate_invitation',
            token: inviteToken || inviteCode,
          });
          setError(errorInfo);
          setValidationResult({ valid: false, ...data, errorInfo });
          return { valid: false, ...data, errorInfo };
        }

        setValidationResult(data);
        return data;
      } catch (err) {
        const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: 'validate_invitation' });
        logError(err, {
          endpoint: 'validate_invitation',
          operation: 'validate_invitation',
          token: inviteToken || inviteCode,
        });
        setError(errorInfo);
        setValidationResult({ valid: false, code: 'NETWORK_ERROR', errorInfo });
        return { valid: false, code: 'NETWORK_ERROR', errorInfo };
      } finally {
        setIsValidating(false);
      }
    },
    [saveInvitationState]
  );

  /**
   * Restore invitation state on mount
   * REMOVED: This was causing stale tokens to override URL parameters
   * The validateInvitation function now handles sessionStorage directly
   * and ensures URL parameters always take priority
   */
  // React.useEffect(() => {
  //   const state = loadInvitationState();
  //   if (state.token) {
  //     setToken(state.token);
  //   }
  //   if (state.shortCode) {
  //     setShortCode(state.shortCode);
  //   }
  // }, [loadInvitationState]);

  const value = {
    // State
    token,
    shortCode,
    validationResult,
    isValidating,
    error,

    // Actions
    setToken: newToken => saveInvitationState(newToken, null),
    setShortCode: newCode => saveInvitationState(null, newCode),
    validateInvitation,
    clearInvitationState,
    setError,
  };

  return <InvitationContext.Provider value={value}>{children}</InvitationContext.Provider>;
}

/**
 * Hook to use invitation context
 */
export function useInvitationContext() {
  const context = React.useContext(InvitationContext);
  if (!context) {
    throw new Error('useInvitationContext must be used within InvitationProvider');
  }
  return context;
}

export default InvitationContext;
