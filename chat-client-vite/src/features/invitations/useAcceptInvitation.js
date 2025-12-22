/**
 * useAcceptInvitation - Hook for accepting co-parent invitations
 *
 * Handles:
 * - Token/code validation
 * - Auto-accept for logged-in users
 * - Signup form state
 * - Registration with invite
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useInvitations } from './useInvitations.js';
import { useInvitationContext } from '../../context/InvitationContext.jsx';
import { apiPost } from '../../apiClient.js';
import {
  getErrorMessage,
  logError,
  retryWithBackoff,
  isRetryableError,
} from '../../utils/errorHandler.jsx';
import { storage, StorageKeys, authStorage } from '../../adapters/storage';
import { NavigationPaths } from '../../adapters/navigation';

/**
 * Validate signup form fields
 */
export function validateSignupForm({
  displayName,
  formEmail,
  formPassword,
  confirmPassword,
  agreeToTerms,
}) {
  if (!displayName?.trim()) {
    return { valid: false, error: 'Please enter your name' };
  }

  if (!formEmail?.trim()) {
    return { valid: false, error: 'Please enter your email' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formEmail.trim().toLowerCase())) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  if (!formPassword || formPassword.length < 10) {
    return { valid: false, error: 'Password must be at least 10 characters' };
  }

  if (formPassword !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }

  if (!agreeToTerms) {
    return { valid: false, error: 'Please agree to the Terms of Service and Privacy Policy' };
  }

  return { valid: true, error: null };
}

/**
 * useAcceptInvitation hook
 */
