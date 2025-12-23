/**
 * useNotificationData.js Unit Tests
 *
 * Tests notification data fetching and state management hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationData } from './useNotificationData.js';

// Mock the API client
vi.mock('../apiClient.js', () => ({
  apiGet: vi.fn(),
}));

import { apiGet } from '../apiClient.js';

describe('useNotificationData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('initial state', () => {
    it('should initialize with empty notifications', () => {
      const { result } = renderHook(() => useNotificationData());

      expect(result.current.notifications).toEqual([]);
    });

    it('should initialize with isLoading false', () => {
      const { result } = renderHook(() => useNotificationData());

      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize with empty error', () => {
      const { result } = renderHook(() => useNotificationData());

      expect(result.current.error).toBe('');
    });

    it('should initialize with zero unreadCount', () => {
      const { result } = renderHook(() => useNotificationData());

      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('fetchNotifications', () => {
    it('should set isLoading to true during fetch', async () => {
      let resolvePromise;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      apiGet.mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useNotificationData());

      act(() => {
        result.current.fetchNotifications();
      });

      expect(result.current.isLoading).toBe(true);

      // Cleanup
      await act(async () => {
        resolvePromise({ ok: true, json: () => Promise.resolve({ notifications: [] }) });
      });
    });

    it('should fetch and set notifications on success', async () => {
      const mockNotifications = [
        { id: '1', title: 'Test 1', read: false },
        { id: '2', title: 'Test 2', read: true },
      ];

      apiGet.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: mockNotifications }),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(result.current.notifications).toEqual(mockNotifications);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('');
    });

    it('should handle empty notifications array', async () => {
      apiGet.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: [] }),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(result.current.notifications).toEqual([]);
    });

    it('should handle missing notifications in response', async () => {
      apiGet.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(result.current.notifications).toEqual([]);
    });

    it('should set error on API error response', async () => {
      apiGet.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(result.current.error).toBe('Server error');
      expect(result.current.isLoading).toBe(false);
    });

    it('should set default error message when no error in response', async () => {
      apiGet.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(result.current.error).toBe('Failed to load notifications');
    });

    it('should handle network error', async () => {
      apiGet.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(result.current.error).toBe('Unable to load notifications');
      expect(result.current.isLoading).toBe(false);
    });

    it('should return success result on successful fetch', async () => {
      const mockNotifications = [{ id: '1', title: 'Test' }];

      apiGet.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: mockNotifications }),
      });

      const { result } = renderHook(() => useNotificationData());

      let fetchResult;
      await act(async () => {
        fetchResult = await result.current.fetchNotifications();
      });

      expect(fetchResult.success).toBe(true);
      expect(fetchResult.notifications).toEqual(mockNotifications);
    });

    it('should return error result on failed fetch', async () => {
      apiGet.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useNotificationData());

      let fetchResult;
      await act(async () => {
        fetchResult = await result.current.fetchNotifications();
      });

      expect(fetchResult.success).toBe(false);
      expect(fetchResult.error).toBe('Server error');
    });

    it('should call correct API endpoint', async () => {
      apiGet.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: [] }),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(apiGet).toHaveBeenCalledWith('/api/notifications');
    });
  });

  describe('removeNotification', () => {
    it('should remove notification by id', async () => {
      const mockNotifications = [
        { id: '1', title: 'Test 1' },
        { id: '2', title: 'Test 2' },
        { id: '3', title: 'Test 3' },
      ];

      apiGet.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: mockNotifications }),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      act(() => {
        result.current.removeNotification('2');
      });

      expect(result.current.notifications).toHaveLength(2);
      expect(result.current.notifications.find(n => n.id === '2')).toBeUndefined();
    });

    it('should not modify list if id not found', async () => {
      const mockNotifications = [{ id: '1', title: 'Test 1' }];

      apiGet.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: mockNotifications }),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      act(() => {
        result.current.removeNotification('nonexistent');
      });

      expect(result.current.notifications).toHaveLength(1);
    });
  });

  describe('updateNotification', () => {
    it('should update notification fields', async () => {
      const mockNotifications = [
        { id: '1', title: 'Test 1', read: false },
      ];

      apiGet.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: mockNotifications }),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      act(() => {
        result.current.updateNotification('1', { read: true });
      });

      expect(result.current.notifications[0].read).toBe(true);
    });

    it('should merge updates with existing fields', async () => {
      const mockNotifications = [
        { id: '1', title: 'Test 1', read: false, message: 'Original' },
      ];

      apiGet.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: mockNotifications }),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      act(() => {
        result.current.updateNotification('1', { read: true });
      });

      expect(result.current.notifications[0].title).toBe('Test 1');
      expect(result.current.notifications[0].message).toBe('Original');
      expect(result.current.notifications[0].read).toBe(true);
    });

    it('should not modify other notifications', async () => {
      const mockNotifications = [
        { id: '1', title: 'Test 1', read: false },
        { id: '2', title: 'Test 2', read: false },
      ];

      apiGet.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: mockNotifications }),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      act(() => {
        result.current.updateNotification('1', { read: true });
      });

      expect(result.current.notifications[1].read).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error message', async () => {
      apiGet.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Some error' }),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe('');
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useNotificationData());

      act(() => {
        result.current.setError('Custom error');
      });

      expect(result.current.error).toBe('Custom error');
    });
  });

  describe('unreadCount', () => {
    it('should count unread notifications', async () => {
      const mockNotifications = [
        { id: '1', read: false },
        { id: '2', read: true },
        { id: '3', read: false },
      ];

      apiGet.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: mockNotifications }),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(result.current.unreadCount).toBe(2);
    });

    it('should update when notification is marked as read', async () => {
      const mockNotifications = [
        { id: '1', read: false },
        { id: '2', read: false },
      ];

      apiGet.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: mockNotifications }),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(result.current.unreadCount).toBe(2);

      act(() => {
        result.current.updateNotification('1', { read: true });
      });

      expect(result.current.unreadCount).toBe(1);
    });

    it('should update when notification is removed', async () => {
      const mockNotifications = [
        { id: '1', read: false },
        { id: '2', read: false },
      ];

      apiGet.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notifications: mockNotifications }),
      });

      const { result } = renderHook(() => useNotificationData());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(result.current.unreadCount).toBe(2);

      act(() => {
        result.current.removeNotification('1');
      });

      expect(result.current.unreadCount).toBe(1);
    });
  });
});
