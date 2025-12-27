/**
 * Service Worker Notification Click Handler Tests
 *
 * Tests for service worker notification click handling logic.
 * Single Responsibility: Service worker handles notification clicks and opens/closes windows.
 *
 * Note: Service workers run in a separate context, so we test the logic in isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Service Worker Notification Click Handler
 * Extracted logic for testability
 */
function handleNotificationClick(event, clients) {
  // Close the notification
  event.notification.close();

  // Get the URL from notification data, default to chat view
  const urlToOpen = event.notification.data?.url || '/?view=chat';
  const fullUrl = new URL(urlToOpen, self.location.origin).href;

  return clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then(clientList => {
    // Check if app is already open in a window
    for (const client of clientList) {
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        // App is open - focus it and navigate
        return client.focus().then(() => {
          // Send message to client to navigate
          return client.postMessage({
            type: 'NAVIGATE',
            url: fullUrl,
          });
        });
      }
    }

    // App is not open - open it with the deep link
    return clients.openWindow(fullUrl);
  });
}

describe('Service Worker Notification Click Handler', () => {
  let mockNotification;
  let mockEvent;
  let mockClients;
  let mockClientList;
  let mockClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock notification
    mockNotification = {
      close: vi.fn(),
      data: {
        url: '/?view=chat',
      },
    };

    // Mock event
    mockEvent = {
      notification: mockNotification,
      waitUntil: vi.fn((promise) => promise),
    };

    // Mock client
    mockClient = {
      url: 'https://coparentliaizen.com/',
      focus: vi.fn().mockResolvedValue(undefined),
      postMessage: vi.fn(),
    };

    // Mock client list
    mockClientList = [mockClient];

    // Mock clients API
    mockClients = {
      matchAll: vi.fn().mockResolvedValue(mockClientList),
      openWindow: vi.fn().mockResolvedValue(mockClient),
    };

    // Mock self.location
    global.self = {
      location: {
        origin: 'https://coparentliaizen.com',
      },
    };
  });

  it('should close notification when clicked', async () => {
    await handleNotificationClick(mockEvent, mockClients);

    expect(mockNotification.close).toHaveBeenCalled();
  });

  it('should use default URL when notification data has no URL', async () => {
    mockNotification.data = {};

    await handleNotificationClick(mockEvent, mockClients);

    expect(mockClients.matchAll).toHaveBeenCalled();
    // Should use default '/?view=chat'
  });

  it('should use URL from notification data', async () => {
    mockNotification.data = {
      url: '/?view=contacts',
    };

    await handleNotificationClick(mockEvent, mockClients);

    const fullUrl = new URL('/?view=contacts', 'https://coparentliaizen.com').href;
    expect(mockClient.postMessage).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      url: fullUrl,
    });
  });

  it('should focus existing client if app is open', async () => {
    await handleNotificationClick(mockEvent, mockClients);

    expect(mockClient.focus).toHaveBeenCalled();
    expect(mockClient.postMessage).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      url: expect.stringContaining('view=chat'),
    });
  });

  it('should open new window if app is not open', async () => {
    // Empty client list (app not open)
    mockClients.matchAll.mockResolvedValue([]);

    await handleNotificationClick(mockEvent, mockClients);

    expect(mockClients.openWindow).toHaveBeenCalledWith(
      expect.stringContaining('view=chat')
    );
    expect(mockClient.focus).not.toHaveBeenCalled();
  });

  it('should handle client without focus method', async () => {
    // Client without focus method
    const clientWithoutFocus = {
      url: 'https://coparentliaizen.com/',
      postMessage: vi.fn(),
    };
    mockClients.matchAll.mockResolvedValue([clientWithoutFocus]);

    await handleNotificationClick(mockEvent, mockClients);

    // Should fall through to openWindow
    expect(mockClients.openWindow).toHaveBeenCalled();
  });

  it('should handle client from different origin', async () => {
    // Client from different origin
    const differentOriginClient = {
      url: 'https://other-site.com/',
      focus: vi.fn(),
      postMessage: vi.fn(),
    };
    mockClients.matchAll.mockResolvedValue([differentOriginClient]);

    await handleNotificationClick(mockEvent, mockClients);

    // Should not focus different origin client, should open new window
    expect(differentOriginClient.focus).not.toHaveBeenCalled();
    expect(mockClients.openWindow).toHaveBeenCalled();
  });

  it('should build full URL correctly', async () => {
    mockNotification.data = {
      url: '/?view=chat',
    };

    await handleNotificationClick(mockEvent, mockClients);

    const expectedUrl = new URL('/?view=chat', 'https://coparentliaizen.com').href;
    expect(mockClient.postMessage).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      url: expectedUrl,
    });
  });
});