export function useAcceptInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const shortCode = searchParams.get('code');

  const {
    isAuthenticated,
    isCheckingAuth,
    setEmail,
    setPassword,
    setUsername,
    handleGoogleLogin,
    isSigningUp,
    isGoogleLoggingIn,
    error: authError,
  } = useAuth();

  const { acceptInvitation, acceptByCode, isValidating, error: inviteError } = useInvitations();

  const { validateInvitation: validateFromContext, clearInvitationState } = useInvitationContext();

  // Validation state
  const [validationResult, setValidationResult] = React.useState(null);
  const [hasValidated, setHasValidated] = React.useState(false);

  // Form state
  const [displayName, setDisplayName] = React.useState('');
  const [formPassword, setFormPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [formEmail, setFormEmail] = React.useState('');
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);
  const [formError, setFormError] = React.useState('');

  // Short code confirmation
  const [confirmedInviter, setConfirmedInviter] = React.useState(false);

  // Auto-accept state
  const [isAutoAccepting, setIsAutoAccepting] = React.useState(false);
  const [autoAcceptError, setAutoAcceptError] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  // Clear form on mount
  React.useEffect(() => {
    setFormEmail('');
    setFormPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setAgreeToTerms(false);
    setFormError('');
  }, []);

  // Validate token/code on mount
  React.useEffect(() => {
    const inviteKey = token || shortCode;
    if (!inviteKey) {
      setValidationResult({ valid: false, code: 'TOKEN_REQUIRED' });
      setHasValidated(true);
      return;
    }

    const validate = async () => {
      const result = await validateFromContext(token, shortCode);
      setValidationResult(result);
      setHasValidated(true);
    };

    validate();
  }, [token, shortCode, validateFromContext]);

  // Auto-accept for logged-in users
  React.useEffect(() => {
    if (!hasValidated || isCheckingAuth || !validationResult?.valid) return;
    if (!isAuthenticated) return;
    if (isAutoAccepting || successMessage) return;

    const autoAccept = async () => {
      setIsAutoAccepting(true);
      setAutoAcceptError('');

      try {
        let result;
        if (shortCode) {
          result = await acceptByCode(shortCode);
        } else {
          result = await acceptInvitation(token);
        }

        if (!result.success) {
          if (result.code === 'ALREADY_CONNECTED') {
            setSuccessMessage('You are already connected with this co-parent!');
            setTimeout(() => navigate(NavigationPaths.HOME, { replace: true }), 1500);
            return;
          }

          if (result.code === 'COPARENT_LIMIT' || result.error?.includes('limit')) {
            setAutoAcceptError(
              'You already have a co-parent connection. Please manage your existing connection first.'
            );
            return;
          }

          setAutoAcceptError(result.error || 'Failed to accept invitation');
          return;
        }

        storage.remove(StorageKeys.PENDING_INVITE_CODE);
        clearInvitationState();

        setSuccessMessage('Connected with your co-parent! Redirecting...');

        window.dispatchEvent(
          new CustomEvent('coparent-joined', {
            detail: {
              coparentId: result?.coParent?.id,
              coparentName: result?.coParent?.name,
            },
          })
        );

        setTimeout(() => navigate(NavigationPaths.HOME, { replace: true }), 1500);
      } catch (err) {
        const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: 'accept_invitation' });
        logError(err, {
          endpoint: 'accept_invitation',
          operation: 'auto_accept',
          token: token || shortCode,
        });
        setAutoAcceptError(errorInfo.userMessage);
      } finally {
        setIsAutoAccepting(false);
      }
    };

    autoAccept();
  }, [
    hasValidated,
    isCheckingAuth,
    isAuthenticated,
    validationResult,
    token,
    shortCode,
    isAutoAccepting,
    successMessage,
    navigate,
    acceptByCode,
    acceptInvitation,
    clearInvitationState,
  ]);

  // Handle signup form submission
  const handleSubmit = React.useCallback(
    async e => {
      e.preventDefault();
      setFormError('');

      const validation = validateSignupForm({
        displayName,
        formEmail,
        formPassword,
        confirmPassword,
        agreeToTerms,
      });

      if (!validation.valid) {
        setFormError(validation.error);
        return;
      }

      setEmail(formEmail.trim().toLowerCase());
      setPassword(formPassword);
      setUsername(displayName.trim());

      // Re-validate token before registration
      if (token || shortCode) {
        const revalidation = await validateFromContext(token, shortCode);
        if (!revalidation.valid) {
          const errorInfo = revalidation.errorInfo || getErrorMessage({ code: revalidation.code });
          setFormError(errorInfo.userMessage);
          return;
        }
      }

      try {
        const response = await retryWithBackoff(
          () =>
            apiPost('/api/auth/register-with-invite', {
              email: formEmail.trim().toLowerCase(),
              password: formPassword,
              displayName: displayName.trim(),
              inviteToken: token,
              inviteCode: shortCode,
            }),
          {
            maxRetries: 3,
            shouldRetry: (error, statusCode) => {
              if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
                return false;
              }
              return isRetryableError(error, statusCode);
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          const errorInfo = getErrorMessage(data, {
            statusCode: response.status,
            endpoint: '/api/auth/register-with-invite',
          });
          logError(data, {
            endpoint: '/api/auth/register-with-invite',
            operation: 'register_from_invite',
            email: formEmail,
          });
          setFormError(errorInfo.userMessage);
          return;
        }

        // Store auth data
        if (data.token) {
          authStorage.setToken(data.token);
        }
        if (data.user) {
          storage.set(StorageKeys.CHAT_USER, data.user);
          authStorage.setUsername(data.user.username || data.user.displayName);
          storage.set(StorageKeys.USER_EMAIL, data.user.email);
        }
        authStorage.setAuthenticated(true);

        storage.remove(StorageKeys.PENDING_INVITE_CODE);
        clearInvitationState();

        setSuccessMessage('Account created and connected! Redirecting to your dashboard...');

        setTimeout(() => {
          navigate(NavigationPaths.HOME, { replace: true });
        }, 1500);
      } catch (err) {
        const errorInfo = getErrorMessage(err, {
          statusCode: 0,
          endpoint: '/api/auth/register-with-invite',
        });
        logError(err, {
          endpoint: '/api/auth/register-with-invite',
          operation: 'register_from_invite',
          email: formEmail,
        });
        setFormError(errorInfo.userMessage);
      }
    },
    [
      displayName,
      formEmail,
      formPassword,
      confirmPassword,
      agreeToTerms,
      token,
      shortCode,
      setEmail,
      setPassword,
      setUsername,
      validateFromContext,
      clearInvitationState,
      navigate,
    ]
  );

  // Navigate to sign in with invite key
  const handleNavigateToSignIn = React.useCallback(() => {
    const inviteKey = token || shortCode;
    const paramName = shortCode ? 'code' : 'invite';
    navigate(NavigationPaths.withQuery(NavigationPaths.SIGN_IN, { [paramName]: inviteKey }));
  }, [token, shortCode, navigate]);

  const handleNavigateHome = React.useCallback(() => {
    navigate(NavigationPaths.HOME);
  }, [navigate]);

  const handleNavigateSignIn = React.useCallback(() => {
    navigate(NavigationPaths.SIGN_IN);
  }, [navigate]);

  return {
    // URL params
    token,
    shortCode,

    // Validation
    validationResult,
    hasValidated,
    isValidating,
    inviteError,

    // Auth state
    isAuthenticated,
    isCheckingAuth,
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
    isLoading: !hasValidated || isValidating || isCheckingAuth,
  };
}

export default useAcceptInvitation;
