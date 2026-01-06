/**
 * useAuthRedirect - Hook for handling post-authentication redirects
 *
 * Handles:
 * - Redirecting after successful login
 * - Redirecting after successful signup
 * - Clearing pending invite codes
 * - Configurable redirect destinations
 * - Deep linking with return URL support
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
    if (!isAuthenticated) {
      return;
    }

    const timer = setTimeout(() => {
      // Clear pending invite code if requested
      if (clearInviteCode) {
        storage.remove(StorageKeys.PENDING_INVITE_CODE);
      }

      // Check for stored return URL (for deep linking)
      const storedReturnUrl = storage.getString(StorageKeys.RETURN_URL);
      
      let destination;
      if (storedReturnUrl && isValidReturnUrl(storedReturnUrl)) {
        // Use return URL if valid
        destination = storedReturnUrl;
        // Clear return URL after use
        storage.remove(StorageKeys.RETURN_URL);
        console.log('[useAuthRedirect] Redirecting to stored return URL:', destination);
      } else {
        // Use default path based on signup vs login
        destination = isNewSignup ? afterSignupPath : afterLoginPath;
      }
      
      // Only navigate if not already on destination path
      // For return URLs, compare pathname + search
      const currentFullPath = currentPath + (window.location.search || '');
      if (currentFullPath !== destination) {
        navigate(destination, { replace: true });
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
