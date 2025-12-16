import React from 'react';
import { apiGet, apiPost } from '../apiClient.js';
import { setUserProperties, setUserID } from '../utils/analyticsEnhancements.js';
import { getErrorMessage, logError, retryWithBackoff, isRetryableError } from '../utils/errorHandler.jsx';
import {
  generateOAuthState,
  storeOAuthState,
  validateOAuthState,
  clearOAuthState,
  detectPopupBlocker,
} from '../utils/oauthHelper.js';

// Helper function to calculate user properties for analytics
function calculateUserProperties(user, isNewUser = false) {
  const properties = {
    user_type: isNewUser ? 'new_user' : 'returning_user',
    account_status: 'beta', // Default to beta for now
  };

  // Calculate days since signup if created_at is available
  if (user.created_at) {
    const signupDate = new Date(user.created_at);
    const now = new Date();
    const daysSinceSignup = Math.floor((now - signupDate) / (1000 * 60 * 60 * 24));
    properties.days_since_signup = daysSinceSignup;

    // Determine user type based on days since signup
    if (daysSinceSignup < 7) {
      properties.user_type = 'new_user';
    } else if (daysSinceSignup < 30) {
      properties.user_type = 'returning_user';
    } else {
      properties.user_type = 'active_user';
    }
  }

  // Check if user has co-parent (will be updated when co-parent connects)
  // For now, default to false - will be updated in ChatRoom when connection is detected
  properties.hasCoparent = false;

  // Features used (will be updated based on actual usage)
  properties.features_used = [];

  return properties;
}

// This hook will gradually absorb the auth-related logic that currently lives
// inside ChatRoom in the legacy chat-client/index.html script.

