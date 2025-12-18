import React from 'react';
import './index.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import { useTasks } from './hooks/useTasks.js';
import { useChat } from './hooks/useChat.js';
import { useContacts } from './hooks/useContacts.js';
import { useNotifications } from './hooks/useNotifications.js';
import { useInAppNotifications } from './hooks/useInAppNotifications.js';
import { useToast } from './hooks/useToast.js';
import { ToastContainer } from './components/ui/Toast/Toast.jsx';
import { ContactsPanel } from './components/ContactsPanel.jsx';
import { ProfilePanel } from './components/ProfilePanel.jsx';
import { UpdatesPanel } from './components/UpdatesPanel.jsx';
import { CommunicationStatsWidget } from './components/CommunicationStatsWidget.jsx';
import { Navigation } from './components/Navigation.jsx';
import { LandingPage } from './components/LandingPage.jsx';
import { ObserverCard } from './components/ObserverCard.jsx';
import { TaskFormModal } from './components/modals/TaskFormModal.jsx';
import { WelcomeModal } from './components/modals/WelcomeModal.jsx';
import { ProfileTaskModal } from './components/modals/ProfileTaskModal.jsx';
import { FlaggingModal } from './components/modals/FlaggingModal.jsx';
import { ContactSuggestionModal } from './components/modals/ContactSuggestionModal.jsx';
import { InviteTaskModal } from './components/InviteTaskModal.jsx';
import { MessageSearch } from './components/MessageSearch.jsx';
import { API_BASE_URL } from './config.js';
import { SettingsView, DashboardView, ChatView } from './views';

// Lazy-load AccountView for code-splitting (reduces initial bundle)
const AccountView = React.lazy(() => import('./components/AccountView.jsx'));
import { apiPost } from './apiClient.js';
import { getWithMigration, setWithMigration, removeWithMigration } from './utils/storageMigration.js';
import {
  trackMessageSent,
  trackAIIntervention,
  trackRewriteUsed,
  trackInterventionOverride,
  trackMessageFlagged,
  trackTaskCreated,
  trackTaskCompleted,
  trackContactAdded,
  trackViewChange,
  trackThreadCreated,
} from './utils/analytics.js';
import { setUserProperties } from './utils/analyticsEnhancements.js';
import { logger } from './utils/logger.js';

// Main LiaiZen chat room component
// Handles chat, tasks, contacts, profile, and all core app functionality

function ChatRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [showLanding, setShowLanding] = React.useState(() => {
    // Don't show landing if user is already authenticated
    // Check both token keys for compatibility (including old key for migration)
    return !getWithMigration('authTokenBackup', 'auth_token_backup') && !localStorage.getItem('token') && !localStorage.getItem('isAuthenticated');
  });

  const {
    username,
    isAuthenticated,
    isCheckingAuth,
    handleLogout,
  } = useAuth();

  // In-app notifications (invitations, system messages)
  const {
    unreadCount: notificationCount,
    refresh: refreshNotifications,
  } = useInAppNotifications({
    enabled: isAuthenticated && !showLanding && !isCheckingAuth
  });

  const availableViews = ['dashboard', 'chat', 'contacts', 'profile', 'settings', 'account'];
  const [currentView, setCurrentViewState] = React.useState(() => {
    const stored = getWithMigration('currentView');
    return stored && availableViews.includes(stored)
      ? stored
      : 'dashboard';
  });

  // Wrap setCurrentView to track analytics
  const setCurrentView = React.useCallback((view) => {
    console.log('[ChatRoom] setCurrentView called with:', view, 'current:', currentView);
    if (view !== currentView) {
      trackViewChange(view);
    }
    setCurrentViewState(view);
    console.log('[ChatRoom] setCurrentViewState called');
  }, [currentView]);

  // Track unread message count for navigation badge
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = React.useState(() => {
    const stored = getWithMigration('notificationPreferences', 'notification_preferences');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fallback to defaults
      }
    }
    return {
      newMessages: true,
      taskReminders: false,
      invitations: true
    };
  });

  // Save notification preferences to localStorage
  React.useEffect(() => {
    setWithMigration('notificationPreferences', JSON.stringify(notificationPrefs));
  }, [notificationPrefs]);

  // Hide landing page once authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      setShowLanding(false);
    }
  }, [isAuthenticated]);

  // Handle unauthenticated state - show landing page or redirect
  React.useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      // Check if there's an invite code - always redirect to signin for invites
      const inviteCode = searchParams.get('invite');
      if (inviteCode) {
        navigate(`/signin?invite=${inviteCode}`);
        return;
      }

      // For users without invite code, show landing page on root path
      // This also handles the case where auth verification failed (stale localStorage)
      if (!showLanding && window.location.pathname === '/') {
        // Show landing page for first-time/returning visitors at root
        setShowLanding(true);
        return;
      }

      // If showLanding is already true, LandingPage will handle navigation
      if (showLanding) {
        return;
      }

      // If not on root and not showing landing, redirect to signin
      navigate('/signin');
    }
  }, [isCheckingAuth, isAuthenticated, showLanding, navigate, searchParams]);

  React.useEffect(() => {
    if (isAuthenticated) {
      setWithMigration('currentView', currentView);
    }
  }, [isAuthenticated, currentView]);

  // Task loading conditions
  const shouldLoadTasks = isAuthenticated && !showLanding && !isCheckingAuth;
  
  const tasksState = useTasks(username, shouldLoadTasks);
  const {
    tasks,
    isLoadingTasks,
    taskSearch,
    taskFilter,
    showTaskForm,
    editingTask,
    taskFormData,
    setShowTaskForm,
    setEditingTask,
    setTaskFormData,
    setTaskSearch,
    setTaskFilter,
    toggleTaskStatus: originalToggleTaskStatus,
    saveTask: originalSaveTask,
    loadTasks,
  } = tasksState;

  // Wrap toggleTaskStatus to track analytics
  const toggleTaskStatus = React.useCallback((task) => {
    const wasCompleted = task.status === 'completed';
    originalToggleTaskStatus(task);
    if (!wasCompleted && task.status === 'open') {
      // Task was just completed
      trackTaskCompleted(task.type || 'general');
    }
  }, [originalToggleTaskStatus]);

  // Wrap saveTask to track analytics
  const saveTask = React.useCallback(async (taskData) => {
    const isNewTask = !taskData.id;
    const result = await originalSaveTask(taskData);
    if (isNewTask && result) {
      trackTaskCreated(taskData.type || 'general', taskData.priority || 'medium');
    }
    return result;
  }, [originalSaveTask]);

  // Only load contacts and chat when NOT showing landing page
  const { contacts } = useContacts(showLanding ? null : username, isAuthenticated && !showLanding && !isCheckingAuth);

  // Notification system for new messages
  const notifications = useNotifications({
    username,
    enabled: isAuthenticated && !showLanding && notificationPrefs.newMessages
  });

  // In-app toast notifications for visual alerts
  const toast = useToast();

  // Expose test function to window for debugging
  React.useEffect(() => {
    window.__testToast = () => {
      console.log('[Test] Manually triggering toast...');
      toast.show({
        sender: 'Test User',
        message: 'This is a test notification!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        username: null, // Won't match current user
      });
    };
    return () => { delete window.__testToast; };
  }, [toast]);

  // Callback for new messages - shows both browser notification and in-app toast
  const handleNewMessage = React.useCallback((message) => {
    // Only process notifications for messages from other users (case-insensitive)
    if (message.username?.toLowerCase() === username?.toLowerCase()) {
      return; // Don't notify for own messages
    }

    // Don't show notifications for AI/system messages
    // These are coaching messages meant for the sender, not notifications for the receiver
    const aiMessageTypes = ['ai_intervention', 'ai_comment', 'pending_original', 'ai_error', 'system'];
    const aiUsernames = ['liaizen', 'alex', 'system'];

    if (aiMessageTypes.includes(message.type)) {
      return; // Don't notify for AI intervention/coaching messages
    }

    if (aiUsernames.includes(message.username?.toLowerCase())) {
      return; // Don't notify for messages from AI users
    }

    // Increment unread count if not on chat screen or page is hidden
    if (currentView !== 'chat' || document.hidden) {
      setUnreadCount(prev => prev + 1);
    }

    // Show in-app toast notification (visual popup like Google Calendar)
    // Works without any browser permissions
    toast.show({
      sender: message.username,
      message: message.text || message.content || '',
      timestamp: message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }) : undefined,
      username: username, // Current user to filter own messages
    });

    // Show native browser notification like SMS - always show if permission granted
    // This provides immediate notification on computer/phone, similar to text messages
    if (notifications.permission === 'granted') {
      notifications.showNotification(message);
    }
  }, [username, currentView, notifications, toast]);

  // Track original message to remove after rewrite is sent
  const [pendingOriginalMessageToRemove, setPendingOriginalMessageToRemove] = React.useState(null);
  const [feedbackGiven, setFeedbackGiven] = React.useState(new Set()); // Track which interventions received feedback

  const chatState = useChat({
    username: showLanding ? null : username,
    isAuthenticated: isAuthenticated && !showLanding,
    currentView,
    onNewMessage: handleNewMessage
  });
  const {
    messages,
    inputMessage,
    isConnected,
    messageStatuses,
    pendingMessages,
    sendMessage: originalSendMessage,
    handleInputChange,
    messagesEndRef,
    messagesContainerRef,
    typingUsers: _typingUsers,
    setInputMessage,
    removeMessages,
    flagMessage: originalFlagMessage,
    draftCoaching,
    setDraftCoaching,
    isPreApprovedRewrite,
    setIsPreApprovedRewrite,
    originalRewrite,
    setOriginalRewrite,
    threads,
    selectedThreadId,
    setSelectedThreadId,
    createThread: originalCreateThread,
    getThreads,
    getThreadMessages,
    addToThread,
    socket,
    // Pagination
    loadOlderMessages,
    isLoadingOlder,
    hasMoreMessages,
    // Search
    searchMessages,
    searchQuery,
    searchResults,
    searchTotal,
    isSearching,
    searchMode,
    toggleSearchMode,
    exitSearchMode,
    jumpToMessage,
    highlightedMessageId,
    isInitialLoad,
  } = chatState;

  // Reset unread count when navigating to chat view and mark all messages as seen
  React.useEffect(() => {
    if (currentView === 'chat' && messages.length > 0) {
      setUnreadCount(0);
      // Mark all current messages as seen by updating the last seen timestamp
      // This is handled by useChat hook when viewing chat
    }
  }, [currentView, messages.length]);

  // Helper function to determine if a message should be removed when rewrite is sent
  const shouldRemoveMessageOnRewrite = React.useCallback((message, pendingOriginal) => {
    // Always remove pending_original and ai_intervention messages
    if (message.type === 'pending_original' || message.type === 'ai_intervention') {
      return true;
    }

    // If we have a pending original message to remove, check if this message matches it
    if (!pendingOriginal) {
      return false;
    }

    // Match flagged/private messages that match the pending original
    const isFlaggedPrivate = message.flagged === true && message.private === true;
    const matchesUsername = message.username === pendingOriginal.username;
    const matchesText = message.text === pendingOriginal.text;
    
    // Match by exact timestamp or within 2 seconds (handles timing differences)
    const matchesTimestamp = 
      message.timestamp === pendingOriginal.timestamp ||
      (message.timestamp && pendingOriginal.timestamp &&
        Math.abs(
          new Date(message.timestamp).getTime() - 
          new Date(pendingOriginal.timestamp).getTime()
        ) < 2000);

    return isFlaggedPrivate && matchesUsername && matchesText && matchesTimestamp;
  }, []);

  // Listen for rewrite-sent event to remove original message
  React.useEffect(() => {
    const handleRewriteSent = () => {
      // Remove all pending original messages and interventions when a new message is sent
      removeMessages((m) => shouldRemoveMessageOnRewrite(m, pendingOriginalMessageToRemove));
      setPendingOriginalMessageToRemove(null);
    };

    window.addEventListener('rewrite-sent', handleRewriteSent);
    return () => window.removeEventListener('rewrite-sent', handleRewriteSent);
  }, [pendingOriginalMessageToRemove, removeMessages, shouldRemoveMessageOnRewrite]);

  // Wrap sendMessage to track analytics and clean up pending messages
  const sendMessage = React.useCallback((e) => {
    const clean = inputMessage.trim();
    if (clean) {
      // Track message sent before sending
      trackMessageSent(clean.length, isPreApprovedRewrite);

      // Clear any pending original messages and interventions when any message is sent
      // This ensures the "not sent yet" bubble disappears
      window.dispatchEvent(new CustomEvent('rewrite-sent', { detail: { isNewMessage: true } }));
    }
    // Call original sendMessage (it handles validation)
    originalSendMessage(e);
  }, [inputMessage, isPreApprovedRewrite, originalSendMessage]);

  // Wrap flagMessage to track analytics
  const flagMessage = React.useCallback((messageId, reason = 'user_flagged') => {
    trackMessageFlagged(reason);
    originalFlagMessage(messageId);
  }, [originalFlagMessage]);

  // Wrap createThread to track analytics (prefixed - feature in development)
  const _createThread = React.useCallback((roomId, title, messageIds) => {
    trackThreadCreated();
    return originalCreateThread(roomId, title, messageIds);
  }, [originalCreateThread]);

  // Thread UI state (prefixed - feature in development)
  const [showThreadsPanel, setShowThreadsPanel] = React.useState(false);
  const [_threadSuggestionModal, setThreadSuggestionModal] = React.useState(null);
  const [_creatingThread, _setCreatingThread] = React.useState(false);
  const [_newThreadTitle, _setNewThreadTitle] = React.useState('');

  // Get room ID from chat state (need to extract from messages or use a ref)
  const roomIdRef = React.useRef(null);
  React.useEffect(() => {
    if (messages.length > 0 && messages[0].roomId) {
      roomIdRef.current = messages[0].roomId;
      // Load threads when room is known
      if (roomIdRef.current && isConnected) {
        getThreads(roomIdRef.current);
      }
    }
  }, [messages, isConnected, getThreads]);

  // Listen for thread suggestions
  React.useEffect(() => {
    const handleThreadSuggestion = (event) => {
      setThreadSuggestionModal({
        message: event.detail.message,
        suggestion: event.detail.suggestion
      });
      setNewThreadTitle(event.detail.suggestion.threadTitle || '');
    };

    window.addEventListener('thread-suggestion', handleThreadSuggestion);
    return () => window.removeEventListener('thread-suggestion', handleThreadSuggestion);
  }, []);

  // Track AI interventions when they appear
  const trackedInterventionsRef = React.useRef(new Set());
  React.useEffect(() => {
    messages.forEach((msg) => {
      if (msg.type === 'ai_intervention' && msg.id && !trackedInterventionsRef.current.has(msg.id)) {
        trackedInterventionsRef.current.add(msg.id);
        trackAIIntervention(
          msg.interventionType || 'general',
          msg.confidence || 'medium',
          msg.riskLevel || 'medium'
        );
      }
    });
  }, [messages]);

  // Handle intervention feedback (thumbs up/down)
  const sendInterventionFeedback = React.useCallback((interventionId, helpful) => {
    if (!socket || !socket.connected) {
      console.warn('Cannot send feedback: socket not connected');
      return;
    }
    socket.emit('intervention_feedback', {
      interventionId,
      helpful,
      reason: null
    });
    setFeedbackGiven(prev => new Set([...prev, interventionId]));
  }, [socket]);

  // Invite state for sharing a room with a co-parent
  const [inviteLink, setInviteLink] = React.useState('');
  const [inviteCode, setInviteCode] = React.useState('');
  const [inviteError, setInviteError] = React.useState('');
  const [isLoadingInvite, setIsLoadingInvite] = React.useState(false);
  const [inviteCopied, setInviteCopied] = React.useState(false);
  const [pendingInviteCode, setPendingInviteCode] = React.useState(null);
  const [isAcceptingInvite, setIsAcceptingInvite] = React.useState(false);
  const [hasCoParentConnected, setHasCoParentConnected] = React.useState(false);
  const [hasPendingInvitation, setHasPendingInvitation] = React.useState(false);
  const [hasAcceptedInvitation, setHasAcceptedInvitation] = React.useState(false);
  const [manualInviteCode, setManualInviteCode] = React.useState('');
  const [showManualInvite, setShowManualInvite] = React.useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false);
  const [showProfileTaskModal, setShowProfileTaskModal] = React.useState(false);
  const [showInviteModal, setShowInviteModal] = React.useState(false); // Feature 005: Invite task modal
  const [taskFormMode, setTaskFormMode] = React.useState('manual'); // 'manual' or 'ai'
  const [aiTaskDetails, setAiTaskDetails] = React.useState('');
  const [isGeneratingTask, setIsGeneratingTask] = React.useState(false);

  // Contact suggestion modal state
  const [pendingContactSuggestion, setPendingContactSuggestion] = React.useState(null);
  const [dismissedSuggestions, setDismissedSuggestions] = React.useState(new Set());

  // Message flagging modal state
  const [flaggingMessage, setFlaggingMessage] = React.useState(null);
  const [flagReason, setFlagReason] = React.useState('');

  // Handler for adding contact from suggestion modal
  const handleAddContactFromSuggestion = () => {
    if (!pendingContactSuggestion) return;
    trackContactAdded('suggestion');
    setCurrentView('contacts');
    setWithMigration('liaizenAddContact', JSON.stringify({
      name: pendingContactSuggestion.detectedName,
      context: pendingContactSuggestion.text
    }));
    if (pendingContactSuggestion.id) {
      setDismissedSuggestions((prev) => new Set(prev).add(pendingContactSuggestion.id));
    }
    setPendingContactSuggestion(null);
  };

  // Handler to navigate to contacts when clicking household members in profile
  const handleNavigateToContacts = (memberName) => {
    setCurrentView('contacts');
    // TODO: In future, can add search/filter functionality to ContactsPanel
    // and pass memberName as a filter prop
    logger.debug('Navigating to contacts for:', memberName);
  };

  // Detect contact suggestions in messages and show modal
  React.useEffect(() => {
    const latestSuggestion = messages
      .filter((msg) => msg.type === 'contact_suggestion' && msg.detectedName)
      .slice(-1)[0]; // Get the most recent suggestion

    if (
      latestSuggestion &&
      !pendingContactSuggestion && // Don't show if one is already showing
      !dismissedSuggestions.has(latestSuggestion.id) // Don't show if already dismissed
    ) {
      setPendingContactSuggestion(latestSuggestion);
    }
  }, [messages, pendingContactSuggestion, dismissedSuggestions]);

  // Check for invite code in URL or localStorage on mount
  React.useEffect(() => {
    const inviteCodeFromUrl = searchParams.get('invite');
    const inviteCodeFromStorage = getWithMigration('pendingInviteCode', 'pending_invite_code');

    // Prioritize URL, then localStorage
    const inviteCode = inviteCodeFromUrl || inviteCodeFromStorage;

    if (inviteCode) {
      logger.debug('Invite code detected:', { inviteCode, source: inviteCodeFromUrl ? 'URL' : 'localStorage' });
      setPendingInviteCode(inviteCode);

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
          headers: { 'Content-Type': 'application/json' },
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
          // Note: Periodic room member check will confirm connection
          // Note: Contacts will auto-refresh when user navigates to that view
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
  const handleManualAcceptInvite = async () => {
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
          headers: { 'Content-Type': 'application/json' },
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
  };

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
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const hasMultiple = data.hasMultipleMembers === true;
        // Only log when status changes to reduce noise (logging removed to prevent re-renders)
        setHasCoParentConnected(hasMultiple);

        // Update user properties when co-parent connects
        if (hasMultiple) {
          setUserProperties({
            hasCoparent: true,
            roomStatus: 'multi_user',
          });
        }
      } else if (response.status === 404) {
        // Endpoint doesn't exist yet (server not restarted) - fallback to message-based detection
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
      // Suppress network/CORS errors - they're expected if server is down or restarting
      const isNetworkError = err.name === 'TypeError' ||
        err.name === 'AbortError' ||
        (err.message && (
          err.message.includes('Failed to fetch') ||
          err.message.includes('Load failed') ||
          err.message.includes('network') ||
          err.message.includes('access control') ||
          err.message.includes('aborted')
        ));

      // Silently handle network errors - don't log or set state
      if (isNetworkError) {
        return; // Exit early, don't update state on network errors
      }

      // Only log non-network errors (but silently - don't spam console)
      // logger.error('Error checking room members', err);

      // Fallback to message-based detection if API fails (only for non-network errors)
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

  React.useEffect(() => {
    // Check immediately when authenticated and in chat view (only if not already connected)
    if (currentView === 'chat' && isAuthenticated && !hasCoParentConnected) {
      checkRoomMembers();
    }

    // Poll periodically - faster when waiting for co-parent, slower once connected
    let interval;
    if (currentView === 'chat' && isAuthenticated) {
      // 5 seconds when waiting for co-parent, 60 seconds once connected
      const pollInterval = hasCoParentConnected ? 60000 : 5000;
      interval = setInterval(checkRoomMembers, pollInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentView, isAuthenticated, hasCoParentConnected, checkRoomMembers]);

  // Check once when user first authenticates (in case they're already in a room)
  React.useEffect(() => {
    if (isAuthenticated && !hasCoParentConnected) {
      // Small delay to ensure user data is loaded
      const timer = setTimeout(() => {
        checkRoomMembers();
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Intentionally minimal deps - only run once on auth

  // Also check when new messages arrive (indicates someone else might be in room)
  React.useEffect(() => {
    if (isAuthenticated && messages.length > 0 && !hasCoParentConnected) {
      checkRoomMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]); // Intentionally minimal deps - only trigger on new messages

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

  // Check invitations periodically and on mount
  React.useEffect(() => {
    if (isAuthenticated) {
      // Check immediately
      checkInvitations();

      // Check periodically (every 5 seconds)
      const interval = setInterval(checkInvitations, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, checkInvitations]);

  // Load or get existing invite link (optimized - uses GET with session auth, falls back to POST)
  const handleLoadInvite = async () => {
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

      // Use the inviteUrl from the API response (includes token for new users)
      // For existing users, they can use the short code
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
  };

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      setInviteCopied(false);
    }
  };

  // Callback for when user clicks Get Started on landing page
  const handleGetStarted = React.useCallback(() => {
    navigate('/signin');
  }, [navigate]);

  // Debug logging - commented out to reduce console noise
  // logger.debug('[ChatRoom] Render state:', { isAuthenticated, showLanding, isCheckingAuth, username });

  // Show landing page for first-time visitors
  if (!isAuthenticated && showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-white text-lg">Checking your session…</div>
      </div>
    );
  }

  // If not authenticated and not showing landing, will redirect to /signin via useEffect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-white text-lg">Redirecting to sign in…</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <>
        {/* Navigation - OUTSIDE overflow container for iOS Safari compatibility */}
        {/* Fixed elements inside overflow:hidden containers can be clipped on iOS Safari */}
        <Navigation
          currentView={currentView}
          setCurrentView={setCurrentView}
          onLogout={handleLogout}
          unreadCount={unreadCount}
          notificationCount={notificationCount}
          onInvitationAccepted={(result) => {
            // Refresh notifications after accepting an invitation
            refreshNotifications();
            // Mark co-parent as connected
            setHasCoParentConnected(true);
            setUserProperties({
              hasCoparent: true,
              roomStatus: 'multi_user',
            });
            // Trigger contacts reload after invitation acceptance
            // Dispatch event to reload contacts (contacts hook listens for this)
            window.dispatchEvent(new CustomEvent('coparent-joined', {
              detail: {
                coparentId: result?.coParent?.id,
                coparentName: result?.coParent?.name
              }
            }));
          }}
          hasMeanMessage={messages.some(msg =>
            msg.username?.toLowerCase() === username?.toLowerCase() &&
            msg.user_flagged_by &&
            Array.isArray(msg.user_flagged_by) &&
            msg.user_flagged_by.length > 0
          )}
        />

        <div className="h-dvh bg-white flex flex-col overflow-hidden overscroll-none">
          {/* In-app toast notifications for visual alerts */}
          <ToastContainer
            toasts={toast.toasts}
            onDismiss={toast.dismiss}
            onClick={(clickedToast) => {
              // Navigate to chat when toast is clicked
              setCurrentView('chat');
              toast.dismiss(clickedToast.id);
            }}
          />

          {/* Main Content Area */}
        <div className={`${currentView === 'chat' ? 'flex-1 min-h-0 overflow-hidden pt-0 pb-14 md:pt-14 md:pb-4' : currentView === 'profile' ? 'pt-0 md:pt-14 pb-0 overflow-y-auto' : 'pt-0 md:pt-14 pb-14 md:pb-8 overflow-y-auto px-4 sm:px-6 md:px-8'} relative z-10`}>
          <div className={`${currentView === 'chat' ? 'h-full flex flex-col overflow-hidden' : currentView === 'profile' ? 'w-full' : 'max-w-7xl mx-auto w-full'}`}>
            {/* Dashboard View */}
            {currentView === 'dashboard' && (
              <DashboardView
                username={username}
                hasCoParentConnected={hasCoParentConnected}
                tasks={tasks}
                isLoadingTasks={isLoadingTasks}
                taskSearch={taskSearch}
                setTaskSearch={setTaskSearch}
                taskFilter={taskFilter}
                setTaskFilter={setTaskFilter}
                contacts={contacts}
                threads={threads}
                selectedThreadId={selectedThreadId}
                setSelectedThreadId={setSelectedThreadId}
                setCurrentView={setCurrentView}
                setShowInviteModal={setShowInviteModal}
                setEditingTask={setEditingTask}
                setShowWelcomeModal={setShowWelcomeModal}
                setShowProfileTaskModal={setShowProfileTaskModal}
                setShowTaskForm={setShowTaskForm}
                setTaskFormMode={setTaskFormMode}
                setAiTaskDetails={setAiTaskDetails}
                setIsGeneratingTask={setIsGeneratingTask}
                setTaskFormData={setTaskFormData}
                toggleTaskStatus={toggleTaskStatus}
                getThreadMessages={getThreadMessages}
              />
            )}
            {/* Chat View */}
            {currentView === 'chat' && (
              <ChatView
                username={username}
                isAuthenticated={isAuthenticated}
                messages={messages}
                messagesContainerRef={messagesContainerRef}
                messagesEndRef={messagesEndRef}
                isInitialLoad={isInitialLoad}
                hasMoreMessages={hasMoreMessages}
                isLoadingOlder={isLoadingOlder}
                loadOlderMessages={loadOlderMessages}
                highlightedMessageId={highlightedMessageId}
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                handleInputChange={handleInputChange}
                sendMessage={sendMessage}
                draftCoaching={draftCoaching}
                setDraftCoaching={setDraftCoaching}
                isPreApprovedRewrite={isPreApprovedRewrite}
                setIsPreApprovedRewrite={setIsPreApprovedRewrite}
                originalRewrite={originalRewrite}
                setOriginalRewrite={setOriginalRewrite}
                searchQuery={searchQuery}
                searchMode={searchMode}
                searchResults={searchResults}
                searchTotal={searchTotal}
                isSearching={isSearching}
                searchMessages={searchMessages}
                toggleSearchMode={toggleSearchMode}
                exitSearchMode={exitSearchMode}
                jumpToMessage={jumpToMessage}
                threads={threads}
                showThreadsPanel={showThreadsPanel}
                setShowThreadsPanel={setShowThreadsPanel}
                selectedThreadId={selectedThreadId}
                setSelectedThreadId={setSelectedThreadId}
                getThreadMessages={getThreadMessages}
                addToThread={addToThread}
                flaggingMessage={flaggingMessage}
                setFlaggingMessage={setFlaggingMessage}
                flagReason={flagReason}
                setFlagReason={setFlagReason}
                flagMessage={flagMessage}
                feedbackGiven={feedbackGiven}
                sendInterventionFeedback={sendInterventionFeedback}
                pendingOriginalMessageToRemove={pendingOriginalMessageToRemove}
                setPendingOriginalMessageToRemove={setPendingOriginalMessageToRemove}
                inviteLink={inviteLink}
                setInviteLink={setInviteLink}
                inviteCode={inviteCode}
                setInviteCode={setInviteCode}
                inviteCopied={inviteCopied}
                setInviteCopied={setInviteCopied}
                inviteError={inviteError}
                setInviteError={setInviteError}
                isLoadingInvite={isLoadingInvite}
                handleLoadInvite={handleLoadInvite}
                handleCopyInvite={handleCopyInvite}
                hasCoParentConnected={hasCoParentConnected}
                hasPendingInvitation={hasPendingInvitation}
                hasAcceptedInvitation={hasAcceptedInvitation}
                showManualInvite={showManualInvite}
                setShowManualInvite={setShowManualInvite}
                manualInviteCode={manualInviteCode}
                setManualInviteCode={setManualInviteCode}
                pendingInviteCode={pendingInviteCode}
                setPendingInviteCode={setPendingInviteCode}
                isAcceptingInvite={isAcceptingInvite}
                handleManualAcceptInvite={handleManualAcceptInvite}
                socket={socket}
              />
            )}
            {/* Contacts View */}
            {currentView === 'contacts' && (
              <ContactsPanel username={username} />
            )}

            {/* Profile View - Clean Style */}
            {currentView === 'profile' && (
              <div className="pb-20 md:pb-8">
                <ProfilePanel
                  username={username}
                  onLogout={handleLogout}
                  onNavigateToContacts={handleNavigateToContacts}
                />
              </div>
            )}

            {/* Settings View */}
            {currentView === 'settings' && (
              <SettingsView
                username={username}
                notifications={notifications}
                notificationPrefs={notificationPrefs}
                setNotificationPrefs={setNotificationPrefs}
                hasCoParentConnected={hasCoParentConnected}
                inviteLink={inviteLink}
                inviteCode={inviteCode}
                inviteError={inviteError}
                isLoadingInvite={isLoadingInvite}
                inviteCopied={inviteCopied}
                setInviteCopied={setInviteCopied}
                setInviteLink={setInviteLink}
                setInviteCode={setInviteCode}
                manualInviteCode={manualInviteCode}
                setManualInviteCode={setManualInviteCode}
                isAcceptingInvite={isAcceptingInvite}
                onLoadInvite={handleLoadInvite}
                onCopyInvite={handleCopyInvite}
                onManualAcceptInvite={handleManualAcceptInvite}
              />
            )}

            {/* Account View - Lazy loaded for code-splitting */}
            {currentView === 'account' && (
              <React.Suspense fallback={
                <div className="bg-white rounded-2xl border-2 border-teal-light shadow-lg overflow-hidden p-8">
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-teal-medium" />
                    <p className="mt-6 text-teal-medium font-semibold text-lg">Loading account...</p>
                  </div>
                </div>
              }>
                <AccountView username={username} />
              </React.Suspense>
            )}

            {/* Enhanced task form modal with Manual/AI toggle */}
            <TaskFormModal
              showTaskForm={showTaskForm}
              editingTask={editingTask}
              taskFormMode={taskFormMode}
              setTaskFormMode={setTaskFormMode}
              aiTaskDetails={aiTaskDetails}
              setAiTaskDetails={setAiTaskDetails}
              isGeneratingTask={isGeneratingTask}
              setIsGeneratingTask={setIsGeneratingTask}
              taskFormData={taskFormData}
              setTaskFormData={setTaskFormData}
              contacts={contacts}
              username={username}
              onClose={() => {
                setShowTaskForm(false);
                setEditingTask(null);
              }}
              onSave={saveTask}
            />

            {/* Welcome to LiaiZen Modal */}
            {showWelcomeModal && (
              <WelcomeModal
                editingTask={editingTask}
                onClose={() => {
                  setShowWelcomeModal(false);
                  setEditingTask(null);
                }}
                onComplete={() => {
                  toggleTaskStatus(editingTask);
                  setShowWelcomeModal(false);
                  setEditingTask(null);
                }}
              />
            )}

            {/* Complete Profile Task Modal */}
            {showProfileTaskModal && (
              <ProfileTaskModal
                editingTask={editingTask}
                onClose={() => {
                  setShowProfileTaskModal(false);
                  setEditingTask(null);
                }}
                onNavigateToProfile={() => {
                  setShowProfileTaskModal(false);
                  setEditingTask(null);
                  setCurrentView('profile');
                }}
              />
            )}

            {/* Feature 005: Invite Co-Parent Task Modal */}
            <InviteTaskModal
              isOpen={showInviteModal}
              onClose={() => setShowInviteModal(false)}
              onSuccess={() => {
                setShowInviteModal(false);
                // Refresh tasks to update auto-completion status
                if (loadTasks) loadTasks();
                // Refresh the page data to get updated co-parent status
                window.location.reload();
              }}
            />

            {/* Message Flagging Modal */}
            <FlaggingModal
              flaggingMessage={flaggingMessage}
              flagReason={flagReason}
              setFlagReason={setFlagReason}
              onFlag={(reason) => {
                flagMessage(flaggingMessage.id || flaggingMessage.timestamp, reason);
                setFlaggingMessage(null);
                setFlagReason('');
              }}
              onClose={() => {
                setFlaggingMessage(null);
                setFlagReason('');
              }}
            />

            {/* Contact Suggestion Modal */}
            <ContactSuggestionModal
              pendingContactSuggestion={pendingContactSuggestion}
              onAddContact={handleAddContactFromSuggestion}
              onDismiss={() => setPendingContactSuggestion(null)}
              setDismissedSuggestions={setDismissedSuggestions}
            />
          </div>
        </div>
        </div>
      </>
    );
  }
}

export default ChatRoom;
// Color scheme updated: white primary, grey secondary, teal accents - Thu Nov 20 22:21:14 PST 2025
