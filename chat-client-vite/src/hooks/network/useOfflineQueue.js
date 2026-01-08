/**
 * useOfflineQueue Hook
 *
 * Single Responsibility: Track offline message queue size.
 *
 * Provides:
 * - Current queue size
 * - Queue state updates
 */

import { useState, useEffect } from 'react';
import { storage, StorageKeys } from '../../adapters/storage';

/**
 * Hook to track offline message queue size
 *
 * @returns {number} Current queue size
 */
export function useOfflineQueue() {
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    // Initial load
    const updateQueueSize = () => {
      try {
        const queue = storage.get(StorageKeys.OFFLINE_QUEUE);
        setQueueSize(Array.isArray(queue) ? queue.length : 0);
      } catch (error) {
        console.warn('[useOfflineQueue] Error reading queue:', error);
        setQueueSize(0);
      }
    };

    updateQueueSize();

    // Listen for storage changes (queue updates)
    const handleStorageChange = e => {
      if (e.key === StorageKeys.OFFLINE_QUEUE) {
        updateQueueSize();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll for changes (in case storage event doesn't fire in same tab)
    // Reduced from 1s to 5s to prevent CPU overheating
    // Storage events should handle most updates, polling is just a fallback
    const interval = setInterval(() => {
      // Only update if page is visible to save CPU
      if (document.visibilityState === 'visible') {
        updateQueueSize();
      }
    }, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return queueSize;
}

export default useOfflineQueue;
