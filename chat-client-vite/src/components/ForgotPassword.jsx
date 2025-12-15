import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input } from './ui';
import { API_BASE_URL } from '../config.js';

/**
 * Forgot Password Page
 * Allows users to request a password reset email
 */
export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state - email sent
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-6 sm:py-8" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(197, 232, 228, 0.2) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(197, 232, 228, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(230, 247, 245, 0.3) 0%, transparent 60%)' }}>
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
          </div>

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-teal-medium text-center mb-4">
            Check your email
          </h1>

          <p className="text-gray-600 text-center mb-6">
            If an account exists for <span className="font-semibold text-gray-800">{email}</span>, you'll receive a password reset link shortly.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Didn't receive the email?</span>
              <br />
              Check your spam folder, or make sure you entered the correct email address.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              variant="teal-outline"
              size="medium"
              fullWidth
            >
              Try a different email
            </Button>

            <Button
              type="button"
              onClick={() => navigate('/signin')}
              variant="teal-solid"
              size="medium"
              fullWidth
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Request form
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-6 sm:py-8" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(197, 232, 228, 0.2) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(197, 232, 228, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(230, 247, 245, 0.3) 0%, transparent 60%)' }}>
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
        </div>

        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-teal-medium text-center mb-3">
          Forgot your password?
        </h1>

        <p className="text-gray-600 text-center mb-6">
          No worries! Enter your email and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-700">
            <div className="font-semibold mb-1">Error</div>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            required
            autoComplete="email"
            autoFocus
          />

          <Button
            type="submit"
            variant="teal-solid"
            size="medium"
            fullWidth
            disabled={isSubmitting || !email.trim()}
            loading={isSubmitting}
            className="mt-6"
          >
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/signin"
            className="text-sm text-teal-medium font-semibold hover:text-teal-dark transition-colors"
          >
            Back to Sign In
          </Link>
        </div>

        {/* Help text */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            If you signed up with Google, you don't need a password.{' '}
            <Link to="/signin" className="text-teal-medium hover:text-teal-dark font-medium">
              Sign in with Google
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
