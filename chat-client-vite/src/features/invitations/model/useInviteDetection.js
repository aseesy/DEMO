/**
 * useInviteDetection - Hook for detecting and handling invite codes
 *
 * Handles:
 * - Detecting invite code from URL query params
 * - Persisting invite code to storage
 * - Retrieving invite code from storage
 * - Redirecting users with invite codes to proper flow
 */

import React from 'react';
import { useAppNavigation, NavigationPaths } from '../../../adapters/navigation';
import { storage, StorageKeys } from '../../../adapters/storage';

/**
 * useInviteDetection hook
 *
 * @param {Object} options
 * @param {boolean} options.isLoginMode - Whether user is in login mode (vs signup)
 * @param {boolean} options.autoRedirect - Whether to auto-redirect signup with invite code
 * @returns {Object} { pendingInviteCode, hasInvite, clearInviteCode, redirectToAcceptInvite }
 */
export function useInviteDetection({ isLoginMode = true, autoRedirect = true } = {}) {
  const { navigate, getQueryParam } = useAppNavigation();

  // Get invite code from URL (supports both ?invite= and ?code= params)
  const inviteCodeFromUrl = getQueryParam('invite') || getQueryParam('code');

  // Store invite code when detected in URL
  React.useEffect(() => {
    if (inviteCodeFromUrl) {
      storage.set(StorageKeys.PENDING_INVITE_CODE, inviteCodeFromUrl.toUpperCase());
    }
  }, [inviteCodeFromUrl]);

  // Get invite code from URL or storage
  const pendingInviteCode = React.useMemo(() => {
    return inviteCodeFromUrl || storage.getString(StorageKeys.PENDING_INVITE_CODE);
  }, [inviteCodeFromUrl]);

  // Redirect users with invite token to dedicated accept-invite page
  // But NOT for short codes (LZ-XXXXX) - those are handled on /invite-coparent after signup
  React.useEffect(() => {
    const isShortCode = pendingInviteCode?.startsWith('LZ-');
    if (autoRedirect && pendingInviteCode && !isLoginMode && !isShortCode) {
      navigate(
        NavigationPaths.withQuery(NavigationPaths.ACCEPT_INVITE, { token: pendingInviteCode }),
        { replace: true }
      );
    }
  }, [autoRedirect, pendingInviteCode, isLoginMode, navigate]);

  /**
   * Clear the stored invite code
   */
  const clearInviteCode = React.useCallback(() => {
    storage.remove(StorageKeys.PENDING_INVITE_CODE);
  }, []);

  /**
   * Navigate to accept invite page with current invite code
   */
  const redirectToAcceptInvite = React.useCallback(() => {
    if (pendingInviteCode) {
      navigate(
        NavigationPaths.withQuery(NavigationPaths.ACCEPT_INVITE, { token: pendingInviteCode })
      );
    }
  }, [pendingInviteCode, navigate]);

  return {
    pendingInviteCode,
    hasInvite: Boolean(pendingInviteCode),
    clearInviteCode,
    redirectToAcceptInvite,
  };
}

export default useInviteDetection;
