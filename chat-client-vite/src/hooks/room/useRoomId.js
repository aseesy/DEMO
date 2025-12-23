/**
 * useRoomId Hook
 *
 * Responsibility: Room ID fetching and state management ONLY
 *
 * What it does:
 * - Fetches roomId from API endpoint
 * - Manages roomId state
 * - Handles username changes (clears roomId)
 * - Handles authentication state changes
 *
 * What it does NOT do:
 * - ❌ Socket connection management
 * - ❌ Thread management
 * - ❌ Message management
 * - ❌ Any business logic beyond fetching roomId
 *
 * Architecture:
 *   useRoomId (this hook)
 *     ↓
 *   HTTP API (/api/room/:username)
 *     ↓
 *   Returns roomId or null
 */

import React from 'react';
import { API_BASE_URL } from '../../config.js';

/**
 * useRoomId - Fetches and manages room ID for authenticated user
 *
 * @param {string} username - Current user's username
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Object} { roomId, isLoading, error, setRoomId }
 */
export function useRoomId(username, isAuthenticated) {
  const [roomId, setRoomId] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const previousUsernameRef = React.useRef(username);

  React.useEffect(() => {
    // Clear roomId if username changed (user switched accounts)
    if (previousUsernameRef.current !== username) {
      setRoomId(null);
      setError(null);
      previousUsernameRef.current = username;
    }

    if (!isAuthenticated || !username) {
      setRoomId(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchRoomId() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/room/${encodeURIComponent(username)}`);
        
        if (cancelled) return;

        if (!response.ok) {
          if (response.status === 404) {
            // User doesn't have a room yet - this is okay, threads will be empty
            setRoomId(null);
            setIsLoading(false);
            return;
          }
          throw new Error(`Failed to fetch room: ${response.statusText}`);
        }

        const room = await response.json();
        
        if (cancelled) return;

        if (room?.roomId) {
          setRoomId(room.roomId);
        } else {
          setRoomId(null);
        }
      } catch (err) {
        if (cancelled) return;
        
        console.error('[useRoomId] Error getting user room:', err);
        // Don't set error for 404 - user just doesn't have a room yet
        if (!err.message.includes('404')) {
          setError(err.message);
        }
        setRoomId(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchRoomId();

    return () => {
      cancelled = true;
    };
  }, [username, isAuthenticated]);

  return {
    roomId,
    isLoading,
    error,
    setRoomId, // Allow external updates (e.g., from socket join_success event)
  };
}

export default useRoomId;

