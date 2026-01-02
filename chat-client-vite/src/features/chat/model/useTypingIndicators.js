import { useState, useEffect, useRef } from 'react';
import { socketService } from '../../../services/socket/index.js';

/**
 * useTypingIndicators Hook
 *
 * Responsibility: Typing indicator state AND subscriptions
 *
 * What it does:
 * - Manages typingUsers Set state
 * - Subscribes to typing socket events
 * - Filters out own user's typing events
 *
 * What it does NOT do:
 * - ❌ Socket connection management
 * - ❌ Emitting typing events (done in message input)
 *
 * @param {Object} options
 * @param {string} options.username - Current user's username (to filter out)
 */
export function useTypingIndicators({ username } = {}) {
  const [typingUsers, setTypingUsers] = useState(new Set());
  const usernameRef = useRef(username);

  // Keep ref in sync
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  // Subscribe to typing events
  useEffect(() => {
    const unsubscribes = [];

    unsubscribes.push(
      socketService.subscribe('user_typing', data => {
        if (data.username !== usernameRef.current) {
          setTypingUsers(prev => new Set([...prev, data.username]));
        }
      })
    );

    unsubscribes.push(
      socketService.subscribe('user_stopped_typing', data => {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(data.username);
          return next;
        });
      })
    );

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  return {
    typingUsers,
    setTypingUsers,
  };
}

export default useTypingIndicators;
