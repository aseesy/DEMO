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
    <div className="min-h-screen bg-gradient-to-br from-[#275559] to-[#4DA8B0] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/95 rounded-3xl shadow-2xl p-6 sm:p-8 text-center">
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
        </div>

        {isProcessing ? (
          <>
            <div className="mb-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#275559] border-t-transparent"></div>
            </div>
            <p className="text-slate-700 font-medium">Completing Google login...</p>
          </>
        ) : error ? (
          <>
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
            <p className="text-slate-600 text-sm">Redirecting to sign in page...</p>
          </>
        ) : (
          <>
            <div className="mb-4 text-green-600 text-2xl">✓</div>
            <p className="text-slate-700 font-medium">Login successful!</p>
            <p className="text-slate-600 text-sm mt-2">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default GoogleOAuthCallback;

