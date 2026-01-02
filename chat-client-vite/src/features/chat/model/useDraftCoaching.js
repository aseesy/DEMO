import { useState, useEffect } from 'react';
import { socketService } from '../../../services/socket/index.js';

/**
 * useDraftCoaching Hook
 *
 * Responsibility: Draft coaching/intervention state AND subscriptions
 *
 * What it does:
 * - Manages draftCoaching object state (AI intervention data)
 * - Subscribes to coaching socket events
 *
 * What it does NOT do:
 * - ❌ Socket connection management
 * - ❌ AI mediation logic (done on server)
 * - ❌ Message blocking/removal (done in message handlers)
 */
export function useDraftCoaching() {
  const [draftCoaching, setDraftCoaching] = useState(null);

  // Subscribe to coaching events
  useEffect(() => {
    const unsubscribes = [];

    unsubscribes.push(
      socketService.subscribe('draft_coaching', data => {
        setDraftCoaching(data);
      })
    );

    unsubscribes.push(
      socketService.subscribe('coaching_dismissed', () => {
        setDraftCoaching(null);
      })
    );

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  return {
    draftCoaching,
    setDraftCoaching,
  };
}

export default useDraftCoaching;
