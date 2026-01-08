import React from 'react';
import { apiGet, apiPost, apiDelete } from '../../../apiClient.js';
import {
  getErrorMessage,
  logError,
  retryWithBackoff,
  isRetryableError,
} from '../../../utils/errorHandler.jsx';

/**
 * Hook for managing co-parent pairing using the new unified pairing system
 * Feature: 004-account-pairing-refactor
 *
 * This replaces the old invitation system with a cleaner API:
 * - Three invitation types: email (7-day), link (7-day), code (15-min)
 * - Mutual detection: auto-pairs when both users invite each other
 * - Cleaner status model: unpaired, pending_sent, pending_received, paired
 */
export function usePairing() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [pairingStatus, setPairingStatus] = React.useState(null);

  /**
   * Get the current user's pairing status
   * @returns {Promise<Object>} Status object with: status, pairing?, partner?
   */
  const fetchPairingStatus = React.useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await retryWithBackoff(() => apiGet('/api/pairing/status'), {
        maxRetries: 3,
        shouldRetry: (error, statusCode) => {
          if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
            return false;
          }
          return isRetryableError(error, statusCode);
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const errorInfo = getErrorMessage(data, {
          statusCode: response.status,
          endpoint: '/api/pairing/status',
        });
        logError(data, { endpoint: '/api/pairing/status', operation: 'fetch_status' });
        setError(errorInfo.userMessage);
        return null;
      }

      setPairingStatus(data);
      return data;
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/pairing/status' });
      logError(err, { endpoint: '/api/pairing/status', operation: 'fetch_status' });
      setError(errorInfo.userMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new pairing invitation
   * @param {string} type - 'email', 'link', or 'code'
   * @param {string} inviteeEmail - Required for email type
   * @returns {Promise<Object>} Result with pairingCode, token (for email/link), expiresAt
   */
  const createPairing = React.useCallback(
    async (type, inviteeEmail = null) => {
      if (!type || !['email', 'link', 'code'].includes(type)) {
        setError('Invalid invitation type');
        return { success: false, error: 'Invalid invitation type' };
      }

      if (type === 'email' && !inviteeEmail) {
        setError('Email is required for email invitations');
        return { success: false, error: 'Email is required for email invitations' };
      }

      setIsCreating(true);
      setError('');

      try {
        console.log(`[usePairing] Creating pairing of type: ${type}`);
        const response = await retryWithBackoff(
          () => apiPost('/api/pairing/create', { type, inviteeEmail }),
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

        const data = await response.json();
        console.log(`[usePairing] Create response status: ${response.status}`, data);

        if (!response.ok) {
          const errorInfo = getErrorMessage(data, {
            statusCode: response.status,
            endpoint: '/api/pairing/create',
          });
          logError(data, { endpoint: '/api/pairing/create', operation: 'create_pairing', type });
          setError(errorInfo.userMessage);
          return { success: false, error: errorInfo.userMessage, code: data.code };
        }

        // Check if mutual invitation was detected
        if (data.mutual) {
          // Auto-refresh status since we're now paired
          await fetchPairingStatus();
          return {
            success: true,
            mutual: true,
            message: data.message,
            sharedRoomId: data.sharedRoomId,
          };
        }

        return {
          success: true,
          pairingCode: data.pairingCode,
          token: data.token,
          expiresAt: data.expiresAt,
          inviteType: data.inviteType,
        };
      } catch (err) {
        console.error('[usePairing] Create pairing exception:', err);
        const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/pairing/create' });
        logError(err, { endpoint: '/api/pairing/create', operation: 'create_pairing', type });
        setError(errorInfo.userMessage);
        return { success: false, error: errorInfo.userMessage };
      } finally {
        setIsCreating(false);
      }
    },
    [fetchPairingStatus]
  );

  /**
   * Validate a pairing code (public - no auth required)
   * @param {string} code - The pairing code (e.g., "LZ-842396")
   * @returns {Promise<Object>} Validation result
   */
  const validateCode = React.useCallback(async code => {
    if (!code) {
      return { valid: false, code: 'CODE_REQUIRED', error: 'Pairing code is required' };
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await retryWithBackoff(
        () => apiGet(`/api/pairing/validate/${encodeURIComponent(code)}`),
        {
          maxRetries: 3,
          shouldRetry: (error, statusCode) => {
            if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
              return false;
            }
            return isRetryableError(error, statusCode);
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorInfo = getErrorMessage(data, {
          statusCode: response.status,
          endpoint: '/api/pairing/validate',
        });
        return {
          valid: false,
          code: data.code || 'INVALID_CODE',
          error: errorInfo.userMessage,
          errorInfo,
        };
      }

      return {
        valid: true,
        inviterUsername: data.inviterUsername,
        inviteType: data.inviteType,
        expiresAt: data.expiresAt,
        parentBEmail: data.parentBEmail || null, // Include email restriction if set
      };
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/pairing/validate' });
      return { valid: false, code: 'NETWORK_ERROR', error: errorInfo.userMessage, errorInfo };
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Validate a pairing token (public - no auth required)
   * @param {string} token - The invitation token
   * @returns {Promise<Object>} Validation result
   */
  const validateToken = React.useCallback(async token => {
    if (!token || token.trim().length === 0) {
      return { 
        valid: false, 
        code: 'TOKEN_REQUIRED', 
        error: 'Invitation token is required',
        userMessage: 'This invitation link is invalid. Please request a new invitation.',
      };
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await retryWithBackoff(
        () => apiGet(`/api/pairing/validate-token/${encodeURIComponent(token)}`),
        {
          maxRetries: 3,
          shouldRetry: (error, statusCode) => {
            // Don't retry client errors (4xx) except 429 (rate limit)
            if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
              return false;
            }
            // Retry server errors (5xx) and network errors
            return isRetryableError(error, statusCode);
          },
        }
      );

      const data = await response.json();

      // Handle both success and error responses
      if (!data.valid) {
        // Use userMessage from API if available, otherwise fall back to error handler
        const errorMessage = data.userMessage || data.error || 'Invalid invitation token';
        const errorInfo = getErrorMessage(data, {
          statusCode: response.status,
          endpoint: '/api/pairing/validate-token',
        });
        
        return {
          valid: false,
          code: data.code || 'INVALID_TOKEN',
          error: errorMessage,
          userMessage: errorMessage, // Ensure userMessage is always set
          errorInfo: {
            ...errorInfo,
            userMessage: errorMessage, // Prefer API userMessage
          },
        };
      }

      // Success response
      return {
        valid: true,
        inviterUsername: data.inviterUsername,
        inviterName: data.inviterName,
        inviteType: data.inviteType,
        expiresAt: data.expiresAt,
        pairingCode: data.pairingCode,
        parentBEmail: data.parentBEmail || null, // Include email restriction if set
      };
    } catch (err) {
      // Network or unexpected errors
      const errorInfo = getErrorMessage(err, {
        statusCode: err.status || 0,
        endpoint: '/api/pairing/validate-token',
      });
      
      // Check if it's a database connection error
      if (err.message?.includes('Database') || err.message?.includes('connection')) {
        return { 
          valid: false, 
          code: 'DATABASE_ERROR', 
          error: 'Unable to validate invitation. Please try again in a moment.',
          userMessage: 'Unable to validate invitation. Please try again in a moment.',
          errorInfo,
        };
      }
      
      return { 
        valid: false, 
        code: 'NETWORK_ERROR', 
        error: errorInfo.userMessage,
        userMessage: errorInfo.userMessage,
        errorInfo,
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Accept a pairing invitation
   * @param {Object} params - { code?: string, token?: string }
   * @returns {Promise<Object>} Result with sharedRoomId, partnerId
   */
  const acceptPairing = React.useCallback(
    async ({ code, token }) => {
      if (!code && !token) {
        setError('Either code or token is required');
        return { success: false, error: 'Either code or token is required' };
      }

      setIsAccepting(true);
      setError('');

      try {
        const response = await retryWithBackoff(
          () => apiPost('/api/pairing/accept', { code, token }),
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

        const data = await response.json();

        if (!response.ok) {
          const errorInfo = getErrorMessage(data, {
            statusCode: response.status,
            endpoint: '/api/pairing/accept',
          });
          logError(data, { endpoint: '/api/pairing/accept', operation: 'accept_pairing' });
          setError(errorInfo.userMessage);
          return { success: false, error: errorInfo.userMessage, code: data.code };
        }

        // Refresh status after accepting
        await fetchPairingStatus();

        return {
          success: true,
          message: data.message,
          sharedRoomId: data.sharedRoomId,
          partnerId: data.partnerId,
        };
      } catch (err) {
        const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/pairing/accept' });
        logError(err, { endpoint: '/api/pairing/accept', operation: 'accept_pairing' });
        setError(errorInfo.userMessage);
        return { success: false, error: errorInfo.userMessage };
      } finally {
        setIsAccepting(false);
      }
    },
    [fetchPairingStatus]
  );

  /**
   * Decline a pairing invitation
   * @param {number} pairingId - The pairing session ID
   * @returns {Promise<Object>} Result
   */
  const declinePairing = React.useCallback(
    async pairingId => {
      if (!pairingId) {
        setError('Pairing ID is required');
        return { success: false, error: 'Pairing ID is required' };
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await apiPost(`/api/pairing/decline/${pairingId}`);
        const data = await response.json();

        if (!response.ok) {
          const errorInfo = getErrorMessage(data, {
            statusCode: response.status,
            endpoint: '/api/pairing/decline',
          });
          setError(errorInfo.userMessage);
          return { success: false, error: errorInfo.userMessage };
        }

        // Refresh status after declining
        await fetchPairingStatus();

        return { success: true, message: data.message };
      } catch (err) {
        const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/pairing/decline' });
        setError(errorInfo.userMessage);
        return { success: false, error: errorInfo.userMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPairingStatus]
  );

  /**
   * Cancel a pending pairing (initiator only)
   * @param {number} pairingId - The pairing session ID
   * @returns {Promise<Object>} Result
   */
  const cancelPairing = React.useCallback(
    async pairingId => {
      if (!pairingId) {
        setError('Pairing ID is required');
        return { success: false, error: 'Pairing ID is required' };
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await apiDelete(`/api/pairing/${pairingId}`);
        const data = await response.json();

        if (!response.ok) {
          const errorInfo = getErrorMessage(data, {
            statusCode: response.status,
            endpoint: '/api/pairing/cancel',
          });
          setError(errorInfo.userMessage);
          return { success: false, error: errorInfo.userMessage };
        }

        // Refresh status after cancelling
        await fetchPairingStatus();

        return { success: true, message: data.message };
      } catch (err) {
        const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/pairing/cancel' });
        setError(errorInfo.userMessage);
        return { success: false, error: errorInfo.userMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPairingStatus]
  );

  /**
   * Resend a pairing invitation (generates new token/expiration)
   * @param {number} pairingId - The pairing session ID
   * @returns {Promise<Object>} Result with new token and expiresAt
   */
  const resendPairing = React.useCallback(
    async pairingId => {
      if (!pairingId) {
        setError('Pairing ID is required');
        return { success: false, error: 'Pairing ID is required' };
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await apiPost(`/api/pairing/resend/${pairingId}`);
        const data = await response.json();

        if (!response.ok) {
          const errorInfo = getErrorMessage(data, {
            statusCode: response.status,
            endpoint: '/api/pairing/resend',
          });
          setError(errorInfo.userMessage);
          return { success: false, error: errorInfo.userMessage };
        }

        // Refresh status after resending
        await fetchPairingStatus();

        return {
          success: true,
          message: data.message,
          token: data.token,
          expiresAt: data.expiresAt,
        };
      } catch (err) {
        const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/pairing/resend' });
        setError(errorInfo.userMessage);
        return { success: false, error: errorInfo.userMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPairingStatus]
  );

  /**
   * Build an invite URL from a token
   * @param {string} token - The invitation token
   * @returns {string} Full invite URL
   */
  const buildInviteUrl = React.useCallback(token => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/accept-invite?token=${encodeURIComponent(token)}`;
  }, []);

  /**
   * Build a shareable message for the invitation
   * @param {string} inviterName - Name of person sending invite
   * @param {string} pairingCode - The pairing code
   * @param {string} inviteUrl - The full invite URL (optional)
   * @returns {string} Shareable message text
   */
  const buildShareableMessage = React.useCallback((inviterName, pairingCode, inviteUrl = null) => {
    let message = `${inviterName} has invited you to connect on LiaiZen for better co-parenting communication.\n\n`;

    if (pairingCode) {
      message += `Your pairing code: ${pairingCode}\n`;
      message += `(Enter this code in the LiaiZen app)\n\n`;
    }

    if (inviteUrl) {
      message += `Or click this link to join:\n${inviteUrl}`;
    }

    return message;
  }, []);

  /**
   * Clear any error state
   */
  const clearError = React.useCallback(() => {
    setError('');
  }, []);

  return {
    // State
    isLoading,
    isValidating,
    isAccepting,
    isCreating,
    error,
    pairingStatus,

    // Actions
    fetchPairingStatus,
    createPairing,
    validateCode,
    validateToken,
    acceptPairing,
    declinePairing,
    cancelPairing,
    resendPairing,

    // Utilities
    buildInviteUrl,
    buildShareableMessage,
    clearError,
  };
}

export default usePairing;
