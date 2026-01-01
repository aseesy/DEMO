import { useState } from 'react';

/**
 * useDraftCoaching Hook
 *
 * Responsibility: Draft coaching/intervention state management ONLY
 *
 * What it does:
 * - Manages draftCoaching object state (AI intervention data)
 * - Provides setter for socket event handlers
 *
 * What it does NOT do:
 * - ❌ Socket connection management
 * - ❌ Socket event handling (done in draftCoachingHandlers.js)
 * - ❌ AI mediation logic (done on server)
 * - ❌ Message blocking/removal (done in handlers)
 */
export function useDraftCoaching() {
  const [draftCoaching, setDraftCoaching] = useState(null);

  return {
    draftCoaching,
    setDraftCoaching,
  };
}

export default useDraftCoaching;
