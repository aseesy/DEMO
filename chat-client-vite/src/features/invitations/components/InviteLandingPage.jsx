/**
 * InviteLandingPage - Landing page for logged-out users clicking invite links
 * 
 * This page:
 * 1. Stores returnTo=/accept-invite?... in storage
 * 2. Shows a friendly landing page with invitation details
 * 3. Offers "Log In" and "Sign Up" buttons
 * 4. After auth, user returns to /accept-invite to continue flow
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storage, StorageKeys } from '../../../adapters/storage';
import { NavigationPaths } from '../../../adapters/navigation';
import { getInviteTokenFromUrl, buildInviteUrl } from '../../../utils/inviteTokenParser';
import { Button } from '../../components/ui';
import { GoogleSignInButton } from '../../auth/components';

export function InviteLandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, code } = getInviteTokenFromUrl(searchParams);
  
  // Store returnTo immediately on mount
  React.useEffect(() => {
    const returnTo = buildInviteUrl('/accept-invite', token, code);
    storage.set(StorageKeys.RETURN_URL, returnTo, { ttl: 60 * 60 * 1000 }); // 1 hour TTL
    
    if (import.meta.env.DEV) {
      console.log('[InviteLanding] Stored returnTo:', returnTo);
    }
  }, [token, code]);

  const handleSignIn = () => {
    const returnTo = buildInviteUrl('/accept-invite', token, code);
    navigate(NavigationPaths.withQuery(NavigationPaths.SIGN_IN, { returnTo }), { replace: true });
  };

  const handleSignUp = () => {
    const returnTo = buildInviteUrl('/accept-invite', token, code);
    navigate(NavigationPaths.withQuery(NavigationPaths.SIGN_UP, { returnTo }), { replace: true });
  };

  const handleGoogleLogin = () => {
    // Store returnTo for OAuth callback
    const returnTo = buildInviteUrl('/accept-invite', token, code);
    storage.set(StorageKeys.RETURN_URL, returnTo, { ttl: 60 * 60 * 1000 });
    
    // Trigger Google OAuth flow
    const googleAuthUrl = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="h-dvh bg-linear-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <img
              src="/assets/Logo.svg"
              alt="LiaiZen Logo"
              className="h-12 sm:h-14 w-auto transition-transform hover:scale-105"
            />
            <img src="/assets/wordmark.svg" alt="LiaiZen" className="h-14 sm:h-16 w-auto" />
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Collaborative Parenting</p>
        </div>

        {/* Invitation Card */}
        <div className="bg-white rounded-2xl border-2 border-emerald-200 p-8 shadow-sm mb-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1 className="font-serif text-2xl font-bold text-teal-dark mb-2">
              You've been invited!
            </h1>
            <p className="text-gray-600">
              Your co-parent has invited you to connect on LiaiZen for easier co-parenting
              communication.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleSignUp} fullWidth size="large">
              Create Account & Accept
            </Button>
            <Button onClick={handleSignIn} variant="secondary" fullWidth size="large">
              Log In to Accept
            </Button>
            <GoogleSignInButton onClick={handleGoogleLogin} />
          </div>

          <p className="text-xs text-gray-500 mt-6 text-center">
            Already have an account? Click "Log In to Accept" above.
          </p>
        </div>
      </div>
    </div>
  );
}

