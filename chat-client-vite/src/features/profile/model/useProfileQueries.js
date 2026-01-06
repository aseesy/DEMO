/**
 * TanStack Query hooks for Profile
 *
 * Provides data fetching and mutations for profile with automatic caching,
 * background refetching, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '../../../apiClient.js';
import { transformProfileFromApi } from '../../../services/profile/ProfileTransformService.js';

/**
 * Query key factory for profile
 */
export const profileQueryKeys = {
  all: ['profile'],
  me: () => [...profileQueryKeys.all, 'me'],
  privacySettings: () => [...profileQueryKeys.all, 'privacy'],
  preview: () => [...profileQueryKeys.all, 'preview'],
};

/**
 * Hook to fetch current user's profile
 *
 * @param {string} username - Username
 * @param {boolean} enabled - Whether the query should run (default: true)
 * @returns {Object} Query result with { data, isLoading, error, refetch }
 */
export function useProfileQuery(username, enabled = true) {
  return useQuery({
    queryKey: profileQueryKeys.me(),
    queryFn: async () => {
      if (!username) {
        return null;
      }

      const response = await apiGet('/api/profile/me');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch profile');
      }

      const data = await response.json();

      // Transform API data to UI format
      const profileData = transformProfileFromApi(data, username);

      return {
        profileData,
        privacySettings: data.privacySettings || {
          personalVisibility: 'shared',
          workVisibility: 'private',
          healthVisibility: 'private',
          financialVisibility: 'private',
          backgroundVisibility: 'shared',
          fieldOverrides: {},
        },
        isOwnProfile: data.isOwnProfile !== false,
      };
    },
    enabled: enabled && !!username,
    staleTime: 60 * 1000, // 1 minute - profile data can be stale for 1min
  });
}

/**
 * Mutation hook to save profile
 *
 * @returns {Object} Mutation object with { mutate, mutateAsync, isLoading, error }
 */
export function useSaveProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, profileData: profileDataToSave }) => {
      const { username: newUsernameFromProfile, ...profileDataWithoutUsername } = profileDataToSave;

      const requestBody = {
        currentUsername: username,
        username: newUsernameFromProfile || username,
        ...profileDataWithoutUsername,
      };

      const response = await apiPut('/api/profile/me', requestBody);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || `Failed to save profile (Status: ${response.status})`
        );
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate profile query to refetch with updated data
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.me() });

      // Update username in localStorage if it changed
      if (data.username && data.username !== variables.username) {
        localStorage.setItem('username', data.username);
      }
    },
  });
}

/**
 * Mutation hook to save a specific profile section
 *
 * @returns {Object} Mutation object with { mutate, mutateAsync, isLoading, error }
 */
export function useSaveProfileSectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, sectionFields, profileData: profileDataToSave }) => {
      const requestBody = {
        currentUsername: username,
      };

      // Only include the specified fields
      for (const field of sectionFields) {
        if (profileDataToSave[field] !== undefined) {
          requestBody[field] = profileDataToSave[field];
        }
      }

      const response = await apiPut('/api/profile/me', requestBody);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to save profile section');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate profile query to refetch with updated data
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.me() });
    },
  });
}

/**
 * Mutation hook to update privacy settings
 *
 * @returns {Object} Mutation object with { mutate, mutateAsync, isLoading, error }
 */
export function useUpdatePrivacySettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async privacySettings => {
      const response = await apiPut('/api/profile/privacy-settings', privacySettings);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update privacy settings');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate both profile and privacy settings queries
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.me() });
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.privacySettings() });
    },
  });
}

/**
 * Query hook to fetch privacy settings
 *
 * @param {string} username - Username
 * @param {boolean} enabled - Whether the query should run (default: true)
 * @returns {Object} Query result with { data, isLoading, error, refetch }
 */
export function usePrivacySettingsQuery(username, enabled = true) {
  return useQuery({
    queryKey: profileQueryKeys.privacySettings(),
    queryFn: async () => {
      const response = await apiGet('/api/profile/privacy-settings');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch privacy settings');
      }

      return await response.json();
    },
    enabled: enabled && !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes - privacy settings don't change often
  });
}
