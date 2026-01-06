/**
 * useNetworkStatus Hook
 *
 * Single Responsibility: Detect and track online/offline network state.
 *
 * Provides:
 * - Real-time online/offline status
 * - Connection quality indicators (future)
 * - Automatic reconnection detection
 */

import { useState, useEffect } from 'react';

/**
 * Hook to detect and track network online/offline status
 *
 * @returns {Object} { isOnline, wasOffline, isReconnecting }
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize from navigator.onLine if available
    if (typeof window !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    // Default to true if API not available (assume online)
    return true;
  });

  const [wasOffline, setWasOffline] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('onLine' in navigator)) {
      return;
    }

    const handleOnline = () => {
      console.log('[useNetworkStatus] Network came online');
      setIsOnline(true);
      
      // If we were offline, we're now reconnecting
      if (wasOffline) {
        setIsReconnecting(true);
        // Clear reconnecting state after a short delay
        setTimeout(() => {
          setIsReconnecting(false);
          setWasOffline(false);
        }, 2000);
      }
    };

    const handleOffline = () => {
      console.log('[useNetworkStatus] Network went offline');
      setIsOnline(false);
      setWasOffline(true);
      setIsReconnecting(false);
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return {
    isOnline,
    wasOffline,
    isReconnecting,
  };
}

export default useNetworkStatus;

