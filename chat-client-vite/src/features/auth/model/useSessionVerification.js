/**
 * useSessionVerification Hook
 *
 * Handles session verification on mount:
 * - Verifies stored tokens with server
 * - Restores auth state from localStorage
 * - Sets analytics properties
 */

import React from 'react';
import { apiGet } from '../../../apiClient.js';
import { setUserProperties, setUserID } from '../../../utils/analyticsEnhancements.js';
import { authStorage } from '../../../adapters/storage';

/**
 * Calculate user properties for analytics.
 * Accepts a user object and extracts only the fields it needs.
 */
export function calculateUserProperties(user, isNewUser = false) {
  // Extract what we need at this boundary
  const createdAt = user?.created_at;

  const properties = {
    user_type: isNewUser ? 'new_user' : 'returning_user',
    account_status: 'beta',
    hasCoparent: false,
    features_used: [],
  };

  if (createdAt) {
    const signupDate = new Date(createdAt);
    const daysSinceSignup = Math.floor((Date.now() - signupDate) / (1000 * 60 * 60 * 24));
    properties.days_since_signup = daysSinceSignup;

    if (daysSinceSignup < 7) {
      properties.user_type = 'new_user';
    } else if (daysSinceSignup < 30) {
      properties.user_type = 'returning_user';
    } else {
      properties.user_type = 'active_user';
    }
  }

  return properties;
}

export function useSessionVerification({ setIsAuthenticated }) {
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    const verifySession = async () => {
      setIsCheckingAuth(true);
      try {
        const token = authStorage.getToken();
        const response = await apiGet('/api/auth/verify', {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setIsAuthenticated(true);
            authStorage.setAuthenticated(true);

            if (data.user?.email) {
              setUserID(data.user.email);
              const userProperties = calculateUserProperties(data.user, false);
              setUserProperties(userProperties);
            }
          } else {
            authStorage.clearAuth();
            setIsAuthenticated(false);
          }
        } else {
          authStorage.clearAuth();
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error verifying session:', err);
        const storedAuth = authStorage.isAuthenticated();
        if (storedAuth) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    const storedToken = authStorage.getToken();

    // Always verify with server if we have any stored credentials
    // Do NOT set isAuthenticated until server confirms - prevents flash on stale tokens
    if (storedToken) {
      verifySession();
    } else {
      setIsCheckingAuth(false);
    }
  }, [setIsAuthenticated]);

  return { isCheckingAuth };
}

export default useSessionVerification;
