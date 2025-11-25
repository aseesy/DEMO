import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button, Input } from './ui';

/**
 * Dedicated login/signup page at /signin
 * Handles both login and signup flows with invite code support
 */
export function LoginSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pendingInviteCode = searchParams.get('invite');

  const [isLoginMode, setIsLoginMode] = React.useState(true);

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
    handleSignup,
    handleGoogleLogin,
  } = useAuth();

  // Redirect to dashboard after successful authentication
  React.useEffect(() => {
    if (isAuthenticated) {
      // Small delay to ensure auth state is fully set before navigation
      // This prevents race conditions with ChatRoom's auth verification
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoginMode) {
      await handleLogin(e);
    } else {
      await handleSignup(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4 py-6 sm:py-8">
      <div className="max-w-md w-full">
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

        {pendingInviteCode && (
          <div className="mb-6 rounded-xl bg-emerald-50 border-2 border-emerald-200 px-4 py-3 text-sm text-emerald-800 transition-all duration-300">
            <div className="font-semibold mb-1">You've been invited to a co-parent mediation room!</div>
            <div className="text-emerald-700">
              {isLoginMode
                ? 'Log in to join your co-parent in this mediation room.'
                : 'Create an account to join your co-parent in this mediation room. Already have an account? Switch to log in above.'}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-700 transition-all duration-300">
            {error}
          </div>
        )}

        {/* Page Title with Serif Typography */}
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-teal-dark text-center mb-6">
          {isLoginMode ? 'Welcome back' : 'Create your account'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5 mb-8">
          {!isLoginMode && (
            <Input
              label="Name"
              type="text"
              value={username}
              onChange={setUsername}
              placeholder="John Doe"
              required
              autoComplete="name"
            />
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
            autoComplete={isLoginMode ? "current-password" : "new-password"}
          />

          <Button
            type="submit"
            variant="primary"
            size="medium"
            fullWidth
            disabled={isLoggingIn || isSigningUp || isGoogleLoggingIn}
            loading={isLoggingIn || isSigningUp}
            className="mt-6 transition-all hover:shadow-lg"
          >
            {isLoginMode ? 'Log in' : 'Create account'}
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
      </div>
    </div>
  );
}

export default LoginSignup;
