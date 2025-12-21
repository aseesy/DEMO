/**
 * AcceptInviteViews - Presentational components for AcceptInvitationPage
 */

import React from 'react';
import { Button, Input } from '../ui';
import { GoogleSignInButton } from '../auth';
import { registry as errorHandlerRegistry } from '../../utils/errorHandlers/ErrorHandlerRegistry.js';

/**
 * Loading view while validating
 */
export function LoadingView() {
  return (
    <div className="h-dvh bg-linear-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-lightest border-t-teal-medium mb-4" />
        <p className="text-teal-dark font-medium">Validating invitation...</p>
      </div>
    </div>
  );
}

/**
 * No token/code provided
 */
export function InvalidLinkView({ onNavigateSignIn }) {
  return (
    <div className="h-dvh bg-linear-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4">
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
          <Button onClick={onNavigateSignIn} fullWidth>Go to Sign In</Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Invalid or expired token/code
 */
export function InvalidTokenView({ validationResult, inviteError, onNavigateHome, onNavigateSignIn }) {
  const handler = errorHandlerRegistry.get(validationResult?.code);
  const errorInfo = handler.getMessage(validationResult?.code, {
    inviteError,
    validationError: validationResult?.error,
  });

  return (
    <div className="h-dvh bg-linear-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4">
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
              <Button onClick={onNavigateSignIn} fullWidth>Sign In</Button>
            )}
            <Button onClick={onNavigateHome} variant={errorInfo.showLogin ? 'tertiary' : 'primary'} fullWidth>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Auto-accepting for logged-in user
 */
export function AutoAcceptView({ successMessage, autoAcceptError, onNavigateHome }) {
  return (
    <div className="h-dvh bg-linear-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4">
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
              <Button onClick={onNavigateHome} fullWidth>Go to Dashboard</Button>
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

/**
 * Success view after account creation
 */
export function SuccessView({ successMessage }) {
  return (
    <div className="h-dvh bg-linear-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4">
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

/**
 * Confirm inviter before signup (for short codes)
 */
export function ConfirmInviterView({ validationResult, onConfirm, onReject }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
      <h2 className="font-serif text-xl font-semibold text-teal-dark mb-4 text-center">
        Confirm Your Co-Parent
      </h2>
      <p className="text-gray-600 text-sm mb-4 text-center">
        Before creating your account, please verify this is the right person:
      </p>
      <div className="p-4 bg-teal-lightest rounded-xl border-2 border-teal-light mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-medium rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
            {(validationResult.inviterName || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-lg text-teal-dark">
              {validationResult.inviterName || 'Your co-parent'}
            </p>
            {validationResult.inviterEmailDomain && (
              <p className="text-sm text-gray-600">Email: ...@{validationResult.inviterEmailDomain}</p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <Button onClick={onConfirm} fullWidth size="large">Yes, this is my co-parent</Button>
        <Button onClick={onReject} variant="tertiary" fullWidth size="medium">No, wrong person</Button>
      </div>
      <p className="text-xs text-gray-500 mt-4 text-center">
        Not sure? Don't proceed with this invitation.
      </p>
    </div>
  );
}

/**
 * Invitation info banner
 */
export function InvitationBanner({ validationResult, shortCode }) {
  return (
    <div className="mb-6 rounded-2xl bg-emerald-50 border-2 border-emerald-200 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
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
            )}{' '}
            has invited you to connect on LiaiZen for easier co-parenting communication.
          </p>
          {shortCode && <p className="text-xs text-emerald-600 mt-2">✓ Verified invitation</p>}
        </div>
      </div>
    </div>
  );
}

/**
 * Signup form
 */
export function SignupForm({
  formEmail,
  displayName,
  formPassword,
  confirmPassword,
  agreeToTerms,
  formError,
  authError,
  isSigningUp,
  isGoogleLoggingIn,
  onEmailChange,
  onDisplayNameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onAgreeChange,
  onSubmit,
  onGoogleLogin,
  onNavigateToSignIn,
}) {
  return (
    <>
      {/* Form errors */}
      {(formError || authError) && (
        <div className="mb-4 rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-700">
          {formError || authError}
        </div>
      )}

      <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-teal-dark text-center mb-6">
        Create your account
      </h1>

      <form onSubmit={onSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          value={formEmail}
          onChange={onEmailChange}
          placeholder="you@example.com"
          required
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
        />

        <Input
          label="Your Name"
          type="text"
          value={displayName}
          onChange={onDisplayNameChange}
          placeholder="Enter your name"
          required
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
        />

        <Input
          label="Password"
          type="password"
          value={formPassword}
          onChange={onPasswordChange}
          placeholder="At least 10 characters"
          required
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
          helperText="Must be at least 10 characters"
        />

        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={onConfirmPasswordChange}
          placeholder="Re-enter your password"
          required
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
          error={confirmPassword && formPassword !== confirmPassword ? 'Passwords do not match' : ''}
        />

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="agree-terms"
            checked={agreeToTerms}
            onChange={e => onAgreeChange(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-gray-300 text-teal-medium focus:ring-teal-medium cursor-pointer"
          />
          <label htmlFor="agree-terms" className="text-sm text-gray-600 cursor-pointer">
            I agree to the{' '}
            <a href="/terms" target="_blank" className="text-teal-medium hover:text-teal-dark font-medium">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="text-teal-medium hover:text-teal-dark font-medium">
              Privacy Policy
            </a>
          </label>
        </div>

        <Button type="submit" fullWidth size="large" disabled={isSigningUp} loading={isSigningUp} className="mt-6">
          Create Account & Connect
        </Button>
      </form>

      <GoogleSignInButton
        onClick={onGoogleLogin}
        disabled={isSigningUp || isGoogleLoggingIn}
        loading={isGoogleLoggingIn}
      />

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToSignIn}
            className="text-teal-medium font-semibold hover:text-teal-dark transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </>
  );
}
