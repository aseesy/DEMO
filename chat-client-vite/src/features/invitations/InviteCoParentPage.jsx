/**
 * InviteCoParentPage - Full page route for connecting with co-parent via codes
 *
 * Used as onboarding step after signup. Uses shared useInviteCode hook
 * and InviteCodeForm component. Handles page-specific behavior (navigation).
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storage, StorageKeys } from '../../adapters/storage/index.js';
import { useInviteCode } from './model/useInviteCode.js';
import { InviteCodeForm } from './components/InviteCodeForm.jsx';

export function InviteCoParentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [initialCode, setInitialCode] = React.useState('');

  // Pre-fill code from URL param or storage
  React.useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    const codeFromStorage = storage.getString(StorageKeys.PENDING_INVITE_CODE);

    if (codeFromUrl) {
      setInitialCode(codeFromUrl.toUpperCase());
      storage.remove(StorageKeys.PENDING_INVITE_CODE);
    } else if (codeFromStorage) {
      setInitialCode(codeFromStorage.toUpperCase());
      storage.remove(StorageKeys.PENDING_INVITE_CODE);
    }
  }, [searchParams]);

  const inviteCode = useInviteCode({ initialCode });

  const handleCodeAccepted = React.useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleContinueToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#E8F5F5] to-white flex flex-col">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <img src="/assets/Logo.svg" alt="" className="h-8 w-auto" />
          <img src="/assets/wordmark.svg" alt="LiaiZen" className="h-9 w-auto" />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-xl font-bold text-teal-700 text-center mb-6">Invite Co-Parent</h1>

            <InviteCodeForm
              inviteState={inviteCode}
              inviteHandlers={inviteCode}
              onCodeAccepted={handleCodeAccepted}
              renderSuccessButton={() =>
                inviteCode.generatedCode ? (
                  <button
                    onClick={handleContinueToDashboard}
                    className="w-full py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Continue to Dashboard
                  </button>
                ) : null
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default InviteCoParentPage;
