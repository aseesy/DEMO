/**
 * Pure Query Functions for Invitation Operations
 *
 * These functions ONLY fetch/query data - they do NOT mutate state.
 * Use these for CQS-compliant code where queries are separated from commands.
 */

import { apiGet, apiPost, apiDelete } from '../apiClient.js';
import { getErrorMessage, logError, retryWithBackoff, isRetryableError } from './errorHandler.jsx';

/**
 * Retry configuration for validation requests
 */
const VALIDATION_RETRY_CONFIG = {
  maxRetries: 3,
  shouldRetry: (error, statusCode) => {
    if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
      return false;
    }
    return isRetryableError(error, statusCode);
  },
};

/**
 * Query: Validate an invitation code
 * @param {string} code - The short code to validate (e.g., LZ-ABC123)
 * @returns {Promise<Object>} Validation result
 */
export async function queryValidateCode(code) {
  if (!code) {
    const errorInfo = getErrorMessage({ code: 'CODE_REQUIRED' });
    return { valid: false, code: 'CODE_REQUIRED', errorInfo };
  }

  try {
    const response = await retryWithBackoff(
      () => apiGet(`/api/pairing/validate/${encodeURIComponent(code)}`),
      VALIDATION_RETRY_CONFIG
    );

    const data = await response.json();

    if (!response.ok) {
      const errorInfo = getErrorMessage(data, {
        statusCode: response.status,
        endpoint: '/api/pairing/validate',
      });
      logError(data, { endpoint: '/api/pairing/validate', operation: 'validate_code', code });
      return {
        valid: false,
        code: data.code || 'ERROR',
        error: errorInfo.userMessage,
        errorInfo,
      };
    }

    return data;
  } catch (err) {
    const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/pairing/validate' });
    logError(err, { endpoint: '/api/pairing/validate', operation: 'validate_code', code });
    return { valid: false, code: 'NETWORK_ERROR', error: errorInfo.userMessage, errorInfo };
  }
}

/**
 * Query: Validate an invitation token
 * @param {string} token - The invitation token to validate
 * @returns {Promise<Object>} Validation result
 */
export async function queryValidateToken(token) {
  if (!token) {
    const errorInfo = getErrorMessage({ code: 'TOKEN_REQUIRED' });
    return { valid: false, code: 'TOKEN_REQUIRED', errorInfo };
  }

  try {
    const response = await retryWithBackoff(
      () => apiGet(`/api/pairing/validate-token/${encodeURIComponent(token)}`),
      VALIDATION_RETRY_CONFIG
    );

    const data = await response.json();

    if (!response.ok) {
      const errorInfo = getErrorMessage(data, {
        statusCode: response.status,
        endpoint: '/api/pairing/validate-token',
      });
      logError(data, {
        endpoint: '/api/pairing/validate-token',
        operation: 'validate_token',
        token,
      });
      return {
        valid: false,
        code: data.code || 'ERROR',
        error: errorInfo.userMessage,
        errorInfo,
      };
    }

    return data;
  } catch (err) {
    const errorInfo = getErrorMessage(err, {
      statusCode: 0,
      endpoint: '/api/pairing/validate-token',
    });
    logError(err, {
      endpoint: '/api/pairing/validate-token',
      operation: 'validate_token',
      token,
    });
    return { valid: false, code: 'NETWORK_ERROR', error: errorInfo.userMessage, errorInfo };
  }
}

/**
 * Command: Accept invitation by code
 * @param {string} code - The short code
 * @returns {Promise<Object>} Result with success flag
 */
export async function commandAcceptByCode(code) {
  if (!code) {
    const errorInfo = getErrorMessage({ code: 'CODE_REQUIRED' });
    return { success: false, error: errorInfo.userMessage, errorInfo };
  }

  try {
    const response = await retryWithBackoff(
      () => apiPost('/api/pairing/accept', { code }),
      VALIDATION_RETRY_CONFIG
    );

    const data = await response.json();

    if (!response.ok) {
      const errorInfo = getErrorMessage(data, {
        statusCode: response.status,
        endpoint: '/api/pairing/accept',
      });
      logError(data, { endpoint: '/api/pairing/accept', operation: 'accept_code', code });
      return { success: false, error: errorInfo.userMessage, errorInfo, code: data.code };
    }

    return { success: true, ...data };
  } catch (err) {
    const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/pairing/accept' });
    logError(err, { endpoint: '/api/pairing/accept', operation: 'accept_code', code });
    return { success: false, error: errorInfo.userMessage, errorInfo };
  }
}

