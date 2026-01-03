/**
 * NavigationAdapter - Abstraction layer for navigation/routing
 *
 * Why this exists:
 * - Decouples application code from react-router-dom
 * - If we switch to Next.js, Remix, or another framework, only this file changes
 * - Provides a stable API that application code can depend on
 *
 * Usage:
 *   import { useAppNavigation } from '../adapters/navigation';
 *   const { navigate, goBack, currentPath } = useAppNavigation();
 */

import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * useAppNavigation - Primary navigation hook
 *
 * @returns {Object} Navigation interface
 * @returns {Function} navigate - Navigate to a path
 * @returns {Function} goBack - Go to previous page
 * @returns {Function} replace - Replace current history entry
 * @returns {string} currentPath - Current pathname
 * @returns {Object} queryParams - Current query parameters as object
 * @returns {Function} setQueryParam - Set a single query parameter
 * @returns {Function} getQueryParam - Get a single query parameter
 */
export function useAppNavigation() {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigate to a path
  const navigate = useCallback(
    (path, options = {}) => {
      if (options.replace) {
        routerNavigate(path, { replace: true });
      } else {
        routerNavigate(path);
      }
    },
    [routerNavigate]
  );

  // Go back in history
  const goBack = useCallback(() => {
    routerNavigate(-1);
  }, [routerNavigate]);

  // Replace current entry (no history)
  const replace = useCallback(
    path => {
      routerNavigate(path, { replace: true });
    },
    [routerNavigate]
  );

  // Get query parameter
  const getQueryParam = useCallback(
    key => {
      return searchParams.get(key);
    },
    [searchParams]
  );

  // Set query parameter
  const setQueryParam = useCallback(
    (key, value) => {
      const newParams = new URLSearchParams(searchParams);
      if (value === null || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  // Query params as plain object
  const queryParams = useMemo(() => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  return {
    navigate,
    goBack,
    replace,
    currentPath: location.pathname,
    queryParams,
    getQueryParam,
    setQueryParam,
  };
}

/**
 * NavigationPaths - Centralized route definitions
 *
 * Why this exists:
 * - Single source of truth for all routes
 * - Type-safe path construction
 * - Easy to refactor routes without breaking links
 */
export const NavigationPaths = {
  // Auth routes
  HOME: '/',
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // App routes
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  CONTACTS: '/contacts',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ACCOUNT: '/account',

  // Content routes
  PRIVACY: '/privacy',
  TERMS: '/terms',
  // BLOG: '/blog', // Moved to marketing site (www.coparentliaizen.com)
  QUIZZES: '/quizzes',

  // Invitation routes
  ACCEPT_INVITE: '/accept-invite',
  INVITE_COPARENT: '/invite-coparent',

  // OAuth callback
  GOOGLE_CALLBACK: '/auth/google/callback',

  // Helper to build paths with params
  withParams: (path, params) => {
    let result = path;
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, value);
    });
    return result;
  },

  // Helper to build paths with query string
  withQuery: (path, query) => {
    const params = new URLSearchParams(query);
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  },
};

export default useAppNavigation;
