/**
 * useInputChange Hook
 *
 * Handles basic input change logic:
 * - Updates input message state
 */

import React from 'react';

/**
 * Hook for handling input changes
 * @param {Function} setInputMessage - Set input message function
 * @returns {Function} handleInputChange function
 */
export function useInputChange(setInputMessage) {
  const handleInputChange = React.useCallback(
    e => {
      const value = e.target.value;
      setInputMessage(value);
    },
    [setInputMessage]
  );

  return { handleInputChange };
}

