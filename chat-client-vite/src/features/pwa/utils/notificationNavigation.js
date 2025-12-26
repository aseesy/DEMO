/**
 * Notification Navigation Utilities
 *
 * Single Responsibility: Handle navigation logic when push notifications are clicked.
 * Separated from components for testability and reusability.
 */

/**
 * Parse notification URL and extract view parameter
 * @param {string} url - URL from notification data
 * @param {string} defaultView - Default view if no view param found
 * @returns {string} View name (e.g., 'chat', 'dashboard')
 */
export function extractViewFromUrl(url, defaultView = 'chat') {
  try {
    const urlObj = new URL(url, window.location.origin);
    const viewParam = urlObj.searchParams.get('view');
    return viewParam || defaultView;
  } catch (error) {
    console.warn('[notificationNavigation] Error parsing URL:', error);
    return defaultView;
  }
}

/**
 * Build navigation URL with view parameter
 * @param {string} view - View name to navigate to
 * @param {string} basePath - Base path (default: '/')
 * @returns {string} Full URL with view parameter
 */
export function buildViewUrl(view, basePath = '/') {
  const url = new URL(basePath, window.location.origin);
  url.searchParams.set('view', view);
  return url.href;
}

/**
 * Navigate to a view by updating URL and triggering navigation event
 * @param {string} view - View name to navigate to
 * @param {Function} setCurrentView - Function to update current view state
 */
export function navigateToView(view, setCurrentView) {
  if (!view || !setCurrentView) {
    console.warn('[notificationNavigation] Invalid parameters for navigateToView');
    return;
  }

  // Update URL
  const url = buildViewUrl(view);
  window.history.pushState({}, '', url);

  // Trigger navigation event for immediate update
  window.dispatchEvent(
    new CustomEvent('navigate-to-view', {
      detail: { view },
    })
  );

  // Update view state
  setCurrentView(view);
}

/**
 * Handle service worker navigation message
 * @param {MessageEvent} event - Service worker message event
 * @param {Function} setCurrentView - Function to update current view state
 * @param {boolean} isAuthenticated - Whether user is authenticated
 */
export function handleServiceWorkerNavigation(event, setCurrentView, isAuthenticated) {
  if (!event.data || event.data.type !== 'NAVIGATE') {
    return;
  }

  if (!isAuthenticated) {
    console.warn('[notificationNavigation] Cannot navigate - user not authenticated');
    return;
  }

  const url = event.data.url;
  if (!url) {
    console.warn('[notificationNavigation] No URL in navigation message');
    return;
  }

  const view = extractViewFromUrl(url);
  navigateToView(view, setCurrentView);
}
