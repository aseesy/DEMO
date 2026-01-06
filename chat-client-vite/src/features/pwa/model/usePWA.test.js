/**
 * usePWA Hook Unit Tests
 *
 * Tests for PWA functionality including:
 * - Service worker registration
 * - Push notification subscription
 * - Update detection and application
 * - Install prompt handling
 *
 * NOTE: Service Worker registration is skipped in development/test mode.
 * Tests focus on hook interface and behavior that doesn't require SW.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies BEFORE importing usePWA
vi.mock('../../../apiClient.js', () => ({
  apiPost: vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }),
}));

// Import after mocks
import { usePWA } from './usePWA.js';

describe('usePWA', () => {
  let mockServiceWorkerRegistration;
  let mockPushManager;
  let mockServiceWorker;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Service Worker API
    mockServiceWorker = {
      state: 'installed',
      addEventListener: vi.fn(),
      postMessage: vi.fn(),
    };

    mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue({
        toJSON: () => ({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: { p256dh: 'key', auth: 'auth' },
        }),
        unsubscribe: vi.fn().mockResolvedValue(true),
      }),
    };

    mockServiceWorkerRegistration = {
      installing: null,
      waiting: null,
      active: mockServiceWorker,
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      pushManager: mockPushManager,
    };

    // Mock navigator.serviceWorker
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
          register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
          ready: Promise.resolve(mockServiceWorkerRegistration),
          controller: mockServiceWorker,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        userAgent: 'Mozilla/5.0 (compatible; Test)',
      },
      writable: true,
      configurable: true,
    });

    // Mock Notification API
    global.Notification = {
      requestPermission: vi.fn().mockResolvedValue('granted'),
    };

    // Mock window.matchMedia
    Object.defineProperty(global, 'window', {
      value: {
        ...global.window,
        matchMedia: vi.fn().mockReturnValue({
          matches: false,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }),
        location: {
          reload: vi.fn(),
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.isInstallable).toBe(false);
      expect(result.current.isInstalled).toBe(false);
      expect(result.current.updateAvailable).toBe(false);
    });

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => usePWA());

      expect(typeof result.current.showInstallPrompt).toBe('function');
      expect(typeof result.current.subscribeToPush).toBe('function');
      expect(typeof result.current.unsubscribeFromPush).toBe('function');
      expect(typeof result.current.sendMessageToSW).toBe('function');
      expect(typeof result.current.applyUpdate).toBe('function');
      expect(typeof result.current.checkForUpdates).toBe('function');
    });
  });

  describe('applyUpdate', () => {
    it('should provide applyUpdate function', () => {
      const { result } = renderHook(() => usePWA());

      expect(typeof result.current.applyUpdate).toBe('function');
    });

    it('should not apply update if no waiting worker', async () => {
      const { result } = renderHook(() => usePWA());

      // Wait for hook to initialize
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      act(() => {
        result.current.applyUpdate();
      });

      // Wait a bit to ensure no async reload happens
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Should not reload if no waiting worker
      expect(window.location.reload).not.toHaveBeenCalled();
    });
  });

  describe('checkForUpdates', () => {
    it('should provide checkForUpdates function', () => {
      const { result } = renderHook(() => usePWA());

      expect(typeof result.current.checkForUpdates).toBe('function');
    });

    it('should handle missing swRegistration gracefully', async () => {
      const { result } = renderHook(() => usePWA());

      // In dev mode, swRegistration is null - should not throw
      await act(async () => {
        await result.current.checkForUpdates();
      });

      // Should not have called update since swRegistration is null in dev mode
      expect(mockServiceWorkerRegistration.update).not.toHaveBeenCalled();
    });
  });

  describe('push notification subscription', () => {
    it('should provide subscribeToPush function', () => {
      const { result } = renderHook(() => usePWA());

      expect(typeof result.current.subscribeToPush).toBe('function');
    });

    it('should provide unsubscribeFromPush function', () => {
      const { result } = renderHook(() => usePWA());

      expect(typeof result.current.unsubscribeFromPush).toBe('function');
    });

    it('should skip subscription in development mode', async () => {
      const { result } = renderHook(() => usePWA());

      const subscription = await act(async () => {
        return await result.current.subscribeToPush();
      });

      // In dev mode, subscribeToPush returns null early
      expect(subscription).toBeNull();
    });

    it('should return false when unsubscribing with no active subscription', async () => {
      const { result } = renderHook(() => usePWA());

      const unsubscribed = await act(async () => {
        return await result.current.unsubscribeFromPush();
      });

      expect(unsubscribed).toBe(false);
    });
  });

  describe('showInstallPrompt', () => {
    it('should provide showInstallPrompt function', () => {
      const { result } = renderHook(() => usePWA());

      expect(typeof result.current.showInstallPrompt).toBe('function');
    });

    it('should return false when no install prompt is available', async () => {
      const { result } = renderHook(() => usePWA());

      const installed = await act(async () => {
        return await result.current.showInstallPrompt();
      });

      expect(installed).toBe(false);
    });
  });

  describe('sendMessageToSW', () => {
    it('should provide sendMessageToSW function', () => {
      const { result } = renderHook(() => usePWA());

      expect(typeof result.current.sendMessageToSW).toBe('function');
    });

    it('should handle missing swRegistration gracefully', () => {
      const { result } = renderHook(() => usePWA());

      // In dev mode, swRegistration is null - should not throw
      expect(() => {
        result.current.sendMessageToSW({ type: 'TEST' });
      }).not.toThrow();
    });
  });
});
