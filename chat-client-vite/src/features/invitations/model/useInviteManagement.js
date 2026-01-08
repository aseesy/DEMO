/**
 * useInviteManagement Hook
 *
 * Manages all invite-related state and delegates to pure query/command functions.
 * This hook follows Command-Query Separation (CQS):
 * - Query functions (in utils/roomQueries.js) only return data
 * - This hook manages state mutations (commands)
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getWithMigration,
  setWithMigration,
  removeWithMigration,
} from '../../../utils/storageMigration.js';
import { setUserProperties } from '../../../utils/analyticsEnhancements.js';
import { logger } from '../../../utils/logger.js';
import { tokenManager } from '../../../utils/tokenManager.js';
import {
  queryRoomMembers,
  queryCoParentFromMessages,
  queryInvitationsStatus,
  commandJoinRoom,
  commandAcceptCoParentInvite,
  commandCreateInvitation,
} from '../../../utils/roomQueries.js';

export function useInviteManagement({
  username,
  isAuthenticated,
  messages = [],
  currentView = 'dashboard',
}) {
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

  // Co-parent connection state - initialize from localStorage for faster UI
  const [hasCoParentConnected, setHasCoParentConnected] = React.useState(() => {
    const cached = getWithMigration('hasCoParentConnected', 'has_coparent_connected');
    return cached === 'true' || cached === true;
  });
  // Loading state to prevent banner flash
  // Start as true unless we have a confirmed co-parent (cached 'true')
  // This prevents the "invite to chat" banner from flashing before API check completes
  const [isCheckingCoParent, setIsCheckingCoParent] = React.useState(() => {
    const cached = getWithMigration('hasCoParentConnected', 'has_coparent_connected');
    // Only skip check if we have confirmed co-parent connection
    // If cached is 'false' or missing, we need to verify with server
    return cached !== 'true' && cached !== true;
  });
  const [hasPendingInvitation, setHasPendingInvitation] = React.useState(false);
  const [hasAcceptedInvitation, setHasAcceptedInvitation] = React.useState(false);

  // Refs for debouncing and backoff
  const lastCheckTimeRef = React.useRef(0);
  const checkInProgressRef = React.useRef(false);
  const backoffUntilRef = React.useRef(0);

  /**
   * Apply co-parent connected state
   */
  const applyCoParentConnected = React.useCallback(() => {
    setHasCoParentConnected(true);
    setWithMigration('hasCoParentConnected', 'has_coparent_connected', 'true');
    setUserProperties({
      hasCoparent: true,
      roomStatus: 'multi_user',
    });
  }, []);

  // Check for invite code in URL or localStorage on mount
  React.useEffect(() => {
    const inviteCodeFromUrl = searchParams.get('invite');
    const inviteCodeFromStorage = getWithMigration('pendingInviteCode', 'pending_invite_code');

    const code = inviteCodeFromUrl || inviteCodeFromStorage;

    if (code) {
      logger.debug('Invite code detected:', {
        inviteCode: code,
        source: inviteCodeFromUrl ? 'URL' : 'localStorage',
      });
      setPendingInviteCode(code);

      if (inviteCodeFromUrl) {
        setWithMigration('pendingInviteCode', inviteCodeFromUrl);
        navigate(window.location.pathname, { replace: true });
      }
    }
  }, [searchParams, navigate]);

  // Auto-accept invite after authentication
  React.useEffect(() => {
    const acceptInvite = async () => {
      if (!pendingInviteCode || !username || !isAuthenticated || isAcceptingInvite) return;

      setIsAcceptingInvite(true);
      setInviteError('');

      const result = await commandJoinRoom(pendingInviteCode, username);

      if (result.success) {
        logger.info('Manual invite accepted successfully', { roomId: result.roomId });
        logger.debug('Successfully accepted invite, joined room:', result.roomId);
        setPendingInviteCode(null);
        removeWithMigration('pendingInviteCode');
        applyCoParentConnected();
        setInviteError('');
      } else {
        setInviteError(result.error);
        setShowManualInvite(true);
        logger.error('Invite acceptance failed', result.error);
      }

      setIsAcceptingInvite(false);
    };

    if (isAuthenticated && pendingInviteCode && !isAcceptingInvite) {
      const timer = setTimeout(() => {
        acceptInvite();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, username, pendingInviteCode, isAcceptingInvite, applyCoParentConnected]);

  /**
   * Manual invite acceptance handler
   * Command: Updates state based on accept result
   */
  const handleManualAcceptInvite = React.useCallback(async () => {
    const codeToUse = manualInviteCode.trim() || pendingInviteCode;
    if (!codeToUse) {
      setInviteError('Please enter an invite code');
      return;
    }

    logger.info('Manual invite acceptance initiated');
    setIsAcceptingInvite(true);
    setInviteError('');

    // Check if it's a co-parent invitation code (LZ-XXXXXX format)
    const isCoParentInviteCode = /^LZ-[A-Z0-9]{6}$/i.test(codeToUse.toUpperCase());

    let result;
    if (isCoParentInviteCode) {
      result = await commandAcceptCoParentInvite(codeToUse);
    } else {
      result = await commandJoinRoom(codeToUse, username);
    }

    if (result.success) {
      logger.info('Manual invite accepted successfully', {
        inviteType: isCoParentInviteCode ? 'coParent' : 'room',
        roomId: result.roomId,
      });
      logger.debug('Successfully accepted invite:', result);
      setPendingInviteCode(null);
      setManualInviteCode('');
      setShowManualInvite(false);
      removeWithMigration('pendingInviteCode');
      applyCoParentConnected();
      setInviteError('');
    } else if (result.alreadyConnected) {
      setInviteError('You are already connected with this co-parent!');
      setHasCoParentConnected(true);
    } else {
      setInviteError(
        result.error || 'Failed to accept invite. Please check the code and try again.'
      );
    }

    setIsAcceptingInvite(false);
  }, [manualInviteCode, pendingInviteCode, username, applyCoParentConnected]);

  /**
   * Check if co-parents are connected
   * Command: Updates hasCoParentConnected state and persists to localStorage
   * Includes debouncing and backoff to prevent hammering the server
   */
  const checkRoomMembers = React.useCallback(async () => {
    if (!isAuthenticated) return;

    const now = Date.now();

    // Debounce: Skip if called within 1 second of last check
    if (now - lastCheckTimeRef.current < 1000) {
      return;
    }

    // Backoff: Skip if we're in a backoff period (server returned 503)
    if (now < backoffUntilRef.current) {
      return;
    }

    // Prevent concurrent checks
    if (checkInProgressRef.current) {
      return;
    }

    checkInProgressRef.current = true;
    lastCheckTimeRef.current = now;
    setIsCheckingCoParent(true);

    const result = await queryRoomMembers();

    if (result.success) {
      setHasCoParentConnected(result.hasMultipleMembers);
      // Persist to localStorage for faster initial load
      setWithMigration(
        'hasCoParentConnected',
        'has_coparent_connected',
        result.hasMultipleMembers ? 'true' : 'false'
      );
      if (result.hasMultipleMembers) {
        setUserProperties({
          hasCoparent: true,
          roomStatus: 'multi_user',
        });
      }
    } else if (result.serviceUnavailable) {
      // Server starting up - back off for 5 seconds
      backoffUntilRef.current = Date.now() + (result.retryAfter || 5000);
      console.log('[checkRoomMembers] Server not ready, backing off for 5s');
    } else if (result.notFound || result.networkError) {
      // Fallback to message-based detection
      const hasMultiple = queryCoParentFromMessages(messages, username);
      setHasCoParentConnected(hasMultiple);
      if (hasMultiple) {
        setWithMigration('hasCoParentConnected', 'has_coparent_connected', 'true');
      }
    } else {
      // Other error - try message-based detection
      const hasMultiple = queryCoParentFromMessages(messages, username);
      setHasCoParentConnected(hasMultiple);
      if (hasMultiple) {
        setWithMigration('hasCoParentConnected', 'has_coparent_connected', 'true');
      }
    }

    setIsCheckingCoParent(false);
    checkInProgressRef.current = false;
  }, [isAuthenticated, messages, username]);

  /**
   * Check for pending or accepted invitations
   * Command: Updates hasPendingInvitation and hasAcceptedInvitation state
   */
  const checkInvitations = React.useCallback(async () => {
    if (!isAuthenticated) return;

    const result = await queryInvitationsStatus();

    if (result.success) {
      const hasPendingSent = result.sent?.some(inv => inv.status === 'pending') || false;
      const hasAcceptedSent = result.sent?.some(inv => inv.status === 'accepted') || false;
      const hasPendingReceived = result.received?.some(inv => inv.status === 'pending') || false;
      const hasAcceptedReceived = result.received?.some(inv => inv.status === 'accepted') || false;

      setHasPendingInvitation(hasPendingSent || hasPendingReceived);
      setHasAcceptedInvitation(hasAcceptedSent || hasAcceptedReceived);
    }
  }, [isAuthenticated]);

  /**
   * Load or create invite link
   * Command: Updates invite link state
   */
  const handleLoadInvite = React.useCallback(async () => {
    if (!isAuthenticated || isLoadingInvite) {
      setInviteError('Please make sure you are logged in.');
      return;
    }

    setInviteError('');
    setInviteCopied(false);
    setIsLoadingInvite(true);

    const result = await commandCreateInvitation();

    if (result.success) {
      if (result.shortCode) {
        setInviteCode(result.shortCode);
      }
      if (result.inviteUrl) {
        setInviteLink(result.inviteUrl);
      } else {
        const currentOrigin = window.location.origin;
        setInviteLink(`${currentOrigin}/accept-invite?code=${result.shortCode}`);
      }
    } else {
      setInviteError(result.error);
    }

    setIsLoadingInvite(false);
  }, [isAuthenticated, isLoadingInvite]);

  /**
   * Copy invite link to clipboard
   * Command: Updates inviteCopied state
   */
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

  // ============================================
  // POLLING EFFECTS - Room member and invitation checking
  // ============================================

  // Periodic room member checking
  // Reduced polling frequency to prevent CPU overheating
  React.useEffect(() => {
    if (currentView === 'chat' && isAuthenticated && !hasCoParentConnected) {
      checkRoomMembers();
    }
    let interval;
    if (currentView === 'chat' && isAuthenticated) {
      // Increased intervals: 30s when waiting, 2min when connected (was 5s/60s)
      const pollInterval = hasCoParentConnected ? 120000 : 30000;
      interval = setInterval(() => {
        // Only poll if page is visible to save CPU
        if (document.visibilityState === 'visible') {
          checkRoomMembers();
        }
      }, pollInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentView, isAuthenticated, hasCoParentConnected, checkRoomMembers]);

  // Check once when user first authenticates - wait for token to be available
  React.useEffect(() => {
    if (isAuthenticated && !hasCoParentConnected) {
      // Wait longer for token to be fully propagated after login
      // Increased delay to prevent race conditions with auth state updates
      const timer = setTimeout(() => {
        // Verify token exists before making request (use TokenManager for instant access)
        if (tokenManager.hasToken()) {
          checkRoomMembers();
        } else {
          // If no token yet, wait a bit more (token should be set by now)
          console.log('[useInviteManagement] No token found after 500ms, waiting 1000ms more');
          setTimeout(() => {
            if (tokenManager.hasToken()) {
              checkRoomMembers();
            } else {
              console.log(
                '[useInviteManagement] No token found after 1500ms, skipping checkRoomMembers'
              );
            }
          }, 1000);
        }
      }, 500); // Increased from 100ms to 500ms to give auth state time to stabilize
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, hasCoParentConnected, checkRoomMembers]);

  // Check when new messages arrive
  React.useEffect(() => {
    if (isAuthenticated && messages.length > 0 && !hasCoParentConnected) {
      checkRoomMembers();
    }
  }, [messages.length, isAuthenticated, hasCoParentConnected, checkRoomMembers]);

  // Check invitations periodically (only if not already paired)
  // Reduced frequency to prevent CPU overheating
  React.useEffect(() => {
    if (isAuthenticated && !hasCoParentConnected) {
      checkInvitations();
      // Poll every 60 seconds (reduced from 30s) - invitations aren't time-critical
      // Only poll when page is visible to save CPU
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          checkInvitations();
        }
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, hasCoParentConnected, checkInvitations]);

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
    isCheckingCoParent,
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
