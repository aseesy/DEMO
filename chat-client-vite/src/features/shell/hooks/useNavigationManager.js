/**
 * Navigation Manager Hook
 *
 * Single Responsibility: Handle navigation and routing logic.
 *
 * Handles:
 * - Authentication-based redirects
 * - URL parameter reading
 * - Deep link handling
 * - Redirect loop prevention
 */

import { useEffect, useRef } from 'react';
import { useAppNavigation, NavigationPaths } from '../../../adapters/navigation';
import { storage, StorageKeys } from '../../../adapters/storage';

const AVAILABLE_VIEWS = ['dashboard', 'chat', 'contacts', 'profile', 'settings', 'account'];

/**
 * Manage navigation based on auth state and URL
 *
 * @param {Object} params - Hook parameters
 * @param {boolean} params.isAuthenticated - Whether user is authenticated
 * @param {boolean} params.isCheckingAuth - Whether auth check is in progress
 * @param {string} params.currentView - Current view name
 * @param {Function} params.setCurrentView - Function to set current view
 * @returns {void}
 */
export function useNavigationManager({
  isAuthenticated,
  isCheckingAuth,
  currentView,
  setCurrentView,
}) {
  const { navigate, getQueryParam } = useAppNavigation();

  // Use refs to prevent infinite redirect loops
  const hasRedirectedRef = useRef(false);
  const lastPathRef = useRef(typeof window !== 'undefined' ? window.location.pathname : '/');
  const redirectTimeoutRef = useRef(null);

  // Main navigation effect - handles auth-based redirects
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentPath = window.location.pathname;

    // CRITICAL: Only reset redirect ref when path actually changes
    // This prevents loops when state changes but we're already on the correct page
    if (currentPath !== lastPathRef.current) {
      hasRedirectedRef.current = false;
      lastPathRef.current = currentPath;
    }

    // Clear any pending redirect timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    // Don't redirect while checking auth - wait for verification to complete
    if (isCheckingAuth) {
      console.log('[NavigationManager] Auth check in progress, waiting...');
      return;
    }

    // If authenticated, ensure we're not on sign-in page (redirect to home)
    if (isAuthenticated) {
      console.log('[NavigationManager] User is authenticated, ensuring correct route');
      const isOnSignIn = currentPath === '/signin' || currentPath === '/sign-in';
      if (isOnSignIn && !hasRedirectedRef.current) {
        console.log('[NavigationManager] Redirecting authenticated user from sign-in to home');
        hasRedirectedRef.current = true;
        lastPathRef.current = '/';
        navigate('/', { replace: true });
        return;
      }
      return;
    }

    // Not authenticated - but check if we have stored auth first
    // This handles the case where server verification failed but token exists
    const hasStoredAuth =
      storage.has(StorageKeys.AUTH_TOKEN) || storage.has(StorageKeys.IS_AUTHENTICATED);
    if (hasStoredAuth) {
      console.log(
        '[NavigationManager] Not authenticated but stored auth exists - waiting for verification'
      );
      // Don't redirect yet - might be a temporary network issue
      // The verifySession will eventually clear auth if token is invalid
      return;
    }

    // Definitely not authenticated and no stored auth
    const isOnSignIn = currentPath === '/signin' || currentPath === '/sign-in';
    const isOnRoot = currentPath === '/';

    // Don't redirect if already on sign-in
    if (isOnSignIn) {
      return;
    }

    // Prevent infinite redirect loop - only redirect if we haven't already redirected to this path
    if (hasRedirectedRef.current) {
      console.log('[NavigationManager] Already redirected, preventing loop');
      return;
    }

    // Redirect to sign-in (only if not already there and haven't redirected)
    if (!isOnSignIn) {
      console.log('[NavigationManager] Redirecting to sign-in');
      hasRedirectedRef.current = true;
      lastPathRef.current = NavigationPaths.SIGN_IN;

      // But preserve invite codes and other query params
      const inviteCode = getQueryParam('invite');
      if (inviteCode) {
        navigate(NavigationPaths.withQuery(NavigationPaths.SIGN_IN, { invite: inviteCode }), {
          replace: true,
        });
      } else {
        navigate(NavigationPaths.SIGN_IN, { replace: true });
      }
    }
  }, [isCheckingAuth, isAuthenticated, navigate, getQueryParam]);

  // Save current view to storage
  useEffect(() => {
    if (isAuthenticated) {
      storage.set(StorageKeys.CURRENT_VIEW, currentView);
    }
  }, [isAuthenticated, currentView]);

  // Listen for navigation events from service worker (when notification is clicked)
  useEffect(() => {
    const handleNavigateToView = event => {
      if (event.detail && event.detail.view) {
        const targetView = event.detail.view;
        console.log('[NavigationManager] Received navigate-to-view event:', targetView, {
          isAuthenticated,
          currentView,
          isValidView: AVAILABLE_VIEWS.includes(targetView),
        });

        // Only navigate if authenticated and view is valid
        if (isAuthenticated && AVAILABLE_VIEWS.includes(targetView)) {
          console.log('[NavigationManager] Navigating to view from notification:', targetView);
          setCurrentView(targetView);
        } else if (!isAuthenticated) {
          console.warn('[NavigationManager] Cannot navigate - user not authenticated');
        } else if (!AVAILABLE_VIEWS.includes(targetView)) {
          console.warn('[NavigationManager] Invalid view:', targetView);
        }
      }
    };

    window.addEventListener('navigate-to-view', handleNavigateToView);

    return () => {
      window.removeEventListener('navigate-to-view', handleNavigateToView);
    };
  }, [isAuthenticated, setCurrentView, currentView]);

  // Check URL for view parameter on mount (handles deep links from notifications)
  useEffect(() => {
    if (isAuthenticated && !isCheckingAuth) {
      const viewParam = getQueryParam('view');
      if (viewParam && AVAILABLE_VIEWS.includes(viewParam) && viewParam !== currentView) {
        console.log('[NavigationManager] Found view parameter in URL, navigating to:', viewParam);
        setCurrentView(viewParam);
      }
    }
  }, [isAuthenticated, isCheckingAuth, getQueryParam, currentView, setCurrentView]);

  // Redirect to sign-in if not authenticated (with timeout)
  // Landing page is now on marketing site (www.coparentliaizen.com)
  useEffect(() => {
    if (!isAuthenticated && !isCheckingAuth) {
      const timer = setTimeout(() => {
        console.log('[NavigationManager] Not authenticated after timeout, redirecting to sign-in');
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
        // Only redirect if not already on signin page
        if (currentPath !== '/signin' && currentPath !== '/sign-in' && currentPath !== '/siginin') {
          navigate('/signin');
        }
      }, 2000); // 2 second timeout
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isCheckingAuth, navigate]);
}
