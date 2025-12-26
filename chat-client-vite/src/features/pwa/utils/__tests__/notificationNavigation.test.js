/**
 * Notification Navigation Utilities Unit Tests
 *
 * Tests for notification navigation helper functions.
 * Each function has a single responsibility and is tested in isolation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractViewFromUrl,
  buildViewUrl,
  navigateToView,
  handleServiceWorkerNavigation,
} from '../notificationNavigation.js';

describe('notificationNavigation', () => {
  let mockSetCurrentView;
  let originalHistory;
  let originalDispatchEvent;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSetCurrentView = vi.fn();

    // Mock window.location
    delete window.location;
    window.location = {
      origin: 'https://coparentliaizen.com',
      href: 'https://coparentliaizen.com/',
    };

    // Mock window.history
    originalHistory = window.history;
    window.history = {
      pushState: vi.fn(),
    };

    // Mock window.dispatchEvent
    originalDispatchEvent = window.dispatchEvent;
    window.dispatchEvent = vi.fn();
  });

  afterEach(() => {
    window.history = originalHistory;
    window.dispatchEvent = originalDispatchEvent;
    vi.restoreAllMocks();
  });

  describe('extractViewFromUrl', () => {
    it('should extract view parameter from URL', () => {
      const url = 'https://coparentliaizen.com/?view=chat';
      const view = extractViewFromUrl(url);
      expect(view).toBe('chat');
    });

    it('should return default view when no view parameter', () => {
      const url = 'https://coparentliaizen.com/';
      const view = extractViewFromUrl(url, 'dashboard');
      expect(view).toBe('dashboard');
    });

    it('should handle relative URLs', () => {
      const url = '/?view=contacts';
      const view = extractViewFromUrl(url);
      expect(view).toBe('contacts');
    });

    it('should handle URLs with multiple parameters', () => {
      const url = 'https://coparentliaizen.com/?view=chat&other=value';
      const view = extractViewFromUrl(url);
      expect(view).toBe('chat');
    });

    it('should return default view on invalid URL', () => {
      const url = 'not-a-valid-url';
      const view = extractViewFromUrl(url, 'dashboard');
      expect(view).toBe('dashboard');
    });

    it('should use custom default view', () => {
      const url = 'https://coparentliaizen.com/';
      const view = extractViewFromUrl(url, 'profile');
      expect(view).toBe('profile');
    });
  });

  describe('buildViewUrl', () => {
    it('should build URL with view parameter', () => {
      const url = buildViewUrl('chat');
      expect(url).toBe('https://coparentliaizen.com/?view=chat');
    });

    it('should use custom base path', () => {
      const url = buildViewUrl('chat', '/app');
      expect(url).toBe('https://coparentliaizen.com/app?view=chat');
    });

    it('should handle different views', () => {
      const views = ['dashboard', 'contacts', 'profile', 'settings'];
      views.forEach(view => {
        const url = buildViewUrl(view);
        expect(url).toContain(`view=${view}`);
      });
    });
  });

  describe('navigateToView', () => {
    it('should update URL and call setCurrentView', () => {
      navigateToView('chat', mockSetCurrentView);

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        'https://coparentliaizen.com/?view=chat'
      );
      expect(mockSetCurrentView).toHaveBeenCalledWith('chat');
    });

    it('should dispatch navigation event', () => {
      navigateToView('chat', mockSetCurrentView);

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'navigate-to-view',
          detail: { view: 'chat' },
        })
      );
    });

    it('should not navigate with invalid view', () => {
      navigateToView(null, mockSetCurrentView);

      expect(window.history.pushState).not.toHaveBeenCalled();
      expect(mockSetCurrentView).not.toHaveBeenCalled();
    });

    it('should not navigate without setCurrentView function', () => {
      navigateToView('chat', null);

      expect(window.history.pushState).not.toHaveBeenCalled();
    });

    it('should handle different views', () => {
      const views = ['dashboard', 'contacts', 'profile'];
      views.forEach(view => {
        vi.clearAllMocks();
        navigateToView(view, mockSetCurrentView);
        expect(mockSetCurrentView).toHaveBeenCalledWith(view);
      });
    });
  });

  describe('handleServiceWorkerNavigation', () => {
    it('should handle NAVIGATE message type', () => {
      const event = {
        data: {
          type: 'NAVIGATE',
          url: 'https://coparentliaizen.com/?view=chat',
        },
      };

      handleServiceWorkerNavigation(event, mockSetCurrentView, true);

      expect(mockSetCurrentView).toHaveBeenCalledWith('chat');
    });

    it('should ignore non-NAVIGATE messages', () => {
      const event = {
        data: {
          type: 'OTHER_TYPE',
          url: 'https://coparentliaizen.com/?view=chat',
        },
      };

      handleServiceWorkerNavigation(event, mockSetCurrentView, true);

      expect(mockSetCurrentView).not.toHaveBeenCalled();
    });

    it('should not navigate when user not authenticated', () => {
      const event = {
        data: {
          type: 'NAVIGATE',
          url: 'https://coparentliaizen.com/?view=chat',
        },
      };

      handleServiceWorkerNavigation(event, mockSetCurrentView, false);

      expect(mockSetCurrentView).not.toHaveBeenCalled();
    });

    it('should handle missing URL in message', () => {
      const event = {
        data: {
          type: 'NAVIGATE',
        },
      };

      handleServiceWorkerNavigation(event, mockSetCurrentView, true);

      expect(mockSetCurrentView).not.toHaveBeenCalled();
    });

    it('should extract view from URL correctly', () => {
      const event = {
        data: {
          type: 'NAVIGATE',
          url: 'https://coparentliaizen.com/?view=contacts',
        },
      };

      handleServiceWorkerNavigation(event, mockSetCurrentView, true);

      expect(mockSetCurrentView).toHaveBeenCalledWith('contacts');
    });

    it('should use default view when URL has no view parameter', () => {
      const event = {
        data: {
          type: 'NAVIGATE',
          url: 'https://coparentliaizen.com/',
        },
      };

      handleServiceWorkerNavigation(event, mockSetCurrentView, true);

      expect(mockSetCurrentView).toHaveBeenCalledWith('chat'); // Default
    });
  });
});
