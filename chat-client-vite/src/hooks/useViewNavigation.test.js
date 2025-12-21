/**
 * Tests for useViewNavigation hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useViewNavigation,
  AVAILABLE_VIEWS,
  DEFAULT_VIEW,
  isValidView,
} from './useViewNavigation.js';

// Mock the storage adapter
vi.mock('../adapters/storage', () => ({
  storage: {
    getString: vi.fn(),
    set: vi.fn(),
  },
  StorageKeys: {
    CURRENT_VIEW: 'current_view',
  },
}));

// Mock analytics
vi.mock('../utils/analytics.js', () => ({
  trackViewChange: vi.fn(),
}));

import { storage, StorageKeys } from '../adapters/storage';
import { trackViewChange } from '../utils/analytics.js';

describe('useViewNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.getString.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AVAILABLE_VIEWS constant', () => {
    it('contains all expected views', () => {
      expect(AVAILABLE_VIEWS).toContain('dashboard');
      expect(AVAILABLE_VIEWS).toContain('chat');
      expect(AVAILABLE_VIEWS).toContain('contacts');
      expect(AVAILABLE_VIEWS).toContain('profile');
      expect(AVAILABLE_VIEWS).toContain('settings');
      expect(AVAILABLE_VIEWS).toContain('account');
    });

    it('has 6 views', () => {
      expect(AVAILABLE_VIEWS).toHaveLength(6);
    });

    it('is an array', () => {
      expect(Array.isArray(AVAILABLE_VIEWS)).toBe(true);
    });
  });

  describe('DEFAULT_VIEW constant', () => {
    it('is dashboard', () => {
      expect(DEFAULT_VIEW).toBe('dashboard');
    });

    it('is a valid view', () => {
      expect(AVAILABLE_VIEWS).toContain(DEFAULT_VIEW);
    });
  });

  describe('isValidView function', () => {
    it('returns true for valid views', () => {
      AVAILABLE_VIEWS.forEach(view => {
        expect(isValidView(view)).toBe(true);
      });
    });

    it('returns false for invalid views', () => {
      expect(isValidView('invalid')).toBe(false);
      expect(isValidView('home')).toBe(false);
      expect(isValidView('login')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidView('')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isValidView(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isValidView(undefined)).toBe(false);
    });

    it('is case-sensitive', () => {
      expect(isValidView('Dashboard')).toBe(false);
      expect(isValidView('CHAT')).toBe(false);
    });
  });

  describe('initialization', () => {
    it('loads view from storage on mount', () => {
      renderHook(() => useViewNavigation());

      expect(storage.getString).toHaveBeenCalledWith(StorageKeys.CURRENT_VIEW);
    });

    it('uses default view when storage is empty', () => {
      storage.getString.mockReturnValue(null);

      const { result } = renderHook(() => useViewNavigation());

      expect(result.current.currentView).toBe(DEFAULT_VIEW);
    });

    it('uses stored view when valid', () => {
      storage.getString.mockReturnValue('settings');

      const { result } = renderHook(() => useViewNavigation());

      expect(result.current.currentView).toBe('settings');
    });

    it('uses default view when stored view is invalid', () => {
      storage.getString.mockReturnValue('invalid_view');

      const { result } = renderHook(() => useViewNavigation());

      expect(result.current.currentView).toBe(DEFAULT_VIEW);
    });

    it('uses default view when stored value is empty string', () => {
      storage.getString.mockReturnValue('');

      const { result } = renderHook(() => useViewNavigation());

      expect(result.current.currentView).toBe(DEFAULT_VIEW);
    });
  });

  describe('navigateTo function', () => {
    it('changes current view to valid view', () => {
      const { result } = renderHook(() => useViewNavigation());

      act(() => {
        result.current.navigateTo('chat');
      });

      expect(result.current.currentView).toBe('chat');
    });

    it('does not change view for invalid view', () => {
      const { result } = renderHook(() => useViewNavigation());
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      act(() => {
        result.current.navigateTo('invalid');
      });

      expect(result.current.currentView).toBe(DEFAULT_VIEW);
      consoleSpy.mockRestore();
    });

    it('warns when navigating to invalid view', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useViewNavigation());

      act(() => {
        result.current.navigateTo('invalid');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid view: invalid')
      );
      consoleSpy.mockRestore();
    });

    it('does not change view when navigating to same view', () => {
      storage.getString.mockReturnValue('chat');
      const { result } = renderHook(() => useViewNavigation());

      act(() => {
        result.current.navigateTo('chat');
      });

      // Should not trigger analytics for same view
      expect(trackViewChange).not.toHaveBeenCalled();
    });

    it('can navigate through all valid views', () => {
      const { result } = renderHook(() => useViewNavigation());

      AVAILABLE_VIEWS.forEach(view => {
        act(() => {
          result.current.navigateTo(view);
        });
        expect(result.current.currentView).toBe(view);
      });
    });
  });

  describe('setCurrentView alias', () => {
    it('is the same function as navigateTo', () => {
      const { result } = renderHook(() => useViewNavigation());

      expect(result.current.setCurrentView).toBe(result.current.navigateTo);
    });

    it('works like navigateTo', () => {
      const { result } = renderHook(() => useViewNavigation());

      act(() => {
        result.current.setCurrentView('profile');
      });

      expect(result.current.currentView).toBe('profile');
    });
  });

  describe('analytics tracking', () => {
    it('tracks view changes by default', () => {
      const { result } = renderHook(() => useViewNavigation());

      act(() => {
        result.current.navigateTo('chat');
      });

      expect(trackViewChange).toHaveBeenCalledWith('chat');
    });

    it('does not track when trackAnalytics is false', () => {
      const { result } = renderHook(() =>
        useViewNavigation({ trackAnalytics: false })
      );

      act(() => {
        result.current.navigateTo('chat');
      });

      expect(trackViewChange).not.toHaveBeenCalled();
    });

    it('tracks each unique view change', () => {
      const { result } = renderHook(() => useViewNavigation());

      act(() => {
        result.current.navigateTo('chat');
      });

      act(() => {
        result.current.navigateTo('profile');
      });

      expect(trackViewChange).toHaveBeenCalledTimes(2);
      expect(trackViewChange).toHaveBeenCalledWith('chat');
      expect(trackViewChange).toHaveBeenCalledWith('profile');
    });

    it('does not track when navigating to same view', () => {
      storage.getString.mockReturnValue('settings');
      const { result } = renderHook(() => useViewNavigation());

      act(() => {
        result.current.navigateTo('settings');
      });

      expect(trackViewChange).not.toHaveBeenCalled();
    });
  });

  describe('storage persistence', () => {
    it('persists view to storage when authenticated', () => {
      const { result } = renderHook(() =>
        useViewNavigation({ isAuthenticated: true })
      );

      act(() => {
        result.current.navigateTo('chat');
      });

      expect(storage.set).toHaveBeenCalledWith(StorageKeys.CURRENT_VIEW, 'chat');
    });

    it('does not persist to storage when not authenticated', () => {
      const { result } = renderHook(() =>
        useViewNavigation({ isAuthenticated: false })
      );

      act(() => {
        result.current.navigateTo('chat');
      });

      expect(storage.set).not.toHaveBeenCalled();
    });

    it('persists each view change when authenticated', () => {
      const { result } = renderHook(() =>
        useViewNavigation({ isAuthenticated: true })
      );
      vi.clearAllMocks();

      act(() => {
        result.current.navigateTo('chat');
      });

      act(() => {
        result.current.navigateTo('profile');
      });

      expect(storage.set).toHaveBeenCalledWith(StorageKeys.CURRENT_VIEW, 'chat');
      expect(storage.set).toHaveBeenCalledWith(StorageKeys.CURRENT_VIEW, 'profile');
    });
  });

  describe('return value', () => {
    it('returns currentView', () => {
      const { result } = renderHook(() => useViewNavigation());

      expect(result.current).toHaveProperty('currentView');
      expect(typeof result.current.currentView).toBe('string');
    });

    it('returns setCurrentView function', () => {
      const { result } = renderHook(() => useViewNavigation());

      expect(result.current).toHaveProperty('setCurrentView');
      expect(typeof result.current.setCurrentView).toBe('function');
    });

    it('returns navigateTo function', () => {
      const { result } = renderHook(() => useViewNavigation());

      expect(result.current).toHaveProperty('navigateTo');
      expect(typeof result.current.navigateTo).toBe('function');
    });

    it('returns availableViews array', () => {
      const { result } = renderHook(() => useViewNavigation());

      expect(result.current).toHaveProperty('availableViews');
      expect(result.current.availableViews).toEqual(AVAILABLE_VIEWS);
    });

    it('returns isValidView function', () => {
      const { result } = renderHook(() => useViewNavigation());

      expect(result.current).toHaveProperty('isValidView');
      expect(typeof result.current.isValidView).toBe('function');
      expect(result.current.isValidView('chat')).toBe(true);
    });
  });

  describe('function stability', () => {
    it('navigateTo has stable reference when view does not change', () => {
      const { result, rerender } = renderHook(() => useViewNavigation());

      const firstNavigateTo = result.current.navigateTo;

      rerender();

      expect(result.current.navigateTo).toBe(firstNavigateTo);
    });

    it('navigateTo reference changes when view changes', () => {
      const { result, rerender } = renderHook(() => useViewNavigation());

      const firstNavigateTo = result.current.navigateTo;

      act(() => {
        result.current.navigateTo('chat');
      });

      rerender();

      // navigateTo depends on currentView, so reference will change
      expect(result.current.navigateTo).not.toBe(firstNavigateTo);
    });
  });

  describe('options', () => {
    it('accepts empty options object', () => {
      const { result } = renderHook(() => useViewNavigation({}));

      expect(result.current.currentView).toBe(DEFAULT_VIEW);
    });

    it('accepts undefined options', () => {
      const { result } = renderHook(() => useViewNavigation(undefined));

      expect(result.current.currentView).toBe(DEFAULT_VIEW);
    });

    it('respects isAuthenticated option', () => {
      const { result } = renderHook(() =>
        useViewNavigation({ isAuthenticated: true })
      );

      act(() => {
        result.current.navigateTo('chat');
      });

      expect(storage.set).toHaveBeenCalled();
    });

    it('respects trackAnalytics option', () => {
      const { result } = renderHook(() =>
        useViewNavigation({ trackAnalytics: false })
      );

      act(() => {
        result.current.navigateTo('chat');
      });

      expect(trackViewChange).not.toHaveBeenCalled();
    });

    it('can combine multiple options', () => {
      const { result } = renderHook(() =>
        useViewNavigation({ isAuthenticated: true, trackAnalytics: false })
      );

      act(() => {
        result.current.navigateTo('chat');
      });

      expect(storage.set).toHaveBeenCalled();
      expect(trackViewChange).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles rapid sequential navigation', () => {
      const { result } = renderHook(() => useViewNavigation());

      act(() => {
        result.current.navigateTo('chat');
        result.current.navigateTo('profile');
        result.current.navigateTo('settings');
      });

      expect(result.current.currentView).toBe('settings');
    });

    it('handles navigation back to previous view', () => {
      const { result } = renderHook(() => useViewNavigation());

      act(() => {
        result.current.navigateTo('chat');
      });

      act(() => {
        result.current.navigateTo('dashboard');
      });

      expect(result.current.currentView).toBe('dashboard');
    });

    it('handles mixed valid and invalid navigation attempts', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useViewNavigation());

      act(() => {
        result.current.navigateTo('chat');
      });

      act(() => {
        result.current.navigateTo('invalid');
      });

      expect(result.current.currentView).toBe('chat');
      consoleSpy.mockRestore();
    });
  });
});
