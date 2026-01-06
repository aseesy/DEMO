/**
 * TanStack Query Client Configuration
 *
 * Provides a configured QueryClient with sensible defaults for the application.
 * Integrates with apiClient.js for authentication and error handling.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure QueryClient instance
 *
 * Defaults:
 * - staleTime: 30 seconds - data is fresh for 30s, won't refetch
 * - cacheTime: 5 minutes - cached data kept for 5min after last use
 * - retry: 1 - retry failed requests once
 * - refetchOnWindowFocus: true - refetch when user returns to tab
 * - refetchOnReconnect: true - refetch when network reconnects
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
