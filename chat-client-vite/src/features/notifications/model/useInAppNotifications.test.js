/**
 * useInAppNotifications Tests - Network Failure Detection
 * 
 * Tests that detect errors when backend server is unavailable:
 * - Connection refused errors during notification count fetch
 * - Graceful error handling without breaking the UI
 * - Error logging for debugging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInAppNotifications } from './useInAppNotifications.js';

// Increase timeout for async operations
const TEST_TIMEOUT = 10000;

// Mock the API client
vi.mock('../../../apiClient.js', () => ({
  apiGet: vi.fn(),
}));

import { apiGet } from '../../../apiClient.js';

// Mock console.error to verify error logging
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('useInAppNotifications - Network Failure Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('Connection Refused Errors', () => {
    it('should handle ERR_CONNECTION_REFUSED gracefully without breaking UI', async () => {
      const connectionRefusedError = new TypeError('Failed to fetch');
      connectionRefusedError.message = 'Failed to fetch';
      
      apiGet.mockRejectedValueOnce(connectionRefusedError);

      const { result } = renderHook(() => useInAppNotifications({ enabled: true }));

      // Wait for the effect to run and error to be handled
      await waitFor(
        () => {
          expect(apiGet).toHaveBeenCalledWith('/api/notifications/unread-count');
          expect(consoleErrorSpy).toHaveBeenCalled();
        },
        { timeout: TEST_TIMEOUT }
      );

      // Verify UI state remains stable (no error state set)
      expect(result.current.error).toBe('');
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.isLoading).toBe(false);
    }, TEST_TIMEOUT);

    it('should continue polling even after connection errors', async () => {
      const connectionRefusedError = new TypeError('Failed to fetch');
      
      // Mock multiple failures (simulating polling)
      apiGet.mockRejectedValue(connectionRefusedError);

      const { result } = renderHook(() => useInAppNotifications({ enabled: true }));

      // Wait for initial call
      await waitFor(
        () => {
          expect(apiGet).toHaveBeenCalled();
        },
        { timeout: TEST_TIMEOUT }
      );

      const initialCallCount = apiGet.mock.calls.length;

      // Wait for polling interval (30 seconds) - use real timers
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 31000));
      });

      // Should have been called at least twice (initial + poll)
      expect(apiGet.mock.calls.length).toBeGreaterThanOrEqual(initialCallCount + 1);

      // Verify error handling doesn't break polling
      expect(result.current.error).toBe('');
    }, TEST_TIMEOUT + 35000); // Increase timeout to account for 30s polling interval

    it('should handle network errors silently (background operation)', async () => {
      const networkError = new Error('Network request failed');
      apiGet.mockRejectedValueOnce(networkError);

      // Set up spy fresh for this test
      const localErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useInAppNotifications({ enabled: true }));

      // Wait for API call to be made and error to be logged
      await waitFor(
        () => {
          expect(apiGet).toHaveBeenCalled();
          expect(localErrorSpy).toHaveBeenCalled();
        },
        { timeout: TEST_TIMEOUT }
      );

      // Verify error was logged but doesn't break the hook
      expect(result.current.error).toBe('');
      expect(result.current.unreadCount).toBe(0);

      localErrorSpy.mockRestore();
    }, TEST_TIMEOUT);
  });

  describe('Error Recovery', () => {
    it('should recover when connection is restored', async () => {
      // First call fails
      const connectionRefusedError = new TypeError('Failed to fetch');
      apiGet.mockRejectedValueOnce(connectionRefusedError);

      const { result } = renderHook(() => useInAppNotifications({ enabled: true }));

      // Wait for initial failed call
      await waitFor(
        () => {
          expect(apiGet).toHaveBeenCalled();
        },
        { timeout: TEST_TIMEOUT }
      );

      // Wait for error handling to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const initialCallCount = apiGet.mock.calls.length;

      // Second call succeeds (connection restored)
      apiGet.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 5 }),
      });

      // Manually trigger refresh
      act(() => {
        result.current.refresh();
      });

      // Wait for the refresh API call
      await waitFor(
        () => {
          expect(apiGet.mock.calls.length).toBeGreaterThan(initialCallCount);
        },
        { timeout: TEST_TIMEOUT }
      );

      // Wait for async operation to complete and state to update
      // The promise chain: apiGet() -> response.json() -> setUnreadCount()
      await waitFor(
        () => {
          expect(result.current.unreadCount).toBe(5);
        },
        { timeout: TEST_TIMEOUT, interval: 50 }
      );
    }, TEST_TIMEOUT);
  });

  describe('Disabled State', () => {
    it('should not make API calls when disabled', () => {
      const { result } = renderHook(() => useInAppNotifications({ enabled: false }));

      // Should immediately have unreadCount of 0 without making API call
      expect(result.current.unreadCount).toBe(0);
      expect(apiGet).not.toHaveBeenCalled();
    });
  });
});
