import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useInvitations } from '../hooks/useInvitations.js';
import { useInvitationContext } from '../context/InvitationContext.jsx';
import { apiPost, apiGet } from '../apiClient.js';
  import { getErrorMessage, logError, retryWithBackoff, isRetryableError } from '../utils/errorHandler.jsx';
import { Button, Input } from './ui';

/**
 * AcceptInvitationPage - Page for accepting co-parent invitations
 * Route: /accept-invite?token=TOKEN or /accept-invite?code=LZ-XXXXXX
 *
 * Workflow:
 * 1. Validate token/code on mount
 * 2. If user is already logged in: auto-accept and redirect
 * 3. If user is new: show signup form, then auto-accept after signup
 * 4. Redirect to dashboard on success
 */
export function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const shortCode = searchParams.get('code');

  const {
    isAuthenticated,
    isCheckingAuth,
    username: authUsername,
    email: authEmail,
    password: authPassword,
    setEmail,
    setPassword,
    setUsername,
    handleSignup,
    handleGoogleLogin,
    isSigningUp,
    isGoogleLoggingIn,
    error: authError,
    setError: setAuthError,
  } = useAuth();

  const {
    validateToken,
    validateCode,
    acceptInvitation,
    acceptByCode,
    isValidating,
    isAccepting,
    error: inviteError,
  } = useInvitations();

  const { validateInvitation: validateFromContext, clearInvitationState } = useInvitationContext();

  // Validation state
  const [validationResult, setValidationResult] = React.useState(null);
  const [hasValidated, setHasValidated] = React.useState(false);

  // Form state (for new users)
  const [displayName, setDisplayName] = React.useState('');
  const [formPassword, setFormPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [formEmail, setFormEmail] = React.useState('');
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);
  const [formError, setFormError] = React.useState('');

  // Short code confirmation step (verify inviter before signup)
  const [confirmedInviter, setConfirmedInviter] = React.useState(false);

  // Auto-accept state
  const [isAutoAccepting, setIsAutoAccepting] = React.useState(false);
  const [autoAcceptError, setAutoAcceptError] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  // Clear form fields on mount to prevent auto-fill
  React.useEffect(() => {
    setFormEmail('');
    setFormPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setAgreeToTerms(false);
    setFormError('');
  }, []);

  // Validate token/code on mount with retry logic
  React.useEffect(() => {
    const inviteKey = token || shortCode;
    if (!inviteKey) {
      setValidationResult({ valid: false, code: 'TOKEN_REQUIRED' });
      setHasValidated(true);
      return;
    }

    const validate = async () => {
      const result = await validateFromContext(token, shortCode);
      setValidationResult(result);
      setHasValidated(true);
    };

    validate();
  }, [token, shortCode, validateFromContext]);

  // Auto-accept for logged-in users
  React.useEffect(() => {
    if (!hasValidated || isCheckingAuth || !validationResult?.valid) return;
    if (!isAuthenticated) return;
    if (isAutoAccepting || successMessage) return;

    const autoAccept = async () => {
      setIsAutoAccepting(true);
      setAutoAcceptError('');

      try {
        const inviteKey = token || shortCode;
        let result;
        
        if (shortCode) {
          result = await acceptByCode(shortCode);
        } else {
          result = await acceptInvitation(token);
        }

        if (!result.success) {
          // Check if error is because already connected
          if (result.code === 'ALREADY_CONNECTED') {
            setSuccessMessage('You are already connected with this co-parent!');
            setTimeout(() => navigate('/', { replace: true }), 1500);
            return;
          }
          
          // Check for co-parent limit
          if (result.code === 'COPARENT_LIMIT' || result.error?.includes('limit')) {
            setAutoAcceptError('You already have a co-parent connection. Please manage your existing connection first.');
            return;
          }
          
          setAutoAcceptError(result.error || 'Failed to accept invitation');
          return;
        }

        // Clear any pending invite code from localStorage and invitation state
        localStorage.removeItem('pending_invite_code');
        clearInvitationState();

        setSuccessMessage('Connected with your co-parent! Redirecting...');
        setTimeout(() => navigate('/', { replace: true }), 1500);
      } catch (err) {
        const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: 'accept_invitation' });
        logError(err, { endpoint: 'accept_invitation', operation: 'auto_accept', token: token || shortCode });
        setAutoAcceptError(errorInfo.userMessage);
      } finally {
        setIsAutoAccepting(false);
      }
    };

    autoAccept();
  }, [hasValidated, isCheckingAuth, isAuthenticated, validationResult, token, shortCode, isAutoAccepting, successMessage, navigate]);

  // Handle signup form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!displayName.trim()) {
      setFormError('Please enter your name');
      return;
    }

    if (!formEmail.trim()) {
      setFormError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail.trim().toLowerCase())) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (formPassword.length < 4) {
      setFormError('Password must be at least 4 characters');
      return;
    }

    if (formPassword !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setFormError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    // Set auth hook values and call signup
    setEmail(formEmail.trim().toLowerCase());
    setPassword(formPassword);
    setUsername(displayName.trim());

    // Re-validate token before registration
    if (token || shortCode) {
      const revalidation = await validateFromContext(token, shortCode);
      if (!revalidation.valid) {
        const errorInfo = revalidation.errorInfo || getErrorMessage({ code: revalidation.code });
        setFormError(errorInfo.userMessage);
        return;
      }
    }

    try {
      // Register the user with the invite token
      const inviteKey = token || shortCode;
      const response = await retryWithBackoff(
        () => apiPost('/api/auth/register-with-invite', {
          email: formEmail.trim().toLowerCase(),
          password: formPassword,
          username: displayName.trim(),
          inviteToken: token,
          inviteCode: shortCode,
        }),
        {
          maxRetries: 3,
          shouldRetry: (error, statusCode) => {
            // Don't retry 4xx errors (except 429 rate limit)
            if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
              return false;
            }
            return isRetryableError(error, statusCode);
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorInfo = getErrorMessage(data, { statusCode: response.status, endpoint: '/api/auth/register-with-invite' });
        logError(data, { endpoint: '/api/auth/register-with-invite', operation: 'register_from_invite', email: formEmail });
        
        // Special handling for specific error codes
        if (data.code === 'REG_001' || data.error?.includes('already') || data.error?.includes('exists')) {
          setFormError(errorInfo.userMessage);
          return;
        }
        if (data.code === 'REG_002' || data.code === 'REG_003' || data.code === 'INVALID_TOKEN' || data.code === 'EXPIRED') {
          setFormError(errorInfo.userMessage);
          return;
        }
        
        setFormError(errorInfo.userMessage);
        return;
      }

      // Store auth data
      if (data.token) {
        localStorage.setItem('auth_token_backup', data.token);
      }
      if (data.user) {
        localStorage.setItem('chatUser', JSON.stringify(data.user));
        localStorage.setItem('username', data.user.username || data.user.displayName);
        localStorage.setItem('userEmail', data.user.email);
      }
      localStorage.setItem('isAuthenticated', 'true');

      // Clear any pending invite code and invitation state
      localStorage.removeItem('pending_invite_code');
      clearInvitationState();

      setSuccessMessage('Account created and connected! Redirecting to your dashboard...');

      // Redirect after brief delay
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } catch (err) {
      const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/auth/register-with-invite' });
      logError(err, { endpoint: '/api/auth/register-with-invite', operation: 'register_from_invite', email: formEmail });
      setFormError(errorInfo.userMessage);
    }
  };

  // Loading state
  if (!hasValidated || isValidating || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-lightest border-t-teal-medium mb-4" />
          <p className="text-teal-dark font-medium">Validating invitation...</p>
        </div>
      </div>
    );
  }

  // No token/code provided
  if ((!token && !shortCode) || validationResult?.code === 'TOKEN_REQUIRED') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl font-bold text-teal-dark mb-2">Invalid Link</h1>
            <p className="text-gray-600 mb-6">
              This invitation link is missing required information. Please check your message for the correct link.
            </p>
            <Button onClick={() => navigate('/signin')} fullWidth>
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Invalid or expired token/code
  if (!validationResult?.valid) {
    const errorMessages = {
      INVALID_TOKEN: {
        title: 'Invalid Invitation',
        message: 'This invitation link is not valid. It may have been entered incorrectly.',
        suggestion: 'Please check your message for the correct link or ask your co-parent to send a new invitation.',
      },
      INVALID_CODE: {
        title: 'Invalid Code',
        message: 'This invitation code is not valid.',
        suggestion: 'Please check the code and try again, or ask your co-parent to send a new invitation.',
      },
      ALREADY_ACCEPTED: {
        title: 'Already Accepted',
        message: 'This invitation has already been accepted.',
        suggestion: 'If you already have an account, please sign in. Otherwise, contact your co-parent.',
        showLogin: true,
      },
      EXPIRED: {
        title: 'Invitation Expired',
        message: 'This invitation has expired. Invitations are valid for 7 days.',
        suggestion: 'Please ask your co-parent to send you a new invitation.',
      },
      CANCELLED: {
        title: 'Invitation Cancelled',
        message: 'This invitation has been cancelled by the sender.',
        suggestion: 'Please contact your co-parent if you believe this is a mistake.',
      },
      // Registration error codes from backend
      REG_001: {
        title: 'Email Already Registered',
        message: 'This email address is already associated with an account.',
        suggestion: 'Try signing in instead, or use a different email address.',
        showLogin: true,
      },
      REG_002: {
        title: 'Invalid Invitation',
        message: 'This invitation token is not valid.',
        suggestion: 'Please ask your co-parent to send a new invitation.',
      },
      REG_003: {
        title: 'Invitation Expired',
        message: 'This invitation has expired.',
        suggestion: 'Please ask your co-parent to send you a new invitation.',
      },
      REG_004: {
        title: 'Already Connected',
        message: 'This invitation has already been used.',
        suggestion: 'If you have an account, please sign in.',
        showLogin: true,
      },
      REG_008: {
        title: 'Inviter Not Found',
        message: 'The account that sent this invitation no longer exists.',
        suggestion: 'Please contact support if you need assistance.',
      },
      NETWORK_ERROR: {
        title: 'Connection Error',
        message: 'Unable to reach the server.',
        suggestion: 'Check your internet connection and try again.',
      },
    };

    const errorInfo = errorMessages[validationResult?.code] || {
      title: 'Something Went Wrong',
      message: inviteError || validationResult?.error || 'We couldn\'t validate this invitation.',
      suggestion: 'Please try again or contact support.',
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl font-bold text-teal-dark mb-2">{errorInfo.title}</h1>
            <p className="text-gray-600 mb-4">{errorInfo.message}</p>
            <p className="text-gray-500 text-sm mb-6">{errorInfo.suggestion}</p>
            <div className="space-y-3">
              {errorInfo.showLogin && (
                <Button onClick={() => navigate('/signin')} fullWidth>
                  Sign In
                </Button>
              )}
              <Button
                onClick={() => navigate('/')}
                variant={errorInfo.showLogin ? 'tertiary' : 'primary'}
                fullWidth
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auto-accepting for logged-in user
  if (isAuthenticated && (isAutoAccepting || successMessage)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm">
            {successMessage ? (
              <>
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="font-serif text-2xl font-bold text-teal-dark mb-2">Connected!</h1>
                <p className="text-gray-600">{successMessage}</p>
                <div className="mt-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-teal-lightest border-t-teal-medium" />
                </div>
              </>
            ) : autoAcceptError ? (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="font-serif text-2xl font-bold text-teal-dark mb-2">Connection Failed</h1>
                <p className="text-gray-600 mb-4">{autoAcceptError}</p>
                <Button onClick={() => navigate('/')} fullWidth>
                  Go to Dashboard
                </Button>
              </>
            ) : (
              <>
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-lightest border-t-teal-medium mb-4" />
                <p className="text-teal-dark font-medium">Connecting with your co-parent...</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success message after account creation
  if (successMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl font-bold text-teal-dark mb-2 flex items-center gap-2">
              Welcome to <img src="/assets/wordmark.svg" alt="LiaiZen" className="h-7 w-auto inline-block" />!
            </h1>
            <p className="text-gray-600">{successMessage}</p>
            <div className="mt-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-teal-lightest border-t-teal-medium" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Valid token - show signup form for new users
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
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
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Collaborative Parenting
          </p>
        </div>

        {/* Short code confirmation step - verify inviter before showing signup */}
        {shortCode && validationResult?.valid && !confirmedInviter ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-teal-dark mb-4 text-center">
              Confirm Your Co-Parent
            </h2>
            <p className="text-gray-600 text-sm mb-4 text-center">
              Before creating your account, please verify this is the right person:
            </p>
            <div className="p-4 bg-teal-lightest rounded-xl border-2 border-teal-light mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-medium rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {(validationResult.inviterName || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-lg text-teal-dark">
                    {validationResult.inviterName || 'Your co-parent'}
                  </p>
                  {validationResult.inviterEmailDomain && (
                    <p className="text-sm text-gray-600">
                      Email: ...@{validationResult.inviterEmailDomain}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => setConfirmedInviter(true)}
                fullWidth
                size="large"
              >
                Yes, this is my co-parent
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="tertiary"
                fullWidth
                size="medium"
              >
                No, wrong person
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Not sure? Don't proceed with this invitation.
            </p>
          </div>
        ) : (
          <>
            {/* Invitation info */}
            <div className="mb-6 rounded-2xl bg-emerald-50 border-2 border-emerald-200 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-emerald-800">You've been invited!</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    <span className="font-medium">{validationResult.inviterName || 'Your co-parent'}</span>
                    {validationResult.inviterEmailDomain && (
                      <span className="text-emerald-600"> ({validationResult.inviterEmailDomain})</span>
                    )}
                    {' '}has invited you to connect on LiaiZen for easier co-parenting communication.
                  </p>
                  {shortCode && (
                    <p className="text-xs text-emerald-600 mt-2">
                      ✓ Verified invitation
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form errors */}
            {(formError || authError) && (
              <div className="mb-4 rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-700">
                {formError || authError}
              </div>
            )}

            {/* Page Title */}
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-teal-dark text-center mb-6">
              Create your account
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <Input
            label="Email"
            type="email"
            value={formEmail}
            onChange={setFormEmail}
            placeholder="you@example.com"
            required
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
          />

          {/* Display Name */}
          <Input
            label="Your Name"
            type="text"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Enter your name"
            required
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
          />

          {/* Password */}
          <Input
            label="Password"
            type="password"
            value={formPassword}
            onChange={setFormPassword}
            placeholder="At least 4 characters"
            required
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            helperText="Must be at least 4 characters"
          />

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your password"
            required
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            error={confirmPassword && formPassword !== confirmPassword ? 'Passwords do not match' : ''}
          />

          {/* Terms checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="agree-terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-teal-medium focus:ring-teal-medium cursor-pointer"
            />
            <label htmlFor="agree-terms" className="text-sm text-gray-600 cursor-pointer">
              I agree to the{' '}
              <a href="/terms" target="_blank" className="text-teal-medium hover:text-teal-dark font-medium">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" className="text-teal-medium hover:text-teal-dark font-medium">
                Privacy Policy
              </a>
            </label>
          </div>

          <Button
            type="submit"
            fullWidth
            size="large"
            disabled={isSigningUp}
            loading={isSigningUp}
            className="mt-6"
          >
            Create Account & Connect
          </Button>
        </form>

            {/* Divider */}
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
                disabled={isSigningUp || isGoogleLoggingIn}
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
                Sign up with Google
              </Button>
            </div>

            {/* Already have account */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    const inviteKey = token || shortCode;
                    const paramName = shortCode ? 'code' : 'invite';
                    navigate(`/signin?${paramName}=${inviteKey}`);
                  }}
                  className="text-teal-medium font-semibold hover:text-teal-dark transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AcceptInvitationPage;
