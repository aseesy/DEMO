/**
 * Auth Guard Component
 *
 * Single Responsibility: Handle authentication state and show appropriate UI.
 *
 * Shows:
 * - Loading state while checking auth
 * - Sign-in page if not authenticated
 * - Main app if authenticated
 *
 * NOTE: Landing page is now on the marketing site (www.coparentliaizen.com)
 */

import React from 'react';
import { storage, StorageKeys } from '../../../adapters/storage';
import { LoginSignup } from '../../auth/components/LoginSignup.jsx';
import { useAppNavigation, NavigationPaths } from '../../../adapters/navigation';

/**
 * Auth Guard - handles authentication-based rendering
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isAuthenticated - Whether user is authenticated
 * @param {boolean} props.isCheckingAuth - Whether auth check is in progress
 * @param {Function} props.onGetStarted - Callback when user clicks "Get Started" (not used, kept for compatibility)
 * @param {React.ReactNode} props.children - Content to render if authenticated
 * @returns {React.ReactNode}
 */
export function AuthGuard({ isAuthenticated, isCheckingAuth, onGetStarted, children }) {
  // Show loading state while checking auth
  if (isCheckingAuth) {
    const hasStoredAuth =
      storage.has(StorageKeys.AUTH_TOKEN) || storage.has(StorageKeys.IS_AUTHENTICATED);
    console.log('[AuthGuard] Checking auth:', {
      isCheckingAuth: true,
      hasStoredAuth,
      isAuthenticated,
    });
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
        style={{
          width: '100%',
          height: '100vh',
          backgroundColor: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="text-gray-600 text-lg"
          style={{
            color: '#4b5563',
            fontSize: '18px',
            fontWeight: '500',
          }}
        >
          Checking your session…
        </div>
      </div>
    );
  }

  // If not authenticated, show sign-up/sign-in page
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;

      // If on signin page, show login form
      if (currentPath === '/signin' || currentPath === '/sign-in' || currentPath === '/siginin') {
        console.log('[AuthGuard] On signin page, rendering LoginSignup (login mode)');
        return <LoginSignup />;
      }

      // For root path or signup path, show signup form (default for new visitors)
      if (currentPath === '/' || currentPath === '/signup') {
        console.log('[AuthGuard] New visitor, rendering LoginSignup (signup mode)');
        return <LoginSignup defaultToSignup={true} />;
      }
    }

    // For any other path, redirect to signup
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
        style={{
          width: '100%',
          height: '100vh',
          backgroundColor: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="text-gray-600 text-lg"
          style={{
            color: '#4b5563',
            fontSize: '18px',
            fontWeight: '500',
          }}
        >
          Redirecting to sign up…
        </div>
      </div>
    );
  }

  // Authenticated - render main app
  return <>{children}</>;
}
