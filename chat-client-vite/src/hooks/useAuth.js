import React from 'react';
import { apiGet, apiPost } from '../apiClient.js';

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
          }
        } else {
          localStorage.removeItem('username');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('auth_token_backup');
          localStorage.removeItem('chatUser');
        }
      } catch (err) {
        console.error('Error verifying session (Vite):', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      verifySession();
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  const handleLogin = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

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
      const response = await apiPost('/api/auth/login', {
        email: cleanEmail,
        password: cleanPassword,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      setIsAuthenticated(true);
      if (data.user?.username) {
        setUsername(data.user.username);
        localStorage.setItem('username', data.user.username);
      }
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', cleanEmail);
      if (data.token) {
        localStorage.setItem('auth_token_backup', data.token);
      }
      if (data.user) {
        localStorage.setItem('chatUser', JSON.stringify(data.user));
      }
      return data;
    } catch (err) {
      console.error('Login error (Vite):', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignup = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setError('');
    setIsSigningUp(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

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
      const response = await apiPost('/api/auth/signup', {
        email: cleanEmail,
        password: cleanPassword,
        context: {},
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      setIsAuthenticated(true);
      if (data.user?.username) {
        setUsername(data.user.username);
        localStorage.setItem('username', data.user.username);
      }
      localStorage.setItem('chatUser', JSON.stringify(data.user));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', cleanEmail);
      return data;
    } catch (err) {
      console.error('Signup error (Vite):', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoggingIn(true);
    
    try {
      const response = await apiGet('/api/auth/google');
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to initiate Google login');
        setIsGoogleLoggingIn(false);
        return;
      }
      
      // Redirect to Google OAuth page
      window.location.href = data.authUrl;
    } catch (err) {
      console.error('Google login error:', err);
      setError('Unable to connect to server. Please try again.');
      setIsGoogleLoggingIn(false);
    }
  };

  const handleGoogleCallback = async (code) => {
    setIsGoogleLoggingIn(true);
    setError('');
    
    try {
      const response = await apiPost('/api/auth/google/callback', { code });
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Google login failed');
        setIsGoogleLoggingIn(false);
        return false;
      }
      
      // Success - set authentication state
      setIsAuthenticated(true);
      if (data.user?.username) {
        setUsername(data.user.username);
        localStorage.setItem('username', data.user.username);
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
      console.error('Google callback error:', err);
      setError('Unable to complete Google login. Please try again.');
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
    handleGoogleLogin,
    handleGoogleCallback,
    handleLogout,
  };
}


