/**
 * Invitation Acceptance State Machine
 *
 * XState machine for managing the invitation acceptance workflow.
 * Eliminates impossible states and makes the flow provable.
 *
 * States:
 * - validating: Validating token/code
 * - invalid: Invalid or expired invitation
 * - confirmingInviter: User needs to confirm inviter (short code flow)
 * - authenticated: User is logged in, auto-accepting
 * - signup: Showing signup form for new user
 *   - editing: User is filling out the form
 *   - submitting: Form is being submitted
 * - googleAuth: Processing Google OAuth
 * - success: Invitation accepted successfully
 * - error: Error occurred during acceptance
 */

import { setup, assign, fromPromise } from 'xstate';

/**
 * Context shape for the invitation acceptance machine
 */
export const createInvitationAcceptanceContext = (initial = {}) => ({
  // URL params
  token: initial.token ?? null,
  shortCode: initial.shortCode ?? null,

  // Validation result
  validationResult: null,
  inviteError: null,

  // Form data
  firstName: '',
  lastName: '',
  formEmail: '',
  formPassword: '',
  confirmPassword: '',
  agreeToTerms: false,
  formError: null,

  // Confirmation state
  confirmedInviter: false,

  // Results
  successMessage: null,
  autoAcceptError: null,
  authError: null,

  // External state (not part of machine context, but needed for guards)
  isAuthenticated: initial.isAuthenticated ?? false,
});

/**
 * Invitation Acceptance State Machine (XState v5)
 *
 * @typedef {ReturnType<typeof createInvitationAcceptanceContext>} Context
 * @typedef {(
 *   | { type: 'CONFIRM_INVITER' }
 *   | { type: 'REJECT_INVITER' }
 *   | { type: 'UPDATE_FIELD'; field: string; value: any }
 *   | { type: 'SUBMIT' }
 *   | { type: 'GOOGLE_LOGIN' }
 *   | { type: 'RETRY' }
 *   | { type: 'GO_TO_SIGNUP' }
 * )} Events
 */
