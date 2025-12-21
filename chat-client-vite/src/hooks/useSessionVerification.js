/**
 * useSessionVerification Hook
 *
 * Handles session verification on mount:
 * - Verifies stored tokens with server
 * - Restores auth state from localStorage
 * - Sets analytics properties
 */

import React from 'react';
import { apiGet } from '../apiClient.js';
import { setUserProperties, setUserID } from '../utils/analyticsEnhancements.js';
import { authStorage } from '../adapters/storage';

/**
 * Calculate user properties for analytics
 */
export function calculateUserProperties(user, isNewUser = false) {
  const properties = {
    user_type: isNewUser ? 'new_user' : 'returning_user',
    account_status: 'beta',
  };

  if (user.created_at) {
    const signupDate = new Date(user.created_at);
    const now = new Date();
    const daysSinceSignup = Math.floor((now - signupDate) / (1000 * 60 * 60 * 24));
    properties.days_since_signup = daysSinceSignup;

    if (daysSinceSignup < 7) {
      properties.user_type = 'new_user';
    } else if (daysSinceSignup < 30) {
      properties.user_type = 'returning_user';
    } else {
      properties.user_type = 'active_user';
    }
  }

  properties.hasCoparent = false;
  properties.features_used = [];

  return properties;
}

export function useSessionVerification({ setUsername, setIsAuthenticated }) {
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
            setUsername(data.user.username);
            setIsAuthenticated(true);
            authStorage.setUsername(data.user.username);
            authStorage.setAuthenticated(true);

            setUserID(data.user.username);
            const userProperties = calculateUserProperties(data.user, false);
            setUserProperties(userProperties);
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
        const storedUsername = authStorage.getUsername();
        const storedAuth = authStorage.isAuthenticated();
        if (storedUsername && storedAuth) {
          setUsername(storedUsername);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    const storedUsername = authStorage.getUsername();
    const storedAuth = authStorage.isAuthenticated();
    const storedToken = authStorage.getToken();

    if (storedUsername && storedAuth && storedToken) {
      setUsername(storedUsername);
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
      verifySession();
    } else if (storedUsername || storedAuth || storedToken) {
      verifySession();
    } else {
      setIsCheckingAuth(false);
    }
  }, [setUsername, setIsAuthenticated]);

  return { isCheckingAuth };
}

export default useSessionVerification;
