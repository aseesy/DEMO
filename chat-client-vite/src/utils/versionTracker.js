/**
 * Version Tracker
 *
 * Single Responsibility: Track app version and detect users stuck on old versions.
 *
 * Features:
 * - Stores current version in localStorage
 * - Tracks version adoption
 * - Detects users stuck on old versions
 * - Reports version metrics
 */

const VERSION_STORAGE_KEY = 'liaizen_app_version';
const VERSION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get stored app version
 * @returns {string|null} Stored version or null
 */
export function getStoredVersion() {
  try {
    return localStorage.getItem(VERSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Store app version
 * @param {string} version - Version to store
 */
export function storeVersion(version) {
  try {
    localStorage.setItem(VERSION_STORAGE_KEY, version);
    localStorage.setItem(`${VERSION_STORAGE_KEY}_timestamp`, Date.now().toString());
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if user is stuck on old version
 * @param {string} currentVersion - Current app version
 * @param {string} latestVersion - Latest available version
 * @returns {Object} { isStuck: boolean, daysSinceUpdate: number }
 */
export function checkStuckVersion(currentVersion, latestVersion) {
  if (currentVersion === latestVersion) {
    return { isStuck: false, daysSinceUpdate: 0 };
  }

  try {
    const timestamp = localStorage.getItem(`${VERSION_STORAGE_KEY}_timestamp`);
    if (!timestamp) {
      return { isStuck: false, daysSinceUpdate: 0 };
    }

    const daysSinceUpdate = (Date.now() - parseInt(timestamp, 10)) / (1000 * 60 * 60 * 24);
    const isStuck = daysSinceUpdate > 7; // Consider stuck if > 7 days

    return { isStuck, daysSinceUpdate: Math.floor(daysSinceUpdate) };
  } catch {
    return { isStuck: false, daysSinceUpdate: 0 };
  }
}

/**
 * Track version adoption
 * @param {string} version - Version to track
 */
export function trackVersionAdoption(version) {
  const storedVersion = getStoredVersion();
  
  if (storedVersion !== version) {
    // Version changed - track adoption
    storeVersion(version);
    
    // Track with analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'version_adoption', {
        event_category: 'pwa',
        version,
        previous_version: storedVersion || 'none',
        is_new_install: !storedVersion,
      });
    }
    
    console.log('[Version Tracker] Version adoption tracked:', {
      version,
      previous_version: storedVersion,
      is_new_install: !storedVersion,
    });
  }
}

/**
 * Initialize version tracking
 * @param {string} currentVersion - Current app version
 */
export function initVersionTracking(currentVersion) {
  trackVersionAdoption(currentVersion);
  
  // Check for stuck versions periodically
  setInterval(() => {
    const storedVersion = getStoredVersion();
    if (storedVersion && storedVersion !== currentVersion) {
      const { isStuck, daysSinceUpdate } = checkStuckVersion(storedVersion, currentVersion);
      
      if (isStuck) {
        // Track stuck user
        import('./pwaObservability.js').then(({ trackStuckOnOldVersion }) => {
          trackStuckOnOldVersion(storedVersion, currentVersion, daysSinceUpdate);
        }).catch(() => {});
      }
    }
  }, VERSION_CHECK_INTERVAL);
}

export default {
  getStoredVersion,
  storeVersion,
  checkStuckVersion,
  trackVersionAdoption,
  initVersionTracking,
};