export const invitationAcceptanceMachine = setup({
  types: {
    // JSDoc types defined above - XState v5 will infer from usage
    context: {},
    events: {},
  },
  guards: {
    hasShortCodeAndNotConfirmed: ({ context, event }) => {
      // Check event output since guards run before actions set context
      const result = event.output || event;
      return context.shortCode && result?.valid === true && !context.confirmedInviter;
    },
    isAuthenticated: ({ context }) => {
      // Check if authenticated from context (set from input)
      return context.isAuthenticated === true;
    },
    isValidInvitation: ({ event }) => {
      // Check event output since guards run before actions set context
      const result = event.output || event;
      return result?.valid === true;
    },
    isFormValid: ({ context }) => {
      const { firstName, lastName, formEmail, formPassword, confirmPassword, agreeToTerms } =
        context;

      if (!firstName?.trim()) return false;
      if (!lastName?.trim()) return false;
      if (!formEmail?.trim()) return false;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formEmail.trim().toLowerCase())) return false;

      if (!formPassword || formPassword.length < 10) return false;
      if (formPassword !== confirmPassword) return false;
      if (!agreeToTerms) return false;

      return true;
    },
    isAlreadyConnected: ({ event }) => {
      return event.output?.code === 'ALREADY_CONNECTED';
    },
    isCoparentLimit: ({ event }) => {
      return event.output?.code === 'COPARENT_LIMIT' || event.output?.error?.includes('limit');
    },
  },
  actors: {
    validateInvitation: fromPromise(async ({ input }) => {
      // Service will be provided via machine.provide()
      // For now, return a placeholder that will be overridden
      throw new Error('validateInvitation service not provided');
    }),
    autoAcceptInvitation: fromPromise(async ({ input }) => {
      // This will be provided by machine options
      if (input.shortCode) {
        return input.acceptByCode(input.shortCode);
      }
      return input.acceptInvitation(input.token);
    }),
    submitSignupWithInvite: fromPromise(async ({ input }) => {
      // This will be provided by machine options
      return input.submitSignup(input);
    }),
    handleGoogleLogin: fromPromise(async ({ input }) => {
      // This will be provided by machine options
      return input.handleGoogleLogin();
    }),
  },
}).createMachine({
  id: 'invitationAcceptance',
  initial: 'validating',
  context: ({ input }) => createInvitationAcceptanceContext(input),

  states: {
    validating: {
      entry: assign({
        formError: null,
        autoAcceptError: null,
        authError: null,
        inviteError: null,
      }),
      invoke: {
        src: 'validateInvitation',
        input: ({ context }) => ({
          token: context.token,
          shortCode: context.shortCode,
        }),
        onDone: [
          {
            target: 'confirmingInviter',
            guard: 'hasShortCodeAndNotConfirmed',
            actions: assign({
              validationResult: ({ event }) => event.output,
            }),
          },
          {
            target: 'authenticated',
            guard: 'isAuthenticated',
            actions: assign({
              validationResult: ({ event }) => event.output,
            }),
          },
          {
            target: 'signup',
            guard: 'isValidInvitation',
            actions: assign({
              validationResult: ({ event }) => event.output,
            }),
          },
          {
            target: 'invalid',
            actions: [
              assign({
                validationResult: ({ event }) => event.output,
                inviteError: ({ event }) => {
                  const result = event.output;
                  return result?.error || 'Invalid invitation';
                },
              }),
            ],
          },
        ],
        onError: {
          target: 'invalid',
          actions: assign({
            inviteError: ({ event }) => event.error?.message || 'Validation failed',
          }),
        },
      },
    },

    invalid: {
      type: 'final',
    },

    confirmingInviter: {
      on: {
        CONFIRM_INVITER: {
          target: 'signup',
          actions: assign({
            confirmedInviter: true,
          }),
        },
        REJECT_INVITER: {
          target: 'invalid',
        },
      },
    },

    authenticated: {
      entry: assign({
        formError: null,
        autoAcceptError: null,
        authError: null,
        inviteError: null,
      }),
      invoke: {
        src: 'autoAcceptInvitation',
        input: ({ context }) => ({
          token: context.token,
          shortCode: context.shortCode,
          acceptInvitation: context.acceptInvitation,
          acceptByCode: context.acceptByCode,
        }),
        onDone: [
          {
            target: 'success',
            guard: 'isAlreadyConnected',
            actions: [
              assign({
                successMessage: () => 'You are already connected with this co-parent!',
              }),
            ],
          },
          {
            target: 'success',
            actions: [
              assign({
                successMessage: () => 'Connected with your co-parent! Redirecting...',
              }),
            ],
          },
        ],
        onError: [
          {
            target: 'error',
            guard: 'isCoparentLimit',
            actions: assign({
              autoAcceptError: ({ event }) =>
                'You already have a co-parent connection. Please manage your existing connection first.',
            }),
          },
          {
            target: 'error',
            actions: assign({
              autoAcceptError: ({ event }) => event.error?.message || 'Failed to accept invitation',
            }),
          },
        ],
      },
    },

    signup: {
      initial: 'editing',
      states: {
        editing: {
          on: {
            UPDATE_FIELD: {
              actions: assign({
                firstName: ({ context, event }) =>
                  event.field === 'firstName' ? event.value : context.firstName,
                lastName: ({ context, event }) =>
                  event.field === 'lastName' ? event.value : context.lastName,
                formEmail: ({ context, event }) =>
                  event.field === 'formEmail' ? event.value : context.formEmail,
                formPassword: ({ context, event }) =>
                  event.field === 'formPassword' ? event.value : context.formPassword,
                confirmPassword: ({ context, event }) =>
                  event.field === 'confirmPassword' ? event.value : context.confirmPassword,
                agreeToTerms: ({ context, event }) =>
                  event.field === 'agreeToTerms' ? event.value : context.agreeToTerms,
              }),
            },
            SUBMIT: {
              target: 'submitting',
              guard: 'isFormValid',
              actions: assign({
                formError: null,
              }),
            },
            GOOGLE_LOGIN: {
              target: '#invitationAcceptance.googleAuth',
            },
          },
        },
        submitting: {
          entry: assign({
            formError: null,
          }),
          invoke: {
            src: 'submitSignupWithInvite',
            input: ({ context }) => ({
              firstName: context.firstName,
              lastName: context.lastName,
              formEmail: context.formEmail,
              formPassword: context.formPassword,
              token: context.token,
              shortCode: context.shortCode,
              submitSignup: context.submitSignup,
            }),
            onDone: {
              target: '#invitationAcceptance.success',
              actions: [
                assign({
                  successMessage: () =>
                    'Account created and connected! Redirecting to your dashboard...',
                }),
              ],
            },
            onError: {
              target: 'editing',
              actions: assign({
                formError: ({ event }) => event.error?.message || 'Failed to create account',
              }),
            },
          },
        },
      },
    },

    googleAuth: {
      invoke: {
        src: 'handleGoogleLogin',
        input: ({ context }) => ({
          handleGoogleLogin: context.handleGoogleLogin,
        }),
        onDone: {
          target: 'authenticated',
        },
        onError: {
          target: 'signup',
          actions: assign({
            authError: ({ event }) => event.error?.message || 'Authentication failed',
          }),
        },
      },
    },

    success: {
      type: 'final',
      entry: ({ context }) => {
        if (context.onSuccess) {
          context.onSuccess();
        }
      },
    },

    error: {
      on: {
        RETRY: {
          target: 'validating',
        },
        GO_TO_SIGNUP: {
          target: 'signup',
        },
      },
    },
  },
});
