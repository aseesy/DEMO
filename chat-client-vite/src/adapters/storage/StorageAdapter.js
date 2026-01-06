/**
 * StorageAdapter - Abstraction layer for persistent storage
 *
 * Why this exists:
 * - Decouples application code from localStorage API
 * - Could swap to sessionStorage, IndexedDB, or server-side storage
 * - Provides JSON serialization, type safety, and TTL support
 * - Handles Safari's ITP storage clearing gracefully
 *
 * Usage:
 *   import { storage, StorageKeys } from '../adapters/storage';
 *   storage.set(StorageKeys.AUTH_TOKEN, token);
 *   const token = storage.get(StorageKeys.AUTH_TOKEN);
 */

/**
 * StorageKeys - Centralized key constants
 *
 * Why this exists:
 * - Single source of truth for all storage keys
 * - Prevents typos in key string literals
 * - Easy to audit all stored data in one place
 */
export const StorageKeys = {
  // Authentication
  AUTH_TOKEN: 'auth_token_backup',
  USERNAME: 'username',
  IS_AUTHENTICATED: 'isAuthenticated',
  USER_EMAIL: 'userEmail',
  CHAT_USER: 'chatUser',

  // Invitation flow
  PENDING_INVITE_CODE: 'pendingInviteCode',
  OAUTH_PROCESSED_CODE: 'oauthProcessedCode',
  INVITATION_TOKEN: 'invitationToken',
  INVITATION_CODE: 'invitationCode',
  PENDING_SENT_INVITATION: 'pendingSentInvitation',
  
  // OAuth state (stored in both localStorage and sessionStorage for ITP resilience)
  OAUTH_STATE: 'oauth_state',
  OAUTH_STATE_TIMESTAMP: 'oauth_state_timestamp',

  // Application state
  SMART_TASK: 'liaizenSmartTask',
  ADD_CONTACT: 'liaizenAddContact',
  CURRENT_VIEW: 'currentView',
  RETURN_URL: 'returnUrl', // For deep linking - stores URL to redirect to after login

  // Preferences
  NOTIFICATION_PREFERENCES: 'notificationPreferences',
  TOAST_SOUND: 'liaizenToastSound',

  // Offline support
  OFFLINE_QUEUE: 'liaizen_offline_queue',
};

/**
 * StorageProvider interface
 * Implement this to swap storage backends
 */
const createLocalStorageProvider = () => ({
  get: key => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove: key => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
});

/**
 * SessionStorage provider (for temporary data that should not persist across tabs)
 */
