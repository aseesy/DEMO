/**
 * Notifications Feature Barrel Export Tests
 *
 * Ensures all exports from the notifications feature are valid and importable.
 */

import { describe, it, expect } from 'vitest';

describe('Notifications Feature Exports', () => {
  it('exports useNotifications hook', async () => {
    const { useNotifications } = await import('./index.js');
    expect(useNotifications).toBeDefined();
    expect(typeof useNotifications).toBe('function');
  });

  it('exports useInAppNotifications hook', async () => {
    const { useInAppNotifications } = await import('./index.js');
    expect(useInAppNotifications).toBeDefined();
    expect(typeof useInAppNotifications).toBe('function');
  });

  it('exports useNotificationActions hook', async () => {
    const { useNotificationActions } = await import('./index.js');
    expect(useNotificationActions).toBeDefined();
    expect(typeof useNotificationActions).toBe('function');
  });

  it('exports useNotificationData hook', async () => {
    const { useNotificationData } = await import('./index.js');
    expect(useNotificationData).toBeDefined();
    expect(typeof useNotificationData).toBe('function');
  });

  it('exports useNotificationPreferences hook', async () => {
    const { useNotificationPreferences } = await import('./index.js');
    expect(useNotificationPreferences).toBeDefined();
    expect(typeof useNotificationPreferences).toBe('function');
  });

  it('all exports are accessible from feature barrel', async () => {
    const notificationsFeature = await import('../index.js');

    expect(notificationsFeature.useNotifications).toBeDefined();
    expect(notificationsFeature.useInAppNotifications).toBeDefined();
    expect(notificationsFeature.useNotificationActions).toBeDefined();
    expect(notificationsFeature.useNotificationData).toBeDefined();
    expect(notificationsFeature.useNotificationPreferences).toBeDefined();
  });
});
