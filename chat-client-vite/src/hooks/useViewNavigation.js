/**
 * useViewNavigation - Hook for managing view navigation with analytics
 *
 * Handles:
 * - Current view state with persistence
 * - View change tracking for analytics
 * - Valid view validation
 */

import React from 'react';
import { storage, StorageKeys } from '../adapters/storage';
import { trackViewChange } from '../utils/analytics.js';

/**
 * Available views in the application
 */
export const AVAILABLE_VIEWS = ['dashboard', 'chat', 'contacts', 'profile', 'settings', 'account'];

/**
 * Default view when none is set
 */
export const DEFAULT_VIEW = 'dashboard';

/**
 * Validate if a view is valid
 * @param {string} view - View to validate
 * @returns {boolean}
 */
export function isValidView(view) {
  return AVAILABLE_VIEWS.includes(view);
}

/**
 * useViewNavigation hook
 * @param {Object} options
 * @param {boolean} options.isAuthenticated - Whether user is authenticated
 * @param {boolean} options.trackAnalytics - Whether to track view changes (default true)
 * @returns {Object} { currentView, setCurrentView, navigateTo }
 */
export function useViewNavigation({ isAuthenticated = false, trackAnalytics = true } = {}) {
  const [currentView, setCurrentViewState] = React.useState(() => {
    const stored = storage.getString(StorageKeys.CURRENT_VIEW);
    return stored && isValidView(stored) ? stored : DEFAULT_VIEW;
  });

  // Persist view to storage when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      storage.set(StorageKeys.CURRENT_VIEW, currentView);
    }
  }, [isAuthenticated, currentView]);

  /**
   * Navigate to a view with analytics tracking
   * @param {string} view - View to navigate to
   */
  const navigateTo = React.useCallback(
    view => {
      if (!isValidView(view)) {
        console.warn(`Invalid view: ${view}. Valid views are: ${AVAILABLE_VIEWS.join(', ')}`);
        return;
      }

      if (view !== currentView) {
        if (trackAnalytics) {
          trackViewChange(view);
        }
        setCurrentViewState(view);
      }
    },
    [currentView, trackAnalytics]
  );

  /**
   * Set current view (alias for navigateTo for backwards compatibility)
   */
  const setCurrentView = navigateTo;

  return {
    currentView,
    setCurrentView,
    navigateTo,
    availableViews: AVAILABLE_VIEWS,
    isValidView,
  };
}

export default useViewNavigation;