/**
 * Command: Accept invitation by token
 * @param {string} token - The invitation token
 * @returns {Promise<Object>} Result with success flag
 */
export async function commandAcceptByToken(token) {
  if (!token) {
    const errorInfo = getErrorMessage({ code: 'TOKEN_REQUIRED' });
    return { success: false, error: errorInfo.userMessage, errorInfo };
  }

  try {
    // Use new production-grade endpoint
    const response = await retryWithBackoff(
      () => apiPost('/api/invites/accept', { token }),
      VALIDATION_RETRY_CONFIG
    );

    const data = await response.json();

    if (!response.ok) {
      const errorInfo = getErrorMessage(data, {
        statusCode: response.status,
        endpoint: '/api/invites/accept',
      });
      logError(data, { endpoint: '/api/invites/accept', operation: 'accept_invitation', token });
      return { 
        success: false, 
        error: errorInfo.userMessage, 
        errorInfo, 
        code: data.code,
        expectedEmail: data.expectedEmail,
        actualEmail: data.actualEmail,
      };
    }

    return { success: true, ...data };
  } catch (err) {
    const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/invites/accept' });
    logError(err, { endpoint: '/api/invites/accept', operation: 'accept_invitation', token });
    return { success: false, error: errorInfo.userMessage, errorInfo };
  }
}

/**
 * Command: Decline invitation
 * @param {string} token - The invitation token
 * @returns {Promise<Object>} Result with success flag
 */
export async function commandDeclineInvitation(token) {
  if (!token) {
    return { success: false, error: 'No invitation token provided' };
  }

  try {
    const response = await apiPost('/api/invitations/decline', { token });
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to decline invitation';
      return { success: false, error: errorMsg };
    }

    return { success: true, ...data };
  } catch (err) {
    console.error('Error declining invitation:', err);
    return { success: false, error: 'Unable to decline invitation. Please try again.' };
  }
}

/**
 * Query: Fetch user's invitations
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of invitations
 */
export async function queryFetchInvitations(options = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (options.status) queryParams.append('status', options.status);

    const queryString = queryParams.toString();
    const url = queryString ? `/api/invitations?${queryString}` : '/api/invitations';

    const response = await apiGet(url);
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to fetch invitations';
      return { success: false, error: errorMsg, invitations: [] };
    }

    // API returns { sent: [...], received: [...] }, but we only care about sent invitations for this component
    // Flatten sent and received into a single array, prioritizing sent invitations
    const sentInvitations = data.sent || [];
    const receivedInvitations = data.received || [];
    const allInvitations = [...sentInvitations, ...receivedInvitations];

    return { success: true, invitations: allInvitations };
  } catch (err) {
    console.error('Error fetching invitations:', err);
    return {
      success: false,
      error: 'Unable to load invitations. Please try again.',
      invitations: [],
    };
  }
}

/**
 * Command: Resend an invitation
 * @param {number} invitationId - The invitation ID
 * @returns {Promise<Object>} Result with success flag
 */
export async function commandResendInvitation(invitationId) {
  try {
    const response = await apiPost(`/api/invitations/resend/${invitationId}`);
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to resend invitation';
      return { success: false, error: errorMsg };
    }

    return { success: true, ...data };
  } catch (err) {
    console.error('Error resending invitation:', err);
    return { success: false, error: 'Unable to resend invitation. Please try again.' };
  }
}

/**
 * Command: Cancel an invitation
 * @param {number} invitationId - The invitation ID
 * @returns {Promise<Object>} Result with success flag
 */
export async function commandCancelInvitation(invitationId) {
  try {
    const response = await apiDelete(`/api/invitations/${invitationId}`);
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to cancel invitation';
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (err) {
    console.error('Error cancelling invitation:', err);
    return { success: false, error: 'Unable to cancel invitation. Please try again.' };
  }
}
