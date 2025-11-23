import React from 'react';
import './index.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import { useTasks } from './hooks/useTasks.js';
import { useChat } from './hooks/useChat.js';
import { useContacts } from './hooks/useContacts.js';
import { useProfile } from './hooks/useProfile.js';
import { useNotifications } from './hooks/useNotifications.js';
import { ContactsPanel } from './components/ContactsPanel.jsx';
import { ProfilePanel } from './components/ProfilePanel.jsx';
import { UpdatesPanel } from './components/UpdatesPanel.jsx';
import { Navigation } from './components/Navigation.jsx';
import { LandingPage } from './components/LandingPage.jsx';
import { PWAInstallButton } from './components/PWAInstallButton.jsx';
import { TaskFormModal } from './components/modals/TaskFormModal.jsx';
import { WelcomeModal } from './components/modals/WelcomeModal.jsx';
import { ProfileTaskModal } from './components/modals/ProfileTaskModal.jsx';
import { FlaggingModal } from './components/modals/FlaggingModal.jsx';
import { ContactSuggestionModal } from './components/modals/ContactSuggestionModal.jsx';
import { API_BASE_URL } from './config.js';
import { apiPost } from './apiClient.js';
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
  trackInterventionFeedback,
} from './utils/analytics.js';
import { setUserProperties } from './utils/analyticsEnhancements.js';

// Vite-migrated shell for the main LiaiZen app.
// Currently focuses on login/signup; chat, tasks, contacts, and profile
// will be brought over next.

