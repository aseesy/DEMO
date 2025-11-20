import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

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
    setError,
    handleLogin,
    handleSignup,
    handleGoogleLogin,
  } = useAuth();

  // Redirect to dashboard after successful authentication
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
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
    <div className="min-h-screen bg-gradient-to-br from-[#275559] to-[#4DA8B0] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/95 rounded-3xl shadow-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/assets/TransB.svg"
            alt="@TransB"
            className="logo-image"
            style={{ height: '64px', width: 'auto', marginBottom: '0', display: 'block' }}
          />
          <div style={{ marginTop: '-32px', marginBottom: '-32px', lineHeight: 0, overflow: 'hidden' }}>
          <img
            src="/assets/LZlogo.svg"
            alt="LiaiZen"
            className="logo-image"
              style={{
                height: '96px',
                width: 'auto',
                display: 'block',
                lineHeight: 0,
                verticalAlign: 'top',
                margin: 0,
                padding: 0
              }}
          />
        </div>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-0.5">
            Collaborative Parenting
        </p>
        </div>

        {pendingInviteCode && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            <div className="font-semibold mb-1">✨ You've been invited to a co-parent mediation room!</div>
            <div>
              {isLoginMode
                ? 'Log in to join your co-parent in this mediation room.'
                : 'Create an account to join your co-parent in this mediation room. Already have an account? Switch to log in above.'}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#275559] text-slate-900 placeholder-slate-400"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#275559] text-slate-900 placeholder-slate-400"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || isSigningUp || isGoogleLoggingIn}
            className="w-full mt-2 bg-[#275559] text-white py-2.5 rounded-xl font-semibold text-sm sm:text-base shadow-md hover:bg-[#1f4447] transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isLoginMode
              ? isLoggingIn
                ? 'Logging in…'
                : 'Log in'
              : isSigningUp
              ? 'Creating account…'
              : 'Create account'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/95 text-slate-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn || isSigningUp || isGoogleLoggingIn}
            className="w-full mt-4 flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-slate-700 py-2.5 rounded-xl font-semibold text-sm sm:text-base shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isGoogleLoggingIn ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent"></div>
                <span>Connecting to Google…</span>
              </>
            ) : (
              <>
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
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 text-center text-sm text-slate-600">
          {isLoginMode ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="text-[#275559] font-semibold hover:underline"
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
                className="text-[#275559] font-semibold hover:underline"
                onClick={() => {
                  setError('');
                  setIsLoginMode(true);
                }}
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginSignup;
