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
    error,
    setEmail,
    setPassword,
    setError,
    handleLogin,
    handleSignup,
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
            disabled={isLoggingIn || isSigningUp}
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
