/**
 * useAsyncOperation - Shared async operation state management
 *
 * Eliminates duplication of loading/error state patterns across hooks.
 * Provides consistent async operation handling with automatic state management.
 *
 * Usage:
 *   const { execute, isLoading, error, clearError } = useAsyncOperation();
 *
 *   const fetchData = async () => {
 *     const result = await execute(async () => {
 *       return await apiGet('/api/data');
 *     });
 *     if (result.success) {
 *       setData(result.data);
 *     }
 *   };
 */

import React from 'react';

/**
 * Hook for managing async operation state
 * @param {Object} options - Configuration options
 * @param {Function} options.onError - Optional error callback
 * @param {boolean} options.showAlerts - Show alert() on errors (default: false)
 * @returns {Object} Async operation utilities
 */
export function useAsyncOperation(options = {}) {
  const { onError, showAlerts = false } = options;

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  /**
   * Execute an async operation with automatic state management
   * @param {Function} operation - Async function to execute
   * @param {Object} opts - Per-operation options
   * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
   */
  const execute = React.useCallback(
    async (operation, opts = {}) => {
      const { resetError = true } = opts;

      if (resetError) {
        setError('');
      }
      setIsLoading(true);

      try {
        const data = await operation();
        setIsLoading(false);
        return { success: true, data };
      } catch (err) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        setIsLoading(false);

        if (showAlerts) {
          alert(errorMessage);
        }

        if (onError) {
          onError(err);
        }

        return { success: false, error: errorMessage };
      }
    },
    [onError, showAlerts]
  );

  /**
   * Clear the current error
   */
  const clearError = React.useCallback(() => {
    setError('');
  }, []);

  /**
   * Set a custom error message
   */
  const setErrorMessage = React.useCallback((message) => {
    setError(message);
  }, []);

  return {
    execute,
    isLoading,
    error,
    clearError,
    setError: setErrorMessage,
  };
}

/**
 * Hook for managing multiple named async operations
 * Useful when a component has several independent async operations
 *
 * Usage:
 *   const { execute, isLoading, error } = useMultipleAsyncOperations();
 *
 *   const fetchUsers = () => execute('users', async () => apiGet('/api/users'));
 *   const fetchPosts = () => execute('posts', async () => apiGet('/api/posts'));
 *
 *   if (isLoading('users')) { ... }
 *   if (error('posts')) { ... }
 */
export function useMultipleAsyncOperations() {
  const [loadingStates, setLoadingStates] = React.useState({});
  const [errorStates, setErrorStates] = React.useState({});

  const execute = React.useCallback(async (name, operation) => {
    setErrorStates(prev => ({ ...prev, [name]: '' }));
    setLoadingStates(prev => ({ ...prev, [name]: true }));

    try {
      const data = await operation();
      setLoadingStates(prev => ({ ...prev, [name]: false }));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setErrorStates(prev => ({ ...prev, [name]: errorMessage }));
      setLoadingStates(prev => ({ ...prev, [name]: false }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const isLoading = React.useCallback(
    (name) => loadingStates[name] || false,
    [loadingStates]
  );

  const error = React.useCallback(
    (name) => errorStates[name] || '',
    [errorStates]
  );

  const clearError = React.useCallback((name) => {
    setErrorStates(prev => ({ ...prev, [name]: '' }));
  }, []);

  const clearAllErrors = React.useCallback(() => {
    setErrorStates({});
  }, []);

  return {
    execute,
    isLoading,
    error,
    clearError,
    clearAllErrors,
    // For checking if any operation is loading
    isAnyLoading: Object.values(loadingStates).some(Boolean),
    // For getting all errors
    allErrors: errorStates,
  };
}

export default useAsyncOperation;
