/**
 * App Component - Notification Navigation Logic Tests
 *
 * Tests for service worker message handling logic in App component.
 * Single Responsibility: App handles service worker messages and updates URL.
 *
 * Note: These tests focus on the navigation logic, not full component rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Extract the message handler logic for testing
 * This is the logic from App.jsx useEffect
 */
function createServiceWorkerMessageHandler() {
  const handleMessage = event => {
    if (event.data && event.data.type === 'NAVIGATE') {
      // Update the URL
      window.history.pushState({}, '', event.data.url);

      // Parse the URL to extract view parameter
      try {
        const url = new URL(event.data.url, window.location.origin);
        const viewParam = url.searchParams.get('view');

        // Trigger a custom event for immediate navigation
        if (viewParam) {
          window.dispatchEvent(new CustomEvent('navigate-to-view', { detail: { view: viewParam } }));
        } else {
          // If no view param, just reload to ensure we're on the right page
          window.location.href = event.data.url;
        }
      } catch (error) {
        console.warn('[App] Error parsing navigation URL:', error);
        // Fallback: direct navigation
        window.location.href = event.data.url;
      }
    }
  };

  return handleMessage;
}

describe('App - Notification Navigation Logic', () => {
  let originalHistory;
  let originalDispatchEvent;
  let originalLocation;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.history
    originalHistory = window.history;
    window.history = {
      pushState: vi.fn(),
    };

    // Mock window.dispatchEvent
    originalDispatchEvent = window.dispatchEvent;
    window.dispatchEvent = vi.fn();

    // Mock window.location
    originalLocation = window.location;
    delete window.location;
    window.location = {
      origin: 'https://coparentliaizen.com',
      href: 'https://coparentliaizen.com/',
    };
  });

  afterEach(() => {
    window.history = originalHistory;
    window.dispatchEvent = originalDispatchEvent;
    window.location = originalLocation;
    vi.restoreAllMocks();
  });

  it('should handle NAVIGATE message from service worker', () => {
    const handleMessage = createServiceWorkerMessageHandler();

    const event = {
      data: {
        type: 'NAVIGATE',
        url: 'https://coparentliaizen.com/?view=chat',
      },
    };

    handleMessage(event);

    // Should update URL
    expect(window.history.pushState).toHaveBeenCalledWith(
      {},
      '',
      'https://coparentliaizen.com/?view=chat'
    );

    // Should dispatch navigation event
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'navigate-to-view',
        detail: { view: 'chat' },
      })
    );
  });

  it('should ignore non-NAVIGATE messages', () => {
    const handleMessage = createServiceWorkerMessageHandler();

    const event = {
      data: {
        type: 'OTHER_TYPE',
        url: 'https://coparentliaizen.com/?view=chat',
      },
    };

    handleMessage(event);

    expect(window.history.pushState).not.toHaveBeenCalled();
    expect(window.dispatchEvent).not.toHaveBeenCalled();
  });

  it('should handle navigation URL without view parameter', () => {
    const handleMessage = createServiceWorkerMessageHandler();

    const event = {
      data: {
        type: 'NAVIGATE',
        url: 'https://coparentliaizen.com/',
      },
    };

    // Mock window.location.href setter
    let hrefValue = 'https://coparentliaizen.com/';
    Object.defineProperty(window.location, 'href', {
      set: vi.fn(value => {
        hrefValue = value;
      }),
      get: () => hrefValue,
      configurable: true,
    });

    handleMessage(event);

    expect(window.history.pushState).toHaveBeenCalled();
    expect(window.dispatchEvent).not.toHaveBeenCalled(); // No view param, so no event
  });

  it('should handle invalid URL gracefully', () => {
    const handleMessage = createServiceWorkerMessageHandler();

    const event = {
      data: {
        type: 'NAVIGATE',
        url: 'not-a-valid-url',
      },
    };

    // Mock window.location.href setter
    let hrefValue = 'https://coparentliaizen.com/';
    Object.defineProperty(window.location, 'href', {
      set: vi.fn(value => {
        hrefValue = value;
      }),
      get: () => hrefValue,
      configurable: true,
    });

    handleMessage(event);

    // Should fallback to direct navigation
    expect(window.location.href).toBe('not-a-valid-url');
  });

  it('should extract view parameter correctly', () => {
    const handleMessage = createServiceWorkerMessageHandler();

    const event = {
      data: {
        type: 'NAVIGATE',
        url: 'https://coparentliaizen.com/?view=contacts',
      },
    };

    handleMessage(event);

    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { view: 'contacts' },
      })
    );
  });
});

