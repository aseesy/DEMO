/**
 * LoginSignup - Dedicated login/signup page at /signin
 *
 * Handles both login and signup flows with:
 * - Invite code detection and redirect
 * - Post-auth navigation
 * - Google OAuth
 *
 * Refactored to use extracted hooks and presentational components.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useInviteDetection } from '../hooks/useInviteDetection.js';
import { useAuthRedirect } from '../hooks/useAuthRedirect.js';
import { Button, Input } from './ui';
import {
  AuthHeader,
  InviteNotificationBanner,
  ErrorAlertBox,
  GoogleSignInButton,
  ModeToggleFooter,
  InviteLinkFooter,
} from './auth';

/**
 * LoginSignup component
 *
 * Signup flow:
 * - If user has invite token: redirects to /accept-invite for proper flow
 * - After signup (no invite): redirects to /invite-coparent page
 */
export function LoginSignup() {
  const [isLoginMode, setIsLoginMode] = React.useState(true);
  const [isNewSignup, setIsNewSignup] = React.useState(false);

  const {
    email,
    password,
    username,
    isAuthenticated,
    isCheckingAuth,
    isLoggingIn,
    isSigningUp,
    isGoogleLoggingIn,
    error,
    setEmail,
    setPassword,
    setUsername,
    setError,
    handleLogin,
    handleSignup,
    handleGoogleLogin,
  } = useAuth();

  // Handle invite code detection and redirect
  const { pendingInviteCode, redirectToAcceptInvite } = useInviteDetection({
    isLoginMode,
    autoRedirect: true,
  });

  // Handle post-auth redirect - immediate redirect for already-authenticated users
  useAuthRedirect({
    isAuthenticated,
    isNewSignup,
    clearInviteCode: true,
    delay: isNewSignup ? 100 : 0, // Immediate redirect if already logged in
  });

  // Clear form when mode changes
  React.useEffect(() => {
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
  }, [isLoginMode, setEmail, setPassword, setUsername, setError]);

  const handleModeToggle = React.useCallback(() => {
    setError('');
    setIsLoginMode(prev => !prev);
  }, [setError]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Get honeypot field value for spam protection
    const honeypotValue = e.target.elements.website?.value || '';

    if (isLoginMode) {
      await handleLogin(e, { website: honeypotValue });
    } else {
      setIsNewSignup(true);
      await handleSignup(e, { website: honeypotValue });
    }
  };

  const isSubmitting = isLoggingIn || isSigningUp || isGoogleLoggingIn;

  // Show loading while checking auth status or after successful auth (before redirect)
  if (isCheckingAuth || isAuthenticated) {
    return (
      <div
        className="min-h-dvh bg-white flex items-center justify-center px-4 py-6 sm:py-8"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(197, 232, 228, 0.2) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(197, 232, 228, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(230, 247, 245, 0.3) 0%, transparent 60%)',
        }}
      >
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-teal-medium border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-teal-dark font-medium">
            {isCheckingAuth
              ? 'Checking session...'
              : isNewSignup
                ? 'Setting up your account...'
                : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh bg-white flex items-center justify-center px-4 py-6 sm:py-8"
      style={{
        backgroundImage:
          'radial-gradient(circle at 10% 20%, rgba(197, 232, 228, 0.2) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(197, 232, 228, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(230, 247, 245, 0.3) 0%, transparent 60%)',
      }}
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 sm:p-8">
        <AuthHeader />

        <InviteNotificationBanner show={Boolean(pendingInviteCode) && isLoginMode} />

        <ErrorAlertBox
          error={error}
          onSignIn={handleModeToggle}
          onCreateAccount={handleModeToggle}
          onGoogleSignIn={handleGoogleLogin}
        />

        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-teal-medium text-center mb-6">
          {isLoginMode ? 'Welcome back' : 'Create your account'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5 mb-8">
          {/* Honeypot field - hidden from users, bots will fill it */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <label htmlFor="website">Website (leave blank)</label>
            <input
              type="text"
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
          </div>

          {!isLoginMode && (
            <Input
              label="Your Name"
              type="text"
              value={username}
              onChange={setUsername}
              placeholder="John Doe"
              required
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
            />
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            required
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            helperText={!isLoginMode ? 'At least 10 characters' : undefined}
          />

          {isLoginMode && (
            <div className="text-right -mt-2">
              <Link
                to="/forgot-password"
                className="text-sm text-teal-medium hover:text-teal-dark font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <Button
            type="submit"
            variant="teal-solid"
            size="medium"
            fullWidth
            disabled={isSubmitting}
            loading={isLoggingIn || isSigningUp}
            className="mt-6 transition-all hover:shadow-lg"
          >
            {isLoginMode ? 'Log in' : 'Create Account'}
          </Button>
        </form>

        <GoogleSignInButton
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          loading={isGoogleLoggingIn}
        />

        <ModeToggleFooter isLoginMode={isLoginMode} onToggle={handleModeToggle} />

        <InviteLinkFooter
          show={Boolean(pendingInviteCode) && !isLoginMode}
          onAcceptInvite={redirectToAcceptInvite}
        />
      </div>
    </div>
  );
}

export default LoginSignup;
