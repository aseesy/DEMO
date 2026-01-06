/**
 * TanStack Query hooks for Tasks
 *
 * Provides data fetching and mutations for tasks with automatic caching,
 * background refetching, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  queryFetchTasks,
  commandUpdateTaskStatus,
  commandSaveTask,
  commandDeleteTask,
} from './taskQueries.js';

/**
 * Query key factory for tasks
 * Centralizes query key generation for consistency
 */
export const taskQueryKeys = {
  all: ['tasks'],
  lists: () => [...taskQueryKeys.all, 'list'],
  list: filters => [...taskQueryKeys.lists(), filters],
  details: () => [...taskQueryKeys.all, 'detail'],
  detail: id => [...taskQueryKeys.details(), id],
};

/**
 * Hook to fetch tasks with filters
 *
 * @param {Object} params
 * @param {string} params.username - Username
 * @param {string} params.search - Search term
 * @param {string} params.filter - Filter type: 'open', 'completed', 'high', 'all'
 * @param {boolean} params.enabled - Whether the query should run (default: true)
 * @returns {Object} Query result with { data, isLoading, error, refetch }
 */
export function useTasksQuery({ username, search = '', filter = 'open', enabled = true }) {
  return useQuery({
    queryKey: taskQueryKeys.list({ username, search, filter }),
    queryFn: async () => {
      if (!username) {
        return { tasks: [] };
      }

      const result = await queryFetchTasks({ username, search, filter });

      if (!result.success) {
        // TanStack Query expects errors to be thrown
        throw new Error(result.error || 'Failed to fetch tasks');
      }

      return result;
    },
    enabled: enabled && !!username,
    staleTime: 30 * 1000, // 30 seconds - tasks can be stale for 30s
  });
}

/**
 * Mutation hook to update task status
 *
 * @returns {Object} Mutation object with { mutate, mutateAsync, isLoading, error }
 */
export function useUpdateTaskStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, username, status }) => {
      const result = await commandUpdateTaskStatus({ taskId, username, status });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update task status');
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate all task lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    },
  });
}

/**
 * Mutation hook to save (create or update) a task
 *
 * @returns {Object} Mutation object with { mutate, mutateAsync, isLoading, error }
 */
export function useSaveTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, taskData, taskId }) => {
      const result = await commandSaveTask({ username, taskData, taskId });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save task');
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate all task lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    },
  });
}

/**
 * Mutation hook to delete a task
 *
 * @returns {Object} Mutation object with { mutate, mutateAsync, isLoading, error }
 */
export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, username }) => {
      const result = await commandDeleteTask({ taskId, username });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete task');
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate all task lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    },
  });
}
