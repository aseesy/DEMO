/**
 * Auth Guard Component
 *
 * Single Responsibility: Handle authentication state and show appropriate UI.
 *
 * Shows:
 * - Loading state while checking auth
 * - Landing page if not authenticated and not PWA
 * - Sign-in page if not authenticated
 * - Main app if authenticated
 */

import React from 'react';
import { storage, StorageKeys } from '../../../adapters/storage';
import { LandingPage } from '../../landing/LandingPage.jsx';
import { LoginSignup } from '../../auth/components/LoginSignup.jsx';
import { useAppNavigation, NavigationPaths } from '../../../adapters/navigation';
import { usePWADetector } from '../hooks/usePWADetector.js';

/**
 * Auth Guard - handles authentication-based rendering
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isAuthenticated - Whether user is authenticated
 * @param {boolean} props.isCheckingAuth - Whether auth check is in progress
 * @param {boolean} props.showLanding - Whether to show landing page
 * @param {Function} props.onGetStarted - Callback when user clicks "Get Started"
 * @param {React.ReactNode} props.children - Content to render if authenticated
 * @returns {React.ReactNode}
 */
export function AuthGuard({
  isAuthenticated,
  isCheckingAuth,
  showLanding,
  onGetStarted,
  children,
}) {
  const { navigate } = useAppNavigation();
  const isPWA = usePWADetector();

  // Show loading state while checking auth (prevents flash of landing page)
  // CRITICAL: If we have stored auth, show loading instead of landing page
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

  // Show landing page if not authenticated and not PWA
  if (showLanding) {
    console.log('[AuthGuard] Showing landing page:', {
      isAuthenticated,
      isCheckingAuth,
      showLanding,
      hasToken: storage.has(StorageKeys.AUTH_TOKEN),
      hasIsAuth: storage.has(StorageKeys.IS_AUTHENTICATED),
    });
    return <LandingPage onGetStarted={onGetStarted || (() => navigate(NavigationPaths.SIGN_IN))} />;
  }

  // If not authenticated, show sign-in page or redirect
  if (!isAuthenticated) {
    // If we're already on signin page, render LoginSignup directly
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath === '/signin' || currentPath === '/sign-in' || currentPath === '/siginin') {
        console.log('[AuthGuard] Already on signin page, rendering LoginSignup');
        return <LoginSignup />;
      }
    }

    // Show redirecting message
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
          Redirecting to sign in…
        </div>
      </div>
    );
  }

  // Authenticated - render main app
  return <>{children}</>;
}
