# TanStack Query Migration Summary

## Overview

Migrated data fetching from custom `useAsyncOperation` hook to **TanStack Query (React Query)** for better caching, request deduplication, background refetching, and optimistic updates.

## What Was Done

### ✅ Completed

1. **Installed TanStack Query**
   - Added `@tanstack/react-query` package

2. **Set up QueryClient**
   - Created `src/lib/queryClient.js` with sensible defaults:
     - `staleTime: 30s` - data is fresh for 30 seconds
     - `gcTime: 5min` - cached data kept for 5 minutes
     - Automatic retry, refetch on window focus/reconnect

3. **Added QueryClientProvider**
   - Wrapped app in `QueryClientProvider` in `App.jsx`
   - Positioned after `ErrorBoundary` but before other providers

4. **Migrated useTasks Hook**
   - Created `src/features/tasks/model/useTaskQueries.js` with:
     - `useTasksQuery` - fetch tasks with filters
     - `useUpdateTaskStatusMutation` - update task status
     - `useSaveTaskMutation` - create/update tasks
     - `useDeleteTaskMutation` - delete tasks
   - Updated `useTasks.js` to use TanStack Query hooks
   - Removed manual loading/error state management
   - Automatic cache invalidation after mutations

5. **Migrated useProfile Hook**
   - Created `src/features/profile/model/useProfileQueries.js` with:
     - `useProfileQuery` - fetch profile data
     - `useSaveProfileMutation` - save profile
     - `useSaveProfileSectionMutation` - save profile section
     - `useUpdatePrivacySettingsMutation` - update privacy settings
   - Updated `useProfile.js` to use TanStack Query hooks
   - Automatic cache invalidation after mutations

6. **Removed Unused Code**
   - Deleted `src/hooks/async/useAsyncOperation.js` (never used in production)
   - Deleted `src/hooks/async/index.js`
   - Updated `src/hooks/index.js` to remove async hooks export
   - Updated tests to remove async hooks tests

## Benefits

### Before (Custom Hook)

- ❌ Manual loading/error state management
- ❌ No request caching
- ❌ No request deduplication
- ❌ Manual race condition handling
- ❌ Manual cache invalidation (`loadTasks()` calls everywhere)
- ❌ No background refetching
- ❌ No optimistic updates

### After (TanStack Query)

- ✅ Automatic loading/error states
- ✅ Intelligent caching with configurable stale times
- ✅ Automatic request deduplication
- ✅ Built-in race condition handling
- ✅ Automatic cache invalidation after mutations
- ✅ Background refetching (stale-while-revalidate)
- ✅ Optimistic updates support
- ✅ Better loading states (`isLoading`, `isFetching`, `isRefetching`)

## Migration Pattern

For migrating other hooks, follow this pattern:

### 1. Create Query Hooks File

```javascript
// src/features/[feature]/model/use[Feature]Queries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../apiClient.js';

// Query key factory
export const [feature]QueryKeys = {
  all: ['[feature]'],
  lists: () => [...[feature]QueryKeys.all, 'list'],
  list: (filters) => [...[feature]QueryKeys.lists(), filters],
};

// Query hook
export function use[Feature]Query(params) {
  return useQuery({
    queryKey: [feature]QueryKeys.list(params),
    queryFn: async () => {
      const response = await apiGet('/api/[feature]');
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      return await response.json();
    },
    enabled: !!params.username, // or other condition
    staleTime: 30 * 1000,
  });
}

// Mutation hook
export function useSave[Feature]Mutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await apiPut('/api/[feature]', data);
      if (!response.ok) {
        throw new Error('Failed to save');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [feature]QueryKeys.lists() });
    },
  });
}
```

### 2. Update Feature Hook

```javascript
// src/features/[feature]/model/use[Feature].js
import { use[Feature]Query, useSave[Feature]Mutation } from './use[Feature]Queries.js';

export function use[Feature](username) {
  // Replace manual state with query
  const { data, isLoading, error, refetch } = use[Feature]Query({ username });

  // Replace manual mutations
  const saveMutation = useSave[Feature]Mutation();

  // Use mutation in handlers
  const save = async (data) => {
    try {
      await saveMutation.mutateAsync(data);
      // Cache automatically invalidated, no manual refetch needed
    } catch (err) {
      // Handle error
    }
  };

  return {
    data: data || [],
    isLoading,
    error: error?.message,
    save,
    refetch, // Expose for manual refresh if needed
  };
}
```

## Remaining Hooks to Migrate

The following hooks still use manual data fetching and should be migrated:

1. **useContactsApi** (`src/features/contacts/model/useContactsApi.js`)
   - Fetches contacts, activities
   - Creates/updates/deletes contacts

2. **useNotificationData** (`src/features/notifications/model/useNotificationData.js`)
   - Fetches notifications
   - Updates notification status

3. **useInAppNotifications** (`src/features/notifications/model/useInAppNotifications.js`)
   - Fetches in-app notifications

4. **useRoomId** (`src/hooks/room/useRoomId.js`)
   - Fetches room ID

5. **useMediationContext** (`src/features/chat/hooks/useMediationContext.js`)
   - Fetches mediation data

6. **Other hooks** that use `apiGet`, `apiPost`, `apiPut`, `apiDelete` directly

## Testing

When migrating hooks, update tests to:

1. Wrap components in `QueryClientProvider`:

```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

render(
  <QueryClientProvider client={queryClient}>
    <YourComponent />
  </QueryClientProvider>
);
```

2. Use `waitFor` for async queries:

```javascript
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

3. Mock queries if needed:

```javascript
import { useQuery } from '@tanstack/react-query';
vi.mock('@tanstack/react-query');
```

## Configuration

Query client configuration is in `src/lib/queryClient.js`. Adjust defaults as needed:

- `staleTime`: How long data is considered fresh (default: 30s)
- `gcTime`: How long unused data stays in cache (default: 5min)
- `retry`: Number of retries on failure (default: 1)
- `refetchOnWindowFocus`: Refetch when user returns to tab (default: true)

## Notes

- `apiClient.js` is still used and works perfectly with TanStack Query
- TanStack Query handles auth errors automatically (they're thrown as errors)
- Cache invalidation happens automatically after mutations
- No need to manually call `loadTasks()` or similar - queries refetch automatically

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [TanStack Query Migration Guide](https://tanstack.com/query/latest/docs/react/guides/migrating-to-react-query-4)
