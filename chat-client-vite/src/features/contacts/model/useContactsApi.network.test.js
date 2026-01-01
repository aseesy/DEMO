/**
 * useContactsApi Network Failure Tests
 * 
 * Tests that detect errors when backend server is unavailable:
 * - Connection refused errors during contact loading
 * - Error state management
 * - Graceful degradation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useContactsApi } from './useContactsApi.js';

// Mock the API client
vi.mock('../../../apiClient.js', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

// Mock relationship mapping
vi.mock('../../../utils/relationshipMapping.js', () => ({
  toBackendRelationship: vi.fn(value => value?.toLowerCase() || ''),
  toDisplayRelationship: vi.fn(value => {
    const mapping = {
      'my child': 'My Child',
      'co-parent': 'My Co-Parent',
    };
    return mapping[value?.toLowerCase()] || value || '';
  }),
}));

// Mock contact mapper
vi.mock('./contactMapper.js', () => ({
  mapFormDataToContact: vi.fn((formData) => ({ ...formData })),
}));

// Mock console.error
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

import { apiGet } from '../../../apiClient.js';

describe('useContactsApi - Network Failure Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('Connection Refused Errors', () => {
    it('should handle ERR_CONNECTION_REFUSED during contact loading', async () => {
      const connectionRefusedError = new TypeError('Failed to fetch');
      connectionRefusedError.message = 'Failed to fetch';
      
      apiGet.mockRejectedValueOnce(connectionRefusedError);

      const { result } = renderHook(() => useContactsApi('testuser', true));

      await waitFor(() => {
        expect(apiGet).toHaveBeenCalledWith('/api/contacts');
      });

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading contacts:',
        expect.any(TypeError)
      );

      // Verify error state is set
      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load contacts');
      });

      // Verify loading state is cleared
      expect(result.current.isLoadingContacts).toBe(false);
      
      // Verify contacts array is empty
      expect(result.current.contacts).toHaveLength(0);
    });

    it('should handle network errors during contact save', async () => {
      const { apiPost } = await import('../../../apiClient.js');
      const networkError = new Error('Network request failed');
      apiPost.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useContactsApi('testuser', true));

      // Mock initial load to succeed
      apiGet.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: [] }),
      });

      await act(async () => {
        await result.current.loadContacts();
      });

      // Try to save a contact
      await act(async () => {
        const saved = await result.current.saveContact({
          contact_name: 'Test Contact',
          relationship: 'My Child',
        });
        expect(saved).toBeNull();
      });

      // Verify error state
      await waitFor(() => {
        expect(result.current.error).toContain('Failed to save contact');
      });
    });
  });

  describe('Error State Management', () => {
    it('should set error state on network failure', async () => {
      const connectionRefusedError = new TypeError('Failed to fetch');
      apiGet.mockRejectedValueOnce(connectionRefusedError);

      const { result } = renderHook(() => useContactsApi('testuser', true));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load contacts');
      });
    });

    it('should clear error state on successful retry', async () => {
      // First call fails
      const connectionRefusedError = new TypeError('Failed to fetch');
      apiGet.mockRejectedValueOnce(connectionRefusedError);

      const { result } = renderHook(() => useContactsApi('testuser', true));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load contacts');
      });

      // Second call succeeds
      apiGet.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: [{ id: 1, contact_name: 'Test' }] }),
      });

      await act(async () => {
        await result.current.loadContacts();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('');
        expect(result.current.contacts).toHaveLength(1);
      });
    });
  });

  describe('Graceful Degradation', () => {
    it('should return empty contacts array on network failure', async () => {
      const connectionRefusedError = new TypeError('Failed to fetch');
      apiGet.mockRejectedValueOnce(connectionRefusedError);

      const { result } = renderHook(() => useContactsApi('testuser', true));

      await waitFor(() => {
        expect(result.current.contacts).toHaveLength(0);
      });
    });

    it('should not crash when network fails during initial load', async () => {
      const connectionRefusedError = new TypeError('Failed to fetch');
      apiGet.mockRejectedValueOnce(connectionRefusedError);

      const { result } = renderHook(() => useContactsApi('testuser', true));

      // Should not throw
      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.contacts).toBeDefined();
      });
    });
  });
});

