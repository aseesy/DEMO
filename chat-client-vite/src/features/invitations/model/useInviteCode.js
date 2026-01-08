/**
 * useInviteCode - Shared hook for invite code generation and acceptance
 *
 * This hook provides all the shared logic for both InviteCoParentPage (full page)
 * and InviteTaskModal (modal). It handles:
 * - Generating invite codes
 * - Accepting invite codes
 * - State management (generatedCode, enteredCode, error, loading, copied)
 * - Copy message generation
 *
 * @param {Object} options
 * @param {string} options.initialCode - Pre-filled code from URL or storage
 * @returns {Object} Invite code state and handlers
 */
import React from 'react';
import { apiPost } from '../../../apiClient.js';
import { INVITE_COPY_MESSAGE_TEMPLATE } from '../constants.js';

/**
 * useInviteCode - Shared hook for invite code generation and acceptance
 *
 * This hook provides all the shared logic for both InviteCoParentPage (full page)
 * and InviteTaskModal (modal). It handles:
 * - Generating invite codes
 * - Accepting invite codes
 * - State management (generatedCode, enteredCode, error, loading, copied)
 * - Copy message generation
 *
 * @param {Object} options
 * @param {string} options.initialCode - Pre-filled code from URL or storage
 * @returns {Object} Invite code state and handlers
 */

export function useInviteCode({ initialCode = '', resetOnClose = false, isOpen = true } = {}) {
  const [generatedCode, setGeneratedCode] = React.useState('');
  const [enteredCode, setEnteredCode] = React.useState(initialCode || '');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Update enteredCode when initialCode changes
  React.useEffect(() => {
    if (initialCode) {
      setEnteredCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  /**
   * Generate a new invite code
   */
  const handleGenerateCode = React.useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiPost('/api/invitations/generate-code');
      const data = await response.json();
      if (response.ok && data.shortCode) {
        setGeneratedCode(data.shortCode);
      } else {
        setError(data.error || 'Failed to generate code');
      }
    } catch {
      setError('Failed to generate code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Copy the generated code with invitation message to clipboard
   */
  const handleCopyCode = React.useCallback(async () => {
    if (!generatedCode) return;

    try {
      const message = INVITE_COPY_MESSAGE_TEMPLATE.replace('{code}', generatedCode);
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy');
    }
  }, [generatedCode]);

  /**
   * Accept an invite code
   */
  const handleAcceptCode = React.useCallback(async () => {
    if (!enteredCode.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await apiPost('/api/invitations/accept-code', {
        code: enteredCode.trim().toUpperCase(),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        // Reset state on success
        setEnteredCode('');
        setError('');
        return { success: true, data };
      } else {
        setError(data.error || 'Invalid or expired code');
        return { success: false, error: data.error || 'Invalid or expired code' };
      }
    } catch {
      setError('Failed to connect. Please try again.');
      return { success: false, error: 'Failed to connect. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, [enteredCode]);

  // Reset state when modal closes (if resetOnClose is true)
  React.useEffect(() => {
    if (resetOnClose && !isOpen) {
      setGeneratedCode('');
      setEnteredCode(initialCode || '');
      setError('');
      setIsLoading(false);
      setCopied(false);
    }
  }, [resetOnClose, isOpen, initialCode]);

  /**
   * Reset all state (useful when modal closes or component unmounts)
   */
  const reset = React.useCallback(() => {
    setGeneratedCode('');
    setEnteredCode(initialCode || '');
    setError('');
    setIsLoading(false);
    setCopied(false);
  }, [initialCode]);

  return {
    // State
    generatedCode,
    enteredCode,
    error,
    isLoading,
    copied,

    // Setters
    setEnteredCode: (value) => setEnteredCode(value?.toUpperCase() || ''),

    // Handlers
    handleGenerateCode,
    handleCopyCode,
    handleAcceptCode,
    reset,
  };
}

export default useInviteCode;

