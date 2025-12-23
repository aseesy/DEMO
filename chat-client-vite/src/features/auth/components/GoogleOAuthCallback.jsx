import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../index.js';
import { parseOAuthError, clearOAuthState } from '../../../utils/oauthHelper.js';
import { getErrorMessage, logError } from '../../../utils/errorHandler.jsx';

// Navigation adapter for abstracting routes
import { NavigationPaths } from '../../../adapters/navigation';

/**
 * Component to handle Google OAuth callback
 * Google redirects here with a code parameter, which we send to the backend
 */
export function GoogleOAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGoogleCallback, error, setError } = useAuth();
  const [isProcessing, setIsProcessing] = React.useState(true);

  React.useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const state = searchParams.get('state');

      // Handle OAuth error from Google
      if (errorParam) {
        const oauthError = parseOAuthError(errorParam, errorDescription);
        logError(new Error(oauthError.message), {
          endpoint: 'google_oauth_callback',
          operation: 'oauth_callback',
          code: errorParam,
        });

        // Special handling for access_denied (user cancelled)
        if (errorParam === 'access_denied') {
          // Silently handle cancellation - no error message needed
          clearOAuthState();
          navigate(NavigationPaths.SIGN_IN, { replace: true });
          return;
        }

        setError(oauthError.userMessage);
        clearOAuthState();
        setIsProcessing(false);
        setTimeout(() => {
          navigate(NavigationPaths.SIGN_IN);
        }, 3000);
        return;
      }

      // Handle missing code
      if (!code) {
        const errorInfo = getErrorMessage(
          { code: 'INVALID_OAUTH_RESPONSE' },
          { endpoint: 'google_oauth_callback' }
        );
        logError(new Error('Missing OAuth code'), {
          endpoint: 'google_oauth_callback',
          operation: 'oauth_callback',
        });
        setError(errorInfo.userMessage);
        clearOAuthState();
        setIsProcessing(false);
        setTimeout(() => {
          navigate(NavigationPaths.SIGN_IN);
        }, 3000);
        return;
      }

      // Prevent code reuse - check if this code has already been processed
      const processedCode = sessionStorage.getItem('oauth_processed_code');
      if (processedCode === code) {
        console.warn('⚠️ OAuth code already processed, skipping to prevent reuse');
        const errorInfo = getErrorMessage(
          { code: 'CODE_ALREADY_USED' },
          { endpoint: 'google_oauth_callback' }
        );
        setError(errorInfo.userMessage);
        clearOAuthState();
        setIsProcessing(false);
        setTimeout(() => {
          navigate(NavigationPaths.SIGN_IN);
        }, 3000);
        return;
      }

      // Mark code as being processed
      sessionStorage.setItem('oauth_processed_code', code);

      // Send code and state to backend
      const success = await handleGoogleCallback(code, state);

      if (success) {
        // Clear the processed code and OAuth state on success
        sessionStorage.removeItem('oauth_processed_code');
        clearOAuthState();
        // Redirect to dashboard on success
        navigate(NavigationPaths.HOME, { replace: true });
      } else {
        // Keep the processed code marker to prevent retries with same code
        // Redirect to signin on error (error message already set)
        clearOAuthState();
        setTimeout(() => {
          navigate(NavigationPaths.SIGN_IN, { replace: true });
        }, 3000);
      }

      setIsProcessing(false);
    };

    processCallback();
  }, [searchParams, handleGoogleCallback, navigate, setError]);

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
        ) : error ? (
          <>
            <div className="mb-4 rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
            <p className="text-gray-600 text-sm">Redirecting to sign in page...</p>
          </>
        ) : (
          <>
            <div className="mb-4 text-green-600 text-2xl">✓</div>
            <p className="text-gray-900 font-medium">Login successful!</p>
            <p className="text-gray-600 text-sm mt-2">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default GoogleOAuthCallback;
