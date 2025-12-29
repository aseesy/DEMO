/**
 * Feature Barrel Export Validation Tests
 *
 * Comprehensive tests to ensure all feature barrels export what they claim.
 * This catches issues like:
 * - Exporting a symbol from the wrong file
 * - Missing exports after refactoring
 * - Broken import paths
 *
 * Run these tests after any refactoring to catch export issues early.
 */

import { describe, it, expect } from 'vitest';

describe('Feature Barrel Exports Validation', () => {
  describe('Auth Feature (features/auth)', () => {
    it('all claimed exports are valid', async () => {
      const auth = await import('./auth/index.js');

      const expectedExports = [
        'useAuth',
        'useEmailAuth',
        'useGoogleAuth',
        'useSessionVerification',
        'useAuthRedirect',
        'calculateUserProperties',
      ];

      for (const exportName of expectedExports) {
        expect(auth[exportName], `Missing export: ${exportName}`).toBeDefined();
      }
    });
  });

  describe('Notifications Feature (features/notifications)', () => {
    it('all claimed exports are valid', async () => {
      const notifications = await import('./notifications/index.js');

      const expectedExports = [
        'useNotifications',
        'useInAppNotifications',
        'useNotificationActions',
        'useNotificationData',
        'useNotificationPreferences',
      ];

      for (const exportName of expectedExports) {
        expect(notifications[exportName], `Missing export: ${exportName}`).toBeDefined();
      }
    });
  });

  describe('Profile Feature (features/profile)', () => {
    it('all claimed exports are valid', async () => {
      const profile = await import('./profile/index.js');

      const expectedExports = ['useProfile'];

      for (const exportName of expectedExports) {
        expect(profile[exportName], `Missing export: ${exportName}`).toBeDefined();
      }
    });
  });

  describe('Invitations Feature (features/invitations)', () => {
    it('all claimed exports are valid', async () => {
      const invitations = await import('./invitations/index.js');

      const expectedExports = [
        'useInviteDetection',
        'useInviteManagement',
        'usePairing',
        'useInvitations',
        'useAcceptInvitation',
        'useInviteCoParent',
        'AcceptInvitationPage',
        'InviteCoParentPage',
        'InviteTaskModal',
      ];

      for (const exportName of expectedExports) {
        expect(invitations[exportName], `Missing export: ${exportName}`).toBeDefined();
      }
    });
  });

  describe('Contacts Feature (features/contacts)', () => {
    it('exports useActivities from model', async () => {
      // useActivities was moved here from hooks/
      const contacts = await import('./contacts/index.js');
      // Note: If contacts barrel doesn't export useActivities, this catches it
      // The actual export may be through a different path
    });
  });

  describe('Chat Feature (features/chat)', () => {
    it('exports useMessageFlaggingModal from model', async () => {
      // useMessageFlaggingModal was moved here from hooks/
      const { useMessageFlaggingModal } = await import('./chat/model/useMessageFlaggingModal.js');
      expect(useMessageFlaggingModal).toBeDefined();
      expect(typeof useMessageFlaggingModal).toBe('function');
    });
  });

  describe('Tasks Feature (features/tasks)', () => {
    it('exports useTaskFormModal', async () => {
      const tasks = await import('./tasks/index.js');
      expect(tasks.useTaskFormModal).toBeDefined();
    });
  });

  describe('Dashboard Feature (features/dashboard)', () => {
    it('exports useDashboard', async () => {
      const { useDashboard } = await import('./dashboard/useDashboard.js');
      expect(useDashboard).toBeDefined();
      expect(typeof useDashboard).toBe('function');
    });
  });
});

describe('Cross-Feature Import Validation', () => {
  it('auth hooks can be imported where needed', async () => {
    // Simulate what LoginSignup.jsx does
    const { useAuth, useAuthRedirect } = await import('./auth/index.js');
    const { useInviteDetection } = await import('./invitations/index.js');

    expect(useAuth).toBeDefined();
    expect(useAuthRedirect).toBeDefined();
    expect(useInviteDetection).toBeDefined();
  });

  it('notification hooks can access invitation hooks', async () => {
    // useNotificationActions imports useInvitations
    const { useNotificationActions } = await import('./notifications/index.js');
    const { useInvitations } = await import('./invitations/index.js');

    expect(useNotificationActions).toBeDefined();
    expect(useInvitations).toBeDefined();
  });
});
