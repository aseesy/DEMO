import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../model/useAuth.js';
import { parseOAuthError, clearOAuthState } from '../../../utils/oauthHelper.js';
import { getErrorMessage, logError } from '../../../utils/errorHandler.jsx';
import { NavigationPaths } from '../../../adapters/navigation';

/**
 * OAuth Callback State Machine
 *
 * States:
 * - IDLE: Initial state
 * - PROCESSING: Making auth request
 * - SUCCESS: Auth completed successfully
 * - ERROR: Auth failed
 */
const OAuthState = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * GoogleOAuthCallback - Handles Google OAuth callback
 *
 * Best Practices Applied:
 * 1. ✅ Idempotent operations (single execution per mount)
 * 2. ✅ Proper useEffect cleanup (AbortController)
 * 3. ✅ Single source of truth (React state, not sessionStorage)
 * 4. ✅ State machine pattern for clear state management
 * 5. ✅ Proper error handling and user feedback
 *
 * Google redirects here with a code parameter, which we send to the backend.
 * OAuth codes from Google are single-use by design, so duplicate calls will
 * fail gracefully at the backend level.
 */
export function GoogleOAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGoogleCallback, error, setError, isAuthenticated } = useAuth();

  // State machine for OAuth flow
  const [state, setState] = React.useState(OAuthState.IDLE);
  const [errorMessage, setErrorMessage] = React.useState('');

  // AbortController for canceling in-flight requests on unmount
  const abortControllerRef = React.useRef(null);

  // Track if we've attempted processing to prevent duplicate executions
  // This handles React StrictMode double mounting correctly
  const hasAttemptedRef = React.useRef(false);

  React.useEffect(() => {
    // If already authenticated, redirect immediately
    if (isAuthenticated) {
      navigate(NavigationPaths.HOME, { replace: true });
      return;
    }

    // Prevent duplicate processing (handles React StrictMode double mounting)
    if (hasAttemptedRef.current) {
      return;
    }

    const processCallback = async () => {
      // Mark as attempted to prevent duplicate processing
      hasAttemptedRef.current = true;

      // Create AbortController for this request
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const state = searchParams.get('state');

        // Handle OAuth error from Google
        if (errorParam) {
          if (signal.aborted) return;

          const oauthError = parseOAuthError(errorParam, errorDescription);
          logError(new Error(oauthError.message), {
            endpoint: 'google_oauth_callback',
            operation: 'oauth_callback',
            code: errorParam,
          });

          // Special handling for access_denied (user cancelled)
          if (errorParam === 'access_denied') {
            clearOAuthState();
            navigate(NavigationPaths.SIGN_IN, { replace: true });
            return;
          }

          setState(OAuthState.ERROR);
          setErrorMessage(oauthError.userMessage);
          clearOAuthState();

          setTimeout(() => {
            if (!signal.aborted) {
              navigate(NavigationPaths.SIGN_IN, { replace: true });
            }
          }, 3000);
          return;
        }

        // Handle missing code
        if (!code) {
          if (signal.aborted) return;

          const errorInfo = getErrorMessage(
            { code: 'INVALID_OAUTH_RESPONSE' },
            { endpoint: 'google_oauth_callback' }
          );
          logError(new Error('Missing OAuth code'), {
            endpoint: 'google_oauth_callback',
            operation: 'oauth_callback',
          });

          setState(OAuthState.ERROR);
          setErrorMessage(errorInfo.userMessage);
          clearOAuthState();

          setTimeout(() => {
            if (!signal.aborted) {
              navigate(NavigationPaths.SIGN_IN, { replace: true });
            }
          }, 3000);
          return;
        }

        // Set processing state
        setState(OAuthState.PROCESSING);
        setErrorMessage('');

        // Send code and state to backend
        // Note: OAuth codes from Google are single-use, so duplicate calls will fail
        // The backend will return an error if the code was already used (expected behavior)
        const success = await handleGoogleCallback(code, state);

        // Check if request was aborted
        if (signal.aborted) {
          return;
        }

        if (success) {
          setState(OAuthState.SUCCESS);
          clearOAuthState();
          // Redirect immediately on success
          navigate(NavigationPaths.HOME, { replace: true });
        } else {
          // Error message is set by handleGoogleCallback
          setState(OAuthState.ERROR);
          setErrorMessage(error || 'Authentication failed. Please try again.');
          clearOAuthState();

          setTimeout(() => {
            if (!signal.aborted) {
              navigate(NavigationPaths.SIGN_IN, { replace: true });
            }
          }, 3000);
        }
      } catch (err) {
        // Only set error if not aborted
        if (!signal.aborted) {
          const errorInfo = getErrorMessage(err, {
            endpoint: '/api/auth/google/callback',
          });
          setState(OAuthState.ERROR);
          setErrorMessage(errorInfo.userMessage);
          clearOAuthState();

          setTimeout(() => {
            if (!signal.aborted) {
              navigate(NavigationPaths.SIGN_IN, { replace: true });
            }
          }, 3000);
        }
      }
    };

    processCallback();

    // Cleanup: abort any in-flight requests on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchParams, handleGoogleCallback, navigate, setError, isAuthenticated, error]);

  // Determine UI state
  const isProcessing = state === OAuthState.PROCESSING;
  const showError = state === OAuthState.ERROR && errorMessage;
  const showSuccess = state === OAuthState.SUCCESS;

  return (
    <div className="h-dvh bg-gradient-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="max-w-md w-full text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-6">
            <img src="/assets/Logo.svg" alt="LiaiZen Logo" className="h-12 sm:h-14 w-auto" />
            <img src="/assets/wordmark.svg" alt="LiaiZen" className="h-14 sm:h-16 w-auto" />
          </div>
        </div>

        {isProcessing ? (
          <>
            <div className="mb-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-medium border-t-transparent"></div>
            </div>
            <p className="text-gray-900 font-medium">Completing Google login...</p>
          </>
        ) : showError ? (
          <>
            <div className="mb-4 rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
            <p className="text-gray-600 text-sm">Redirecting to sign in page...</p>
          </>
        ) : showSuccess ? (
          <>
            <div className="mb-4 text-green-600 text-2xl">✓</div>
            <p className="text-gray-900 font-medium">Login successful!</p>
            <p className="text-gray-600 text-sm mt-2">Redirecting...</p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default GoogleOAuthCallback;
