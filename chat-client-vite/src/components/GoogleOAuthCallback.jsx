import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

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

      // Handle OAuth error from Google
      if (errorParam) {
        setError('Google login was cancelled or failed. Please try again.');
        setIsProcessing(false);
        setTimeout(() => {
          navigate('/signin');
        }, 3000);
        return;
      }

      // Handle missing code
      if (!code) {
        setError('Invalid Google login response. Please try again.');
        setIsProcessing(false);
        setTimeout(() => {
          navigate('/signin');
        }, 3000);
        return;
      }

      // Send code to backend
      const success = await handleGoogleCallback(code);
      
      if (success) {
        // Redirect to dashboard on success
        navigate('/');
      } else {
        // Redirect to signin on error (error message already set)
        setTimeout(() => {
          navigate('/signin');
        }, 3000);
      }
      
      setIsProcessing(false);
    };

    processCallback();
  }, [searchParams, handleGoogleCallback, navigate, setError]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="max-w-md w-full text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-6">
            <img
              src="/assets/Logo.svg"
              alt="LiaiZen Logo"
              className="h-12 sm:h-14 w-auto"
            />
            <img
              src="/assets/wordmark.svg"
              alt="LiaiZen"
              className="h-14 sm:h-16 w-auto"
            />
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

