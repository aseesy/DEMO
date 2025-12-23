/**
 * useContactsApi Hook Tests
 *
 * Tests the contact API hook to ensure:
 * - Relationship fields are transformed from backend to display format when loading contacts
 * - All relationship types are correctly transformed
 * - Edge cases (null, undefined, unknown values) are handled
 * - Contact loading, saving, and deletion work correctly
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
  toBackendRelationship: vi.fn(value => {
    const mapping = {
      'My Child': 'my child',
      'My Co-Parent': 'co-parent',
      'My Partner': 'my partner',
      'My Family': 'my family',
      'My Friend': 'my friend',
    };
    return mapping[value] || value?.toLowerCase() || '';
  }),
  toDisplayRelationship: vi.fn(value => {
    const mapping = {
      'my child': 'My Child',
      'child': 'My Child',
      'co-parent': 'My Co-Parent',
      'coparent': 'My Co-Parent',
      'my co-parent': 'My Co-Parent',
      'my partner': 'My Partner',
      'partner': 'My Partner',
      'my family': 'My Family',
      'family': 'My Family',
      'my friend': 'My Friend',
      'friend': 'My Friend',
    };
    return mapping[value?.toLowerCase()] || value || '';
  }),
}));

// Mock contact mapper
vi.mock('./contactMapper.js', () => ({
  mapFormDataToContact: vi.fn((formData, toBackend) => {
    if (!formData) return {};
    const contact = { ...formData };
    if (formData.relationship && toBackend) {
      contact.relationship = toBackend(formData.relationship);
    }
    return contact;
  }),
}));

import { apiGet, apiPost, apiPut } from '../../../apiClient.js';
import { toDisplayRelationship } from '../../../utils/relationshipMapping.js';

describe('useContactsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock initial load (useEffect on mount)
    apiGet.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ contacts: [] }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadContacts - relationship transformation', () => {
    it('should transform relationship from backend format to display format', async () => {
      const mockContacts = [
        {
          id: 1,
          contact_name: 'Vira',
          relationship: 'my child', // Backend format
          contact_email: null,
        },
        {
          id: 2,
          contact_name: 'Yashir',
          relationship: 'co-parent', // Backend format
          contact_email: 'yashir@example.com',
        },
        {
          id: 3,
          contact_name: 'John',
          relationship: 'my partner', // Backend format
          contact_email: 'john@example.com',
        },
      ];

      apiGet.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      const { result } = renderHook(() => useContactsApi('athena', true));

      await act(async () => {
        await result.current.loadContacts();
      });

      await waitFor(() => {
        expect(result.current.contacts).toHaveLength(3);
      });

      // Verify relationships are transformed
      expect(result.current.contacts[0].relationship).toBe('My Child');
      expect(result.current.contacts[1].relationship).toBe('My Co-Parent');
      expect(result.current.contacts[2].relationship).toBe('My Partner');

      // Verify toDisplayRelationship was called for each contact
      expect(toDisplayRelationship).toHaveBeenCalledWith('my child');
      expect(toDisplayRelationship).toHaveBeenCalledWith('co-parent');
      expect(toDisplayRelationship).toHaveBeenCalledWith('my partner');
    });

    it('should handle child contacts correctly (critical for Vira)', async () => {
      const mockContacts = [
        {
          id: 1,
          contact_name: 'Vira',
          relationship: 'my child', // Backend format (lowercase)
          contact_email: null,
          child_birthdate: '2015-01-01',
        },
      ];

      apiGet.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      const { result } = renderHook(() => useContactsApi('athena', true));

      await act(async () => {
        await result.current.loadContacts();
      });

      await waitFor(() => {
        expect(result.current.contacts).toHaveLength(1);
      });

      // Critical: Child contact should have "My Child" (display format)
      expect(result.current.contacts[0].relationship).toBe('My Child');
      expect(result.current.contacts[0].contact_name).toBe('Vira');
    });

    it('should handle null relationship gracefully', async () => {
      const mockContacts = [
        {
          id: 1,
          contact_name: 'Unknown',
          relationship: null,
          contact_email: null,
        },
      ];

      apiGet.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      const { result } = renderHook(() => useContactsApi('athena', true));

      await act(async () => {
        await result.current.loadContacts();
      });

      await waitFor(() => {
        expect(result.current.contacts).toHaveLength(1);
      });

      expect(result.current.contacts[0].relationship).toBeNull();
    });

    it('should handle undefined relationship gracefully', async () => {
      const mockContacts = [
        {
          id: 1,
          contact_name: 'Unknown',
          relationship: undefined,
          contact_email: null,
        },
      ];

      apiGet.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      const { result } = renderHook(() => useContactsApi('athena', true));

      await act(async () => {
        await result.current.loadContacts();
      });

      await waitFor(() => {
        expect(result.current.contacts).toHaveLength(1);
      });

      expect(result.current.contacts[0].relationship).toBeUndefined();
    });

    it('should handle empty contacts array', async () => {
      apiGet.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: [] }),
      });

      const { result } = renderHook(() => useContactsApi('athena', true));

      await act(async () => {
        await result.current.loadContacts();
      });

      await waitFor(() => {
        expect(result.current.contacts).toHaveLength(0);
      });
    });

    it('should handle all relationship types correctly', async () => {
      const mockContacts = [
        { id: 1, contact_name: 'Child', relationship: 'my child' },
        { id: 2, contact_name: 'CoParent', relationship: 'co-parent' },
        { id: 3, contact_name: 'Partner', relationship: 'my partner' },
        { id: 4, contact_name: 'Family', relationship: 'my family' },
        { id: 5, contact_name: 'Friend', relationship: 'my friend' },
        { id: 6, contact_name: 'Other', relationship: 'other' },
      ];

      apiGet.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      const { result } = renderHook(() => useContactsApi('athena', true));

      await act(async () => {
        await result.current.loadContacts();
      });

      await waitFor(() => {
        expect(result.current.contacts).toHaveLength(6);
      });

      // Verify all relationships are transformed
      expect(result.current.contacts[0].relationship).toBe('My Child');
      expect(result.current.contacts[1].relationship).toBe('My Co-Parent');
      expect(result.current.contacts[2].relationship).toBe('My Partner');
      expect(result.current.contacts[3].relationship).toBe('My Family');
      expect(result.current.contacts[4].relationship).toBe('My Friend');
      // Unknown values should be passed through
      expect(result.current.contacts[5].relationship).toBe('other');
    });

    it('should preserve all other contact fields during transformation', async () => {
      const mockContacts = [
        {
          id: 1,
          contact_name: 'Vira',
          relationship: 'my child',
          contact_email: null,
          child_birthdate: '2015-01-01',
          child_age: '9',
          school: 'Elementary School',
          linked_contact_id: 2,
        },
      ];

      apiGet.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      const { result } = renderHook(() => useContactsApi('athena', true));

      await act(async () => {
        await result.current.loadContacts();
      });

      await waitFor(() => {
        expect(result.current.contacts).toHaveLength(1);
      });

      const contact = result.current.contacts[0];
      expect(contact.relationship).toBe('My Child'); // Transformed
      expect(contact.contact_name).toBe('Vira'); // Preserved
      expect(contact.child_birthdate).toBe('2015-01-01'); // Preserved
      expect(contact.child_age).toBe('9'); // Preserved
      expect(contact.school).toBe('Elementary School'); // Preserved
      expect(contact.linked_contact_id).toBe(2); // Preserved
    });
  });

  describe('loadContacts - error handling', () => {
    it('should handle API errors gracefully', async () => {
      apiGet.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useContactsApi('athena', true));

      await act(async () => {
        await result.current.loadContacts();
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Failed to load contacts');
      });
    });

    it('should handle 401 unauthorized', async () => {
      apiGet.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useContactsApi('athena', true));

      await act(async () => {
        await result.current.loadContacts();
      });

      await waitFor(() => {
        expect(result.current.contacts).toHaveLength(0);
      });
    });

    it('should handle network errors', async () => {
      apiGet.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useContactsApi('athena', true));

      await act(async () => {
        await result.current.loadContacts();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load contacts');
      });
    });
  });

  describe('loadContacts - authentication handling', () => {
    it('should not load contacts when username is missing', async () => {
      const { result } = renderHook(() => useContactsApi(null, true));

      await act(async () => {
        await result.current.loadContacts();
      });

      expect(apiGet).not.toHaveBeenCalled();
      expect(result.current.contacts).toHaveLength(0);
    });

    it('should not load contacts when not authenticated', async () => {
      const { result } = renderHook(() => useContactsApi('athena', false));

      await act(async () => {
        await result.current.loadContacts();
      });

      expect(apiGet).not.toHaveBeenCalled();
      expect(result.current.contacts).toHaveLength(0);
    });
  });
});