const createSessionStorageProvider = () => ({
  get: key => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove: key => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  clear: () => {
    try {
      sessionStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
});

/**
 * StorageAdapter class
 */
class StorageAdapter {
  constructor(provider = createLocalStorageProvider()) {
    this._provider = provider;
    this._prefix = '';
  }

  /**
   * Set storage key prefix (for namespacing)
   * @param {string} prefix - Prefix to add to all keys
   */
  setPrefix(prefix) {
    this._prefix = prefix;
  }

  /**
   * Get prefixed key
   * @private
   */
  _getKey(key) {
    return this._prefix ? `${this._prefix}:${key}` : key;
  }

  /**
   * Get a value from storage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Stored value or default
   */
  get(key, defaultValue = null) {
    if (typeof window === 'undefined') return defaultValue;

    const fullKey = this._getKey(key);
    const raw = this._provider.get(fullKey);

    if (raw === null) return defaultValue;

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(raw);

      // Check for TTL wrapper
      if (parsed && typeof parsed === 'object' && parsed.__ttl) {
        if (Date.now() > parsed.__ttl) {
          this.remove(key);
          return defaultValue;
        }
        return parsed.value;
      }

      return parsed;
    } catch {
      // Return raw string if not JSON
      return raw;
    }
  }

  /**
   * Get a value as a string (no JSON parsing)
   * @param {string} key - Storage key
   * @param {string} defaultValue - Default value if key doesn't exist
   * @returns {string} Stored string value or default
   */
  getString(key, defaultValue = '') {
    if (typeof window === 'undefined') return defaultValue;

    const fullKey = this._getKey(key);
    const value = this._provider.get(fullKey);
    return value !== null ? value : defaultValue;
  }

  /**
   * Set a value in storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store (will be JSON stringified if object)
   * @param {Object} options - Options
   * @param {number} options.ttl - Time to live in milliseconds
   * @returns {boolean} Success
   */
  set(key, value, options = {}) {
    if (typeof window === 'undefined') return false;

    const fullKey = this._getKey(key);
    let toStore = value;

    // Wrap with TTL if specified
    if (options.ttl) {
      toStore = {
        value,
        __ttl: Date.now() + options.ttl,
      };
    }

    // Stringify if object
    const raw = typeof toStore === 'object' ? JSON.stringify(toStore) : String(toStore);

    return this._provider.set(fullKey, raw);
  }

  /**
   * Remove a value from storage
   * @param {string} key - Storage key
   * @returns {boolean} Success
   */
  remove(key) {
    if (typeof window === 'undefined') return false;

    const fullKey = this._getKey(key);
    return this._provider.remove(fullKey);
  }

  /**
   * Check if a key exists
   * @param {string} key - Storage key
   * @returns {boolean} Whether key exists
   */
  has(key) {
    if (typeof window === 'undefined') return false;

    const fullKey = this._getKey(key);
    return this._provider.get(fullKey) !== null;
  }

  /**
   * Clear all storage (use with caution)
   * @returns {boolean} Success
   */
  clear() {
    if (typeof window === 'undefined') return false;
    return this._provider.clear();
  }

  /**
   * Get multiple values at once
   * @param {string[]} keys - Array of storage keys
   * @returns {Object} Key-value object
   */
  getMany(keys) {
    const result = {};
    for (const key of keys) {
      result[key] = this.get(key);
    }
    return result;
  }

  /**
   * Set multiple values at once
   * @param {Object} entries - Key-value object
   * @param {Object} options - Options (applied to all)
   * @returns {boolean} Success (all succeeded)
   */
  setMany(entries, options = {}) {
    let allSuccess = true;
    for (const [key, value] of Object.entries(entries)) {
      if (!this.set(key, value, options)) {
        allSuccess = false;
      }
    }
    return allSuccess;
  }

  /**
   * Remove multiple values at once
   * @param {string[]} keys - Array of storage keys
   * @returns {boolean} Success (all succeeded)
   */
  removeMany(keys) {
    let allSuccess = true;
    for (const key of keys) {
      if (!this.remove(key)) {
        allSuccess = false;
      }
    }
    return allSuccess;
  }
}

// Create and export singleton instances
export const storage = new StorageAdapter();
export const sessionStorage = new StorageAdapter(createSessionStorageProvider());

// Export class for testing or custom instances
export { StorageAdapter };

/**
 * Auth-specific storage helpers
 * Provides typed accessors for authentication data
 */
export const authStorage = {
  getToken: () => storage.getString(StorageKeys.AUTH_TOKEN),
  setToken: token => storage.set(StorageKeys.AUTH_TOKEN, token),
  removeToken: () => storage.remove(StorageKeys.AUTH_TOKEN),

  getUsername: () => storage.getString(StorageKeys.USERNAME),
  setUsername: username => storage.set(StorageKeys.USERNAME, username),
  removeUsername: () => storage.remove(StorageKeys.USERNAME),

  isAuthenticated: () => storage.get(StorageKeys.IS_AUTHENTICATED, false),
  setAuthenticated: value => storage.set(StorageKeys.IS_AUTHENTICATED, value),

  clearAuth: () =>
    storage.removeMany([
      StorageKeys.AUTH_TOKEN,
      StorageKeys.USERNAME,
      StorageKeys.IS_AUTHENTICATED,
      StorageKeys.USER_EMAIL,
      StorageKeys.CHAT_USER,
    ]),
};

/**
 * Preferences storage helpers
 */
export const preferencesStorage = {
  getNotificationPrefs: () =>
    storage.get(StorageKeys.NOTIFICATION_PREFERENCES, {
      newMessages: true,
      taskReminders: false,
      invitations: true,
    }),
  setNotificationPrefs: prefs => storage.set(StorageKeys.NOTIFICATION_PREFERENCES, prefs),

  getToastSound: () => storage.get(StorageKeys.TOAST_SOUND, true),
  setToastSound: enabled => storage.set(StorageKeys.TOAST_SOUND, enabled),
};

export default storage;
