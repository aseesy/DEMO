import { useState, useEffect, useCallback } from 'react';
import { coachingService } from '../../services/chat';

/**
 * useCoaching - React hook for AI coaching state
 *
 * Simply subscribes to CoachingService.
 * Re-renders ONLY when coaching state changes.
 */
export function useCoaching() {
  const [state, setState] = useState(coachingService.getState());

  useEffect(() => {
    return coachingService.subscribe(setState);
  }, []);

  const dismiss = useCallback(() => coachingService.dismiss(), []);
  const acceptRewrite = useCallback(index => coachingService.acceptRewrite(index), []);

  return {
    ...state,
    dismiss,
    acceptRewrite,
  };
}

export default useCoaching;
