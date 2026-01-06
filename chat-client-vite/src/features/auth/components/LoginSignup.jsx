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
import { Link, useLocation } from 'react-router-dom';
// Direct imports to avoid circular dependency with ../index.js
import { useAuth } from '../model/useAuth.js';
import { useAuthRedirect } from '../model/useAuthRedirect.js';
// Direct import to avoid circular dependency with feature index
import { useInviteDetection } from '../../invitations/model/useInviteDetection.js';
import { Button, Input } from '../../../components/ui';
import {
  AuthHeader,
  InviteNotificationBanner,
  ErrorAlertBox,
  GoogleSignInButton,
  ModeToggleFooter,
  InviteLinkFooter,
} from './index.js';

/**
 * LoginSignup component
 *
 * Signup flow:
 * - If user has invite token: redirects to /accept-invite for proper flow
 * - After signup (no invite): redirects to /invite-coparent page
 */
export function LoginSignup({ defaultToSignup = false }) {
  const location = useLocation();
  // Default to signup if: prop is true, or route is /signup, or URL has ?mode=signup
  const shouldDefaultToSignup =
    defaultToSignup ||
    location.pathname === '/signup' ||
    new URLSearchParams(location.search).get('mode') === 'signup';
  const [isLoginMode, setIsLoginMode] = React.useState(!shouldDefaultToSignup);
  const [isNewSignup, setIsNewSignup] = React.useState(false);

  const {
    email,
    password,
    firstName,
    lastName,
    isAuthenticated,
    isCheckingAuth,
    isLoggingIn,
    isSigningUp,
    isGoogleLoggingIn,
    error,
    setEmail,
    setPassword,
    setFirstName,
    setLastName,
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
    delay: isNewSignup ? 100 : 0, // 100ms delay for signup, immediate for login
  });

  // Reset isNewSignup flag after redirect completes to prevent wrong redirect on logout/login
  React.useEffect(() => {
    if (isAuthenticated && isNewSignup) {
      const timer = setTimeout(() => {
        setIsNewSignup(false);
      }, 200); // After redirect delay (100ms) + buffer
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isNewSignup]);

  // Clear form when mode changes
  React.useEffect(() => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setError('');
  }, [isLoginMode, setEmail, setPassword, setFirstName, setLastName, setError]);

  const handleModeToggle = React.useCallback(() => {
    setError('');
    setIsLoginMode(prev => !prev);
  }, [setError]);

  const isSubmitting = isLoggingIn || isSigningUp || isGoogleLoggingIn;

  const handleSubmit = async e => {
    console.log('[LoginSignup] handleSubmit called', {
      eventType: e?.type,
      isLoginMode,
      email: email ? '***' : 'empty',
      password: password ? '***' : 'empty',
      isSubmitting,
    });

    e.preventDefault();
    e.stopPropagation();
    setError('');

    console.log('[LoginSignup] Form submitted', {
      isLoginMode,
      email: email ? '***' : 'empty',
      password: password ? '***' : 'empty',
    });

    // Get honeypot field value for spam protection
    const honeypotValue = e.target.elements.website?.value || '';

    try {
      if (isLoginMode) {
        console.log('[LoginSignup] Calling handleLogin');
        const result = await handleLogin(e, { website: honeypotValue });
        console.log(
          '[LoginSignup] Login result:',
          result?.success ? 'success' : 'failed',
          result?.error
        );
      } else {
        setIsNewSignup(true);
        console.log('[LoginSignup] Calling handleSignup');
        const result = await handleSignup(e, { website: honeypotValue });
        console.log(
          '[LoginSignup] Signup result:',
          result?.success ? 'success' : 'failed',
          result?.error
        );
      }
    } catch (err) {
      console.error('[LoginSignup] Error in handleSubmit:', err);
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  // Debug: Log state values
  React.useEffect(() => {
    console.log('[LoginSignup] State:', {
      isCheckingAuth,
      isAuthenticated,
      isSubmitting,
      isLoggingIn,
      isSigningUp,
      isGoogleLoggingIn,
      email: email ? '***' : 'empty',
      password: password ? '***' : 'empty',
    });
  }, [
    isCheckingAuth,
    isAuthenticated,
    isSubmitting,
    isLoggingIn,
    isSigningUp,
    isGoogleLoggingIn,
    email,
    password,
  ]);

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

        <form onSubmit={handleSubmit} className="space-y-5 mb-8" noValidate>
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
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                value={firstName}
                onChange={setFirstName}
                placeholder="John"
                required
                autoComplete="given-name"
                data-lpignore="true"
                data-form-type="other"
              />
              <Input
                label="Last Name"
                type="text"
                value={lastName}
                onChange={setLastName}
                placeholder="Doe"
                required
                autoComplete="family-name"
                data-lpignore="true"
                data-form-type="other"
              />
            </div>
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
            onClick={e => {
              console.log('[LoginSignup] Button clicked directly', {
                type: e.type,
                defaultPrevented: e.defaultPrevented,
                isSubmitting,
                disabled: isSubmitting,
              });
              // Don't prevent default - let form submission work naturally
              // But ensure form is submitted if button click happens
              if (e.type === 'click' && !isSubmitting) {
                const form = e.target.closest('form');
                if (form && !form.querySelector(':invalid')) {
                  console.log('[LoginSignup] Form is valid, submitting...');
                  // Form will submit naturally via type="submit"
                } else if (form) {
                  console.log('[LoginSignup] Form has validation errors');
                }
              }
            }}
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
