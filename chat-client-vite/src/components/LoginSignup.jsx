import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button, Input } from './ui';

/**
 * Dedicated login/signup page at /signin
 * Handles both login and signup flows
 *
 * Signup flow:
 * - If user has invite token: redirects to /accept-invite for proper flow
 * - After signup (no invite): redirects to /invite-coparent page where user can generate invite
 */
export function LoginSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCodeFromUrl = searchParams.get('invite');

  // Store invite code in localStorage when detected in URL
  React.useEffect(() => {
    if (inviteCodeFromUrl) {
      console.log('Storing invite code in localStorage:', inviteCodeFromUrl);
      localStorage.setItem('pending_invite_code', inviteCodeFromUrl);
    }
  }, [inviteCodeFromUrl]);

  // Get invite code from URL or localStorage
  const pendingInviteCode = inviteCodeFromUrl || localStorage.getItem('pending_invite_code');

  const [isLoginMode, setIsLoginMode] = React.useState(true);
  const [isNewSignup, setIsNewSignup] = React.useState(false);

  const {
    email,
    password,
    username,
    isAuthenticated,
    isLoggingIn,
    isSigningUp,
    isGoogleLoggingIn,
    error,
    setEmail,
    setPassword,
    setUsername,
    setError,
    handleLogin,
    handleSignup, // Use standard signup (no co-parent email needed)
    handleGoogleLogin,
  } = useAuth();

  // Clear email and password when component mounts or mode changes
  // This ensures forms are always empty and prevents auto-fill
  React.useEffect(() => {
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
  }, [isLoginMode, setEmail, setPassword, setUsername, setError]);

  // Redirect users with invite token to dedicated accept-invite page
  React.useEffect(() => {
    if (pendingInviteCode && !isLoginMode) {
      // If user is trying to sign up with an invite code, redirect to accept-invite page
      navigate(`/accept-invite?token=${pendingInviteCode}`, { replace: true });
    }
  }, [pendingInviteCode, isLoginMode, navigate]);

  // Redirect after successful authentication
  React.useEffect(() => {
    if (isAuthenticated) {
      // Small delay to ensure auth state is fully set before navigation
      const timer = setTimeout(() => {
        // Clear any pending invite code after login
        localStorage.removeItem('pending_invite_code');

        // If this was a new signup, redirect to invite co-parent page
        if (isNewSignup) {
          navigate('/invite-coparent', { replace: true });
        } else {
          // Existing user login - go to dashboard
          navigate('/', { replace: true });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isNewSignup, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLoginMode) {
      await handleLogin(e);
    } else {
      // Mark this as a new signup so we redirect to invite page after
      setIsNewSignup(true);
      // Use standard signup - co-parent invite happens on next screen
      await handleSignup(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-teal-lightest/20 to-white flex items-center justify-center px-4 py-6 sm:py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <img
              src="/assets/Logo.svg"
              alt="LiaiZen Logo"
              className="h-12 sm:h-14 w-auto transition-transform hover:scale-105"
            />
            <img
              src="/assets/wordmark.svg"
              alt="LiaiZen"
              className="h-14 sm:h-16 w-auto"
            />
          </div>

          <p className="text-sm sm:text-base text-gray-600 font-medium mb-3">
            Collaborative Parenting
          </p>

        </div>

        {pendingInviteCode && isLoginMode && (
          <div className="mb-6 rounded-xl bg-emerald-50 border-2 border-emerald-200 px-4 py-3 text-sm text-emerald-800 transition-all duration-300">
            <div className="font-semibold mb-1">You've been invited to connect!</div>
            <div className="text-emerald-700">
              Log in to accept the invitation and connect with your co-parent.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-700 transition-all duration-300">
            <div className="font-semibold mb-1">Error</div>
            <div>{error}</div>
            {/* Show action links for specific errors */}
            {error.includes('already registered') && (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setIsLoginMode(true);
                }}
                className="mt-2 text-teal-medium font-semibold hover:text-teal-dark transition-colors underline"
              >
                Sign in instead
              </button>
            )}
            {(error.includes('No account found') || error.includes('account found')) && (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setIsLoginMode(false);
                }}
                className="mt-2 text-teal-medium font-semibold hover:text-teal-dark transition-colors underline"
              >
                Create account
              </button>
            )}
            {error.includes('Google sign-in') && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="mt-2 text-teal-medium font-semibold hover:text-teal-dark transition-colors underline"
              >
                Sign in with Google
              </button>
            )}
          </div>
        )}

        {/* Page Title with Serif Typography */}
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-teal-medium text-center mb-6">
          {isLoginMode ? 'Welcome back' : 'Create your account'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5 mb-8">
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
            helperText={!isLoginMode ? "At least 4 characters" : undefined}
          />

          <Button
            type="submit"
            variant="teal-solid"
            size="medium"
            fullWidth
            disabled={isLoggingIn || isSigningUp || isGoogleLoggingIn}
            loading={isLoggingIn || isSigningUp}
            className="mt-6 transition-all hover:shadow-lg"
          >
            {isLoginMode ? 'Log in' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-transparent text-gray-500 font-medium">Or</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn || isSigningUp || isGoogleLoggingIn}
            loading={isGoogleLoggingIn}
            fullWidth
            size="medium"
            className="mt-6 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 [&>span]:!text-gray-900 [&>span]:font-semibold"
            icon={!isGoogleLoggingIn && (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
          >
            Sign in with Google
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
          {isLoginMode ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                  className="text-teal-medium font-semibold hover:text-teal-dark transition-colors"
                onClick={() => {
                  setError('');
                  setIsLoginMode(false);
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                  className="text-teal-medium font-semibold hover:text-teal-dark transition-colors"
                onClick={() => {
                  setError('');
                  setIsLoginMode(true);
                }}
              >
                Log in
              </button>
            </>
          )}
          </p>
        </div>

        {/* Info about accepting invitation if has invite code */}
        {pendingInviteCode && !isLoginMode && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Have an invitation?{' '}
              <button
                type="button"
                onClick={() => navigate(`/accept-invite?token=${pendingInviteCode}`)}
                className="text-teal-medium hover:text-teal-dark font-medium"
              >
                Accept invitation here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginSignup;