export function useAuth() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isSigningUp, setIsSigningUp] = React.useState(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = React.useState(false);
  const [error, setError] = React.useState('');

  // Restore/verify session on mount (similar to legacy verifySession)
  React.useEffect(() => {
    const verifySession = async () => {
      setIsCheckingAuth(true);
      try {
        const response = await apiGet('/api/auth/verify', {
          headers: {
            Authorization: localStorage.getItem('auth_token_backup')
              ? `Bearer ${localStorage.getItem('auth_token_backup')}`
              : undefined,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setUsername(data.user.username);
            setIsAuthenticated(true);
            // Keep localStorage in sync
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('isAuthenticated', 'true');

            // Set User ID and properties for analytics
            setUserID(data.user.username);
            const userProperties = calculateUserProperties(data.user, false);
            setUserProperties(userProperties);
          } else {
            // Session invalid - clear everything
            localStorage.removeItem('username');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('auth_token_backup');
            localStorage.removeItem('chatUser');
            localStorage.removeItem('userEmail');
            setIsAuthenticated(false);
          }
        } else {
          // Session invalid - clear everything
          localStorage.removeItem('username');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('auth_token_backup');
          localStorage.removeItem('chatUser');
          localStorage.removeItem('userEmail');
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error verifying session (Vite):', err);
        // On error, try to restore from localStorage if available
        const storedUsername = localStorage.getItem('username');
        const storedAuth = localStorage.getItem('isAuthenticated');
        if (storedUsername && storedAuth === 'true') {
          setUsername(storedUsername);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    // Always verify session if we have any auth data in localStorage
    const storedUsername = localStorage.getItem('username');
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedToken = localStorage.getItem('auth_token_backup');

    // If we have all auth data (username, auth flag, and token), we're likely already authenticated
    // Set state immediately to avoid race conditions, then verify in background
    if (storedUsername && storedAuth === 'true' && storedToken) {
      // Set authenticated state immediately from localStorage
      setUsername(storedUsername);
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
      // Verify in background to ensure session is still valid
      verifySession();
    } else if (storedUsername || storedAuth || storedToken) {
      verifySession();
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  const handleLogin = async (e, spamFields = {}) => {
    if (e?.preventDefault) e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const honeypotValue = spamFields.website || '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address');
      setIsLoggingIn(false);
      return;
    }
    if (cleanPassword.length < 4) {
      setError('Password must be at least 4 characters');
      setIsLoggingIn(false);
      return;
    }

    try {
      const response = await retryWithBackoff(
        () => apiPost('/api/auth/login', {
          email: cleanEmail,
          password: cleanPassword,
          website: honeypotValue, // Honeypot field for spam protection
        }),
        {
          maxRetries: 3,
          shouldRetry: (error, statusCode) => {
            // Don't retry 4xx errors (except 429 rate limit)
            if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
              return false;
            }
            return isRetryableError(error, statusCode);
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorInfo = getErrorMessage(data, { statusCode: response.status, endpoint: '/api/auth/login' });
        logError(data, { endpoint: '/api/auth/login', operation: 'login', email: cleanEmail });
        
        // Handle specific error codes from backend
        if (data.code === 'ACCOUNT_NOT_FOUND' || response.status === 404) {
          errorInfo.userMessage = 'No account found with this email. Would you like to create an account?';
          errorInfo.action = 'create_account';
          setError(errorInfo.userMessage);
          return { success: false, error: errorInfo, action: 'create_account' };
        }
        
        if (data.code === 'OAUTH_ONLY_ACCOUNT' || response.status === 403) {
          errorInfo.userMessage = data.error || 'This account uses Google sign-in. Please sign in with Google.';
          errorInfo.action = 'use_google';
          setError(errorInfo.userMessage);
          return { success: false, error: errorInfo, action: 'use_google' };
        }
        
        if (data.code === 'INVALID_PASSWORD' || (response.status === 401 && data.error?.includes('password'))) {
          errorInfo.userMessage = 'Incorrect password. Please try again.';
          setError(errorInfo.userMessage);
          return { success: false, error: errorInfo };
        }
        
        // Generic error handling
        setError(errorInfo.userMessage);
        return { success: false, error: errorInfo };
      }

      setIsAuthenticated(true);
      if (data.user?.username) {
        setUsername(data.user.username);
        localStorage.setItem('username', data.user.username);

        // Set User ID for analytics
        setUserID(data.user.username);

        // Set user properties for analytics
        const userProperties = calculateUserProperties(data.user, false);
        setUserProperties(userProperties);
      }
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', cleanEmail);
      if (data.token) {
        localStorage.setItem('auth_token_backup', data.token);
      }
      if (data.user) {
        localStorage.setItem('chatUser', JSON.stringify(data.user));
      }
      return { success: true, user: data.user };
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/auth/login' });
      logError(err, { endpoint: '/api/auth/login', operation: 'login', email: cleanEmail });
      setError(errorInfo.userMessage);
      return { success: false, error: errorInfo };
    } finally {
      setIsLoggingIn(false);
    }
  };

  /**
   * Legacy signup function - kept for backward compatibility
   * Use handleRegister for new registrations with co-parent invitation
   */
  const handleSignup = async (e, spamFields = {}) => {
    if (e?.preventDefault) e.preventDefault();
    setError('');
    setIsSigningUp(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const honeypotValue = spamFields.website || '';

    if (!cleanEmail) {
      setError('Email is required');
      setIsSigningUp(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address');
      setIsSigningUp(false);
      return;
    }
    if (cleanPassword.length < 4) {
      setError('Password must be at least 4 characters');
      setIsSigningUp(false);
      return;
    }

    try {
      const response = await retryWithBackoff(
        () => apiPost('/api/auth/signup', {
          email: cleanEmail,
          password: cleanPassword,
          context: {},
          website: honeypotValue, // Honeypot field for spam protection
        }),
        {
          maxRetries: 3,
          shouldRetry: (error, statusCode) => {
            // Don't retry 4xx errors (except 429 rate limit)
            if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
              return false;
            }
            return isRetryableError(error, statusCode);
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorInfo = getErrorMessage(data, { statusCode: response.status, endpoint: '/api/auth/signup' });
        logError(data, { endpoint: '/api/auth/signup', operation: 'signup', email: cleanEmail });
        
        // Special handling for REG_001 (email exists)
        if (data.code === 'REG_001' || data.error?.includes('already') || data.error?.includes('exists')) {
          setError(errorInfo.userMessage);
          return { success: false, error: errorInfo, action: 'sign_in' };
        }
        
        setError(errorInfo.userMessage);
        return { success: false, error: errorInfo };
      }

      setIsAuthenticated(true);
      if (data.user?.username) {
        setUsername(data.user.username);
        localStorage.setItem('username', data.user.username);

        // Set User ID for analytics
        setUserID(data.user.username);

        // Set user properties for analytics (new user)
        const userProperties = calculateUserProperties(data.user, true);
        setUserProperties(userProperties);
      }
      localStorage.setItem('chatUser', JSON.stringify(data.user));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', cleanEmail);
      if (data.token) {
        localStorage.setItem('auth_token_backup', data.token);
      }
      return { success: true, user: data.user };
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/auth/signup' });
      logError(err, { endpoint: '/api/auth/signup', operation: 'signup', email: cleanEmail });
      setError(errorInfo.userMessage);
      return { success: false, error: errorInfo };
    } finally {
      setIsSigningUp(false);
    }
  };

  /**
   * Register new user with co-parent invitation
   * This is the primary registration method that creates user AND sends invitation
   * @param {Event} e - Form submit event
   * @param {string} coParentEmail - Email address of the co-parent to invite
   */
  const handleRegister = async (e, coParentEmail) => {
    if (e?.preventDefault) e.preventDefault();
    setError('');
    setIsSigningUp(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanUsername = username.trim();
    const cleanCoParentEmail = coParentEmail?.trim().toLowerCase();

    // Validation
    if (!cleanUsername) {
      setError('Name is required');
      setIsSigningUp(false);
      return;
    }
    if (!cleanEmail) {
      setError('Email is required');
      setIsSigningUp(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address');
      setIsSigningUp(false);
      return;
    }
    if (cleanPassword.length < 4) {
      setError('Password must be at least 4 characters');
      setIsSigningUp(false);
      return;
    }
    if (!cleanCoParentEmail) {
      setError('Co-parent email is required');
      setIsSigningUp(false);
      return;
    }
    if (!emailRegex.test(cleanCoParentEmail)) {
      setError('Please enter a valid email for your co-parent');
      setIsSigningUp(false);
      return;
    }
    if (cleanCoParentEmail === cleanEmail) {
      setError('You cannot invite yourself as a co-parent');
      setIsSigningUp(false);
      return;
    }

    try {
      // Use the /api/auth/register endpoint which creates user AND sends invitation
      const response = await retryWithBackoff(
        () => apiPost('/api/auth/register', {
          email: cleanEmail,
          password: cleanPassword,
          displayName: cleanUsername, // Updated: use displayName instead of username
          coParentEmail: cleanCoParentEmail,
          context: {},
        }),
        {
          maxRetries: 3,
          shouldRetry: (error, statusCode) => {
            // Don't retry 4xx errors (except 429 rate limit)
            if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
              return false;
            }
            return isRetryableError(error, statusCode);
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorInfo = getErrorMessage(data, { statusCode: response.status, endpoint: '/api/auth/register' });
        logError(data, { endpoint: '/api/auth/register', operation: 'register', email: cleanEmail });
        
        // Special handling for REG_001 (email exists)
        if (data.code === 'REG_001' || data.error?.includes('already') || data.error?.includes('exists')) {
          setError(errorInfo.userMessage);
          return { success: false, error: errorInfo, action: 'sign_in' };
        }
        
        setError(errorInfo.userMessage);
        return { success: false, error: errorInfo };
      }

      // Set authentication state
      setIsAuthenticated(true);
      if (data.user?.username) {
        setUsername(data.user.username);
        localStorage.setItem('username', data.user.username);

        // Set User ID for analytics
        setUserID(data.user.username);

        // Set user properties for analytics (new user)
        const userProperties = calculateUserProperties(data.user, true);
        setUserProperties(userProperties);
      }
      localStorage.setItem('chatUser', JSON.stringify(data.user));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', cleanEmail);
      if (data.token) {
        localStorage.setItem('auth_token_backup', data.token);
      }

      // Store invitation info for displaying confirmation
      if (data.invitation) {
        localStorage.setItem('pending_sent_invitation', JSON.stringify({
          inviteeEmail: data.invitation.inviteeEmail,
          isExistingUser: data.invitation.isExistingUser,
        }));
      }

      return { success: true, user: data.user, invitation: data.invitation };
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/auth/register' });
      logError(err, { endpoint: '/api/auth/register', operation: 'register', email: cleanEmail });
      setError(errorInfo.userMessage);
      return { success: false, error: errorInfo };
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoggingIn(true);

    try {
      // Check for popup blocker before initiating OAuth
      const isBlocked = await detectPopupBlocker();
      if (isBlocked) {
        const errorInfo = getErrorMessage({ code: 'popup_blocked' });
        setError(errorInfo.userMessage);
        setIsGoogleLoggingIn(false);
        return { success: false, error: errorInfo, action: 'allow_popups' };
      }

      // Generate and store state parameter for CSRF protection
      const state = generateOAuthState();
      storeOAuthState(state);

      const response = await retryWithBackoff(
        () => apiGet(`/api/auth/google?state=${encodeURIComponent(state)}`),
        {
          maxRetries: 2,
          shouldRetry: (error, statusCode) => {
            if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
              return false;
            }
            return isRetryableError(error, statusCode);
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorInfo = getErrorMessage(data, { statusCode: response.status, endpoint: '/api/auth/google' });
        logError(data, { endpoint: '/api/auth/google', operation: 'initiate_oauth' });
        clearOAuthState();
        
        // Handle OAuth configuration errors specifically
        if (data.code === 'OAUTH_CONFIG_ERROR' || response.status === 500) {
          errorInfo.userMessage = 'Google sign-in is not configured. Please contact support or use email/password sign-in.';
          errorInfo.action = 'use_email_password';
        }
        
        setError(errorInfo.userMessage);
        setIsGoogleLoggingIn(false);
        return { success: false, error: errorInfo };
      }

      // Redirect to Google OAuth page with state parameter
      const authUrlWithState = data.authUrl.includes('state=')
        ? data.authUrl
        : `${data.authUrl}&state=${encodeURIComponent(state)}`;
      
      window.location.href = authUrlWithState;
      
      // Return success (redirect will happen)
      return { success: true, redirecting: true };
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/auth/google' });
      logError(err, { endpoint: '/api/auth/google', operation: 'initiate_oauth' });
      clearOAuthState();
      setError(errorInfo.userMessage);
      setIsGoogleLoggingIn(false);
      return { success: false, error: errorInfo };
    }
  };

  const handleGoogleCallback = async (code, state = null) => {
    setIsGoogleLoggingIn(true);
    setError('');

    try {
      // Validate state parameter if provided (CSRF protection)
      if (state) {
        if (!validateOAuthState(state)) {
          logError(new Error('OAuth state mismatch'), { endpoint: '/api/auth/google/callback', operation: 'oauth_callback', security: true });
          setError('Security validation failed. Please try signing in again.');
          clearOAuthState();
          setIsGoogleLoggingIn(false);
          return false;
        }
        // Clear state after validation
        clearOAuthState();
      }

      const response = await retryWithBackoff(
        () => apiPost('/api/auth/google/callback', { code }),
        {
          maxRetries: 2,
          shouldRetry: (error, statusCode) => {
            // Don't retry 4xx errors (except 429 rate limit)
            if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
              return false;
            }
            return isRetryableError(error, statusCode);
          },
        }
      );

      let data;
      try {
        data = await response.json();
      } catch (_jsonError) {
        // Response is not valid JSON - log the raw response
        const text = await response.text();
        console.error('❌ Invalid JSON response from OAuth callback:', text);
        logError(new Error('Invalid JSON response'), { endpoint: '/api/auth/google/callback', responseText: text });
        setError('Server returned an invalid response. Please try again.');
        setIsGoogleLoggingIn(false);
        return false;
      }

      if (!response.ok) {
        // Use error handler for consistent error messages
        const errorInfo = getErrorMessage(data, { statusCode: response.status, endpoint: '/api/auth/google/callback' });
        logError(data, { endpoint: '/api/auth/google/callback', operation: 'oauth_callback' });
        
        // Check for specific error codes from backend
        if (data.code === 'OAUTH_CONFIG_ERROR') {
          errorInfo.userMessage = 'Google sign-in is not configured. Please contact support or use email/password sign-in.';
        } else if (data.code === 'OAUTH_INVALID_CLIENT') {
          errorInfo.userMessage = 'OAuth configuration error. Please verify your Google OAuth credentials are correct.';
        } else if (data.code === 'USER_CREATION_ERROR') {
          errorInfo.userMessage = 'Failed to create your account. Please try again or contact support.';
        } else if (data.code === 'INVALID_USER_DATA') {
          errorInfo.userMessage = 'Account creation issue. Please try again or contact support.';
        } else if (data.code === 'TOKEN_GENERATION_ERROR') {
          errorInfo.userMessage = 'Authentication failed. Please try signing in again.';
        } else if (data.code === 'GOOGLE_USERINFO_ERROR') {
          errorInfo.userMessage = 'Failed to get your information from Google. Please try again.';
        } else if (data.code === 'INVALID_GOOGLE_USER') {
          errorInfo.userMessage = 'Invalid account information from Google. Please try again.';
        } else if (data.error && data.error.includes('already used')) {
          errorInfo.userMessage = 'This sign-in link has already been used. Please try signing in again.';
        } else if (data.error && data.error.includes('expired')) {
          errorInfo.userMessage = 'The sign-in session expired. Please try again.';
        }
        
        setError(errorInfo.userMessage);
        setIsGoogleLoggingIn(false);
        return false;
      }

      // Success - set authentication state
      setIsAuthenticated(true);
      if (data.user?.username) {
        setUsername(data.user.username);
        localStorage.setItem('username', data.user.username);

        // Set User ID for analytics
        setUserID(data.user.username);

        // Set user properties for analytics
        const userProperties = calculateUserProperties(data.user, false);
        setUserProperties(userProperties);
      }
      localStorage.setItem('isAuthenticated', 'true');
      if (data.user?.email) {
        localStorage.setItem('userEmail', data.user.email);
      }
      if (data.token) {
        localStorage.setItem('auth_token_backup', data.token);
      }
      if (data.user) {
        localStorage.setItem('chatUser', JSON.stringify(data.user));
      }

      setIsGoogleLoggingIn(false);
      return true;
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/auth/google/callback' });
      logError(err, { endpoint: '/api/auth/google/callback', operation: 'oauth_callback' });
      setError(errorInfo.userMessage);
      setIsGoogleLoggingIn(false);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear server-side cookie
      await apiPost('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
      // Continue with client-side cleanup even if server call fails
    } finally {
      // Clear all client-side auth data
      localStorage.removeItem('username');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('auth_token_backup');
      localStorage.removeItem('chatUser');
      localStorage.removeItem('userEmail');

      // Clear analytics user data
      setUserID(null);
      setUserProperties({});

      // Reset state
      setIsAuthenticated(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setError('');
    }
  };

  return {
    // state
    email,
    password,
    username,
    isAuthenticated,
    isCheckingAuth,
    isLoggingIn,
    isSigningUp,
    isGoogleLoggingIn,
    error,
    // setters
    setEmail,
    setPassword,
    setUsername,
    setError,
    // actions
    handleLogin,
    handleSignup,
    handleRegister, // New: registration with co-parent invitation
    handleGoogleLogin,
    handleGoogleCallback,
    handleLogout,
  };
}


