/**
 * InviteCoParentPage - Post-signup screen for inviting co-parent
 *
 * Refactored to use useInviteCoParent hook and presentational components.
 *
 * User can:
 * 1. Send invitation via email (7-day expiration)
 * 2. Generate a shareable link (7-day expiration)
 * 3. Generate a quick code for existing users (15-minute expiration)
 * 4. Enter a code they received from their co-parent
 */

import React from 'react';
import { useInviteCoParent } from './useInviteCoParent.js';
import { InvitePreGenerationView, InviteGeneratedView } from './components/invite';

export function InviteCoParentPage() {
  const {
    // State
    inviteeEmail,
    inviteMethod,
    error,
    enteredCode,
    codeValidation,
    inviteData,

    // Copy states
    copied,
    copiedCode,
    copiedMessage,

    // Loading states
    isLoading,
    isCreating,
    isAccepting,
    isValidating,

    // Setters
    setInviteeEmail,
    setInviteMethod,
    setEnteredCode,

    // Handlers
    handleGenerateInvite,
    handleCopyLink,
    handleCopyCode,
    handleCopyMessage,
    handleShare,
    handleSkip,
    handleContinue,
    handleGenerateNew,
    handleValidateCode,
    handleAcceptCode,

    // Helpers
    getExpirationText,
  } = useInviteCoParent();

  return (
    <div className="h-dvh bg-gradient-to-b from-[#E8F5F5] to-white flex flex-col pt-nav-mobile pb-nav-mobile overflow-y-auto">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/assets/Logo.svg" alt="LiaiZen Logo" className="h-8 sm:h-10 w-auto" />
          <img src="/assets/wordmark.svg" alt="LiaiZen" className="h-9 sm:h-11 w-auto" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8">
            {!inviteData ? (
              <InvitePreGenerationView
                error={error}
                inviteMethod={inviteMethod}
                inviteeEmail={inviteeEmail}
                enteredCode={enteredCode}
                codeValidation={codeValidation}
                isLoading={isLoading}
                isCreating={isCreating}
                isAccepting={isAccepting}
                isValidating={isValidating}
                onMethodChange={setInviteMethod}
                onEmailChange={setInviteeEmail}
                onCodeChange={setEnteredCode}
                onValidateCode={handleValidateCode}
                onAcceptCode={handleAcceptCode}
                onGenerateInvite={handleGenerateInvite}
                onSkip={handleSkip}
              />
            ) : (
              <InviteGeneratedView
                inviteData={inviteData}
                copied={copied}
                copiedCode={copiedCode}
                copiedMessage={copiedMessage}
                onCopyLink={handleCopyLink}
                onCopyCode={handleCopyCode}
                onCopyMessage={handleCopyMessage}
                onShare={handleShare}
                onGenerateNew={handleGenerateNew}
                onContinue={handleContinue}
                expirationText={getExpirationText()}
              />
            )}
          </div>

          {/* Help text */}
          <p className="text-center text-sm text-gray-500 mt-4">
            You can always invite your co-parent later from Settings
          </p>
        </div>
      </div>
    </div>
  );
}

export default InviteCoParentPage;
