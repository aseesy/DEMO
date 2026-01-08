/**
 * 🔒 SEALED FILE - DO NOT MODIFY WITHOUT APPROVAL
 * 
 * useAuthRedirect - Hook for handling post-authentication redirects
 *
 * ⚠️ CRITICAL: This file is SEALED and SET IN STONE.
 * Redirect logic is critical for proper post-auth navigation.
 * 
 * RULES FOR AI ASSISTANTS:
 * - ❌ DO NOT modify redirect trigger logic (isAuthenticated, isNewSignup)
 * - ❌ DO NOT change redirect paths without updating NavigationPaths constant
 * - ✅ CAN update redirect paths (if routes change)
 * - ✅ CAN modify redirect delay (currently 100ms for signup)
 * 
 * Before modifying: Check docs/AUTH_FLOW_SEALED.md for approval process.
 * 
 * Handles:
 * - Redirecting after successful login
 * - Redirecting after successful signup
 * - Clearing pending invite codes
 * - Configurable redirect destinations
 * - Deep linking with return URL support
 * 
 * See: docs/AUTH_FLOW_SEALED.md for complete sealing documentation.
 */

import React from 'react';
import { useAppNavigation, NavigationPaths } from '../../../adapters/navigation';
import { storage, StorageKeys } from '../../../adapters/storage';

/**
 * Default redirect paths
 */
export const DEFAULT_REDIRECT_PATHS = {
  afterLogin: NavigationPaths.HOME,
  afterSignup: NavigationPaths.INVITE_COPARENT,
};

/**
 * Validate return URL for security
 * Only allows same-origin URLs
 * @param {string} returnUrl - URL to validate
 * @returns {boolean} Whether URL is safe
 */
function isValidReturnUrl(returnUrl) {
  if (!returnUrl || typeof returnUrl !== 'string') {
    return false;
  }

  try {
    // Must be a relative URL (starts with /) or same origin
    if (returnUrl.startsWith('/')) {
      // Relative URL - safe
      return true;
    }

    // Absolute URL - must be same origin
    const url = new URL(returnUrl, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * useAuthRedirect hook
 *
 * @param {Object} options
 * @param {boolean} options.isAuthenticated - Whether user is authenticated
 * @param {boolean} options.isNewSignup - Whether this was a new signup
 * @param {string} options.afterLoginPath - Where to redirect after login (if no return URL)
 * @param {string} options.afterSignupPath - Where to redirect after signup (if no return URL)
 * @param {number} options.delay - Delay before redirect (ms)
 * @param {boolean} options.clearInviteCode - Whether to clear pending invite code
 */
export function useAuthRedirect({
  isAuthenticated = false,
  isNewSignup = false,
  afterLoginPath = DEFAULT_REDIRECT_PATHS.afterLogin,
  afterSignupPath = DEFAULT_REDIRECT_PATHS.afterSignup,
  delay = 100,
  clearInviteCode = true,
} = {}) {
  const { navigate, currentPath } = useAppNavigation();

  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[useAuthRedirect] Effect running:', {
        isAuthenticated,
        isNewSignup,
        currentPath,
        delay,
      });
    }

    if (!isAuthenticated) {
      if (import.meta.env.DEV) {
        console.log('[useAuthRedirect] Not authenticated, skipping redirect');
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log('[useAuthRedirect] Scheduling redirect in', delay, 'ms');
    }

    const timer = setTimeout(() => {
      // Clear pending invite code if requested
      if (clearInviteCode) {
        storage.remove(StorageKeys.PENDING_INVITE_CODE);
      }

      let destination;

      // New signups always go to invite-coparent (ignore return URL)
      if (isNewSignup) {
        destination = afterSignupPath;
        storage.remove(StorageKeys.RETURN_URL); // Clear any stored return URL
        if (import.meta.env.DEV) {
          console.log('[useAuthRedirect] New signup - redirecting to:', destination);
        }
      } else {
        // For logins, check for stored return URL (deep linking)
        const storedReturnUrl = storage.getString(StorageKeys.RETURN_URL);
        if (storedReturnUrl && isValidReturnUrl(storedReturnUrl)) {
          destination = storedReturnUrl;
          storage.remove(StorageKeys.RETURN_URL);
          if (import.meta.env.DEV) {
            console.log('[useAuthRedirect] Login - redirecting to return URL:', destination);
          }
        } else {
          destination = afterLoginPath;
          if (import.meta.env.DEV) {
            console.log('[useAuthRedirect] Login - redirecting to default:', destination);
          }
        }
      }

      // Only navigate if not already on destination path
      // For return URLs, compare pathname + search
      const currentFullPath = currentPath + (window.location.search || '');
      if (currentFullPath !== destination) {
        if (import.meta.env.DEV) {
          console.log('[useAuthRedirect] Navigating from', currentFullPath, 'to', destination);
        }
        navigate(destination, { replace: true });
      } else {
        if (import.meta.env.DEV) {
          console.log('[useAuthRedirect] Already on destination, skipping navigate');
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [
    isAuthenticated,
    isNewSignup,
    afterLoginPath,
    afterSignupPath,
    delay,
    clearInviteCode,
    navigate,
    currentPath,
  ]);
}

export default useAuthRedirect;
