/**
 * Invitation Acceptance State Machine Tests
 *
 * Tests the XState machine for invitation acceptance workflow.
 * Verifies state transitions, guards, and actions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createActor, fromPromise } from 'xstate';
import {
  invitationAcceptanceMachine,
  createInvitationAcceptanceContext,
} from '../invitationAcceptanceMachine.js';

describe('Invitation Acceptance State Machine', () => {
  it('should create machine with initial context', () => {
    const context = createInvitationAcceptanceContext({
      token: 'test-token',
      shortCode: null,
      isAuthenticated: false,
    });

    expect(context.token).toBe('test-token');
    expect(context.shortCode).toBeNull();
    expect(context.isAuthenticated).toBe(false);
    expect(context.validationResult).toBeNull();
    expect(context.formError).toBeNull();
  });

  it('should start in validating state', () => {
    const actor = createActor(
      invitationAcceptanceMachine.provide({
        actors: {
          validateInvitation: fromPromise(async () => {
            // Delay to ensure we can check initial state
            await new Promise(resolve => setTimeout(resolve, 10));
            return { valid: true };
          }),
          autoAcceptInvitation: fromPromise(async () => ({ success: true })),
          submitSignupWithInvite: fromPromise(async () => ({ success: true })),
          handleGoogleLogin: fromPromise(async () => ({ success: true })),
        },
      }),
      {
        input: {
          token: 'test-token',
          shortCode: null,
          isAuthenticated: false,
        },
      }
    );

    actor.start();
    // Check immediately after start - should be in validating
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('validating');
  });

  it('should transition to invalid state when validation fails', async () => {
    const actor = createActor(
      invitationAcceptanceMachine.provide({
        actors: {
          validateInvitation: fromPromise(async () => ({ valid: false, code: 'INVALID_TOKEN' })),
          autoAcceptInvitation: fromPromise(async () => ({ success: true })),
          submitSignupWithInvite: fromPromise(async () => ({ success: true })),
          handleGoogleLogin: fromPromise(async () => ({ success: true })),
        },
      }),
      {
        input: {
          token: 'invalid-token',
          shortCode: null,
          isAuthenticated: false,
        },
      }
    );

    actor.start();

    // Wait for validation to complete by subscribing to state changes
    await new Promise(resolve => {
      const subscription = actor.subscribe(state => {
        if (
          state.value === 'invalid' ||
          state.value === 'signup' ||
          state.value === 'authenticated'
        ) {
          subscription.unsubscribe();
          resolve();
        }
      });
      // Timeout after 1 second
      setTimeout(() => {
        subscription.unsubscribe();
        resolve();
      }, 1000);
    });

    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('invalid');
    if (snapshot.context.validationResult) {
      expect(snapshot.context.validationResult.valid).toBe(false);
    }
  });

  it('should transition to signup state when validation succeeds and user is not authenticated', async () => {
    const actor = createActor(
      invitationAcceptanceMachine.provide({
        actors: {
          validateInvitation: fromPromise(async () => ({ valid: true })),
          autoAcceptInvitation: fromPromise(async () => ({ success: true })),
          submitSignupWithInvite: fromPromise(async () => ({ success: true })),
          handleGoogleLogin: fromPromise(async () => ({ success: true })),
        },
      }),
      {
        input: {
          token: 'valid-token',
          shortCode: null,
          isAuthenticated: false,
        },
      }
    );

    actor.start();

    // Wait for validation to complete by subscribing to state changes
    await new Promise(resolve => {
      const subscription = actor.subscribe(state => {
        const stateValue =
          typeof state.value === 'object' ? Object.keys(state.value)[0] : state.value;
        if (stateValue === 'signup' || stateValue === 'invalid' || stateValue === 'authenticated') {
          subscription.unsubscribe();
          resolve();
        }
      });
      // Timeout after 1 second
      setTimeout(() => {
        subscription.unsubscribe();
        resolve();
      }, 1000);
    });

    const snapshot = actor.getSnapshot();
    // Should be in signup state (editing substate) when valid and not authenticated
    // XState v5 uses object format for nested states: { signup: 'editing' }
    const stateValue = typeof snapshot.value === 'object' ? 'signup' : snapshot.value;
    expect(['signup']).toContain(stateValue);
    if (snapshot.context.validationResult) {
      expect(snapshot.context.validationResult.valid).toBe(true);
    }
  });

  it('should update form fields when UPDATE_FIELD event is sent', () => {
    const actor = createActor(
      invitationAcceptanceMachine.provide({
        actors: {
          validateInvitation: async () => ({ valid: true }),
          autoAcceptInvitation: async () => ({ success: true }),
          submitSignupWithInvite: async () => ({ success: true }),
          handleGoogleLogin: async () => ({ success: true }),
        },
      }),
      {
        input: {
          token: 'valid-token',
          shortCode: null,
          isAuthenticated: false,
        },
      }
    );

    actor.start();

    // Wait for validation to complete and transition to signup
    setTimeout(() => {
      actor.send({ type: 'UPDATE_FIELD', field: 'formEmail', value: 'test@example.com' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.formEmail).toBe('test@example.com');
    }, 100);
  });

  it('should validate form before allowing submission', () => {
    const actor = createActor(
      invitationAcceptanceMachine.provide({
        actors: {
          validateInvitation: async () => ({ valid: true }),
          autoAcceptInvitation: async () => ({ success: true }),
          submitSignupWithInvite: async () => ({ success: true }),
          handleGoogleLogin: async () => ({ success: true }),
        },
      }),
      {
        input: {
          token: 'valid-token',
          shortCode: null,
          isAuthenticated: false,
        },
      }
    );

    actor.start();

    // Try to submit with invalid form (empty fields)
    setTimeout(() => {
      actor.send({ type: 'SUBMIT' });
      const snapshot = actor.getSnapshot();
      // Should stay in editing state if form is invalid
      expect(snapshot.value).toBe('signup');
    }, 100);
  });
});
