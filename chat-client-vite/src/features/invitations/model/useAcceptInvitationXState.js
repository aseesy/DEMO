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
import {
  invitationAcceptanceMachine,
  createInvitationAcceptanceContext,
} from './invitationAcceptanceMachine.js';
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
import { getInviteTokenFromUrl } from '../../../utils/inviteTokenParser';

/**
 * useAcceptInvitationXState hook
 */
export function useAcceptInvitationXState() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, code: shortCode } = getInviteTokenFromUrl(searchParams);
  
  // Log token read in dev mode
  if (import.meta.env.DEV) {
    console.log('[useAcceptInvitationXState] Token read:', {
      hasToken: !!token,
      hasCode: !!shortCode,
      tokenPreview: token ? `${token.substring(0, 8)}...` : null,
    });
  }

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
      const startTime = Date.now();
      
      if (!tokenParam && !shortCodeParam) {
        if (import.meta.env.DEV) {
          console.warn('[InviteAccept] Validation failed: No token or code provided');
        }
        return { valid: false, code: 'TOKEN_REQUIRED' };
      }
      
      if (import.meta.env.DEV) {
        console.log('[InviteAccept] Validating invitation:', {
          hasToken: !!tokenParam,
          hasCode: !!shortCodeParam,
        });
      }
      
      const result = await validateFromContext(tokenParam, shortCodeParam);
      
      const duration = Date.now() - startTime;
      if (import.meta.env.DEV) {
        console.log('[InviteAccept] Validation result:', {
          valid: result.valid,
          duration: `${duration}ms`,
          code: result.code,
        });
      }
      
      return result;
    },
    [validateFromContext]
  );

  const autoAcceptInvitationService = React.useCallback(
    async (tokenParam, shortCodeParam) => {
      const startTime = Date.now();
      
      if (import.meta.env.DEV) {
        console.log('[InviteAccept] Starting auto-accept:', {
          hasToken: !!tokenParam,
          hasCode: !!shortCodeParam,
        });
      }
      
      let result;
      if (shortCodeParam) {
        result = await acceptByCode(shortCodeParam);
      } else {
        result = await acceptInvitation(tokenParam);
      }
      
      const duration = Date.now() - startTime;
      if (import.meta.env.DEV) {
        console.log('[InviteAccept] Auto-accept result:', {
          success: result.success,
          duration: `${duration}ms`,
          code: result.code,
          pairingId: result.pairingId,
          roomId: result.roomId,
        });
      }
      
      return result;
    },
    [acceptByCode, acceptInvitation]
  );

  const submitSignupService = React.useCallback(
    async ({ firstName, lastName, formEmail, formPassword, tokenParam, shortCodeParam }) => {
      const startTime = Date.now();
      
      if (import.meta.env.DEV) {
        console.log('[InviteAccept] Starting signup with invite:', {
          hasToken: !!tokenParam,
          hasCode: !!shortCodeParam,
          email: formEmail,
        });
      }
      
      // Re-validate token before registration
      if (tokenParam || shortCodeParam) {
        if (import.meta.env.DEV) {
          console.log('[InviteAccept] Re-validating token before signup');
        }
        const revalidation = await validateFromContext(tokenParam, shortCodeParam);
        if (!revalidation.valid) {
          const errorInfo = revalidation.errorInfo || getErrorMessage({ code: revalidation.code });
          if (import.meta.env.DEV) {
            console.warn('[InviteAccept] Token validation failed:', revalidation.code);
          }
          throw new Error(errorInfo.userMessage);
        }
        if (import.meta.env.DEV) {
          console.log('[InviteAccept] Token validation passed');
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
        if (import.meta.env.DEV) {
          console.error('[InviteAccept] Signup failed:', errorInfo.userMessage);
        }
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

      const duration = Date.now() - startTime;
      if (import.meta.env.DEV) {
        console.log('[InviteAccept] Signup successful:', {
          duration: `${duration}ms`,
          userId: data.user?.id,
          pairingId: data.pairingId,
          roomId: data.roomId,
        });
      }

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
        },
      }),
    [
      validateInvitationService,
      autoAcceptInvitationService,
      submitSignupService,
      handleGoogleLoginService,
    ]
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

  // Log state transitions for debugging (dev only)
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      const stateValue =
        typeof state.value === 'object' ? JSON.stringify(state.value) : state.value;
      console.log(`[XState] State transition: ${stateValue}`, {
        context: {
          hasToken: !!state.context.token,
          hasShortCode: !!state.context.shortCode,
          isAuthenticated: state.context.isAuthenticated,
          validationResult: state.context.validationResult?.valid,
          formError: state.context.formError,
          autoAcceptError: state.context.autoAcceptError,
        },
      });
    }
  }, [state.value, state.context]);

  // Update machine when auth state changes - restart if needed for proper guard evaluation
  React.useEffect(() => {
    // If we're in validating state and auth state changed, the guard will evaluate correctly
    // For other states, we may need to restart or the guards use the current isAuthenticated value
    // XState v5 evaluates guards with current context at transition time
  }, [isAuthenticated]);

  // Handle success callback - redirect after acceptance
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

      // Determine redirect destination
      // TODO: If roomId/pairingId available, redirect to specific room/workspace
      // For now, redirect to home (dashboard)
      const redirectPath = NavigationPaths.HOME;
      
      if (import.meta.env.DEV) {
        console.log('[InviteAccept] Redirecting after success:', redirectPath);
      }

      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1500);
    }
  }, [state.value, state.context.successMessage, navigate, clearInvitationState]);

  // Derived state for compatibility with existing component
  const isLoading = state.value === 'validating' || isValidating || isCheckingAuth;
  // Ensure validationResult is always available, even when invalid
  const validationResult = state.context.validationResult || 
    (state.value === 'invalid' ? { valid: false, code: 'INVALID_TOKEN', error: state.context.inviteError || 'Invalid invitation' } : null);

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
    firstName: state.context.firstName,
    lastName: state.context.lastName,
    formEmail: state.context.formEmail,
    formPassword: state.context.formPassword,
    confirmPassword: state.context.confirmPassword,
    agreeToTerms: state.context.agreeToTerms,
    formError: state.context.formError,

    // Form setters
    setFirstName: React.useCallback(
      value => send({ type: 'UPDATE_FIELD', field: 'firstName', value }),
      [send]
    ),
    setLastName: React.useCallback(
      value => send({ type: 'UPDATE_FIELD', field: 'lastName', value }),
      [send]
    ),
    setFormEmail: React.useCallback(
      value => send({ type: 'UPDATE_FIELD', field: 'formEmail', value }),
      [send]
    ),
    setFormPassword: React.useCallback(
      value => send({ type: 'UPDATE_FIELD', field: 'formPassword', value }),
      [send]
    ),
    setConfirmPassword: React.useCallback(
      value => send({ type: 'UPDATE_FIELD', field: 'confirmPassword', value }),
      [send]
    ),
    setAgreeToTerms: React.useCallback(
      value => send({ type: 'UPDATE_FIELD', field: 'agreeToTerms', value }),
      [send]
    ),

    // Confirmation state
    confirmedInviter: state.context.confirmedInviter,
    setConfirmedInviter: React.useCallback(() => {
      send({ type: 'CONFIRM_INVITER' });
    }, [send]),

    // Auto-accept state
    isAutoAccepting: state.value === 'authenticated',
    autoAcceptError: state.context.autoAcceptError,
    successMessage: state.context.successMessage,

    // Handlers
    handleSubmit: React.useCallback(
      e => {
        e?.preventDefault();
        
        // Validate form before submitting
        const { firstName, lastName, formEmail, formPassword, confirmPassword, agreeToTerms } = state.context;
        
        if (!firstName?.trim()) {
          send({ type: 'UPDATE_FIELD', field: 'formError', value: 'Please enter your first name' });
          return;
        }
        if (!lastName?.trim()) {
          send({ type: 'UPDATE_FIELD', field: 'formError', value: 'Please enter your last name' });
          return;
        }
        if (!formEmail?.trim()) {
          send({ type: 'UPDATE_FIELD', field: 'formError', value: 'Please enter your email' });
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formEmail.trim().toLowerCase())) {
          send({ type: 'UPDATE_FIELD', field: 'formError', value: 'Please enter a valid email address' });
          return;
        }
        if (!formPassword || formPassword.length < 10) {
          send({ type: 'UPDATE_FIELD', field: 'formError', value: 'Password must be at least 10 characters' });
          return;
        }
        if (formPassword !== confirmPassword) {
          send({ type: 'UPDATE_FIELD', field: 'formError', value: 'Passwords do not match' });
          return;
        }
        if (!agreeToTerms) {
          send({ type: 'UPDATE_FIELD', field: 'formError', value: 'Please agree to the Terms of Service and Privacy Policy' });
          return;
        }
        
        // Clear any previous errors and submit
        send({ type: 'UPDATE_FIELD', field: 'formError', value: null });
        send({ type: 'SUBMIT' });
      },
      [send, state.context]
    ),
    handleGoogleLogin: React.useCallback(() => {
      send({ type: 'GOOGLE_LOGIN' });
    }, [send]),
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
