/**
 * Network Failure Integration Tests
 * 
 * End-to-end tests that detect errors when backend server is unavailable:
 * - Multiple hooks failing simultaneously
 * - Component rendering with failed API calls
 * - Error boundary behavior
 * - User experience during network outages
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock API client to simulate network failures
vi.mock('../apiClient.js', () => ({
  apiGet: vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
  apiPost: vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
  apiPut: vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
}));

// Mock Socket.IO to simulate connection failures
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => {
    const mockSocket = {
      id: null,
      connected: false,
      disconnected: true,
      on: vi.fn((event, handler) => {
        if (event === 'connect_error') {
          // Simulate connection error
          setTimeout(() => {
            handler(new Error('xhr poll error'));
          }, 10);
        }
      }),
      off: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connect: vi.fn(),
    };
    return mockSocket;
  }),
}));

// Mock console.error to verify error logging
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Network Failure Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('Multiple Hooks Failing Simultaneously', () => {
    it('should handle multiple API failures without crashing', async () => {
      const { useInAppNotifications } = await import('../features/notifications/model/useInAppNotifications.js');
      const { useContactsApi } = await import('../features/contacts/model/useContactsApi.js');

      const TestComponent = () => {
        const notifications = useInAppNotifications({ enabled: true });
        const contacts = useContactsApi('testuser', true);

        return (
          <div>
            <div data-testid="notifications-count">{notifications.unreadCount}</div>
            <div data-testid="contacts-count">{contacts.contacts.length}</div>
            <div data-testid="contacts-error">{contacts.error}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Wait for hooks to attempt API calls
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Verify components render without crashing
      expect(screen.getByTestId('notifications-count')).toBeInTheDocument();
      expect(screen.getByTestId('contacts-count')).toBeInTheDocument();
      
      // Verify error states are handled
      await waitFor(() => {
        const errorElement = screen.getByTestId('contacts-error');
        expect(errorElement.textContent).toBeTruthy();
      });
    });
  });

  describe('Error Logging', () => {
    it('should log all network errors for debugging', async () => {
      const { useInAppNotifications } = await import('../features/notifications/model/useInAppNotifications.js');
      const { useContactsApi } = await import('../features/contacts/model/useContactsApi.js');

      const TestComponent = () => {
        useInAppNotifications({ enabled: true });
        useContactsApi('testuser', true);
        return <div>Test</div>;
      };

      render(<TestComponent />);

      await waitFor(() => {
        // Verify errors are logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error'),
          expect.any(Error)
        );
      });
    });
  });

  describe('Graceful Degradation', () => {
    it('should maintain UI functionality during network outages', async () => {
      const { useContactsApi } = await import('../features/contacts/model/useContactsApi.js');

      const TestComponent = () => {
        const contacts = useContactsApi('testuser', true);
        
        return (
          <div>
            <button 
              data-testid="retry-button"
              onClick={() => contacts.loadContacts()}
            >
              Retry
            </button>
            <div data-testid="contacts-list">
              {contacts.contacts.length === 0 ? 'No contacts' : 'Has contacts'}
            </div>
          </div>
        );
      };

      render(<TestComponent />);

      // Verify UI renders
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      expect(screen.getByTestId('contacts-list')).toBeInTheDocument();
      
      // Verify retry functionality still works
      const retryButton = screen.getByTestId('retry-button');
      retryButton.click();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover when network is restored', async () => {
      const { apiGet } = await import('../apiClient.js');
      
      // First call fails
      apiGet.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const { useContactsApi } = await import('../features/contacts/model/useContactsApi.js');

      const TestComponent = () => {
        const contacts = useContactsApi('testuser', true);
        return (
          <div>
            <div data-testid="contacts-count">{contacts.contacts.length}</div>
            <div data-testid="contacts-error">{contacts.error}</div>
          </div>
        );
      };

      const { rerender } = render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('contacts-error').textContent).toBeTruthy();
      });

      // Second call succeeds (network restored)
      apiGet.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: [{ id: 1, contact_name: 'Test' }] }),
      });

      // Trigger reload
      rerender(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('contacts-count').textContent).toBe('1');
      });
    });
  });
});

