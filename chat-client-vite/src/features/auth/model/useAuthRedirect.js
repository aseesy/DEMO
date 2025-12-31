/**
 * useAuthRedirect - Hook for handling post-authentication redirects
 *
 * Handles:
 * - Redirecting after successful login
 * - Redirecting after successful signup
 * - Clearing pending invite codes
 * - Configurable redirect destinations
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
 * useAuthRedirect hook
 *
 * @param {Object} options
 * @param {boolean} options.isAuthenticated - Whether user is authenticated
 * @param {boolean} options.isNewSignup - Whether this was a new signup
 * @param {string} options.afterLoginPath - Where to redirect after login
 * @param {string} options.afterSignupPath - Where to redirect after signup
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

      // Navigate based on signup vs login
      const destination = isNewSignup ? afterSignupPath : afterLoginPath;
      
      // Only navigate if not already on destination path
      if (currentPath !== destination) {
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
