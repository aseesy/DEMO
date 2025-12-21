/**
 * AcceptInvitationPage - Page for accepting co-parent invitations
 *
 * Refactored to use useAcceptInvitation hook and presentational components.
 *
 * Route: /accept-invite?token=TOKEN or /accept-invite?code=LZ-XXXXXX
 *
 * Workflow:
 * 1. Validate token/code on mount
 * 2. If user is logged in: auto-accept and redirect
 * 3. If user is new: show signup form, then auto-accept after signup
 * 4. Redirect to dashboard on success
 */

import React from 'react';
import { useAcceptInvitation } from '../hooks/useAcceptInvitation.js';
import {
  LoadingView,
  InvalidLinkView,
  InvalidTokenView,
  AutoAcceptView,
  SuccessView,
  ConfirmInviterView,
  InvitationBanner,
  SignupForm,
} from './invite';

export function AcceptInvitationPage() {
  const {
    // URL params
    token,
    shortCode,

    // Validation
    validationResult,
    inviteError,

    // Auth state
    isAuthenticated,
    authError,
    isSigningUp,
    isGoogleLoggingIn,

    // Form state
    displayName,
    formEmail,
    formPassword,
    confirmPassword,
    agreeToTerms,
    formError,

    // Form setters
    setDisplayName,
    setFormEmail,
    setFormPassword,
    setConfirmPassword,
    setAgreeToTerms,

    // Confirmation state
    confirmedInviter,
    setConfirmedInviter,

    // Auto-accept state
    isAutoAccepting,
    autoAcceptError,
    successMessage,

    // Handlers
    handleSubmit,
    handleGoogleLogin,
    handleNavigateToSignIn,
    handleNavigateHome,
    handleNavigateSignIn,

    // Loading states
    isLoading,
  } = useAcceptInvitation();

  // Loading state
  if (isLoading) {
    return <LoadingView />;
  }

  // No token/code provided
  if ((!token && !shortCode) || validationResult?.code === 'TOKEN_REQUIRED') {
    return <InvalidLinkView onNavigateSignIn={handleNavigateSignIn} />;
  }

  // Invalid or expired token/code
  if (!validationResult?.valid) {
    return (
      <InvalidTokenView
        validationResult={validationResult}
        inviteError={inviteError}
        onNavigateHome={handleNavigateHome}
        onNavigateSignIn={handleNavigateSignIn}
      />
    );
  }

  // Auto-accepting for logged-in user
  if (isAuthenticated && (isAutoAccepting || successMessage || autoAcceptError)) {
    return (
      <AutoAcceptView
        successMessage={successMessage}
        autoAcceptError={autoAcceptError}
        onNavigateHome={handleNavigateHome}
      />
    );
  }

  // Success message after account creation (not logged in)
  if (successMessage) {
    return <SuccessView successMessage={successMessage} />;
  }

  // Valid token - show signup form for new users
  return (
    <div className="h-dvh bg-linear-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
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

        {/* Short code confirmation step */}
        {shortCode && validationResult?.valid && !confirmedInviter ? (
          <ConfirmInviterView
            validationResult={validationResult}
            onConfirm={() => setConfirmedInviter(true)}
            onReject={handleNavigateHome}
          />
        ) : (
          <>
            <InvitationBanner validationResult={validationResult} shortCode={shortCode} />

            <SignupForm
              formEmail={formEmail}
              displayName={displayName}
              formPassword={formPassword}
              confirmPassword={confirmPassword}
              agreeToTerms={agreeToTerms}
              formError={formError}
              authError={authError}
              isSigningUp={isSigningUp}
              isGoogleLoggingIn={isGoogleLoggingIn}
              onEmailChange={setFormEmail}
              onDisplayNameChange={setDisplayName}
              onPasswordChange={setFormPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onAgreeChange={setAgreeToTerms}
              onSubmit={handleSubmit}
              onGoogleLogin={handleGoogleLogin}
              onNavigateToSignIn={handleNavigateToSignIn}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default AcceptInvitationPage;
