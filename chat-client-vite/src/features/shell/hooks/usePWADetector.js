/**
 * PWA Detector Hook
 *
 * Single Responsibility: Detect if app is running in PWA mode.
 *
 * Abstracts browser API access (window.matchMedia, navigator.standalone).
 * Callers don't need to know about browser-specific APIs.
 */

import { useState, useEffect } from 'react';

/**
 * Detect if app is running in PWA/standalone mode
 *
 * @returns {boolean} True if running as PWA
 */
export function usePWADetector() {
  const [isPWA, setIsPWA] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check for standalone display mode (Android, Chrome, Edge)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Check for iOS Safari standalone mode
    const isIOSStandalone = window.navigator.standalone === true;

    return isStandalone || isIOSStandalone;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Listen for display mode changes (if supported)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = e => {
      setIsPWA(e.matches || window.navigator.standalone === true);
    };

    // Some browsers support addEventListener on MediaQueryList
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return isPWA;
}