function AccountView({ username }) {
  const {
    profileData,
    isLoadingProfile,
    isSavingProfile,
    showPasswordChange,
    passwordData,
    isChangingPassword,
    error,
    setProfileData,
    setShowPasswordChange,
    setPasswordData,
    saveProfile,
    changePassword,
  } = useProfile(username);

  if (isLoadingProfile) {
    return (
      <div className="bg-white rounded-2xl border-2 border-teal-light shadow-lg overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-teal-medium" />
            <p className="mt-6 text-teal-medium font-semibold text-lg">Loading account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-teal-light shadow-lg overflow-hidden">
      <div className="p-6 sm:p-8 space-y-8">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl mb-6 text-sm shadow-sm">
            <div className="font-semibold mb-1">Error</div>
            <div>{error}</div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-teal-dark mb-3">Account</h2>
          <p className="text-base text-gray-600 leading-relaxed">
            Manage billing, authentication, and household members connected to your space.
          </p>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-teal-light shadow-sm hover:shadow-md transition-shadow mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white border-2 border-teal-light rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-teal-dark mb-1">
                Account Information
              </h3>
              <p className="text-sm text-gray-600">Update your email and account details</p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-teal-dark mb-2.5">
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 transition-all text-base text-gray-900 placeholder-gray-400 min-h-[44px]"
                placeholder="your@email.com"
              />
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-teal-light shadow-sm hover:shadow-md transition-shadow mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white border-2 border-teal-light rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-teal-dark mb-1">Password</h3>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="px-5 py-3 bg-white text-teal-medium border-2 border-teal-light hover:bg-teal-lightest rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md min-h-[44px] whitespace-nowrap"
            >
              {showPasswordChange ? 'Cancel' : 'Change Password'}
            </button>
          </div>
          {showPasswordChange && (
            <div className="space-y-5 pt-4 border-t-2 border-teal-light">
              <div>
                <label className="block text-sm font-semibold text-teal-dark mb-2.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 transition-all text-base text-gray-900 placeholder-gray-400 min-h-[44px]"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-dark mb-2.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 transition-all text-base text-gray-900 placeholder-gray-400 min-h-[44px]"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-dark mb-2.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 transition-all text-base text-gray-900 placeholder-gray-400 min-h-[44px]"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                onClick={changePassword}
                disabled={isChangingPassword}
                className="w-full bg-teal-dark hover:bg-teal-darkest text-white py-3.5 px-5 rounded-lg font-semibold disabled:bg-gray-400 transition-all shadow-sm hover:shadow-md min-h-[44px] flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Changing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Other Account Sections */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div className="border-2 border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-teal-dark mb-2">Plan &amp; Billing</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Upgrade plans or download invoices.</p>
          </div>
          <div className="border-2 border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-teal-dark mb-2">Household Access</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Invite, remove, or update connected caregivers.</p>
          </div>
        </div>

        {/* Save button */}
        <div className="bg-teal-dark rounded-xl p-1.5 shadow-md hover:shadow-lg transition-shadow">
          <button
            onClick={saveProfile}
            disabled={isSavingProfile}
            className="w-full bg-teal-dark hover:bg-teal-darkest text-white py-3.5 px-6 rounded-lg font-semibold text-base disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isSavingProfile ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Account</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [showLanding, setShowLanding] = React.useState(() => {
    // Don't show landing if user is already authenticated
    // Check both token keys for compatibility
    return !localStorage.getItem('auth_token_backup') && !localStorage.getItem('token') && !localStorage.getItem('isAuthenticated');
  });

  const {
    username,
    isAuthenticated,
    isCheckingAuth,
    handleLogout,
  } = useAuth();
  const availableViews = ['dashboard', 'chat', 'contacts', 'profile', 'settings', 'account'];
  const [currentView, setCurrentViewState] = React.useState(() => {
    const stored = localStorage.getItem('currentView');
    return stored && availableViews.includes(stored)
      ? stored
      : 'dashboard';
  });

  // Wrap setCurrentView to track analytics
  const setCurrentView = React.useCallback((view) => {
    if (view !== currentView) {
      trackViewChange(view);
    }
    setCurrentViewState(view);
  }, [currentView]);

  // Track unread message count for navigation badge
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Hide landing page once authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      setShowLanding(false);
    }
  }, [isAuthenticated]);

  // Redirect to /signin if not authenticated and not checking auth
  React.useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      // If on root path and not authenticated, show landing page first
      if (showLanding) {
        // Landing page will handle navigation to /signin via "Get Started" button
        return;
      }

      // Otherwise redirect to signin
      const inviteCode = searchParams.get('invite');
      if (inviteCode) {
        navigate(`/signin?invite=${inviteCode}`);
      } else {
        // Don't redirect if already on landing
        if (!showLanding) {
          navigate('/signin');
        }
      }
    }
  }, [isCheckingAuth, isAuthenticated, showLanding, navigate, searchParams]);

  // Reset unread count when navigating to chat view
  React.useEffect(() => {
    if (currentView === 'chat') {
      setUnreadCount(0);
    }
  }, [currentView]);

  React.useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('currentView', currentView);
    }
  }, [isAuthenticated, currentView]);

  const tasksState = useTasks(username);
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
  const { contacts } = useContacts(showLanding ? null : username);

  // Notification system for new messages
  const notifications = useNotifications({
    username,
    enabled: isAuthenticated && !showLanding
  });

  // Callback for new messages - Device notifications only (no in-browser toast)
  const handleNewMessage = React.useCallback((message) => {
    // Increment unread count if not on chat screen
    if (currentView !== 'chat') {
      setUnreadCount(prev => prev + 1);
    }

    // Device notifications are handled by PWA Service Worker
    // No in-browser toast pop-ups - only native device notifications
  }, [username, currentView]);

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
    sendMessage: originalSendMessage,
    handleInputChange,
    messagesEndRef,
    typingUsers,
    setInputMessage,
    removeMessages,
    flagMessage: originalFlagMessage,
    draftCoaching,
    setDraftCoaching,
    isPreApprovedRewrite,
    setIsPreApprovedRewrite,
    setOriginalRewrite,
    threads,
    threadMessages,
    selectedThreadId,
    setSelectedThreadId,
    createThread: originalCreateThread,
    getThreads,
    getThreadMessages,
    addToThread,
    removeFromThread,
    socket,
  } = chatState;

  // Wrap sendMessage to track analytics
  const sendMessage = React.useCallback((e) => {
    const clean = inputMessage.trim();
    if (clean) {
      // Track message sent before sending
      trackMessageSent(clean.length, isPreApprovedRewrite);
    }
    // Call original sendMessage (it handles validation)
    originalSendMessage(e);
  }, [inputMessage, isPreApprovedRewrite, originalSendMessage]);

  // Wrap flagMessage to track analytics
  const flagMessage = React.useCallback((messageId, reason = 'user_flagged') => {
    trackMessageFlagged(reason);
    originalFlagMessage(messageId);
  }, [originalFlagMessage]);

  // Wrap createThread to track analytics
  const createThread = React.useCallback((roomId, title, messageIds) => {
    trackThreadCreated();
    return originalCreateThread(roomId, title, messageIds);
  }, [originalCreateThread]);

  // Thread UI state
  const [showThreadsPanel, setShowThreadsPanel] = React.useState(false);
  const [threadSuggestionModal, setThreadSuggestionModal] = React.useState(null);
  const [creatingThread, setCreatingThread] = React.useState(false);
  const [newThreadTitle, setNewThreadTitle] = React.useState('');

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

  // Invite state for sharing a room with a co-parent
  const [inviteLink, setInviteLink] = React.useState('');
  const [inviteCode, setInviteCode] = React.useState('');
  const [inviteError, setInviteError] = React.useState('');
  const [isLoadingInvite, setIsLoadingInvite] = React.useState(false);
  const [inviteCopied, setInviteCopied] = React.useState(false);
  const [pendingInviteCode, setPendingInviteCode] = React.useState(null);
  const [isAcceptingInvite, setIsAcceptingInvite] = React.useState(false);
  const [hasCoParentConnected, setHasCoParentConnected] = React.useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false);
  const [showProfileTaskModal, setShowProfileTaskModal] = React.useState(false);
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
    localStorage.setItem('liaizen_add_contact', JSON.stringify({
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
    console.log('Navigating to contacts for:', memberName);
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

  // Check for invite code in URL on mount
  React.useEffect(() => {
    const inviteCodeFromUrl = searchParams.get('invite');
    if (inviteCodeFromUrl) {
      console.log('Invite code detected in URL:', inviteCodeFromUrl);
      setPendingInviteCode(inviteCodeFromUrl);
      // Clean up URL (remove invite param)
      navigate(window.location.pathname, { replace: true });
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
          console.log('Successfully accepted invite, joined room:', data.roomId);
          setPendingInviteCode(null);
          setHasCoParentConnected(true); // Co-parents are now connected
          
          // Update user properties when co-parent connects
          setUserProperties({
            has_coparent: true,
            room_status: 'multi_user',
          });
          // Show success message briefly
          setInviteError(''); // Clear errors
          // Note: Periodic room member check will confirm connection
          // Note: Contacts will auto-refresh when user navigates to that view
        } else {
          setInviteError(data.error || 'Failed to accept invite. Please try again.');
        }
      } catch (err) {
        console.error('Error accepting invite (Vite):', err);
        setInviteError('Failed to accept invite. Please check your connection and try again.');
      } finally {
        setIsAcceptingInvite(false);
      }
    };

    if (isAuthenticated && pendingInviteCode) {
      acceptInvite();
    }
  }, [isAuthenticated, username, pendingInviteCode]);

  // Check if co-parents are connected by querying room membership
  const checkRoomMembers = React.useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('auth_token_backup');
      const response = await fetch(
        `${API_BASE_URL.replace(/\/+$/, '')}/api/room/members/check`,
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
        const hasMultiple = data.hasMultipleMembers === true;
        console.log(`[checkRoomMembers] API response: hasMultipleMembers=${hasMultiple}`);
        setHasCoParentConnected(hasMultiple);
        
        // Update user properties when co-parent connects
        if (hasMultiple) {
          setUserProperties({
            has_coparent: true,
            room_status: 'multi_user',
          });
        }
      } else if (response.status === 404) {
        // Endpoint doesn't exist yet (server not restarted) - fallback to message-based detection
        console.log('[checkRoomMembers] API endpoint not found, using message-based detection');
        if (messages.length > 0 && username) {
          const uniqueUsernames = new Set(
            messages
              .filter((msg) => msg.username && msg.type !== 'ai_intervention' && msg.type !== 'ai_comment')
              .map((msg) => msg.username),
          );
          const hasMultiple = uniqueUsernames.size >= 2;
          console.log(`[checkRoomMembers] Message-based: ${uniqueUsernames.size} unique users, hasMultiple=${hasMultiple}`);
          setHasCoParentConnected(hasMultiple);
        } else {
          setHasCoParentConnected(false);
        }
      } else {
        // Other error - try message-based detection
        console.log(`[checkRoomMembers] API error ${response.status}, using message-based detection`);
        if (messages.length > 0 && username) {
          const uniqueUsernames = new Set(
            messages
              .filter((msg) => msg.username && msg.type !== 'ai_intervention' && msg.type !== 'ai_comment')
              .map((msg) => msg.username),
          );
          const hasMultiple = uniqueUsernames.size >= 2;
          console.log(`[checkRoomMembers] Message-based: ${uniqueUsernames.size} unique users, hasMultiple=${hasMultiple}`);
          setHasCoParentConnected(hasMultiple);
        } else {
          setHasCoParentConnected(false);
        }
      }
    } catch (err) {
      console.error('Error checking room members (Vite):', err);
      // Fallback to message-based detection if API fails
      if (messages.length > 0 && username) {
        const uniqueUsernames = new Set(
          messages
            .filter((msg) => msg.username && msg.type !== 'ai_intervention' && msg.type !== 'ai_comment')
            .map((msg) => msg.username),
        );
        const hasMultiple = uniqueUsernames.size >= 2;
        console.log(`[checkRoomMembers] Error fallback: ${uniqueUsernames.size} unique users, hasMultiple=${hasMultiple}`);
        setHasCoParentConnected(hasMultiple);
      } else {
        setHasCoParentConnected(false);
      }
    }
  }, [isAuthenticated, messages, username]);

  React.useEffect(() => {
    // Check immediately when authenticated and in chat view
    if (currentView === 'chat' && isAuthenticated) {
      checkRoomMembers();
    }

    // Also check periodically while in chat view (every 3 seconds)
    let interval;
    if (currentView === 'chat' && isAuthenticated) {
      interval = setInterval(checkRoomMembers, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentView, isAuthenticated, checkRoomMembers]);

  // Check once when user first authenticates (in case they're already in a room)
  React.useEffect(() => {
    if (isAuthenticated) {
      // Small delay to ensure user data is loaded
      const timer = setTimeout(() => {
        checkRoomMembers();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, checkRoomMembers]);

  // Also check when new messages arrive (indicates someone else might be in room)
  React.useEffect(() => {
    if (isAuthenticated && messages.length > 0 && !hasCoParentConnected) {
      checkRoomMembers();
    }
  }, [messages.length, isAuthenticated, hasCoParentConnected, checkRoomMembers]);

  // Load or get existing invite link (optimized - uses GET with session auth, falls back to POST)
  const handleLoadInvite = async () => {
    if (!isAuthenticated || isLoadingInvite) {
      setInviteError('Please make sure you are logged in.');
      return;
    }
    setInviteError('');
    setInviteCopied(false);
    setIsLoadingInvite(true);
    
    // Use POST for now (GET endpoint requires server restart)
    // TODO: Switch to GET once server is updated
    try {
      const currentUsername = username || localStorage.getItem('username');
      if (!currentUsername) {
        setInviteError('Unable to determine username. Please log out and back in.');
        setIsLoadingInvite(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL.replace(/\/+$/, '')}/api/room/invite`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: currentUsername }),
        },
      );

      // Parse response (handle both JSON and text errors)
      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        // If JSON parsing fails, try to get text
        const text = await response.text();
        console.error('Failed to parse response as JSON:', text);
        setInviteError(`Server error: ${response.status} ${response.statusText}`);
        return;
      }

      if (!response.ok) {
        console.error('Invite API error:', data);
        if (response.status === 401) {
          setInviteError('Please log in again to create an invite.');
        } else if (response.status === 404) {
          setInviteError('Invite endpoint not found. The server may need to be restarted.');
        } else {
          setInviteError(data.error || data.message || `Unable to get invite (${response.status}). Please try again.`);
        }
        return;
      }
      if (!data.success) {
        setInviteError(data.error || data.message || 'Unable to get invite. Please try again.');
        return;
      }
      setInviteCode(data.inviteCode);
      // Construct invite link using current window location (works for both dev and production)
      const currentOrigin = window.location.origin;
      const inviteLink = `${currentOrigin}${window.location.pathname}?invite=${data.inviteCode}`;
      setInviteLink(inviteLink);
    } catch (err) {
      console.error('Error loading invite (Vite):', err);
      setInviteError('Unable to load invite. Please check your connection and try again.');
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

  // Debug logging
  console.log('[ChatRoom] Render state:', {
    isAuthenticated,
    showLanding,
    isCheckingAuth,
    username
  });

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
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        {/* Device notifications handled by PWA Service Worker - no in-browser toasts */}

        {/* Navigation - Top for desktop, Bottom for mobile */}
        <Navigation
          currentView={currentView}
          setCurrentView={setCurrentView}
          onLogout={handleLogout}
          unreadCount={unreadCount}
          hasMeanMessage={messages.some(msg =>
            msg.username === username &&
            msg.user_flagged_by &&
            Array.isArray(msg.user_flagged_by) &&
            msg.user_flagged_by.length > 0
          )}
        />

        {/* Main Content Area */}
        <div className={`${currentView === 'chat' ? 'flex-1 min-h-0 overflow-hidden pt-0 pb-16 md:pt-10 md:pb-4' : 'pt-10 md:pt-10 pb-20 md:pb-8 overflow-y-auto px-4 sm:px-6 md:px-8'} relative z-10`}>
          <div className={`${currentView === 'chat' ? 'h-full flex flex-col overflow-hidden' : 'max-w-7xl mx-auto w-full'}`}>
            {/* Dashboard View - Monochrome Style */}
            {currentView === 'dashboard' && (
              <div className="space-y-6 md:space-y-8">
                {/* Invite acceptance notification */}
                {isAcceptingInvite && (
                  <div className="rounded-xl border-2 border-teal-light bg-white px-6 py-4 text-sm text-teal-medium mb-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-teal-light border-t-teal-medium" />
                      <span className="font-medium">Accepting invite and joining room…</span>
                    </div>
                  </div>
                )}

                {/* Dashboard Grid: Tasks and Updates */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  {/* Tasks Section */}
                  <div className="bg-white rounded-2xl border-2 border-teal-light p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-teal-dark mb-1">
                          Your Tasks
                        </h2>
                        <p className="text-sm text-gray-600">Manage your co-parenting tasks</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingTask(null);
                          setTaskFormMode('manual');
                          setAiTaskDetails('');
                          setIsGeneratingTask(false);
                          setTaskFormData({
                            title: '',
                            description: '',
                            status: 'open',
                            priority: 'medium',
                            due_date: '',
                            assigned_to: 'self',
                            related_people: [],
                          });
                          setShowTaskForm(true);
                        }}
                        className="px-6 py-3 bg-teal-dark text-white rounded-lg text-sm font-semibold hover:bg-teal-darkest transition-all shadow-sm hover:shadow-md flex items-center gap-2 min-h-[44px] whitespace-nowrap"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Task
                      </button>
                    </div>
                    
                    {/* Search and Filter Controls */}
                    <div className="mb-6 space-y-4">
                      {/* Search Input */}
                      <div className="relative">
                        <input
                          type="text"
                          value={taskSearch}
                          onChange={(e) => setTaskSearch(e.target.value)}
                          placeholder="Search tasks..."
                          className="w-full px-5 py-3.5 pl-11 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 text-base bg-white min-h-[44px] transition-all"
                        />
                        <svg className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {taskSearch && (
                          <button
                            onClick={() => setTaskSearch('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-medium p-1.5 rounded-lg hover:bg-gray-50 transition-all touch-manipulation"
                            aria-label="Clear search"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {/* Filter Buttons */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={() => setTaskFilter('open')}
                          className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all min-h-[44px] touch-manipulation ${
                            taskFilter === 'open'
                              ? 'bg-teal-dark text-white shadow-sm hover:shadow-md'
                              : 'bg-white border-2 border-teal-light text-teal-medium hover:border-teal-medium hover:bg-teal-lightest'
                          }`}
                        >
                          Open
                        </button>
                        <button
                          onClick={() => setTaskFilter('completed')}
                          className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all min-h-[44px] touch-manipulation ${
                            taskFilter === 'completed'
                              ? 'bg-teal-medium text-white shadow-sm hover:shadow-md'
                              : 'bg-white border-2 border-teal-light text-teal-medium hover:border-teal-medium hover:bg-teal-lightest'
                          }`}
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => setTaskFilter('all')}
                          className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all min-h-[44px] touch-manipulation ${
                            taskFilter === 'all'
                              ? 'bg-teal-medium text-white shadow-sm hover:shadow-md'
                              : 'bg-white border-2 border-teal-light text-teal-medium hover:border-teal-medium hover:bg-teal-lightest'
                          }`}
                        >
                          All
                        </button>
                      </div>
                    </div>
                  {isLoadingTasks ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-teal-light border-t-teal-medium" />
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 text-base">
                        {taskSearch || taskFilter !== 'open'
                          ? 'No tasks match your search or filter criteria.'
                          : 'No open tasks found. Create your first task to get started!'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map((task) => {
                        const titleLower = (task.title || '').toLowerCase().trim();
                        const isCoparentTask =
                          titleLower.includes('add your co-parent') ||
                          titleLower.includes('add coparent');
                        const isProfileTask =
                          titleLower.includes('complete your profile') ||
                          titleLower.includes('complete profile');
                        const isChildrenTask =
                          titleLower.includes('add your children') ||
                          titleLower.includes('add children');
                        const isWelcomeTask = titleLower.includes('welcome');
                        const isSmartTask =
                          task.status !== 'completed' &&
                          (isCoparentTask || isProfileTask || isChildrenTask);

                        // Get icon based on task content
                        const getTaskIcon = () => {
                          const iconSize = "w-full h-full";
                          if (isWelcomeTask) {
                            return (
                              <svg className={`${iconSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            );
                          }
                          if (isProfileTask) {
                            return (
                              <svg className={`${iconSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            );
                          }
                          if (isCoparentTask) {
                            return (
                              <svg className={`${iconSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            );
                          }
                          if (isChildrenTask) {
                            return (
                              <svg className={`${iconSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            );
                          }
                          // Default task icon
                          return (
                            <svg className={`${iconSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          );
                        };

                        return (
                          <div
                            key={task.id}
                            onClick={() => {
                              // Welcome task: show static info modal
                              if (task.title === 'Welcome to LiaiZen') {
                                setEditingTask(task);
                                setShowWelcomeModal(true);
                                return;
                              }

                              // Profile task: show profile task modal
                              if (isProfileTask) {
                                setEditingTask(task);
                                setShowProfileTaskModal(true);
                                return;
                              }

                              if (isSmartTask) {
                                if (isCoparentTask) {
                                  localStorage.setItem('liaizen_smart_task', 'add_coparent');
                                  setCurrentView('contacts');
                                } else if (isChildrenTask) {
                                  setCurrentView('contacts');
                                }
                                return;
                              }

                              // Regular task: open edit modal
                              setEditingTask(task);
                              setTaskFormData({
                                title: task.title,
                                description: task.description || '',
                                status: task.status,
                                priority: task.priority || 'medium',
                                due_date: task.due_date || '',
                                assigned_to: task.assigned_to || 'self',
                                related_people: Array.isArray(task.related_people) ? task.related_people : [],
                              });
                              setShowTaskForm(true);
                            }}
                            className={`flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl cursor-pointer transition-all touch-manipulation ${
                              task.status === 'completed'
                                ? 'bg-gray-50 opacity-70 border-2 border-gray-200'
                                : 'bg-white hover:shadow-md active:scale-[0.98] border-2 border-teal-light hover:border-teal-medium shadow-sm'
                            }`}
                          >
                            {/* Task Icon/Status Circle */}
                            <div className="flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskStatus(task);
                                }}
                                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all touch-manipulation shadow-sm hover:shadow-md ${
                                  task.status === 'completed' ? 'bg-teal-medium' : 'bg-teal-medium'
                                }`}
                              >
                                {task.status === 'completed' ? (
                                  <svg
                                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                ) : (
                                  <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                                    {getTaskIcon()}
                                  </div>
                                )}
                              </button>
                            </div>

                            {/* Task Content */}
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 mb-1">
                                <h3
                                  className={`text-sm sm:text-base font-semibold text-teal-dark truncate ${
                                    task.status === 'completed'
                                      ? 'line-through text-gray-400'
                                      : ''
                                  }`}
                                >
                                  {isSmartTask
                                    ? isCoparentTask
                                      ? 'Add Co-parent'
                                      : isProfileTask
                                      ? 'Complete Profile'
                                      : isChildrenTask
                                      ? 'Add Children'
                                      : task.title
                                    : task.title}
                                </h3>
                                {isSmartTask && (
                                  <svg
                                    className="w-4 h-4 sm:w-5 sm:h-5 text-teal-medium flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                )}
                              </div>
                              {task.description && (
                                <p
                                  className={`text-sm text-gray-600 line-clamp-2 break-words leading-relaxed ${
                                    task.status === 'completed'
                                      ? 'line-through text-gray-400'
                                      : ''
                                  }`}
                                >
                                  {task.description}
                                </p>
                              )}
                              {/* Assigned and Related People */}
                              {(task.assigned_to || (Array.isArray(task.related_people) && task.related_people.length > 0)) && (
                                <div className="flex items-center gap-2 sm:gap-3 mt-3 flex-wrap">
                                  {task.assigned_to && (() => {
                                    if (task.assigned_to === 'self') {
                                      return (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-teal-medium rounded-lg text-xs font-medium border-2 border-teal-light shadow-sm">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span className="hidden sm:inline">Assigned: </span>
                                          Self (me)
                                        </span>
                                      );
                                    }
                                    const assignedContact = contacts.find(c => c.id.toString() === task.assigned_to.toString());
                                    return assignedContact ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-teal-medium rounded-lg text-xs font-medium border-2 border-teal-light shadow-sm">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="hidden sm:inline">Assigned: </span>
                                        {assignedContact.contact_name}
                                      </span>
                                    ) : null;
                                  })()}
                                  {Array.isArray(task.related_people) && task.related_people.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-teal-medium rounded-lg text-xs font-medium border-2 border-teal-light shadow-sm">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      {task.related_people.length} {task.related_people.length === 1 ? 'person' : 'people'}
                                      <span className="hidden sm:inline"> for context</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>

                  {/* Updates Section */}
                  <UpdatesPanel
                    username={username}
                    onContactClick={(contactName) => {
                      // Navigate to contacts view when clicking on a person
                      setCurrentView('contacts');
                    }}
                  />

                  {/* Threads Section */}
                  <div className="bg-white rounded-2xl border-2 border-teal-light shadow-sm hover:shadow-md transition-shadow overflow-hidden mt-6 md:mt-8">
                    <div className="p-6 sm:p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-semibold text-teal-dark mb-1">
                            Threads
                          </h2>
                          <p className="text-sm text-gray-600">Organized conversation topics</p>
                        </div>
                        {threads.length > 0 && (
                          <button
                            onClick={() => setCurrentView('chat')}
                            className="text-sm text-teal-medium hover:text-teal-dark font-semibold px-4 py-2 rounded-lg hover:bg-teal-lightest transition-colors"
                          >
                            View All ({threads.length})
                          </button>
                        )}
                      </div>

                      {threads.length === 0 ? (
                        <div className="text-center py-12">
                          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p className="text-gray-600 text-base">
                            No conversation threads yet. Start a chat to create threads!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {threads.slice(0, 3).map((thread) => (
                            <div
                              key={thread.id}
                              onClick={() => {
                                setSelectedThreadId(thread.id);
                                setCurrentView('chat');
                              }}
                              className="p-4 border-2 border-teal-light rounded-xl hover:border-teal-medium hover:bg-teal-lightest transition-all cursor-pointer shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-white border-2 border-teal-light rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <svg className="w-5 h-5 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-3 mb-1">
                                    <h3 className="text-base font-semibold text-teal-dark truncate">
                                      {thread.title}
                                    </h3>
                                    {thread.message_count > 0 && (
                                      <span className="text-xs text-gray-500 font-medium flex-shrink-0 bg-gray-100 px-2 py-1 rounded-lg">
                                        {thread.message_count} {thread.message_count === 1 ? 'msg' : 'msgs'}
                                      </span>
                                    )}
                                  </div>
                                  {thread.last_message_at && (
                                    <p className="text-xs text-gray-500">
                                      {new Date(thread.last_message_at).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Full chat view */}
            {/* Chat View */}
            {currentView === 'chat' && (
              <div className="h-full flex flex-col relative">
                {/* Threads button and invite link - moved to top right corner */}
                <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
                  {threads.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowThreadsPanel(!showThreadsPanel)}
                      className="px-5 py-3 rounded-lg bg-teal-dark text-white text-sm font-semibold hover:bg-teal-darkest transition-all border-2 border-teal-dark flex items-center gap-2 shadow-sm hover:shadow-md min-h-[44px]"
                      title="View threads"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Threads ({threads.length})
                    </button>
                  )}
                  {(() => {
                    const shouldShowInvite = !inviteLink && !hasCoParentConnected;
                    if (process.env.NODE_ENV === 'development') {
                      console.log('[Invite Button] shouldShowInvite:', shouldShowInvite, 'inviteLink:', inviteLink, 'hasCoParentConnected:', hasCoParentConnected);
                    }
                    return shouldShowInvite ? (
                      <button
                        type="button"
                        onClick={handleLoadInvite}
                        disabled={isLoadingInvite || !isAuthenticated}
                        className="px-5 py-3 rounded-lg bg-teal-dark text-white text-sm font-semibold hover:bg-teal-darkest disabled:opacity-60 disabled:cursor-not-allowed transition-all border-2 border-teal-dark shadow-sm hover:shadow-md min-h-[44px] flex items-center gap-2"
                        title="Invite your co-parent to join this mediation room"
                      >
                        {isLoadingInvite ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Loading…</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Invite co-parent</span>
                          </>
                        )}
                      </button>
                    ) : null;
                  })()}
                </div>

                {/* Chat Content */}
                <div className="flex flex-1 min-h-0">
                  {/* Threads Sidebar */}
                  {showThreadsPanel && (
                    <div className="w-72 border-r-2 border-teal-light bg-white flex flex-col shadow-lg">
                      <div className="p-4 border-b-2 border-teal-light flex items-center justify-between bg-teal-lightest">
                        <h3 className="font-semibold text-base text-teal-dark">Threads</h3>
                        <button
                          type="button"
                          onClick={() => setShowThreadsPanel(false)}
                          className="text-gray-500 hover:text-teal-medium p-1.5 rounded-lg hover:bg-white transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {threads.length === 0 ? (
                          <div className="p-6 text-sm text-gray-500 text-center">
                            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p>No threads yet. Start a conversation about a specific topic to create one.</p>
                          </div>
                        ) : (
                          threads.map((thread) => (
                            <button
                              key={thread.id}
                              type="button"
                              onClick={() => {
                                setSelectedThreadId(thread.id === selectedThreadId ? null : thread.id);
                                if (thread.id !== selectedThreadId) {
                                  getThreadMessages(thread.id);
                                }
                              }}
                              className={`w-full text-left p-4 border-b border-gray-100 hover:bg-teal-lightest transition-colors ${
                                selectedThreadId === thread.id ? 'bg-teal-lightest border-l-4 border-l-teal-medium' : ''
                              }`}
                            >
                              <div className="font-semibold text-sm text-teal-dark mb-1">{thread.title}</div>
                              <div className="text-xs text-gray-500 font-medium">
                                {thread.message_count || 0} {thread.message_count === 1 ? 'message' : 'messages'}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Main Chat Area */}
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {inviteError && (
                <div className="mb-4 rounded-xl border-2 border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900 shadow-sm">
                  <div className="font-semibold mb-2 text-base">Error</div>
                  <div className="leading-relaxed">{inviteError}</div>
                  {inviteError.includes('404') && (
                    <div className="mt-3 text-xs text-red-700">
                      The server may need to be restarted. Please contact support if this persists.
                    </div>
                  )}
                </div>
              )}

              {inviteLink && !hasCoParentConnected && (
                <div className="mb-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-6 py-5 text-sm text-emerald-900 shadow-md">
                  <div className="font-semibold mb-3 text-lg text-emerald-800">
                    Invite your co-parent
                  </div>
                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-4 block p-3 bg-white rounded-lg border-2 border-emerald-200 break-all text-emerald-800 font-mono text-xs hover:bg-emerald-100 transition-colors shadow-sm"
                    onClick={(e) => {
                      // Ensure link opens even if service worker tries to intercept
                      e.preventDefault();
                      window.location.href = inviteLink;
                    }}
                  >
                    {inviteLink}
                  </a>
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="flex-1 px-5 py-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 min-h-[44px] shadow-sm hover:shadow-md"
                    >
                      {inviteCopied ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy link</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInviteLink('');
                        setInviteCode('');
                        setInviteError('');
                      }}
                      className="px-5 py-3 rounded-lg border-2 border-emerald-300 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors min-h-[44px] bg-white"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-4 text-xs text-emerald-700 leading-relaxed">
                    Share this link with your co-parent. When they click it, they'll join this mediation room. This room is for co-parents only.
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 pt-6 pb-2 space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                {(() => {
                  // Helper function to get initials from username
                  // Calculate streak for each message
                  const getMessageStreak = (msgIndex) => {
                    let streak = 0;
                    // Count backwards from current message to find streak
                    for (let i = msgIndex; i >= 0; i--) {
                      const msg = filteredMessages[i];
                      // Only count messages from the same user
                      if (msg.username !== username) continue;

                      const isFlagged = msg.user_flagged_by &&
                                       Array.isArray(msg.user_flagged_by) &&
                                       msg.user_flagged_by.length > 0;

                      if (isFlagged) {
                        // If this is the current message (flagged), return the streak before it
                        if (i === msgIndex) return streak;
                        // If we hit a flagged message in the past, stop counting
                        break;
                      }

                      // Only increment if it's from the current user
                      if (msg.username === username) {
                        streak++;
                      }
                    }
                    return streak;
                  };

                  const getStreakBadge = (message, messageIndex) => {
                    // Only show badge for current user's messages
                    if (message.username !== username) return null;

                    // Check if message is flagged (needs moderation)
                    const isFlagged = message.user_flagged_by &&
                                     Array.isArray(message.user_flagged_by) &&
                                     message.user_flagged_by.length > 0;

                    const streak = getMessageStreak(messageIndex);

                    // Return just the streak badge
                    return (
                      <div className={`rounded-full text-sm font-bold px-2 py-1 shadow-md ${
                        isFlagged
                          ? 'bg-red-500 text-white'
                          : 'text-white'
                      }`}
                      style={!isFlagged ? { backgroundColor: '#FFBE74' } : {}}>
                        {isFlagged ? streak : '+1'}
                      </div>
                    );
                  };
                  
                  // Get avatar color based on username
                  const getAvatarColor = (name) => {
                    if (!name) return 'bg-gray-400';
                    const colors = [
                      'bg-gradient-to-br from-teal-medium to-teal-medium',
                      'bg-gradient-to-br from-teal-dark to-teal-darkest',
                      'bg-gradient-to-br from-teal-500 to-teal-700',
                      'bg-gradient-to-br from-cyan-500 to-cyan-700',
                    ];
                    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    return colors[hash % colors.length];
                  };
                  
                  const filteredMessages = messages.filter((msg) => msg.type !== 'contact_suggestion');
                  
                  // Group messages for better iMessage-like display
                  const messageGroups = [];
                  let currentGroup = null;
                  
                  filteredMessages.forEach((msg, index) => {
                    const isOwn = msg.username === username;
                    const isAI = msg.type === 'ai_intervention' || msg.type === 'ai_comment';
                    const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
                    const prevIsAI = prevMsg && (prevMsg.type === 'ai_intervention' || prevMsg.type === 'ai_comment');
                    const timeGap = prevMsg && msg.timestamp && prevMsg.timestamp
                      ? new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 5 * 60 * 1000
                      : false;
                    const newSpeaker = prevMsg && prevMsg.username !== msg.username;
                    const typeChanged = prevIsAI !== isAI;
                    
                    // AI messages always start a new group, and regular messages always start new group after AI
                    // Start new group if: first message, new speaker, type changed (AI vs regular), or time gap > 5 min
                    if (!currentGroup || newSpeaker || typeChanged || timeGap || index === 0) {
                      currentGroup = {
                        messages: [msg],
                        username: msg.username,
                        isOwn: isOwn,
                        isAI: isAI,
                        timestamp: msg.timestamp,
                        startIndex: index
                      };
                      messageGroups.push(currentGroup);
                    } else {
                      // Add to current group (only if same type and speaker)
                      currentGroup.messages.push(msg);
                    }
                  });
                  
                  return messageGroups.map((group, groupIndex) => {
                    const isOwn = group.isOwn;
                    const isAI = group.isAI;
                    const groupTimeLabel = group.timestamp && new Date(group.timestamp).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    });
                    
                    // Check if we should show date separator
                    const prevGroup = groupIndex > 0 ? messageGroups[groupIndex - 1] : null;
                    const showDateSeparator = prevGroup && group.timestamp && prevGroup.timestamp
                      ? new Date(group.timestamp).toDateString() !== new Date(prevGroup.timestamp).toDateString()
                      : groupIndex === 0;
                    
                    const dateLabel = group.timestamp && (() => {
                      const msgDate = new Date(group.timestamp);
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);
                      
                      if (msgDate.toDateString() === today.toDateString()) {
                        return 'Today';
                      } else if (msgDate.toDateString() === yesterday.toDateString()) {
                        return 'Yesterday';
                      } else {
                        return msgDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
                      }
                    })();
                    
                    // Handle AI messages separately
                    if (isAI) {
                      return group.messages.map((msg) => {
                        const isIntervention = msg.type === 'ai_intervention';
                        const isComment = msg.type === 'ai_comment' && msg.text && !msg.personalMessage;
                        
                        const handleRewriteSelected = () => {
                          removeMessages((m) => m.id === msg.id || 
                            (m.type === 'ai_intervention' && m.timestamp === msg.timestamp));
                          if (msg.originalMessage) {
                            removeMessages((m) => 
                              m.flagged === true && 
                              m.private === true &&
                              m.username === msg.originalMessage.username &&
                              m.text === msg.originalMessage.text
                            );
                          }
                        };
                        
                        return (
                          <div key={msg.id ?? `ai-${msg.timestamp}`} className="mb-4 first:mt-0">
                            {groupTimeLabel && (
                              <div className="flex items-center justify-center mb-2">
                                <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-md">{groupTimeLabel}</span>
                              </div>
                            )}
                            <div className="flex items-start gap-3 max-w-[75%] sm:max-w-[60%] md:max-w-[55%] mx-auto">
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-gray-200">
                                {isComment ? (
                                  <svg className="w-5 h-5 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-2">
                                  <span className="font-semibold text-sm text-gray-900">
                                    {msg.username || 'LiaiZen'}
                                  </span>
                                </div>
                                <div className="rounded-2xl px-4 py-3 bg-white border-2 border-teal-light shadow-sm">
                                  {isComment && msg.text && (
                                    <p className="text-sm text-gray-900 leading-relaxed">{msg.text}</p>
                                  )}
                                  {!isComment && (
                                    <>
                                      {msg.explanation && (
                                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                          <p className="text-sm text-blue-800 mb-1 leading-relaxed">
                                            <strong className="font-semibold">Why I'm intervening:</strong> {msg.explanation}
                                          </p>
                                        </div>
                                      )}
                                      {msg.personalMessage && (
                                        <p className="text-sm text-gray-900 leading-relaxed mb-3">{msg.personalMessage}</p>
                                      )}
                                      {(msg.tip1 || msg.tip2 || msg.tip3) && (
                                        <div className="mb-3">
                                          <p className="text-xs font-semibold text-gray-700 mb-2">Communication Tips:</p>
                                          <ul className="space-y-1.5 text-sm text-gray-700">
                                            {msg.tip1 && <li className="leading-relaxed">• {msg.tip1}</li>}
                                            {msg.tip2 && <li className="leading-relaxed">• {msg.tip2}</li>}
                                            {msg.tip3 && <li className="leading-relaxed">• {msg.tip3}</li>}
                                          </ul>
                                        </div>
                                      )}
                                      {(msg.rewrite1 || msg.rewrite2) && (
                                        <div className="space-y-2 pt-3 border-t border-gray-200">
                                          <p className="text-xs font-semibold text-gray-700 mb-2">Suggested Rewrites:</p>
                                          {msg.rewrite1 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const originalText = msg.originalMessage?.text || '';
                                                trackRewriteUsed('option_1', originalText.length, msg.rewrite1.length);
                                                handleRewriteSelected();
                                                setInputMessage(msg.rewrite1);
                                                setIsPreApprovedRewrite(true);
                                                setOriginalRewrite(msg.rewrite1);
                                              }}
                                              className="w-full text-left p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors text-sm text-green-800"
                                            >
                                              <span className="text-xs font-semibold text-green-700 mb-1 block">Option 1:</span>
                                              "{msg.rewrite1}"
                                            </button>
                                          )}
                                          {msg.rewrite2 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const originalText = msg.originalMessage?.text || '';
                                                trackRewriteUsed('option_2', originalText.length, msg.rewrite2.length);
                                                handleRewriteSelected();
                                                setInputMessage(msg.rewrite2);
                                                setIsPreApprovedRewrite(true);
                                                setOriginalRewrite(msg.rewrite2);
                                              }}
                                              className="w-full text-left p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors text-sm text-green-800"
                                            >
                                              <span className="text-xs font-semibold text-green-700 mb-1 block">Option 2:</span>
                                              "{msg.rewrite2}"
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    }

                  // AI messages are now handled in the grouping logic above
                  // This old code block is no longer needed
                  if (false && (msg.type === 'ai_intervention' || msg.type === 'ai_comment')) {
                    const isIntervention = msg.type === 'ai_intervention';
                    const isComment = msg.type === 'ai_comment' && msg.text && !msg.personalMessage;
                    
                    // Helper function to remove intervention and original blocked message (only for interventions)
                    const handleRewriteSelected = () => {
                      // Remove the intervention message
                      removeMessages((m) => m.id === msg.id || 
                        (m.type === 'ai_intervention' && m.timestamp === msg.timestamp));
                      
                      // Remove the original blocked message (flagged and matches originalMessage)
                      if (msg.originalMessage) {
                        removeMessages((m) => 
                          m.flagged === true && 
                          m.private === true &&
                          m.username === msg.originalMessage.username &&
                          m.text === msg.originalMessage.text
                        );
                      }
                    };
                    
                    return (
                      <div
                        key={msg.id ?? `ai-${msg.timestamp}`}
                        className={`flex items-start gap-3 ${needsSpacing || index === 0 ? 'mt-3' : 'mt-1'}`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md border-2 border-teal-light">
                          {isComment ? (
                            <svg className="w-6 h-6 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-3 mb-3">
                            <span className="font-semibold text-base text-teal-dark">
                              {msg.username || 'LiaiZen'}
                            </span>
                            {timeLabel && (
                              <span className="text-xs text-gray-500 font-medium">{timeLabel}</span>
                            )}
                          </div>
                          <div
                            className={`rounded-xl px-6 py-5 max-w-full break-words space-y-4 shadow-md hover:shadow-lg transition-all bg-white border-2 ${
                              isIntervention
                                ? 'border-teal-light'
                                : isComment
                                ? 'border-teal-light'
                                : 'border-teal-light'
                            }`}
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {/* COMMENT: Simple conversational message */}
                            {isComment && msg.text && (
                              <p className="text-sm text-gray-900 leading-relaxed">
                                {msg.text}
                              </p>
                            )}

                            {/* INTERVENTION: Validation, Tips, Rewrites */}
                            {!isComment && (
                              <>
                                {/* Explanation and Override Controls */}
                                {msg.explanation && (
                                  <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-sm">
                                    <p className="text-sm text-blue-800 mb-2 leading-relaxed">
                                      <strong className="font-semibold">Why I'm intervening:</strong> {msg.explanation}
                                    </p>
                                    {msg.confidence !== undefined && (
                                      <p className="text-xs text-blue-600 font-medium">
                                        Confidence: {msg.confidence}%
                                      </p>
                                    )}
                                    {msg.overrideOptions && msg.overrideOptions.canOverride && (
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {msg.overrideOptions.overrideOptions.map((option, idx) => (
                                          <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                              if (option.action === 'send_anyway') {
                                                // Track override
                                                trackInterventionOverride(option.action);
                                                // Emit override event
                                                if (socket) {
                                                  socket.emit('override_intervention', {
                                                    messageId: msg.originalMessage?.id || msg.timestamp,
                                                    overrideAction: option.action
                                                  });
                                                  // Remove intervention message
                                                  removeMessages((m) => m.id === msg.id);
                                                }
                                              } else if (option.action === 'edit_first') {
                                                // Track override
                                                trackInterventionOverride(option.action);
                                                // Pre-fill input with original message
                                                setInputMessage(msg.originalMessage?.text || '');
                                                removeMessages((m) => m.id === msg.id);
                                              }
                                            }}
                                            className="px-3 py-2 text-xs font-medium bg-white border-2 border-blue-300 rounded-lg text-blue-700 hover:bg-blue-100 transition-all shadow-sm"
                                          >
                                            {option.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Feedback buttons for interventions */}
                                {isIntervention && (
                                  <div className="mb-4 flex items-center gap-3 text-sm">
                                    <span className="text-gray-600 font-medium">Was this helpful?</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        if (socket) {
                                          socket.emit('intervention_feedback', {
                                            interventionId: msg.id,
                                            helpful: true
                                          });
                                          // Show thank you message briefly
                                          const feedbackBtn = e.target;
                                          feedbackBtn.textContent = '✓ Thank you!';
                                          feedbackBtn.disabled = true;
                                          setTimeout(() => {
                                            feedbackBtn.textContent = 'Yes';
                                            feedbackBtn.disabled = false;
                                          }, 2000);
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all font-medium shadow-sm"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        if (socket) {
                                          socket.emit('intervention_feedback', {
                                            interventionId: msg.id,
                                            helpful: false
                                          });
                                          // Show thank you message briefly
                                          const feedbackBtn = e.target;
                                          feedbackBtn.textContent = '✓ Thank you!';
                                          feedbackBtn.disabled = true;
                                          setTimeout(() => {
                                            feedbackBtn.textContent = 'No';
                                            feedbackBtn.disabled = false;
                                          }, 2000);
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium shadow-sm"
                                    >
                                      No
                                    </button>
                                  </div>
                                )}

                                {/* Personal Message from AI Coach */}
                                {msg.personalMessage && (
                                  <div className="mb-5">
                                    <p className="text-base leading-relaxed text-gray-800 font-medium">
                                      {msg.personalMessage}
                                    </p>
                                  </div>
                                )}

                                {/* Communication Tips (3 tips) */}
                                {(msg.tip1 || msg.tip2 || msg.tip3) && (
                                  <div>
                                    <div className="flex items-center gap-3 mb-4">
                                      <svg className="w-5 h-5 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                      </svg>
                                      <p className="text-base font-semibold text-teal-dark">
                                        Communication Tips:
                                      </p>
                                    </div>
                                    <ul className="space-y-3 list-none pl-0">
                                      {msg.tip1 && (
                                        <li className="text-sm text-gray-700 leading-relaxed pl-7 relative">
                                          <span className="absolute left-0 top-0.5 text-teal-medium text-lg">•</span>
                                          {msg.tip1}
                                        </li>
                                      )}
                                      {msg.tip2 && (
                                        <li className="text-sm text-gray-700 leading-relaxed pl-7 relative">
                                          <span className="absolute left-0 top-0.5 text-teal-medium text-lg">•</span>
                                          {msg.tip2}
                                        </li>
                                      )}
                                      {msg.tip3 && (
                                        <li className="text-sm text-gray-700 leading-relaxed pl-7 relative">
                                          <span className="absolute left-0 top-0.5 text-teal-medium text-lg">•</span>
                                          {msg.tip3}
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                )}

                                {/* Suggested Rewrites (2 clickable rewrites) */}
                                {(msg.rewrite1 || msg.rewrite2) && (
                                  <div className="pt-4 border-t-2 border-gray-200 space-y-4">
                                    <div className="flex items-center gap-2.5 mb-3">
                                      <svg className="w-4 h-4 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      <p className="text-sm font-semibold text-teal-dark">
                                        Suggested Rewrites:
                                      </p>
                                    </div>
                                    {msg.rewrite1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const originalText = msg.originalMessage?.text || '';
                                          trackRewriteUsed('option_1', originalText.length, msg.rewrite1.length);
                                          handleRewriteSelected();
                                          setInputMessage(msg.rewrite1);
                                          setIsPreApprovedRewrite(true); // Mark as pre-approved
                                          setOriginalRewrite(msg.rewrite1); // Store original for edit detection
                                          // Scroll to input
                                          setTimeout(() => {
                                            document.querySelector('input[type="text"][placeholder*="Type a message"]')?.focus();
                                          }, 100);
                                        }}
                                        className="w-full text-left p-4 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition-all shadow-sm"
                                      >
                                        <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">
                                          Option 1:
                                        </p>
                                        <p className="text-sm text-green-800 font-medium leading-relaxed">
                                          "{msg.rewrite1}"
                                        </p>
                                      </button>
                                    )}
                                    {msg.rewrite2 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const originalText = msg.originalMessage?.text || '';
                                          trackRewriteUsed('option_2', originalText.length, msg.rewrite2.length);
                                          handleRewriteSelected();
                                          setInputMessage(msg.rewrite2);
                                          setIsPreApprovedRewrite(true); // Mark as pre-approved
                                          setOriginalRewrite(msg.rewrite2); // Store original for edit detection
                                          // Scroll to input
                                          setTimeout(() => {
                                            document.querySelector('input[type="text"][placeholder*="Type a message"]')?.focus();
                                          }, 100);
                                        }}
                                        className="w-full text-left p-4 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition-all shadow-sm"
                                      >
                                        <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">
                                          Option 2:
                                        </p>
                                        <p className="text-sm text-green-800 font-medium leading-relaxed">
                                          "{msg.rewrite2}"
                                        </p>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleRewriteSelected();
                                        setInputMessage('');
                                        // Scroll to input and focus
                                        setTimeout(() => {
                                          const input = document.querySelector('input[type="text"][placeholder*="Type a message"]');
                                          input?.focus();
                                          input?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                        }, 100);
                                      }}
                                      className="w-full mt-3 px-5 py-3 bg-white border-2 border-gray-300 rounded-lg text-sm font-semibold text-teal-medium hover:bg-gray-50 hover:border-teal-medium transition-all min-h-[44px] shadow-sm"
                                    >
                                      Try sending a new message
                                    </button>
                                  </div>
                                )}

                                {/* Fallback for old format (backward compatibility) */}
                                {msg.rewrite && !msg.rewrite1 && !msg.rewrite2 && (
                                  <div className="pt-3 border-t border-gray-300">
                                    <div className="flex items-center gap-2 mb-1">
                                      <svg className="w-3 h-3 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      <p className="text-xs font-semibold text-teal-medium">
                                        Suggested Rewrite:
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleRewriteSelected();
                                        setInputMessage(msg.rewrite);
                                        setTimeout(() => {
                                          document.querySelector('input[type="text"][placeholder*="Type a message"]')?.focus();
                                        }, 100);
                                      }}
                                      className="w-full text-left p-3 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-colors"
                                    >
                                      <p className="text-sm text-green-800 font-medium">
                                        "{msg.rewrite}"
                                      </p>
                                    </button>
                                  </div>
                                )}

                                {/* Fallback for old format */}
                                {msg.text && !msg.validation && !msg.tip1 && !msg.rewrite && !msg.rewrite1 && (
                                  <p
                                    className={
                                      isIntervention ? 'text-red-800' : 'text-purple-800'
                                    }
                                  >
                                    {msg.text}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                    return (
                      <div key={`group-${groupIndex}`} className="mb-4 first:mt-0">
                        {/* Date Separator */}
                        {showDateSeparator && dateLabel && (
                          <div className="flex items-center justify-center my-4">
                            <div className="px-3 py-1 bg-white border-2 border-teal-light rounded-full shadow-sm">
                              <span className="text-xs font-semibold text-gray-600">{dateLabel}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Timestamp above group - only show if not immediately after date separator */}
                        {groupTimeLabel && !showDateSeparator && (
                          <div className="flex items-center justify-center mb-2">
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-md">{groupTimeLabel}</span>
                          </div>
                        )}
                        
                        {/* Message Group */}
                        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} gap-2`}>
                          {group.messages.map((msg, msgIndex) => {
                            const isFlagged = msg.user_flagged_by && Array.isArray(msg.user_flagged_by) && msg.user_flagged_by.length > 0;
                            const isFlaggedByMe = msg.user_flagged_by && Array.isArray(msg.user_flagged_by) && msg.user_flagged_by.includes(username);
                            const isInThread = msg.threadId !== null && msg.threadId !== undefined;
                            const thread = threads.find(t => t.id === msg.threadId);
                            const isLastInGroup = msgIndex === group.messages.length - 1;
                            const originalIndex = group.startIndex + msgIndex;
                            
                            return (
                              <div
                                key={msg.id ?? `${msg.username}-${msg.timestamp}-${msg.text}-${msgIndex}`}
                                className={`group relative ${isOwn ? 'flex justify-end' : 'flex justify-start'} w-full`}
                              >
                                <div className={`relative ${isOwn ? 'max-w-[75%] sm:max-w-[60%] md:max-w-[55%]' : 'max-w-[75%] sm:max-w-[60%] md:max-w-[55%]'}`}>
                                  {/* Badge positioned at top right corner of bubble */}
                                  {isOwn && isLastInGroup && getStreakBadge(msg, originalIndex) && (
                                    <div className="absolute -top-2 -right-2 z-10">
                                      {getStreakBadge(msg, originalIndex)}
                                    </div>
                                  )}
                                  
                                  {/* Message Bubble */}
                                  <div
                                    className={`relative py-3 rounded-2xl text-base leading-relaxed transition-all shadow-sm ${
                                      isOwn
                                        ? isLastInGroup
                                          ? 'text-white rounded-br-sm'
                                          : 'text-white'
                                        : isLastInGroup
                                          ? 'bg-white border-2 border-teal-light text-gray-900 rounded-bl-sm'
                                          : 'bg-white border-2 border-teal-light text-gray-900'
                                    } ${
                                      isFlagged ? 'ring-2 ring-orange-300 bg-orange-50 border-orange-200' : ''
                                    } ${isInThread ? 'border-l-4 border-l-teal-medium' : ''}`}
                                    style={{ 
                                      fontFamily: "'Inter', sans-serif",
                                      paddingLeft: '16px',
                                      paddingRight: '16px',
                                      ...(isOwn && !isFlagged && { backgroundColor: '#00908B' })
                                    }}
                                  >
                                    {isInThread && thread && (
                                      <div className="text-xs text-teal-medium font-semibold mb-1.5 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        {thread.title}
                                      </div>
                                    )}
                                    
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words text-left">{msg.text.trim()}</div>
                                    
                                    {/* Timestamp */}
                                    {isLastInGroup && (
                                      <div className={`mt-1.5 text-xs ${isOwn ? 'text-white opacity-75' : 'text-gray-500'}`}>
                                        {(() => {
                                          const msgDate = new Date(msg.timestamp);
                                          return msgDate.toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                          });
                                        })()}
                                      </div>
                                    )}
                                    
                                    {isFlagged && (
                                      <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-700 font-medium">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span>Flagged as problematic</span>
                                      </div>
                                    )}
                                    
                                    {/* Action buttons - only show on last message in group */}
                                    {isLastInGroup && !isOwn && (
                                      <div className="absolute -right-10 top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {threads.length > 0 && !isInThread && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const threadId = prompt('Select thread ID (or leave empty to create new):');
                                              if (threadId) {
                                                addToThread(msg.id || msg.timestamp, threadId);
                                              }
                                            }}
                                            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-teal-medium transition-colors"
                                            title="Add to thread"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isFlaggedByMe) {
                                              flagMessage(msg.id || msg.timestamp);
                                            } else {
                                              setFlaggingMessage(msg);
                                              setFlagReason('');
                                            }
                                          }}
                                          className={`p-1.5 rounded-full transition-colors ${
                                            isFlaggedByMe
                                              ? 'text-orange-600 hover:bg-orange-100'
                                              : 'text-gray-400 hover:text-orange-600 hover:bg-gray-100'
                                          }`}
                                          title={isFlaggedByMe ? 'Unflag message' : 'Flag as problematic'}
                                        >
                                          <svg className="w-4 h-4" fill={isFlaggedByMe ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                          </svg>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
                <div ref={messagesEndRef} className="h-2" />
              </div>
              {/* Proactive Coaching Banner - DISABLED: Using unified intervention system instead */}
              {false && draftCoaching && draftCoaching.riskLevel !== 'low' && !draftCoaching.shouldSend && (
                <div className="border-t border-orange-200 bg-orange-50 px-3 py-2">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                        <svg className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="text-xs font-semibold text-orange-900">
                          {draftCoaching.coachingMessage}
                        </p>
                      </div>
                      {draftCoaching.issues && draftCoaching.issues.length > 0 && (
                        <ul className="text-xs text-orange-800 mb-2 list-disc list-inside">
                          {draftCoaching.issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      )}
                      {(draftCoaching.rewrite1 || draftCoaching.rewrite2) && (
                        <div className="flex flex-col gap-1.5 mt-2">
                          {draftCoaching.rewrite1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const originalLength = inputMessage.length;
                                trackRewriteUsed('draft_rewrite_1', originalLength, draftCoaching.rewrite1.length);
                                setInputMessage(draftCoaching.rewrite1);
                                setIsPreApprovedRewrite(true); // Mark as pre-approved
                                setOriginalRewrite(draftCoaching.rewrite1); // Store original for edit detection
                                setDraftCoaching(null);
                              }}
                              className="text-left px-3 py-2 bg-white border-2 border-orange-200 rounded-lg text-xs text-orange-900 hover:bg-orange-100 transition-colors min-h-[44px]"
                            >
                              Use: "{draftCoaching.rewrite1}"
                            </button>
                          )}
                          {draftCoaching.rewrite2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const originalLength = inputMessage.length;
                                trackRewriteUsed('draft_rewrite_2', originalLength, draftCoaching.rewrite2.length);
                                setInputMessage(draftCoaching.rewrite2);
                                setIsPreApprovedRewrite(true); // Mark as pre-approved
                                setOriginalRewrite(draftCoaching.rewrite2); // Store original for edit detection
                                setDraftCoaching(null);
                              }}
                              className="text-left px-2 py-1.5 bg-white border border-orange-200 rounded-lg text-xs text-orange-900 hover:bg-orange-100 transition-colors"
                            >
                              Use: "{draftCoaching.rewrite2}"
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDraftCoaching(null)}
                      className="text-orange-600 hover:text-orange-800 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <form
                onSubmit={sendMessage}
                className="bg-white px-4 sm:px-6 md:px-8 py-2 flex items-end gap-3 safe-area-inset-bottom"
                style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
              >
                <div className="flex-1 flex items-center gap-3">
                  <textarea
                    value={inputMessage}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    rows={1}
                    className={`flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-dark focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 transition-all text-base text-gray-900 placeholder-gray-500 min-h-[40px] max-h-32 resize-none ${
                      draftCoaching && draftCoaching.riskLevel !== 'low' && !draftCoaching.shouldSend
                        ? 'border-orange-200 placeholder-orange-400'
                        : ''
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="px-5 py-2 bg-teal-dark text-white rounded-xl font-semibold hover:bg-teal-darkest transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Send message"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
              </div>
            </div>
          </div>
        </div>
            )}

            {/* Contacts View */}
            {currentView === 'contacts' && (
              <div className="h-[calc(100vh-9rem)] sm:h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
                  <ContactsPanel username={username} />
              </div>
            )}

            {/* Profile View - Clean Style */}
            {currentView === 'profile' && (
              <div className="bg-white rounded-2xl border-2 border-teal-light shadow-lg overflow-hidden">
                <div className="h-[calc(100vh-9rem)] sm:h-[calc(100vh-8rem)] md:h-[75vh] md:max-h-[800px] overflow-y-auto">
                  <ProfilePanel
                    username={username}
                    onLogout={handleLogout}
                    onNavigateToContacts={handleNavigateToContacts}
                  />
                </div>
              </div>
            )}

            {/* Settings View - Placeholder */}
            {currentView === 'settings' && (
              <div className="bg-white rounded-2xl border-2 border-teal-light shadow-lg overflow-hidden">
                <div className="p-8 sm:p-10 space-y-8">
                  <div>
                    <h2 className="text-3xl font-semibold text-teal-dark mb-3">Settings</h2>
                    <p className="text-base text-gray-600 leading-relaxed">
                      Customize notifications, privacy, and other preferences. Full controls are coming soon,
                      but here you can preview the sections that will live here.
                    </p>
                  </div>

                  {/* PWA Install Section */}
                  <div className="mb-4">
                    <PWAInstallButton />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Notifications Settings */}
                    <div className="border-2 border-teal-light rounded-2xl p-8 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-teal-medium flex items-center justify-center flex-shrink-0 shadow-md">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-teal-dark mb-2">Desktop Notifications</h3>
                          <p className="text-base text-gray-600 mb-6 leading-relaxed">
                            Get notified when your co-parent sends you a message
                          </p>

                          {notifications.isSupported ? (
                            <div className="space-y-3">
                              {notifications.permission === 'granted' ? (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">Notifications enabled</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      // Send a test notification
                                      notifications.showNotification({
                                        username: 'Co-parent',
                                        text: 'This is a test notification! You will see this every time a new message arrives.',
                                        id: 'test-' + Date.now(),
                                        timestamp: new Date().toISOString()
                                      });
                                    }}
                                    className="w-full px-5 py-3 bg-white text-teal-medium border-2 border-teal-medium rounded-lg font-semibold hover:bg-teal-lightest transition-all min-h-[44px] shadow-sm hover:shadow-md"
                                  >
                                    Test Notification
                                  </button>
                                </div>
                              ) : notifications.permission === 'denied' ? (
                                <div className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                                  <p className="font-medium mb-1">Notifications blocked</p>
                                  <p className="text-xs">Please enable notifications in your browser settings</p>
                                </div>
                              ) : (
                                <button
                                  onClick={notifications.requestPermission}
                                  className="w-full px-5 py-3 bg-teal-medium text-white rounded-lg font-semibold hover:bg-teal-dark transition-all shadow-sm hover:shadow-md min-h-[44px]"
                                >
                                  Enable Notifications
                                </button>
                              )}

                              <p className="text-xs text-gray-500">
                                You'll get a notification every time your co-parent sends a message
                              </p>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                              Notifications are not supported in this browser
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="border-2 border-gray-200 rounded-2xl p-8 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-teal-dark mb-2">Privacy</h3>
                          <p className="text-base text-gray-600 mb-4 leading-relaxed">Control who can see activity within your room.</p>
                          <p className="text-sm text-gray-500">More privacy controls coming soon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account View */}
            {currentView === 'account' && <AccountView username={username} />}

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
    );
  }
}

export default ChatRoom;
// Color scheme updated: white primary, grey secondary, teal accents - Thu Nov 20 22:21:14 PST 2025
