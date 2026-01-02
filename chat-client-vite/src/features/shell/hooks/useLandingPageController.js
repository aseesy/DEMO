/**
 * Landing Page Controller Hook
 *
 * Single Responsibility: Manage landing page display logic.
 *
 * Handles:
 * - Determining when to show landing page
 * - PWA mode detection (delegates to usePWADetector)
 * - Auth state checks
 * - Storage checks
 */

import { useState, useEffect } from 'react';
import { usePWADetector } from './usePWADetector.js';
import { storage, StorageKeys } from '../../../adapters/storage';

/**
 * Control landing page display based on auth state and PWA mode
 *
 * @param {Object} params - Hook parameters
 * @param {boolean} params.isAuthenticated - Whether user is authenticated
 * @param {boolean} params.isCheckingAuth - Whether auth check is in progress
 * @returns {Object} { showLanding: boolean, setShowLanding: function }
 */
export function useLandingPageController({ isAuthenticated, isCheckingAuth }) {
  const isPWA = usePWADetector();

  const [showLanding, setShowLanding] = useState(() => {
    // PWA MODE: Skip landing page entirely - go straight to login
    // Users who installed the app don't need to see marketing content
    if (isPWA) {
      console.log('[LandingPageController] PWA mode detected, skipping landing page');
      return false;
    }

    // If authenticated from context (optimistic load), never show landing
    if (isAuthenticated) {
      console.log('[LandingPageController] Initializing: isAuthenticated=true, hiding landing');
      return false;
    }

    // If checking auth, don't show landing yet (wait for result)
    if (isCheckingAuth) {
      console.log(
        '[LandingPageController] Initializing: isCheckingAuth=true, hiding landing (waiting for auth check)'
      );
      return false;
    }

    // CRITICAL: Check storage directly - if user has stored auth, don't show landing
    // This handles the case where optimistic load hasn't completed yet
    const hasStoredAuth =
      storage.has(StorageKeys.AUTH_TOKEN) || storage.has(StorageKeys.IS_AUTHENTICATED);
    if (hasStoredAuth) {
      console.log('[LandingPageController] Initializing: stored auth exists, hiding landing');
      return false;
    }

    // Only show landing if definitely no auth anywhere
    console.log('[LandingPageController] Initializing showLanding:', {
      isAuthenticated,
      isCheckingAuth,
      hasStoredAuth,
      shouldShow: true,
    });
    return true;
  });

  // Auth effects - hide landing page when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setShowLanding(false);
    } else if (!isCheckingAuth) {
      // Only show landing if we're not checking auth and not authenticated
      // This prevents showing landing during the brief moment before auth check completes
      const hasStoredAuth =
        storage.has(StorageKeys.AUTH_TOKEN) || storage.has(StorageKeys.IS_AUTHENTICATED);

      // PWA MODE: Never show landing page - go straight to login
      if (isPWA) {
        setShowLanding(false);
        return;
      }

      // CRITICAL: If we have stored auth, don't show landing page
      // This handles the case where user just signed in and auth state hasn't updated yet
      if (hasStoredAuth) {
        console.log('[LandingPageController] Stored auth exists, hiding landing page');
        setShowLanding(false);
        return;
      }

      if (!hasStoredAuth && !isPWA && window.location.pathname === '/') {
        setShowLanding(true);
      }
    }
  }, [isAuthenticated, isCheckingAuth, isPWA]);

  // Determine if landing should actually be shown
  const hasStoredAuth =
    storage.has(StorageKeys.AUTH_TOKEN) || storage.has(StorageKeys.IS_AUTHENTICATED);
  const shouldShowLanding =
    !isAuthenticated &&
    !hasStoredAuth &&
    !isPWA && // PWA users skip landing
    showLanding;

  return {
    showLanding: shouldShowLanding,
    setShowLanding,
  };
}
