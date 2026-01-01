/**
 * API Client Tests - Network Failure Detection
 * 
 * Tests that detect errors when backend server is unavailable:
 * - Connection refused errors (ERR_CONNECTION_REFUSED)
 * - Network timeouts
 * - Graceful error handling
 * - Error tracking and analytics
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiGet, apiPost, apiPut, apiDelete } from './apiClient.js';

// Mock fetch globally
global.fetch = vi.fn();

// Mock analytics
vi.mock('./utils/analyticsEnhancements.js', () => ({
  trackAPIError: vi.fn(),
  trackAPIResponseTime: vi.fn(),
}));

// Mock token manager
vi.mock('./utils/tokenManager.js', () => ({
  tokenManager: {
    getToken: vi.fn(() => 'mock-token'),
  },
}));

// Mock config
vi.mock('./config.js', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

describe('apiClient - Network Failure Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Connection Refused Errors', () => {
    it('should handle ERR_CONNECTION_REFUSED errors gracefully', async () => {
      const connectionRefusedError = new TypeError('Failed to fetch');
      connectionRefusedError.message = 'Failed to fetch';
      connectionRefusedError.cause = { code: 'ECONNREFUSED' };
      
      global.fetch.mockRejectedValueOnce(connectionRefusedError);

      await expect(apiGet('/api/contacts')).rejects.toThrow('Failed to fetch');
      
      // Verify error was tracked
      const { trackAPIError } = await import('./utils/analyticsEnhancements.js');
      expect(trackAPIError).toHaveBeenCalledWith(
        '/api/contacts',
        0,
        'Failed to fetch'
      );
    });

    it('should handle connection refused for POST requests', async () => {
      const connectionRefusedError = new TypeError('Failed to fetch');
      global.fetch.mockRejectedValueOnce(connectionRefusedError);

      await expect(apiPost('/api/contacts', { name: 'Test' })).rejects.toThrow('Failed to fetch');
      
      const { trackAPIError } = await import('./utils/analyticsEnhancements.js');
      expect(trackAPIError).toHaveBeenCalledWith(
        '/api/contacts',
        0,
        'Failed to fetch'
      );
    });

    it('should handle connection refused for PUT requests', async () => {
      const connectionRefusedError = new TypeError('Failed to fetch');
      global.fetch.mockRejectedValueOnce(connectionRefusedError);

      await expect(apiPut('/api/contacts/1', { name: 'Test' })).rejects.toThrow('Failed to fetch');
      
      const { trackAPIError } = await import('./utils/analyticsEnhancements.js');
      expect(trackAPIError).toHaveBeenCalledWith(
        '/api/contacts/1',
        0,
        'Failed to fetch'
      );
    });

    it('should handle connection refused for DELETE requests', async () => {
      const connectionRefusedError = new TypeError('Failed to fetch');
      global.fetch.mockRejectedValueOnce(connectionRefusedError);

      await expect(apiDelete('/api/contacts/1')).rejects.toThrow('Failed to fetch');
      
      const { trackAPIError } = await import('./utils/analyticsEnhancements.js');
      expect(trackAPIError).toHaveBeenCalledWith(
        '/api/contacts/1',
        0,
        'Failed to fetch'
      );
    });
  });

  describe('Network Timeout Errors', () => {
    it('should handle network timeout errors', async () => {
      const timeoutError = new TypeError('Network request failed');
      timeoutError.message = 'Network request failed';
      
      global.fetch.mockRejectedValueOnce(timeoutError);

      await expect(apiGet('/api/notifications/unread-count')).rejects.toThrow('Network request failed');
      
      const { trackAPIError } = await import('./utils/analyticsEnhancements.js');
      expect(trackAPIError).toHaveBeenCalledWith(
        '/api/notifications/unread-count',
        0,
        'Network request failed'
      );
    });
  });

  describe('Response Time Tracking', () => {
    it('should track response time even when connection fails', async () => {
      const connectionRefusedError = new TypeError('Failed to fetch');
      global.fetch.mockRejectedValueOnce(connectionRefusedError);

      await expect(apiGet('/api/dashboard/updates')).rejects.toThrow();
      
      const { trackAPIResponseTime } = await import('./utils/analyticsEnhancements.js');
      expect(trackAPIResponseTime).toHaveBeenCalledWith(
        '/api/dashboard/updates',
        expect.any(Number)
      );
    });
  });

  describe('Error Message Consistency', () => {
    it('should preserve original error message', async () => {
      const customError = new Error('ERR_CONNECTION_REFUSED');
      global.fetch.mockRejectedValueOnce(customError);

      try {
        await apiGet('/api/contacts');
      } catch (error) {
        expect(error.message).toBe('ERR_CONNECTION_REFUSED');
      }
    });

    it('should handle errors without message', async () => {
      const errorWithoutMessage = new Error();
      global.fetch.mockRejectedValueOnce(errorWithoutMessage);

      await expect(apiGet('/api/contacts')).rejects.toThrow();
      
      const { trackAPIError } = await import('./utils/analyticsEnhancements.js');
      expect(trackAPIError).toHaveBeenCalledWith(
        '/api/contacts',
        0,
        'Network error'
      );
    });
  });
});

