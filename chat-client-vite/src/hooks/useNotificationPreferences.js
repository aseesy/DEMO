/**
 * useNotificationPreferences - Hook for managing notification preferences
 *
 * Handles:
 * - Loading preferences from storage
 * - Persisting preferences to storage
 * - Providing typed preferences with defaults
 */

import React from 'react';
import { storage, StorageKeys } from '../adapters/storage';

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFS = {
  newMessages: true,
  taskReminders: false,
  invitations: true,
};

/**
 * useNotificationPreferences hook
 * @returns {Object} { prefs, setPrefs, updatePref }
 */
export function useNotificationPreferences() {
  const [prefs, setPrefsState] = React.useState(() => {
    return storage.get(StorageKeys.NOTIFICATION_PREFERENCES, DEFAULT_NOTIFICATION_PREFS);
  });

  // Persist to storage when preferences change
  React.useEffect(() => {
    storage.set(StorageKeys.NOTIFICATION_PREFERENCES, prefs);
  }, [prefs]);

  /**
   * Update a single preference
   * @param {string} key - Preference key
   * @param {boolean} value - New value
   */
  const updatePref = React.useCallback((key, value) => {
    setPrefsState(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Set multiple preferences at once
   * @param {Object|Function} newPrefs - New preferences or updater function
   */
  const setPrefs = React.useCallback((newPrefs) => {
    if (typeof newPrefs === 'function') {
      setPrefsState(newPrefs);
    } else {
      setPrefsState(prev => ({
        ...prev,
        ...newPrefs,
      }));
    }
  }, []);

  /**
   * Reset to defaults
   */
  const resetPrefs = React.useCallback(() => {
    setPrefsState(DEFAULT_NOTIFICATION_PREFS);
  }, []);

  return {
    prefs,
    setPrefs,
    updatePref,
    resetPrefs,
  };
}

export default useNotificationPreferences;
