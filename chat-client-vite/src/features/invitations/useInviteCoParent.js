/**
 * useInviteCoParent - Hook for managing co-parent invitation flow
 *
 * Extracts all state and handlers from InviteCoParentPage.
 * Handles invite generation, code validation, and clipboard operations.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePairing } from '../../hooks/usePairing.js';
import { authStorage } from '../../adapters/storage';
import { NavigationPaths } from '../../adapters/navigation';
import { validateInviteEmail } from '../../utils/validators.js';

/**
 * Get expiration text based on invite type
 * @param {string} inviteType - 'code', 'email', or 'link'
 * @returns {string}
 */
export function getExpirationText(inviteType) {
  if (!inviteType) return 'This invite expires in 7 days';

  switch (inviteType) {
    case 'code':
      return 'This code expires in 15 minutes';
    case 'email':
    case 'link':
    default:
      return 'This invite expires in 7 days';
  }
}

// Re-export for backward compatibility
export { validateInviteEmail };

/**
 * useInviteCoParent hook
 *
 * @returns {Object} State and handlers for invite flow
 */
export function useInviteCoParent() {
  const navigate = useNavigate();
  const {
    createPairing,
    buildInviteUrl,
    buildShareableMessage,
    isCreating,
    isAccepting,
    acceptPairing,
    validateCode,
    isValidating,
    error: pairingError,
    clearError,
  } = usePairing();

  // Form state
  const [inviteeEmail, setInviteeEmail] = React.useState('');
  const [inviteMethod, setInviteMethod] = React.useState('link');
  const [error, setError] = React.useState('');
  const [enteredCode, setEnteredCode] = React.useState('');
  const [codeValidation, setCodeValidation] = React.useState(null);

  // Result state
  const [inviteData, setInviteData] = React.useState(null);

  // Copy states
  const [copied, setCopied] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedMessage, setCopiedMessage] = React.useState(false);

  // Get username from storage
  const username = authStorage.getUsername() || 'Your co-parent';

  /**
   * Generate a new invitation
   */
  const handleGenerateInvite = React.useCallback(async () => {
    setError('');
    clearError();

    if (inviteMethod === 'email') {
      const validation = validateInviteEmail(inviteeEmail);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
    }

    const result = await createPairing(inviteMethod, inviteeEmail.trim() || null);

    if (!result.success) {
      setError(result.error || 'Failed to create invitation');
      return;
    }

    // Mutual invitation detected - instant pairing!
    if (result.mutual) {
      navigate(NavigationPaths.HOME, {
        state: {
          message: 'You are now connected with your co-parent!',
          roomId: result.sharedRoomId,
        },
      });
      return;
    }

    const inviteUrl = result.token ? buildInviteUrl(result.token) : null;
    const shareableMessage = buildShareableMessage(username, result.pairingCode, inviteUrl);

    setInviteData({
      pairingCode: result.pairingCode,
      token: result.token,
      inviteUrl,
      shareableMessage,
      expiresAt: result.expiresAt,
      inviteType: result.inviteType,
    });
  }, [
    inviteMethod,
    inviteeEmail,
    clearError,
    createPairing,
    buildInviteUrl,
    buildShareableMessage,
    username,
    navigate,
  ]);

  /**
   * Copy invite link to clipboard
   */
  const handleCopyLink = React.useCallback(async () => {
    if (!inviteData?.inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteData.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [inviteData?.inviteUrl]);

  /**
   * Copy short code to clipboard
   */
  const handleCopyCode = React.useCallback(async () => {
    if (!inviteData?.pairingCode) return;

    try {
      await navigator.clipboard.writeText(inviteData.pairingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [inviteData?.pairingCode]);

  /**
   * Copy full shareable message
   */
  const handleCopyMessage = React.useCallback(async () => {
    if (!inviteData?.shareableMessage) return;

    try {
      await navigator.clipboard.writeText(inviteData.shareableMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [inviteData?.shareableMessage]);

  /**
   * Share via native share API
   */
  const handleShare = React.useCallback(async () => {
    if (!inviteData?.shareableMessage) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on LiaiZen',
          text: inviteData.shareableMessage,
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback to copy
      await navigator.clipboard.writeText(inviteData.shareableMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  }, [inviteData?.shareableMessage]);

  /**
   * Skip - go to main app
   */
  const handleSkip = React.useCallback(() => {
    navigate(NavigationPaths.HOME);
  }, [navigate]);

  /**
   * Continue after generating invite
   */
  const handleContinue = React.useCallback(() => {
    navigate(NavigationPaths.HOME);
  }, [navigate]);

  /**
   * Generate a new invite (reset state)
   */
  const handleGenerateNew = React.useCallback(() => {
    setInviteData(null);
    setError('');
    clearError();
  }, [clearError]);

  /**
   * Handle code input change
   */
  const handleCodeChange = React.useCallback(value => {
    setEnteredCode(value.toUpperCase());
    setCodeValidation(null);
    setError('');
  }, []);

  /**
   * Validate entered code
   */
  const handleValidateCode = React.useCallback(async () => {
    if (!enteredCode.trim()) {
      setError('Please enter a pairing code');
      return;
    }

    const code = enteredCode.trim().toUpperCase();
    setError('');
    clearError();

    const validation = await validateCode(code);
    setCodeValidation(validation);

    if (!validation.valid) {
      setError(validation.error || 'Invalid code');
    }
  }, [enteredCode, clearError, validateCode]);

  /**
   * Accept a pairing code
   */
  const handleAcceptCode = React.useCallback(async () => {
    if (!enteredCode.trim()) {
      setError('Please enter a pairing code');
      return;
    }

    if (!codeValidation || !codeValidation.valid) {
      await handleValidateCode();
      return;
    }

    const code = enteredCode.trim().toUpperCase();
    setError('');
    clearError();

    const result = await acceptPairing({ code });

    if (!result.success) {
      if (
        result.code === 'UNAUTHORIZED' ||
        result.error?.includes('authentication') ||
        result.error?.includes('Unauthorized')
      ) {
        setError('Please log in to accept the invitation. Redirecting to login...');
        setTimeout(() => navigate(NavigationPaths.SIGN_IN), 2000);
        return;
      }
      setError(result.error || 'Failed to accept invitation');
      return;
    }

    // Success!
    navigate(NavigationPaths.HOME, {
      state: {
        message: 'You are now connected with your co-parent!',
        roomId: result.sharedRoomId,
      },
    });
  }, [enteredCode, codeValidation, handleValidateCode, clearError, acceptPairing, navigate]);

  /**
   * Handle method change
   */
  const handleMethodChange = React.useCallback(
    method => {
      setInviteMethod(method);
      if (method === 'have-code') {
        setInviteData(null);
        setError('');
        clearError();
      }
    },
    [clearError]
  );

  return {
    // State
    inviteeEmail,
    inviteMethod,
    error: error || pairingError,
    enteredCode,
    codeValidation,
    inviteData,
    username,

    // Copy states
    copied,
    copiedCode,
    copiedMessage,

    // Loading states
    isCreating,
    isAccepting,
    isValidating,
    isLoading: isCreating || isAccepting || isValidating,

    // Setters
    setInviteeEmail,
    setInviteMethod: handleMethodChange,
    setEnteredCode: handleCodeChange,

    // Handlers
    handleGenerateInvite,
    handleCopyLink,
    handleCopyCode,
    handleCopyMessage,
    handleShare,
    handleSkip,
    handleContinue,
    handleGenerateNew,
    handleValidateCode,
    handleAcceptCode,

    // Helpers
    getExpirationText: () => getExpirationText(inviteData?.inviteType),
  };
}

export default useInviteCoParent;
