import React from 'react';
import { apiGet, apiPost, apiDelete } from '../apiClient.js';
import { getErrorMessage, logError, retryWithBackoff, isRetryableError } from '../utils/errorHandler.jsx';

/**
 * Hook for managing invitation-related API calls and state
 * Handles token validation, accepting/declining invitations, and invitation management
 */
export function useInvitations() {
  const [isValidating, setIsValidating] = React.useState(false);
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [isDeclining, setIsDeclining] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [invitations, setInvitations] = React.useState([]);
  const [error, setError] = React.useState('');

  /**
   * Validate an invitation token
   * @param {string} token - The invitation token to validate
   * @returns {Promise<Object>} Validation result with invitation details
   */
  /**
   * Validate an invitation short code
   * @param {string} code - The short code to validate (e.g., LZ-ABC123)
   * @returns {Promise<Object>} Validation result with invitation details
   */
  const validateCode = React.useCallback(async (code) => {
    if (!code) {
      const errorInfo = getErrorMessage({ code: 'CODE_REQUIRED' });
      return { valid: false, code: 'CODE_REQUIRED', errorInfo };
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await retryWithBackoff(
        () => apiGet(`/api/invitations/validate-code/${encodeURIComponent(code)}`),
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
        const errorInfo = getErrorMessage(data, { statusCode: response.status, endpoint: '/api/invitations/validate-code' });
        logError(data, { endpoint: '/api/invitations/validate-code', operation: 'validate_code', code });
        setError(errorInfo.userMessage);
        return { valid: false, code: data.code || 'ERROR', error: errorInfo.userMessage, errorInfo };
      }

      return data;
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/invitations/validate-code' });
      logError(err, { endpoint: '/api/invitations/validate-code', operation: 'validate_code', code });
      setError(errorInfo.userMessage);
      return { valid: false, code: 'NETWORK_ERROR', error: errorInfo.userMessage, errorInfo };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateToken = React.useCallback(async (token) => {
    if (!token) {
      const errorInfo = getErrorMessage({ code: 'TOKEN_REQUIRED' });
      return { valid: false, code: 'TOKEN_REQUIRED', errorInfo };
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await retryWithBackoff(
        () => apiGet(`/api/invitations/validate/${encodeURIComponent(token)}`),
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
        const errorInfo = getErrorMessage(data, { statusCode: response.status, endpoint: '/api/invitations/validate' });
        logError(data, { endpoint: '/api/invitations/validate', operation: 'validate_token', token });
        setError(errorInfo.userMessage);
        return { valid: false, code: data.code || 'ERROR', error: errorInfo.userMessage, errorInfo };
      }

      return data;
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/invitations/validate' });
      logError(err, { endpoint: '/api/invitations/validate', operation: 'validate_token', token });
      setError(errorInfo.userMessage);
      return { valid: false, code: 'NETWORK_ERROR', error: errorInfo.userMessage, errorInfo };
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Accept an invitation (for existing users)
   * @param {string} token - The invitation token
   * @returns {Promise<Object>} Result with room and co-parent info
   */
  /**
   * Accept an invitation by short code
   * @param {string} code - The short code (e.g., LZ-ABC123)
   * @returns {Promise<Object>} Result with room and co-parent info
   */
  const acceptByCode = React.useCallback(async (code) => {
    if (!code) {
      const errorInfo = getErrorMessage({ code: 'CODE_REQUIRED' });
      setError(errorInfo.userMessage);
      return { success: false, error: errorInfo.userMessage, errorInfo };
    }

    setIsAccepting(true);
    setError('');

    try {
      const response = await retryWithBackoff(
        () => apiPost('/api/invitations/accept-code', { code }),
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
        const errorInfo = getErrorMessage(data, { statusCode: response.status, endpoint: '/api/invitations/accept-code' });
        logError(data, { endpoint: '/api/invitations/accept-code', operation: 'accept_code', code });
        setError(errorInfo.userMessage);
        return { success: false, error: errorInfo.userMessage, errorInfo, code: data.code };
      }

      return { success: true, ...data };
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/invitations/accept-code' });
      logError(err, { endpoint: '/api/invitations/accept-code', operation: 'accept_code', code });
      setError(errorInfo.userMessage);
      return { success: false, error: errorInfo.userMessage, errorInfo };
    } finally {
      setIsAccepting(false);
    }
  }, []);

  const acceptInvitation = React.useCallback(async (token) => {
    if (!token) {
      const errorInfo = getErrorMessage({ code: 'TOKEN_REQUIRED' });
      setError(errorInfo.userMessage);
      return { success: false, error: errorInfo.userMessage, errorInfo };
    }

    setIsAccepting(true);
    setError('');

    try {
      const response = await retryWithBackoff(
        () => apiPost('/api/invitations/accept', { token }),
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
        const errorInfo = getErrorMessage(data, { statusCode: response.status, endpoint: '/api/invitations/accept' });
        logError(data, { endpoint: '/api/invitations/accept', operation: 'accept_invitation', token });
        setError(errorInfo.userMessage);
        return { success: false, error: errorInfo.userMessage, errorInfo, code: data.code };
      }

      return { success: true, ...data };
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/invitations/accept' });
      logError(err, { endpoint: '/api/invitations/accept', operation: 'accept_invitation', token });
      setError(errorInfo.userMessage);
      return { success: false, error: errorInfo.userMessage, errorInfo };
    } finally {
      setIsAccepting(false);
    }
  }, []);

  /**
   * Decline an invitation
   * @param {string} token - The invitation token
   * @returns {Promise<Object>} Result
   */
  const declineInvitation = React.useCallback(async (token) => {
    if (!token) {
      setError('No invitation token provided');
      return { success: false, error: 'No invitation token provided' };
    }

    setIsDeclining(true);
    setError('');

    try {
      const response = await apiPost('/api/invitations/decline', { token });
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to decline invitation';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      return { success: true, ...data };
    } catch (err) {
      console.error('Error declining invitation:', err);
      const errorMsg = 'Unable to decline invitation. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsDeclining(false);
    }
  }, []);

  /**
   * Fetch user's invitations (sent and received)
   * @param {Object} options - Query options
   * @param {string} options.status - Filter by status (pending, accepted, etc.)
   * @returns {Promise<Array>} List of invitations
   */
  const fetchInvitations = React.useCallback(async (options = {}) => {
    setIsLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams();
      if (options.status) queryParams.append('status', options.status);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/invitations?${queryString}` : '/api/invitations';

      const response = await apiGet(url);
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to fetch invitations';
        setError(errorMsg);
        return [];
      }

      setInvitations(data.invitations || []);
      return data.invitations || [];
    } catch (err) {
      console.error('Error fetching invitations:', err);
      const errorMsg = 'Unable to load invitations. Please try again.';
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Resend an expired or pending invitation
   * @param {number} invitationId - The invitation ID to resend
   * @returns {Promise<Object>} Result with new invitation details
   */
  const resendInvitation = React.useCallback(async (invitationId) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiPost(`/api/invitations/resend/${invitationId}`);
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to resend invitation';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Refresh invitations list
      await fetchInvitations();
      return { success: true, ...data };
    } catch (err) {
      console.error('Error resending invitation:', err);
      const errorMsg = 'Unable to resend invitation. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvitations]);

  /**
   * Cancel a pending invitation
   * @param {number} invitationId - The invitation ID to cancel
   * @returns {Promise<Object>} Result
   */
  const cancelInvitation = React.useCallback(async (invitationId) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiDelete(`/api/invitations/${invitationId}`);
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to cancel invitation';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Refresh invitations list
      await fetchInvitations();
      return { success: true };
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      const errorMsg = 'Unable to cancel invitation. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [fetchInvitations]);

  /**
   * Clear any error state
   */
  const clearError = React.useCallback(() => {
    setError('');
  }, []);

  return {
    // State
    isValidating,
    isAccepting,
    isDeclining,
    isLoading,
    invitations,
    error,
    // Actions
    validateToken,
    validateCode,
    acceptInvitation,
    acceptByCode,
    declineInvitation,
    fetchInvitations,
    resendInvitation,
    cancelInvitation,
    clearError,
  };
}

export default useInvitations;
