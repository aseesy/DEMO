/**
 * Tests for useNotificationPreferences hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFS,
} from './useNotificationPreferences.js';

// Mock the storage adapter
vi.mock('../../../adapters/storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  },
  StorageKeys: {
    NOTIFICATION_PREFERENCES: 'notification_preferences',
  },
}));

import { storage, StorageKeys } from '../../../adapters/storage';

describe('useNotificationPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: return default prefs from storage
    storage.get.mockReturnValue(DEFAULT_NOTIFICATION_PREFS);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DEFAULT_NOTIFICATION_PREFS', () => {
    it('has expected default values', () => {
      expect(DEFAULT_NOTIFICATION_PREFS).toEqual({
        newMessages: true,
        taskReminders: false,
        invitations: true,
      });
    });

    it('has all required preference keys', () => {
      expect(DEFAULT_NOTIFICATION_PREFS).toHaveProperty('newMessages');
      expect(DEFAULT_NOTIFICATION_PREFS).toHaveProperty('taskReminders');
      expect(DEFAULT_NOTIFICATION_PREFS).toHaveProperty('invitations');
    });
  });

  describe('initialization', () => {
    it('loads preferences from storage on mount', () => {
      renderHook(() => useNotificationPreferences());

      expect(storage.get).toHaveBeenCalledWith(
        StorageKeys.NOTIFICATION_PREFERENCES,
        DEFAULT_NOTIFICATION_PREFS
      );
    });

    it('returns default preferences when storage is empty', () => {
      storage.get.mockReturnValue(DEFAULT_NOTIFICATION_PREFS);

      const { result } = renderHook(() => useNotificationPreferences());

      expect(result.current.prefs).toEqual(DEFAULT_NOTIFICATION_PREFS);
    });

    it('returns stored preferences when available', () => {
      const storedPrefs = {
        newMessages: false,
        taskReminders: true,
        invitations: false,
      };
      storage.get.mockReturnValue(storedPrefs);

      const { result } = renderHook(() => useNotificationPreferences());

      expect(result.current.prefs).toEqual(storedPrefs);
    });

    it('persists initial preferences to storage', () => {
      const storedPrefs = {
        newMessages: true,
        taskReminders: true,
        invitations: true,
      };
      storage.get.mockReturnValue(storedPrefs);

      renderHook(() => useNotificationPreferences());

      expect(storage.set).toHaveBeenCalledWith(StorageKeys.NOTIFICATION_PREFERENCES, storedPrefs);
    });
  });

  describe('updatePref', () => {
    it('updates a single preference', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.updatePref('newMessages', false);
      });

      expect(result.current.prefs.newMessages).toBe(false);
      expect(result.current.prefs.taskReminders).toBe(false);
      expect(result.current.prefs.invitations).toBe(true);
    });

    it('persists updated preference to storage', () => {
      const { result } = renderHook(() => useNotificationPreferences());
      vi.clearAllMocks();

      act(() => {
        result.current.updatePref('taskReminders', true);
      });

      expect(storage.set).toHaveBeenCalledWith(
        StorageKeys.NOTIFICATION_PREFERENCES,
        expect.objectContaining({ taskReminders: true })
      );
    });

    it('can update multiple preferences sequentially', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.updatePref('newMessages', false);
      });

      act(() => {
        result.current.updatePref('invitations', false);
      });

      expect(result.current.prefs).toEqual({
        newMessages: false,
        taskReminders: false,
        invitations: false,
      });
    });

    it('does not affect other preferences when updating one', () => {
      const initialPrefs = {
        newMessages: true,
        taskReminders: true,
        invitations: true,
      };
      storage.get.mockReturnValue(initialPrefs);

      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.updatePref('taskReminders', false);
      });

      expect(result.current.prefs.newMessages).toBe(true);
      expect(result.current.prefs.invitations).toBe(true);
    });

    it('handles boolean false correctly', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.updatePref('newMessages', false);
      });

      expect(result.current.prefs.newMessages).toBe(false);
    });

    it('handles boolean true correctly', () => {
      storage.get.mockReturnValue({
        newMessages: false,
        taskReminders: false,
        invitations: false,
      });

      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.updatePref('newMessages', true);
      });

      expect(result.current.prefs.newMessages).toBe(true);
    });
  });

  describe('setPrefs with object', () => {
    it('merges new preferences with existing', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.setPrefs({ taskReminders: true });
      });

      expect(result.current.prefs).toEqual({
        newMessages: true,
        taskReminders: true,
        invitations: true,
      });
    });

    it('can set multiple preferences at once', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.setPrefs({
          newMessages: false,
          taskReminders: true,
        });
      });

      expect(result.current.prefs).toEqual({
        newMessages: false,
        taskReminders: true,
        invitations: true,
      });
    });

    it('persists merged preferences to storage', () => {
      const { result } = renderHook(() => useNotificationPreferences());
      vi.clearAllMocks();

      act(() => {
        result.current.setPrefs({
          newMessages: false,
          taskReminders: true,
        });
      });

      expect(storage.set).toHaveBeenCalledWith(
        StorageKeys.NOTIFICATION_PREFERENCES,
        expect.objectContaining({
          newMessages: false,
          taskReminders: true,
          invitations: true,
        })
      );
    });

    it('handles empty object gracefully', () => {
      const { result } = renderHook(() => useNotificationPreferences());
      const initialPrefs = { ...result.current.prefs };

      act(() => {
        result.current.setPrefs({});
      });

      expect(result.current.prefs).toEqual(initialPrefs);
    });
  });

  describe('setPrefs with function', () => {
    it('accepts updater function', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.setPrefs(prev => ({
          ...prev,
          newMessages: !prev.newMessages,
        }));
      });

      expect(result.current.prefs.newMessages).toBe(false);
    });

    it('provides current state to updater function', () => {
      storage.get.mockReturnValue({
        newMessages: false,
        taskReminders: true,
        invitations: false,
      });

      const { result } = renderHook(() => useNotificationPreferences());
      let receivedPrev = null;

      act(() => {
        result.current.setPrefs(prev => {
          receivedPrev = prev;
          return prev;
        });
      });

      expect(receivedPrev).toEqual({
        newMessages: false,
        taskReminders: true,
        invitations: false,
      });
    });

    it('can toggle all preferences', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.setPrefs(prev => ({
          newMessages: !prev.newMessages,
          taskReminders: !prev.taskReminders,
          invitations: !prev.invitations,
        }));
      });

      expect(result.current.prefs).toEqual({
        newMessages: false,
        taskReminders: true,
        invitations: false,
      });
    });

    it('persists function-updated preferences to storage', () => {
      const { result } = renderHook(() => useNotificationPreferences());
      vi.clearAllMocks();

      act(() => {
        result.current.setPrefs(prev => ({
          ...prev,
          taskReminders: true,
        }));
      });

      expect(storage.set).toHaveBeenCalledWith(
        StorageKeys.NOTIFICATION_PREFERENCES,
        expect.objectContaining({ taskReminders: true })
      );
    });
  });

  describe('resetPrefs', () => {
    it('resets preferences to defaults', () => {
      storage.get.mockReturnValue({
        newMessages: false,
        taskReminders: true,
        invitations: false,
      });

      const { result } = renderHook(() => useNotificationPreferences());

      // Verify non-default state
      expect(result.current.prefs.newMessages).toBe(false);
      expect(result.current.prefs.taskReminders).toBe(true);

      act(() => {
        result.current.resetPrefs();
      });

      expect(result.current.prefs).toEqual(DEFAULT_NOTIFICATION_PREFS);
    });

    it('persists reset preferences to storage', () => {
      storage.get.mockReturnValue({
        newMessages: false,
        taskReminders: true,
        invitations: false,
      });

      const { result } = renderHook(() => useNotificationPreferences());
      vi.clearAllMocks();

      act(() => {
        result.current.resetPrefs();
      });

      expect(storage.set).toHaveBeenCalledWith(
        StorageKeys.NOTIFICATION_PREFERENCES,
        DEFAULT_NOTIFICATION_PREFS
      );
    });

    it('works when already at default values', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.resetPrefs();
      });

      expect(result.current.prefs).toEqual(DEFAULT_NOTIFICATION_PREFS);
    });
  });

  describe('return value stability', () => {
    it('returns stable function references', () => {
      const { result, rerender } = renderHook(() => useNotificationPreferences());

      const firstRender = {
        setPrefs: result.current.setPrefs,
        updatePref: result.current.updatePref,
        resetPrefs: result.current.resetPrefs,
      };

      rerender();

      expect(result.current.setPrefs).toBe(firstRender.setPrefs);
      expect(result.current.updatePref).toBe(firstRender.updatePref);
      expect(result.current.resetPrefs).toBe(firstRender.resetPrefs);
    });

    it('returns all expected properties', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      expect(result.current).toHaveProperty('prefs');
      expect(result.current).toHaveProperty('setPrefs');
      expect(result.current).toHaveProperty('updatePref');
      expect(result.current).toHaveProperty('resetPrefs');
    });

    it('prefs is an object', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      expect(typeof result.current.prefs).toBe('object');
      expect(result.current.prefs).not.toBeNull();
    });

    it('functions are callable', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      expect(typeof result.current.setPrefs).toBe('function');
      expect(typeof result.current.updatePref).toBe('function');
      expect(typeof result.current.resetPrefs).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('handles undefined preference key in updatePref', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.updatePref('unknownKey', true);
      });

      // Should add the key without error
      expect(result.current.prefs.unknownKey).toBe(true);
    });

    it('handles null value in updatePref', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.updatePref('newMessages', null);
      });

      expect(result.current.prefs.newMessages).toBe(null);
    });

    it('handles rapid sequential updates', () => {
      const { result } = renderHook(() => useNotificationPreferences());

      act(() => {
        result.current.updatePref('newMessages', false);
        result.current.updatePref('newMessages', true);
        result.current.updatePref('newMessages', false);
      });

      expect(result.current.prefs.newMessages).toBe(false);
    });

    it('handles storage returning partial preferences', () => {
      storage.get.mockReturnValue({
        newMessages: false,
        // missing taskReminders and invitations
      });

      const { result } = renderHook(() => useNotificationPreferences());

      // Should work with partial state
      expect(result.current.prefs.newMessages).toBe(false);
    });
  });
});
