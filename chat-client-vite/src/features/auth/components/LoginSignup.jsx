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
  validateLoginCredentials,
  validateSignupCredentials,
} from '../../../utils/validators.js';
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
  
  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = React.useState({});

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
  // Note: Don't clear invite code for new signups - they need it on /invite-coparent page
  if (import.meta.env.DEV) {
    console.log('[LoginSignup] Calling useAuthRedirect with:', {
      isAuthenticated,
      isNewSignup,
      delay: isNewSignup ? 100 : 0,
    });
  }
  useAuthRedirect({
    isAuthenticated,
    isNewSignup,
    clearInviteCode: !isNewSignup, // Keep invite code for new signups going to /invite-coparent
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

  // Clear form and errors when mode changes
  React.useEffect(() => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setError('');
    setFieldErrors({});
  }, [isLoginMode, setEmail, setPassword, setFirstName, setLastName, setError]);

  const handleModeToggle = React.useCallback(() => {
    setError('');
    setFieldErrors({});
    setIsLoginMode(prev => !prev);
  }, [setError]);

  const isSubmitting = isLoggingIn || isSigningUp || isGoogleLoggingIn;

  const handleSubmit = async e => {
    if (import.meta.env.DEV) {
      console.log('[LoginSignup] handleSubmit called', {
        eventType: e?.type,
        isLoginMode,
        email: email ? '***' : 'empty',
        password: password ? '***' : 'empty',
        isSubmitting,
      });
    }

    e.preventDefault();
    e.stopPropagation();
    setError('');

    // CRITICAL: Validate input at submit time before attempting auth
    let validation;
    if (isLoginMode) {
      validation = validateLoginCredentials(email, password);
    } else {
      validation = validateSignupCredentials(email, password, firstName, lastName);
    }

    // If validation fails, show field-level errors and prevent submission
    if (!validation.valid) {
      if (import.meta.env.DEV) {
        console.log('[LoginSignup] Validation failed:', validation.errors);
      }
      setFieldErrors(validation.errors || {});
      // Focus first error field
      const firstErrorField = Object.keys(validation.errors || {})[0];
      if (firstErrorField && typeof document !== 'undefined') {
        const field = document.querySelector(`[name="${firstErrorField}"]`);
        if (field) {
          field.focus();
        }
      }
      return;
    }

    // Clear field errors on valid submission
    setFieldErrors({});

    if (import.meta.env.DEV) {
      console.log('[LoginSignup] Form submitted', {
        isLoginMode,
        email: email ? '***' : 'empty',
        password: password ? '***' : 'empty',
      });
    }

    // Get honeypot field value for spam protection
    const honeypotValue = e.target.elements.website?.value || '';

    try {
      if (isLoginMode) {
        if (import.meta.env.DEV) {
          console.log('[LoginSignup] Calling handleLogin');
        }
        const result = await handleLogin(e, { website: honeypotValue });
        if (import.meta.env.DEV) {
          console.log(
            '[LoginSignup] Login result:',
            result?.success ? 'success' : 'failed',
            result?.error
          );
        }
      } else {
        setIsNewSignup(true);
        if (import.meta.env.DEV) {
          console.log('[LoginSignup] Calling handleSignup');
        }
        const result = await handleSignup(e, { website: honeypotValue });
        if (import.meta.env.DEV) {
          console.log(
            '[LoginSignup] Signup result:',
            result?.success ? 'success' : 'failed',
            result?.error
          );
        }
        // CRITICAL: Reset isNewSignup if signup fails
        // Otherwise, it stays true and could cause wrong redirect on next login
        if (!result?.success) {
          setIsNewSignup(false);
        }
      }
    } catch (err) {
      console.error('[LoginSignup] Error in handleSubmit:', err);
      setError(err.message || 'An error occurred. Please try again.');
      // Also reset on exception
      if (!isLoginMode) {
        setIsNewSignup(false);
      }
    }
  };


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
                name="firstName"
                value={firstName}
                onChange={setFirstName}
                placeholder="John"
                required
                autoComplete="given-name"
                data-lpignore="true"
                data-form-type="other"
                error={fieldErrors.firstName}
                onFocus={() => {
                  // Clear error when user starts typing
                  if (fieldErrors.firstName) {
                    setFieldErrors(prev => ({ ...prev, firstName: undefined }));
                  }
                }}
              />
              <Input
                label="Last Name"
                type="text"
                name="lastName"
                value={lastName}
                onChange={setLastName}
                placeholder="Doe"
                required
                autoComplete="family-name"
                data-lpignore="true"
                data-form-type="other"
                error={fieldErrors.lastName}
                onFocus={() => {
                  // Clear error when user starts typing
                  if (fieldErrors.lastName) {
                    setFieldErrors(prev => ({ ...prev, lastName: undefined }));
                  }
                }}
              />
            </div>
          )}

          <Input
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            required
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            error={fieldErrors.email}
            onFocus={() => {
              // Clear error when user starts typing
              if (fieldErrors.email) {
                setFieldErrors(prev => ({ ...prev, email: undefined }));
              }
            }}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            helperText={!isLoginMode ? 'At least 10 characters' : undefined}
            error={fieldErrors.password}
            onFocus={() => {
              // Clear error when user starts typing
              if (fieldErrors.password) {
                setFieldErrors(prev => ({ ...prev, password: undefined }));
              }
            }}
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
