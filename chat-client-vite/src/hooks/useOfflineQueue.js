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

const OFFLINE_QUEUE_KEY = 'liaizen_offline_queue';

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
        const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
        if (stored) {
          const queue = JSON.parse(stored);
          setQueueSize(Array.isArray(queue) ? queue.length : 0);
        } else {
          setQueueSize(0);
        }
      } catch (error) {
        console.warn('[useOfflineQueue] Error reading queue:', error);
        setQueueSize(0);
      }
    };

    updateQueueSize();

    // Listen for storage changes (queue updates)
    const handleStorageChange = (e) => {
      if (e.key === OFFLINE_QUEUE_KEY) {
        updateQueueSize();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll for changes (in case storage event doesn't fire in same tab)
    const interval = setInterval(updateQueueSize, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return queueSize;
}

export default useOfflineQueue;

