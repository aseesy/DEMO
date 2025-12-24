/**
 * Pure Query Functions for Room and Invitation Operations
 *
 * These functions ONLY fetch/query data - they do NOT mutate state.
 * Use these for CQS-compliant code where queries are separated from commands.
 */

import { API_BASE_URL } from '../config.js';
import { apiPost } from '../apiClient.js';
import { authStorage } from '../adapters/storage';
import { logger } from './logger.js';

/**
 * Query: Check if room has multiple members (co-parent connected)
 * @returns {Promise<Object>} { hasMultipleMembers: boolean, error?: string }
 */
export async function queryRoomMembers() {
  try {
    const token = authStorage.getToken();
    const apiUrl = `${API_BASE_URL.replace(/\/+$/, '')}/api/room/members/check`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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
 * @returns {Promise<Object>} { sent: Array, received: Array }
 */
export async function queryInvitationsStatus() {
  try {
    const token = authStorage.getToken();
    const response = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/api/invitations`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        sent: data.sent || [],
        received: data.received || [],
      };
    }

    return { success: false, error: `HTTP ${response.status}` };
  } catch (err) {
    logger.error('[queryInvitationsStatus] Error checking invitations', err);
    return { success: false, error: err.message };
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
 * @param {string} code - The LZ-XXXXXX code
 * @returns {Promise<Object>} Accept result
 */
export async function commandAcceptCoParentInvite(code) {
  try {
    const token = authStorage.getToken();
    const response = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/api/invitations/accept-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include',
      body: JSON.stringify({ code: code.toUpperCase() }),
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
