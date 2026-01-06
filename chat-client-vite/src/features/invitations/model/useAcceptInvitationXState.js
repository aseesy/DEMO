/**
 * useAcceptInvitationXState - XState-based hook for accepting co-parent invitations
 *
 * Uses XState machine to manage complex invitation acceptance workflow.
 * Eliminates impossible states and makes the flow provable.
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMachine } from '@xstate/react';
import { fromPromise } from 'xstate';
import { invitationAcceptanceMachine, createInvitationAcceptanceContext } from './invitationAcceptanceMachine.js';
import { useAuth } from '../../auth';
import { useInvitations } from './useInvitations.js';
import { useInvitationContext } from '../../../context/InvitationContext.jsx';
import { apiPost } from '../../../apiClient.js';
import {
  getErrorMessage,
  logError,
  retryWithBackoff,
  isRetryableError,
} from '../../../utils/errorHandler.jsx';
import { storage, StorageKeys, authStorage } from '../../../adapters/storage';
import { NavigationPaths } from '../../../adapters/navigation';

/**
 * useAcceptInvitationXState hook
 */
export function useAcceptInvitationXState() {
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
    handleGoogleLogin: authHandleGoogleLogin,
    isSigningUp,
    isGoogleLoggingIn,
    error: authError,
  } = useAuth();

  const { acceptInvitation, acceptByCode, isValidating, error: inviteError } = useInvitations();

  const { validateInvitation: validateFromContext, clearInvitationState } = useInvitationContext();

  // Create services for the machine
  const validateInvitationService = React.useCallback(
    async (tokenParam, shortCodeParam) => {
      if (!tokenParam && !shortCodeParam) {
        return { valid: false, code: 'TOKEN_REQUIRED' };
      }
      return await validateFromContext(tokenParam, shortCodeParam);
    },
    [validateFromContext]
  );

  const autoAcceptInvitationService = React.useCallback(
    async (tokenParam, shortCodeParam) => {
      if (shortCodeParam) {
        return await acceptByCode(shortCodeParam);
      }
      return await acceptInvitation(tokenParam);
    },
    [acceptByCode, acceptInvitation]
  );

  const submitSignupService = React.useCallback(
    async ({ firstName, lastName, formEmail, formPassword, tokenParam, shortCodeParam }) => {
      // Re-validate token before registration
      if (tokenParam || shortCodeParam) {
        const revalidation = await validateFromContext(tokenParam, shortCodeParam);
        if (!revalidation.valid) {
          const errorInfo = revalidation.errorInfo || getErrorMessage({ code: revalidation.code });
          throw new Error(errorInfo.userMessage);
        }
      }

      const response = await retryWithBackoff(
        () =>
          apiPost('/api/auth/register-with-invite', {
            email: formEmail.trim().toLowerCase(),
            password: formPassword,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            inviteToken: tokenParam,
            inviteCode: shortCodeParam,
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
        throw new Error(errorInfo.userMessage);
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

      return { success: true, data };
    },
    [validateFromContext]
  );

  const handleGoogleLoginService = React.useCallback(async () => {
    await authHandleGoogleLogin();
  }, [authHandleGoogleLogin]);

  // Initialize machine with current auth state
  const machineWithServices = React.useMemo(
    () =>
      invitationAcceptanceMachine.provide({
      actors: {
        validateInvitation: fromPromise(async ({ input }) => {
          return validateInvitationService(input.token, input.shortCode);
        }),
        autoAcceptInvitation: fromPromise(async ({ input }) => {
          return autoAcceptInvitationService(input.token, input.shortCode);
        }),
        submitSignupWithInvite: fromPromise(async ({ input }) => {
          return submitSignupService({
            firstName: input.firstName,
            lastName: input.lastName,
            formEmail: input.formEmail,
            formPassword: input.formPassword,
            tokenParam: input.token,
            shortCodeParam: input.shortCode,
          });
        }),
        handleGoogleLogin: fromPromise(async () => {
          return handleGoogleLoginService();
        }),
      }),
    [validateInvitationService, autoAcceptInvitationService, submitSignupService, handleGoogleLoginService]
  );

  const [state, send, actor] = useMachine(machineWithServices, {
    input: {
      token,
      shortCode,
      isAuthenticated, // Passed to context, used by guards
      validateInvitation: validateInvitationService,
      acceptInvitation,
      acceptByCode,
      submitSignup: submitSignupService,
      handleGoogleLogin: handleGoogleLoginService,
      onSuccess: () => {
        storage.remove(StorageKeys.PENDING_INVITE_CODE);
        clearInvitationState();
        setTimeout(() => {
          navigate(NavigationPaths.HOME, { replace: true });
        }, 1500);
      },
    },
  });

  // Update machine when auth state changes - restart if needed for proper guard evaluation
  React.useEffect(() => {
    // If we're in validating state and auth state changed, the guard will evaluate correctly
    // For other states, we may need to restart or the guards use the current isAuthenticated value
    // XState v5 evaluates guards with current context at transition time
  }, [isAuthenticated]);

  // Handle success callback
  React.useEffect(() => {
    if (state.value === 'success' && state.context.successMessage) {
      storage.remove(StorageKeys.PENDING_INVITE_CODE);
      clearInvitationState();

      // Dispatch coparent joined event if needed
      if (state.context.validationResult?.invitation) {
        window.dispatchEvent(
          new CustomEvent('coparent-joined', {
            detail: {
              invitationId: state.context.validationResult.invitation.id,
            },
          })
        );
      }

      setTimeout(() => {
        navigate(NavigationPaths.HOME, { replace: true });
      }, 1500);
    }
  }, [state.value, state.context.successMessage, navigate, clearInvitationState]);

  // Derived state for compatibility with existing component
  const isLoading = state.value === 'validating' || isValidating || isCheckingAuth;
  const validationResult = state.context.validationResult;

  return {
    // Machine state
    state,
    send,

    // URL params
    token,
    shortCode,

    // Validation
    validationResult,
    hasValidated: state.value !== 'validating',
    isValidating,
    inviteError: state.context.inviteError || inviteError,

    // Auth state
    isAuthenticated,
    isCheckingAuth,
    authError: state.context.authError || authError,
    isSigningUp,
    isGoogleLoggingIn,

    // Form state
    displayName: state.context.firstName, // Alias for compatibility
    formEmail: state.context.formEmail,
    formPassword: state.context.formPassword,
    confirmPassword: state.context.confirmPassword,
    agreeToTerms: state.context.agreeToTerms,
    formError: state.context.formError,

    // Form setters
    setDisplayName: (value) => send({ type: 'UPDATE_FIELD', field: 'firstName', value }),
    setFormEmail: (value) => send({ type: 'UPDATE_FIELD', field: 'formEmail', value }),
    setFormPassword: (value) => send({ type: 'UPDATE_FIELD', field: 'formPassword', value }),
    setConfirmPassword: (value) => send({ type: 'UPDATE_FIELD', field: 'confirmPassword', value }),
    setAgreeToTerms: (value) => send({ type: 'UPDATE_FIELD', field: 'agreeToTerms', value }),

    // Confirmation state
    confirmedInviter: state.context.confirmedInviter,
    setConfirmedInviter: () => send({ type: 'CONFIRM_INVITER' }),

    // Auto-accept state
    isAutoAccepting: state.value === 'authenticated',
    autoAcceptError: state.context.autoAcceptError,
    successMessage: state.context.successMessage,

    // Handlers
    handleSubmit: (e) => {
      e?.preventDefault();
      send({ type: 'SUBMIT' });
    },
    handleGoogleLogin: () => send({ type: 'GOOGLE_LOGIN' }),
    handleNavigateToSignIn: React.useCallback(() => {
      const inviteKey = token || shortCode;
      const paramName = shortCode ? 'code' : 'invite';
      navigate(NavigationPaths.withQuery(NavigationPaths.SIGN_IN, { [paramName]: inviteKey }));
    }, [token, shortCode, navigate]),
    handleNavigateHome: React.useCallback(() => {
      navigate(NavigationPaths.HOME);
    }, [navigate]),
    handleNavigateSignIn: React.useCallback(() => {
      navigate(NavigationPaths.SIGN_IN);
    }, [navigate]),

    // Loading states
    isLoading,
  };
}

export default useAcceptInvitationXState;

