/**
 * useInvitations Hook
 *
 * Manages invitation state and delegates to pure query/command functions.
 * This hook follows Command-Query Separation (CQS):
 * - Query functions (in utils/invitationQueries.js) only return data
 * - This hook manages state mutations (commands)
 */

import React from 'react';
import {
  queryValidateCode,
  queryValidateToken,
  commandAcceptByCode,
  commandAcceptByToken,
  commandDeclineInvitation,
  queryFetchInvitations,
  commandResendInvitation,
  commandCancelInvitation,
} from '../../../utils/invitationQueries.js';

export function useInvitations() {
  const [isValidating, setIsValidating] = React.useState(false);
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [isDeclining, setIsDeclining] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [invitations, setInvitations] = React.useState([]);
  const [error, setError] = React.useState('');

  /**
   * Validate an invitation short code
   * Command: Updates isValidating and error state
   * @param {string} code - The short code to validate (e.g., LZ-ABC123)
   */
  const validateCode = React.useCallback(async code => {
    setIsValidating(true);
    setError('');

    const result = await queryValidateCode(code);

    if (!result.valid && result.error) {
      setError(result.error);
    }
    setIsValidating(false);

    return result;
  }, []);

  /**
   * Validate an invitation token
   * Command: Updates isValidating and error state
   * @param {string} token - The invitation token to validate
   */
  const validateToken = React.useCallback(async token => {
    setIsValidating(true);
    setError('');

    const result = await queryValidateToken(token);

    if (!result.valid && result.error) {
      setError(result.error);
    }
    setIsValidating(false);

    return result;
  }, []);

  /**
   * Accept an invitation by short code
   * Command: Updates isAccepting and error state
   * @param {string} code - The short code (e.g., LZ-ABC123)
   */
  const acceptByCode = React.useCallback(async code => {
    setIsAccepting(true);
    setError('');

    const result = await commandAcceptByCode(code);

    if (!result.success && result.error) {
      setError(result.error);
    }
    setIsAccepting(false);

    return result;
  }, []);

  /**
   * Accept an invitation by token
   * Command: Updates isAccepting and error state
   * @param {string} token - The invitation token
   */
  const acceptInvitation = React.useCallback(async token => {
    setIsAccepting(true);
    setError('');

    const result = await commandAcceptByToken(token);

    if (!result.success && result.error) {
      setError(result.error);
    }
    setIsAccepting(false);

    return result;
  }, []);

  /**
   * Decline an invitation
   * Command: Updates isDeclining and error state
   * @param {string} token - The invitation token
   */
  const declineInvitation = React.useCallback(async token => {
    setIsDeclining(true);
    setError('');

    const result = await commandDeclineInvitation(token);

    if (!result.success && result.error) {
      setError(result.error);
    }
    setIsDeclining(false);

    return result;
  }, []);

  /**
   * Fetch user's invitations
   * Command: Updates isLoading, invitations, and error state
   * @param {Object} options - Query options
   */
  const fetchInvitations = React.useCallback(async (options = {}) => {
    setIsLoading(true);
    setError('');

    const result = await queryFetchInvitations(options);

    if (result.success) {
      setInvitations(result.invitations);
    } else if (result.error) {
      setError(result.error);
    }
    setIsLoading(false);

    return result.invitations;
  }, []);

  /**
   * Resend an expired or pending invitation
   * Command: Updates isLoading and error state, refreshes invitations
   * @param {number} invitationId - The invitation ID to resend
   */
  const resendInvitation = React.useCallback(
    async invitationId => {
      setIsLoading(true);
      setError('');

      const result = await commandResendInvitation(invitationId);

      if (!result.success && result.error) {
        setError(result.error);
      } else {
        // Refresh invitations list on success
        await fetchInvitations();
      }
      setIsLoading(false);

      return result;
    },
    [fetchInvitations]
  );

  /**
   * Cancel a pending invitation
   * Command: Updates isLoading and error state, refreshes invitations
   * @param {number} invitationId - The invitation ID to cancel
   */
  const cancelInvitation = React.useCallback(
    async invitationId => {
      setIsLoading(true);
      setError('');

      const result = await commandCancelInvitation(invitationId);

      if (!result.success && result.error) {
        setError(result.error);
      } else {
        // Refresh invitations list on success
        await fetchInvitations();
      }
      setIsLoading(false);

      return result;
    },
    [fetchInvitations]
  );

  /**
   * Clear any error state
   */
  const clearError = React.useCallback(() => {
    setError('');
  }, []);

  return {
    // State (read-only queries)
    isValidating,
    isAccepting,
    isDeclining,
    isLoading,
    invitations,
    error,

    // Commands (state mutations)
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
