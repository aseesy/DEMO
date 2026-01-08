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
import { useAcceptInvitationXState } from './model/useAcceptInvitationXState.js';
import { storage, StorageKeys, authStorage } from '../../adapters/storage';
import { buildInviteUrl } from '../../utils/inviteTokenParser';
import {
  LoadingView,
  InvalidLinkView,
  InvalidTokenView,
  AutoAcceptView,
  SuccessView,
  ConfirmInviterView,
  InvitationBanner,
  SignupForm,
  WrongAccountView,
} from './components/invite';

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
    firstName,
    lastName,
    formEmail,
    formPassword,
    confirmPassword,
    agreeToTerms,
    formError,

    // Form setters
    setFirstName,
    setLastName,
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
  } = useAcceptInvitationXState();

  // Store returnTo when user is not authenticated (for when they navigate to sign in)
  React.useEffect(() => {
    if (token || shortCode) {
      const returnTo = buildInviteUrl('/accept-invite', token, shortCode);
      storage.set(StorageKeys.RETURN_URL, returnTo, { ttl: 60 * 60 * 1000 }); // 1 hour TTL
      
      if (import.meta.env.DEV) {
        console.log('[AcceptInvitationPage] Stored returnTo:', returnTo);
      }
    }
  }, [token, shortCode]);

  // Loading state - show loading while validating
  if (isLoading) {
    return <LoadingView />;
  }

  // No token/code provided
  if ((!token && !shortCode) || validationResult?.code === 'TOKEN_REQUIRED') {
    return <InvalidLinkView onNavigateSignIn={handleNavigateSignIn} />;
  }

  // Check for wrong account state (State 3: Logged in + wrong account)
  // This happens when parentBEmail is set and doesn't match logged-in user's email
  const currentUserEmail = storage.get(StorageKeys.USER_EMAIL) || '';
  const expectedEmail = validationResult?.parentBEmail;
  const isWrongAccount = 
    isAuthenticated && 
    expectedEmail && 
    currentUserEmail.toLowerCase().trim() !== expectedEmail.toLowerCase().trim();

  // Also check if auto-accept returned WRONG_ACCOUNT error
  const wrongAccountError = autoAcceptError && (
    autoAcceptError.includes('invitation was sent to') || 
    autoAcceptError.includes('wrong account') ||
    autoAcceptError.includes('WRONG_ACCOUNT')
  );

  if (isWrongAccount || wrongAccountError) {
    // Try to extract email from error message if available
    const errorMatch = autoAcceptError?.match(/invitation was sent to ([^\s]+)/i);
    const errorExpectedEmail = errorMatch ? errorMatch[1] : expectedEmail;
    
    return (
      <WrongAccountView
        expectedEmail={errorExpectedEmail || expectedEmail || 'another email address'}
        actualEmail={currentUserEmail || 'your current account'}
        onSwitchAccount={() => {
          // Logout and redirect to invite link
          authStorage.clear();
          storage.clear();
          window.location.href = `/accept-invite?token=${token || ''}&code=${shortCode || ''}`;
        }}
        onCancel={handleNavigateHome}
      />
    );
  }

  // Invalid or expired token/code
  // Check both validationResult and inviteError to catch all error cases
  if (!validationResult?.valid || (inviteError && !validationResult)) {
    return (
      <InvalidTokenView
        validationResult={validationResult || { valid: false, code: 'INVALID_TOKEN', error: inviteError || 'Invalid invitation' }}
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
              firstName={firstName}
              lastName={lastName}
              formPassword={formPassword}
              confirmPassword={confirmPassword}
              agreeToTerms={agreeToTerms}
              formError={formError}
              authError={authError}
              isSigningUp={isSigningUp}
              isGoogleLoggingIn={isGoogleLoggingIn}
              onEmailChange={setFormEmail}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
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
