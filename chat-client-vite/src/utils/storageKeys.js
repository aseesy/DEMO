/**
 * Centralized localStorage key constants
 * Use these constants instead of magic strings throughout the codebase
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token_backup',
  USERNAME: 'username',
  IS_AUTHENTICATED: 'isAuthenticated',
  USER_EMAIL: 'userEmail',
  CHAT_USER: 'chatUser',
  PENDING_INVITE_CODE: 'pending_invite_code',
  OAUTH_PROCESSED_CODE: 'oauth_processed_code',
  INVITATION_TOKEN: 'invitation_token',
  INVITATION_CODE: 'invitation_code',
  SMART_TASK: 'liaizen_smart_task',
  ADD_CONTACT: 'liaizen_add_contact',
};

/**
 * Helper functions for common localStorage operations
 */
export const storageHelpers = {
  /**
   * Get auth token from localStorage
   * @returns {string|null}
   */
  getAuthToken() {
    return typeof window !== 'undefined' 
      ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) 
      : null;
  },

  /**
   * Set auth token in localStorage
   * @param {string} token
   */
  setAuthToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
  },

  /**
   * Remove auth token from localStorage
   */
  removeAuthToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  },

  /**
   * Clear all auth-related storage
   */
  clearAuth() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USERNAME);
      localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.CHAT_USER);
    }
  },
};

