import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button, Input } from './ui';
import { API_BASE_URL } from '../config.js';

/**
 * Reset Password Page
 * Allows users to set a new password using a valid reset token
 */
export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  // Token validation state
  const [isValidating, setIsValidating] = React.useState(true);
  const [tokenValid, setTokenValid] = React.useState(false);
  const [tokenError, setTokenError] = React.useState('');
  const [maskedEmail, setMaskedEmail] = React.useState('');

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = React.useState({
    score: 0,
    label: '',
    color: ''
  });

  // Validate token on mount
  React.useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setTokenError('No reset token provided. Please request a new password reset link.');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-reset-token/${token}`);
        const data = await response.json();

        if (data.valid) {
          setTokenValid(true);
          setMaskedEmail(data.email);
        } else {
          setTokenError(getTokenErrorMessage(data.code, data.error));
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setTokenError('Unable to verify reset link. Please try again or request a new link.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // Calculate password strength
  React.useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, label: '', color: '' });
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const strengthMap = {
      0: { label: 'Very weak', color: 'bg-red-500' },
      1: { label: 'Weak', color: 'bg-red-400' },
      2: { label: 'Fair', color: 'bg-orange-400' },
      3: { label: 'Good', color: 'bg-yellow-400' },
      4: { label: 'Strong', color: 'bg-green-400' },
      5: { label: 'Very strong', color: 'bg-green-500' },
      6: { label: 'Excellent', color: 'bg-green-600' }
    };

    setPasswordStrength({
      score,
      label: strengthMap[score].label,
      color: strengthMap[score].color
    });
  }, [password]);

  const getTokenErrorMessage = (code, defaultMessage) => {
    switch (code) {
      case 'INVALID_TOKEN':
        return 'This reset link is invalid. It may have been copied incorrectly.';
      case 'TOKEN_USED':
        return 'This reset link has already been used. Please request a new password reset.';
      case 'TOKEN_EXPIRED':
        return 'This reset link has expired. Password reset links are valid for 1 hour.';
      default:
        return defaultMessage || 'Something went wrong. Please request a new password reset.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Basic password validation
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
      } else {
        // Handle specific error codes
        if (data.code === 'WEAK_PASSWORD') {
          setError(data.error + (data.requirements ? ` Requirements: ${data.requirements.join(', ')}` : ''));
        } else if (data.code === 'TOKEN_EXPIRED' || data.code === 'TOKEN_USED' || data.code === 'INVALID_TOKEN') {
          setTokenValid(false);
          setTokenError(getTokenErrorMessage(data.code, data.error));
        } else {
          setError(data.error || 'Failed to reset password. Please try again.');
        }
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-6 sm:py-8" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(197, 232, 228, 0.2) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(197, 232, 228, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(230, 247, 245, 0.3) 0%, transparent 60%)' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 sm:p-8 text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1">
              <img src="/assets/Logo.svg" alt="LiaiZen Logo" className="h-12 sm:h-14 w-auto" />
              <img src="/assets/wordmark.svg" alt="LiaiZen" className="h-14 sm:h-16 w-auto" />
            </div>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-6 sm:py-8" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(197, 232, 228, 0.2) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(197, 232, 228, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(230, 247, 245, 0.3) 0%, transparent 60%)' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 sm:p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-1">
              <img src="/assets/Logo.svg" alt="LiaiZen Logo" className="h-12 sm:h-14 w-auto" />
              <img src="/assets/wordmark.svg" alt="LiaiZen" className="h-14 sm:h-16 w-auto" />
            </div>
          </div>

          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-gray-800 text-center mb-4">
            Link Not Valid
          </h1>

          <p className="text-gray-600 text-center mb-6">
            {tokenError}
          </p>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={() => navigate('/forgot-password')}
              variant="teal-solid"
              size="medium"
              fullWidth
            >
              Request New Reset Link
            </Button>

            <Button
              type="button"
              onClick={() => navigate('/signin')}
              variant="teal-outline"
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

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-6 sm:py-8" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(197, 232, 228, 0.2) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(197, 232, 228, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(230, 247, 245, 0.3) 0%, transparent 60%)' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 sm:p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-1">
              <img src="/assets/Logo.svg" alt="LiaiZen Logo" className="h-12 sm:h-14 w-auto" />
              <img src="/assets/wordmark.svg" alt="LiaiZen" className="h-14 sm:h-16 w-auto" />
            </div>
          </div>

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-teal-medium text-center mb-4">
            Password Reset!
          </h1>

          <p className="text-gray-600 text-center mb-6">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>

          <Button
            type="button"
            onClick={() => navigate('/signin')}
            variant="teal-solid"
            size="medium"
            fullWidth
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Reset form
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

        {/* Key Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-teal-medium text-center mb-3">
          Create new password
        </h1>

        {maskedEmail && (
          <p className="text-gray-600 text-center mb-6">
            Enter a new password for <span className="font-semibold text-gray-800">{maskedEmail}</span>
          </p>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-700">
            <div className="font-semibold mb-1">Error</div>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter new password"
              required
              autoComplete="new-password"
              autoFocus
            />

            {/* Password strength indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-600">
                  Password strength: <span className="font-medium">{passwordStrength.label}</span>
                </p>
              </div>
            )}
          </div>

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm new password"
            required
            autoComplete="new-password"
            helperText={confirmPassword && password !== confirmPassword ? (
              <span className="text-red-600">Passwords do not match</span>
            ) : undefined}
          />

          <Button
            type="submit"
            variant="teal-solid"
            size="medium"
            fullWidth
            disabled={isSubmitting || !password || !confirmPassword || password !== confirmPassword}
            loading={isSubmitting}
            className="mt-6"
          >
            Reset Password
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
      </div>
    </div>
  );
}

export default ResetPassword;
