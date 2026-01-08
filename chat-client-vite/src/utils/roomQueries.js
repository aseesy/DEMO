/**
 * Pure Query Functions for Room and Invitation Operations
 *
 * These functions ONLY fetch/query data - they do NOT mutate state.
 * Use these for CQS-compliant code where queries are separated from commands.
 */

import { API_BASE_URL } from '../config.js';
import { apiGet, apiPost, checkServerStatus } from '../apiClient.js';
import { tokenManager } from './tokenManager.js';
import { logger } from './logger.js';

/**
 * Query: Check if room has multiple members (co-parent connected)
 * Uses apiGet for proper auth header and 401 handling
 * @returns {Promise<Object>} { hasMultipleMembers: boolean, error?: string }
 */
export async function queryRoomMembers() {
  try {
    // Check if server is down to avoid unnecessary requests
    if (checkServerStatus()) {
      return { success: false, networkError: true };
    }

    // Verify token exists before making request (use TokenManager for instant access)
    const token = tokenManager.getToken();
    if (!token) {
      console.log('[queryRoomMembers] No token available, skipping request');
      return { success: false, error: 'No authentication token' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await apiGet('/api/room/members/check', {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        hasMultipleMembers: data.hasMultipleMembers === true,
      };
    }

    if (response.status === 404) {
      return { success: false, notFound: true };
    }

    // 503 = server starting up, database not ready yet
    if (response.status === 503) {
      return { success: false, serviceUnavailable: true, retryAfter: 5000 };
    }

    // 401 errors will trigger auth failure event via apiGet
    return { success: false, error: `HTTP ${response.status}` };
  } catch (err) {
    const isNetworkError =
      err.name === 'TypeError' ||
      err.name === 'AbortError' ||
      (err.message &&
        (err.message.includes('Failed to fetch') ||
          err.message.includes('Load failed') ||
          err.message.includes('network') ||
          err.message.includes('access control') ||
          err.message.includes('aborted')));

    if (isNetworkError) {
      return { success: false, networkError: true };
    }

    return { success: false, error: err.message };
  }
}

/**
 * Query: Check co-parent connection from messages (fallback)
 * @param {Array} messages - Message list
 * @param {string} username - Current user's username
 * @returns {boolean} Whether multiple users are in the conversation
 */
export function queryCoParentFromMessages(messages, username) {
  if (!messages || messages.length === 0 || !username) {
    return false;
  }

  const uniqueUsernames = new Set(
    messages
      .filter(msg => msg.username && msg.type !== 'ai_intervention' && msg.type !== 'ai_comment')
      .map(msg => msg.username)
  );

  return uniqueUsernames.size >= 2;
}

/**
 * Query: Fetch user's invitations status
 * Uses apiGet to ensure proper auth header and 401 handling
 * @returns {Promise<Object>} { sent: Array, received: Array }
 */
export async function queryInvitationsStatus() {
  try {
    // Check if server is down to avoid unnecessary requests
    if (checkServerStatus()) {
      return { success: false, networkError: true };
    }

    const response = await apiGet('/api/invitations');

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        sent: data.sent || [],
        received: data.received || [],
      };
    }

    // 401 errors will trigger auth failure event via apiGet
    return { success: false, error: `HTTP ${response.status}` };
  } catch (err) {
    // Handle various error types
    const errorMessage =
      err?.message ||
      (typeof err === 'string' ? err : null) ||
      err?.error?.message ||
      err?.error ||
      'Failed to load invitations';

    logger.error(
      '[queryInvitationsStatus] Error checking invitations',
      err instanceof Error ? err : new Error(errorMessage)
    );
    return { success: false, error: errorMessage };
  }
}

/**
 * Command: Join room with invite code
 * @param {string} inviteCode - The invite code
 * @param {string} username - Current user's username
 * @returns {Promise<Object>} Join result
 */
export async function commandJoinRoom(inviteCode, username) {
  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/api/room/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
      body: JSON.stringify({ inviteCode, username }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return { success: true, roomId: data.roomId };
    }

    return { success: false, error: data.error || 'Failed to join room' };
  } catch (err) {
    logger.error('Error joining room', err);
    return {
      success: false,
      error: err.message || 'Failed to join room. Please check your connection.',
    };
  }
}

/**
 * Command: Accept co-parent invitation by code
 * Uses apiPost for proper auth header and 401 handling
 * @param {string} code - The LZ-XXXXXX code
 * @returns {Promise<Object>} Accept result
 */
export async function commandAcceptCoParentInvite(code) {
  try {
    const response = await apiPost('/api/invitations/accept-code', {
      code: code.toUpperCase(),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return { success: true, ...data };
    }

    if (data?.code === 'ALREADY_CONNECTED') {
      return { success: false, alreadyConnected: true, error: data.error };
    }

    return { success: false, error: data?.error || 'Failed to accept invite' };
  } catch (err) {
    logger.error('Error accepting co-parent invite', err);
    return {
      success: false,
      error: err.message || 'Failed to accept invite. Please check your connection.',
    };
  }
}

/**
 * Command: Create invitation
 * @returns {Promise<Object>} Invitation result with shortCode and inviteUrl
 */
export async function commandCreateInvitation() {
  try {
    const response = await apiPost('/api/invitations/create', {});

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.apiError('/api/invitations', response.status, errorData.error || 'Unknown error');

      if (response.status === 401) {
        return {
          success: false,
          error: 'Your session has expired. Please refresh the page and try again.',
        };
      }

      return {
        success: false,
        error:
          errorData.error ||
          errorData.message ||
          `Unable to create invite (${response.status}). Please try again.`,
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || data.message || 'Unable to create invite. Please try again.',
      };
    }

    return {
      success: true,
      shortCode: data.shortCode,
      inviteUrl: data.inviteUrl,
    };
  } catch (err) {
    logger.error('Error creating invite', err);
    return {
      success: false,
      error: 'Unable to create invite. Please check your connection and try again.',
    };
  }
}
