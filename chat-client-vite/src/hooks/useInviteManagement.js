/**
 * useInviteManagement Hook
 *
 * Manages all invite-related state and logic for co-parent connections:
 * - Invite link generation and copying
 * - Manual invite code entry
 * - Auto-accept invites from URL params
 * - Room member checking
 * - Invitation status tracking
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config.js';
import { apiPost } from '../apiClient.js';
import { getWithMigration, setWithMigration, removeWithMigration } from '../utils/storageMigration.js';
import { setUserProperties } from '../utils/analyticsEnhancements.js';
import { logger } from '../utils/logger.js';

export function useInviteManagement({ username, isAuthenticated, messages = [] }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Invite link state
  const [inviteLink, setInviteLink] = React.useState('');
  const [inviteCode, setInviteCode] = React.useState('');
  const [inviteError, setInviteError] = React.useState('');
  const [isLoadingInvite, setIsLoadingInvite] = React.useState(false);
  const [inviteCopied, setInviteCopied] = React.useState(false);

  // Invite acceptance state
  const [pendingInviteCode, setPendingInviteCode] = React.useState(null);
  const [isAcceptingInvite, setIsAcceptingInvite] = React.useState(false);
  const [manualInviteCode, setManualInviteCode] = React.useState('');
  const [showManualInvite, setShowManualInvite] = React.useState(false);

  // Co-parent connection state
  const [hasCoParentConnected, setHasCoParentConnected] = React.useState(false);
  const [hasPendingInvitation, setHasPendingInvitation] = React.useState(false);
  const [hasAcceptedInvitation, setHasAcceptedInvitation] = React.useState(false);

  // Check for invite code in URL or localStorage on mount
  React.useEffect(() => {
    const inviteCodeFromUrl = searchParams.get('invite');
    const inviteCodeFromStorage = getWithMigration('pendingInviteCode', 'pending_invite_code');

    // Prioritize URL, then localStorage
    const code = inviteCodeFromUrl || inviteCodeFromStorage;

    if (code) {
      logger.debug('Invite code detected:', { inviteCode: code, source: inviteCodeFromUrl ? 'URL' : 'localStorage' });
      setPendingInviteCode(code);

      // Store in localStorage if from URL
      if (inviteCodeFromUrl) {
        setWithMigration('pendingInviteCode', inviteCodeFromUrl);
      }

      // Clean up URL (remove invite param) but keep in localStorage
      if (inviteCodeFromUrl) {
        navigate(window.location.pathname, { replace: true });
      }
    }
  }, [searchParams, navigate]);

  // Auto-accept invite after authentication
  React.useEffect(() => {
    const acceptInvite = async () => {
      if (!pendingInviteCode || !username || !isAuthenticated || isAcceptingInvite) return;

      setIsAcceptingInvite(true);
      setInviteError(''); // Clear any previous errors
      try {
        const response = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/api/room/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include',
          body: JSON.stringify({
            inviteCode: pendingInviteCode,
            username,
          }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          logger.debug('Successfully accepted invite, joined room:', data.roomId);
          setPendingInviteCode(null);
          // Clear invite code from localStorage after successful acceptance
          removeWithMigration('pendingInviteCode');
          setHasCoParentConnected(true); // Co-parents are now connected

          // Update user properties when co-parent connects
          setUserProperties({
            hasCoparent: true,
            roomStatus: 'multi_user',
          });
          // Show success message briefly
          setInviteError(''); // Clear errors
        } else {
          const errorMsg = data.error || 'Failed to accept invite. Please try again.';
          setInviteError(errorMsg);
          // Show manual invite UI if auto-accept failed
          setShowManualInvite(true);
          logger.error('Invite acceptance failed', errorMsg);
        }
      } catch (err) {
        logger.error('Error accepting invite', err);
        const errorMsg = err.message || 'Failed to accept invite. Please check your connection and try again.';
        setInviteError(errorMsg);
        // Show manual invite UI if auto-accept failed
        setShowManualInvite(true);
      } finally {
        setIsAcceptingInvite(false);
      }
    };

    if (isAuthenticated && pendingInviteCode && !isAcceptingInvite) {
      // Small delay to ensure auth state is fully set
      const timer = setTimeout(() => {
        acceptInvite();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, username, pendingInviteCode, isAcceptingInvite]);

  // Manual invite acceptance handler
  const handleManualAcceptInvite = React.useCallback(async () => {
    const codeToUse = manualInviteCode.trim() || pendingInviteCode;
    if (!codeToUse) {
      setInviteError('Please enter an invite code');
      return;
    }

    setIsAcceptingInvite(true);
    setInviteError('');

    try {
      // Check if it's a co-parent invitation code (LZ-XXXXXX format)
      const isCoParentInviteCode = /^LZ-[A-Z0-9]{6}$/i.test(codeToUse.toUpperCase());
      const token = getWithMigration('authTokenBackup', 'auth_token_backup');

      let response;
      let data;

      if (isCoParentInviteCode) {
        // Use the co-parent invitation endpoint for LZ codes
        response = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/api/invitations/accept-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          credentials: 'include',
          body: JSON.stringify({ code: codeToUse.toUpperCase() }),
        });

        data = await response.json();

        if (response.ok && data.success) {
          logger.debug('Successfully accepted co-parent invite:', data);
          setPendingInviteCode(null);
          setManualInviteCode('');
          setShowManualInvite(false);
          removeWithMigration('pendingInviteCode');
          setHasCoParentConnected(true);
          setUserProperties({
            hasCoparent: true,
            roomStatus: 'multi_user',
          });
          setInviteError('');
          return;
        }
      } else {
        // Use the room invite endpoint for other codes
        response = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/api/room/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          credentials: 'include',
          body: JSON.stringify({
            inviteCode: codeToUse,
            username,
          }),
        });

        data = await response.json();

        if (response.ok && data.success) {
          logger.debug('Successfully accepted room invite:', data.roomId);
          setPendingInviteCode(null);
          setManualInviteCode('');
          setShowManualInvite(false);
          removeWithMigration('pendingInviteCode');
          setHasCoParentConnected(true);
          setUserProperties({
            hasCoparent: true,
            roomStatus: 'multi_user',
          });
          setInviteError('');
          return;
        }
      }

      // Handle error cases
      if (data?.code === 'ALREADY_CONNECTED') {
        setInviteError('You are already connected with this co-parent!');
        setHasCoParentConnected(true);
      } else {
        setInviteError(data?.error || 'Failed to accept invite. Please check the code and try again.');
      }
    } catch (err) {
      logger.error('Error manually accepting invite', err);
      setInviteError('Failed to accept invite. Please check your connection and try again.');
    } finally {
      setIsAcceptingInvite(false);
    }
  }, [manualInviteCode, pendingInviteCode, username]);

  // Check if co-parents are connected by querying room membership
  const checkRoomMembers = React.useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = getWithMigration('authTokenBackup', 'auth_token_backup');
      const apiUrl = `${API_BASE_URL.replace(/\/+$/, '')}/api/room/members/check`;

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        apiUrl,
        {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const hasMultiple = data.hasMultipleMembers === true;
        setHasCoParentConnected(hasMultiple);

        // Update user properties when co-parent connects
        if (hasMultiple) {
          setUserProperties({
            hasCoparent: true,
            roomStatus: 'multi_user',
          });
        }
      } else if (response.status === 404) {
        // Endpoint doesn't exist yet - fallback to message-based detection
        if (messages.length > 0 && username) {
          const uniqueUsernames = new Set(
            messages
              .filter((msg) => msg.username && msg.type !== 'ai_intervention' && msg.type !== 'ai_comment')
              .map((msg) => msg.username),
          );
          const hasMultiple = uniqueUsernames.size >= 2;
          setHasCoParentConnected(hasMultiple);
        } else {
          setHasCoParentConnected(false);
        }
      } else {
        // Other error - try message-based detection silently
        if (messages.length > 0 && username) {
          const uniqueUsernames = new Set(
            messages
              .filter((msg) => msg.username && msg.type !== 'ai_intervention' && msg.type !== 'ai_comment')
              .map((msg) => msg.username),
          );
          const hasMultiple = uniqueUsernames.size >= 2;
          setHasCoParentConnected(hasMultiple);
        } else {
          setHasCoParentConnected(false);
        }
      }
    } catch (err) {
      // Suppress network/CORS errors
      const isNetworkError = err.name === 'TypeError' ||
        err.name === 'AbortError' ||
        (err.message && (
          err.message.includes('Failed to fetch') ||
          err.message.includes('Load failed') ||
          err.message.includes('network') ||
          err.message.includes('access control') ||
          err.message.includes('aborted')
        ));

      if (isNetworkError) {
        return; // Exit early, don't update state on network errors
      }

      // Fallback to message-based detection if API fails
      if (messages.length > 0 && username) {
        const uniqueUsernames = new Set(
          messages
            .filter((msg) => msg.username && msg.type !== 'ai_intervention' && msg.type !== 'ai_comment')
            .map((msg) => msg.username),
        );
        const hasMultiple = uniqueUsernames.size >= 2;
        setHasCoParentConnected(hasMultiple);
      } else {
        setHasCoParentConnected(false);
      }
    }
  }, [isAuthenticated, messages, username]);

  // Check for pending or accepted invitations
  const checkInvitations = React.useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = getWithMigration('authTokenBackup', 'auth_token_backup');
      const response = await fetch(
        `${API_BASE_URL.replace(/\/+$/, '')}/api/invitations`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Check sent invitations (invitations user sent)
        const hasPendingSent = data.sent?.some(inv => inv.status === 'pending') || false;
        const hasAcceptedSent = data.sent?.some(inv => inv.status === 'accepted') || false;

        // Check received invitations (invitations user received)
        const hasPendingReceived = data.received?.some(inv => inv.status === 'pending') || false;
        const hasAcceptedReceived = data.received?.some(inv => inv.status === 'accepted') || false;

        // Set states
        setHasPendingInvitation(hasPendingSent || hasPendingReceived);
        setHasAcceptedInvitation(hasAcceptedSent || hasAcceptedReceived);
      }
    } catch (err) {
      // Silently handle errors - don't block UI
      logger.error('[checkInvitations] Error checking invitations', err);
    }
  }, [isAuthenticated]);

  // Load or get existing invite link
  const handleLoadInvite = React.useCallback(async () => {
    if (!isAuthenticated || isLoadingInvite) {
      setInviteError('Please make sure you are logged in.');
      return;
    }
    setInviteError('');
    setInviteCopied(false);
    setIsLoadingInvite(true);

    try {
      // Use the new co-parent invitation API
      const response = await apiPost('/api/invitations/create', {});

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.apiError('/api/invitations', response.status, errorData.error || 'Unknown error');
        if (response.status === 401) {
          setInviteError('Your session has expired. Please refresh the page and try again.');
        } else {
          setInviteError(errorData.error || errorData.message || `Unable to create invite (${response.status}). Please try again.`);
        }
        return;
      }

      const data = await response.json();

      if (!data.success) {
        setInviteError(data.error || data.message || 'Unable to create invite. Please try again.');
        return;
      }

      // Store the short code (LZ-XXXXXX format) for manual entry
      if (data.shortCode) {
        setInviteCode(data.shortCode);
      }

      // Use the inviteUrl from the API response
      if (data.inviteUrl) {
        setInviteLink(data.inviteUrl);
      } else {
        // Fallback: construct link with short code if inviteUrl not provided
        const currentOrigin = window.location.origin;
        setInviteLink(`${currentOrigin}/accept-invite?code=${data.shortCode}`);
      }
    } catch (err) {
      logger.error('Error loading invite', err);
      setInviteError('Unable to create invite. Please check your connection and try again.');
    } finally {
      setIsLoadingInvite(false);
    }
  }, [isAuthenticated, isLoadingInvite]);

  // Copy invite link to clipboard
  const handleCopyInvite = React.useCallback(async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      setInviteCopied(false);
    }
  }, [inviteLink]);

  return {
    // Invite link state
    inviteLink,
    setInviteLink,
    inviteCode,
    setInviteCode,
    inviteError,
    setInviteError,
    isLoadingInvite,
    inviteCopied,
    setInviteCopied,

    // Invite acceptance state
    pendingInviteCode,
    setPendingInviteCode,
    isAcceptingInvite,
    manualInviteCode,
    setManualInviteCode,
    showManualInvite,
    setShowManualInvite,

    // Co-parent connection state
    hasCoParentConnected,
    setHasCoParentConnected,
    hasPendingInvitation,
    hasAcceptedInvitation,

    // Handlers
    handleLoadInvite,
    handleCopyInvite,
    handleManualAcceptInvite,
    checkRoomMembers,
    checkInvitations,
  };
}
