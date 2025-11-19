import React from 'react';
import './index.css';
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
import { TaskFormModal } from './components/modals/TaskFormModal.jsx';
import { WelcomeModal } from './components/modals/WelcomeModal.jsx';
import { ProfileTaskModal } from './components/modals/ProfileTaskModal.jsx';
import { FlaggingModal } from './components/modals/FlaggingModal.jsx';
import { ContactSuggestionModal } from './components/modals/ContactSuggestionModal.jsx';
import { API_BASE_URL } from './config.js';
import { apiPost } from './apiClient.js';

// Vite-migrated shell for the main LiaiZen app.
// Currently focuses on login/signup; chat, tasks, contacts, and profile
// will be brought over next.

function AccountView({ username }) {
  const {
    profileData,
    isLoadingProfile,
    isSavingProfile,
    error,
    setProfileData,
    saveProfile,
  } = useProfile(username);

  if (isLoadingProfile) {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#E6F7F5] border-t-[#4DA8B0]" />
            <p className="mt-4 text-[#275559] font-medium">Loading account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="p-4 sm:p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Account</h2>
          <p className="text-slate-600 text-sm">
            Manage billing, authentication, and household members connected to your space.
          </p>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-[#C5E8E4] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E6F7F5] to-[#C5E8E4] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[#275559]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#275559]">
              Account Information
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#275559] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] transition-all"
                placeholder="your@email.com"
              />
            </div>
          </div>
        </div>

        {/* Other Account Sections */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-slate-100 rounded-2xl p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Plan &amp; Billing</h3>
            <p className="text-sm text-slate-600">Upgrade plans or download invoices.</p>
          </div>
          <div className="border border-slate-100 rounded-2xl p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Household Access</h3>
            <p className="text-sm text-slate-600">Invite, remove, or update connected caregivers.</p>
          </div>
        </div>

        {/* Save button */}
        <div className="bg-gradient-to-br from-[#4DA8B0] to-[#3d8a92] rounded-2xl p-1 shadow-lg hover:shadow-xl transition-all">
          <button
            onClick={saveProfile}
            disabled={isSavingProfile}
            className="w-full bg-gradient-to-br from-[#4DA8B0] to-[#3d8a92] hover:from-[#3d8a92] hover:to-[#2d6d75] text-white py-3 px-6 rounded-xl font-semibold text-base disabled:from-gray-400 disabled:to-gray-500 transition-all flex items-center justify-center gap-2"
          >
            {isSavingProfile ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatRoom() {
  const [showLanding, setShowLanding] = React.useState(() => {
    // Don't show landing if user is already authenticated
    return !localStorage.getItem('token');
  });

  const {
    email,
    password,
    username,
    isAuthenticated,
    isCheckingAuth,
    isLoggingIn,
    isSigningUp,
    error,
    setEmail,
    setPassword,
    setError,
    handleLogin,
    handleSignup,
    handleLogout,
  } = useAuth();

  // Local UI state must be declared before passing into hooks that depend on it
  const [isLoginMode, setIsLoginMode] = React.useState(true);
  const availableViews = ['dashboard', 'chat', 'contacts', 'profile', 'settings', 'account'];
  const [currentView, setCurrentView] = React.useState(() => {
    const stored = localStorage.getItem('currentView');
    return stored && availableViews.includes(stored)
      ? stored
      : 'dashboard';
  });

  // Hide landing page once authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      setShowLanding(false);
    }
  }, [isAuthenticated]);

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
    toggleTaskStatus,
    saveTask,
  } = tasksState;

  const { contacts } = useContacts(username);

  // Notification system for new messages
  const notifications = useNotifications({
    username,
    enabled: isAuthenticated
  });

  const chatState = useChat({
    username,
    isAuthenticated,
    currentView,
    onNewMessage: notifications.showNotification
  });
  const {
    messages,
    inputMessage,
    isConnected,
    sendMessage,
    handleInputChange,
    messagesEndRef,
    typingUsers,
    setInputMessage,
    removeMessages,
    flagMessage,
    draftCoaching,
    setDraftCoaching,
    threads,
    threadMessages,
    selectedThreadId,
    setSelectedThreadId,
    createThread,
    getThreads,
    getThreadMessages,
    addToThread,
    removeFromThread,
  } = chatState;

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
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCodeFromUrl = urlParams.get('invite');
    if (inviteCodeFromUrl) {
      console.log('Invite code detected in URL:', inviteCodeFromUrl);
      setPendingInviteCode(inviteCodeFromUrl);
      // Default to signup mode for invite links (new users are more common)
      setIsLoginMode(false);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
      const response = await fetch(
        `${API_BASE_URL.replace(/\/+$/, '')}/api/room/members/check`,
        {
          method: 'GET',
          credentials: 'include',
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.hasMultipleMembers) {
          setHasCoParentConnected(true);
        } else {
          setHasCoParentConnected(false);
        }
      } else if (response.status === 404) {
        // Endpoint doesn't exist yet (server not restarted) - fallback to message-based detection
        if (messages.length > 0 && username) {
          const uniqueUsernames = new Set(
            messages
              .filter((msg) => msg.username && msg.type !== 'ai_intervention' && msg.type !== 'ai_comment')
              .map((msg) => msg.username),
          );
          if (uniqueUsernames.size >= 2) {
            setHasCoParentConnected(true);
          }
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
        if (uniqueUsernames.size >= 2) {
          setHasCoParentConnected(true);
        }
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

  const handleSubmit = async (e) => {
    setError('');
    if (isLoginMode) {
      const result = await handleLogin(e);
      if (result && isAuthenticated) {
        const { trackConversion } = await import('./utils/analytics.js');
        trackConversion('signup_form', 'login');
      }
    } else {
      const result = await handleSignup(e);
      if (result && isAuthenticated) {
        const { trackConversion } = await import('./utils/analytics.js');
        trackConversion('signup_form', 'signup');
      }
    }
  };

  // Show landing page for first-time visitors
  if (!isAuthenticated && showLanding) {
    return <LandingPage onGetStarted={() => {
      setShowLanding(false);
      setIsLoginMode(false);
    }} />;
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#275559] to-[#4DA8B0] flex items-center justify-center px-4">
        <div className="text-white text-lg">Checking your session…</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        {/* Navigation - Top for desktop, Bottom for mobile */}
        <Navigation
          currentView={currentView}
          setCurrentView={setCurrentView}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <div className="pt-14 md:pt-16 pb-20 md:pb-8 px-2 sm:px-4 md:px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto w-full">
            {/* Dashboard View - Monochrome Style */}
            {currentView === 'dashboard' && (
              <div className="space-y-0 md:space-y-4">
                {/* Invite acceptance notification */}
                {isAcceptingInvite && (
                  <div className="rounded-lg border-2 border-[#C5E8E4] bg-[#E6F7F5] px-4 py-3 text-sm text-[#275559] mb-4">
                    <div className="flex items-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-[#C5E8E4] border-t-[#275559]" />
                      <span>Accepting invite and joining room…</span>
                    </div>
                  </div>
                )}

                {/* Dashboard Grid: Tasks and Updates */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                  {/* Tasks Section */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#275559]">
                    Your Tasks
                  </h2>
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
                        className="px-3 py-1.5 sm:px-3 sm:py-2 bg-[#275559] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#1f4447] transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 self-start sm:self-auto min-h-[36px] sm:min-h-[40px]"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Task
                      </button>
                    </div>
                    
                    {/* Search and Filter Controls */}
                    <div className="mb-3 space-y-2">
                      {/* Search Input */}
                      <div className="relative">
                        <input
                          type="text"
                          value={taskSearch}
                          onChange={(e) => setTaskSearch(e.target.value)}
                          placeholder="Search tasks..."
                          className="w-full px-3 py-2 sm:px-3 sm:py-2.5 pl-9 sm:pl-10 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm bg-white min-h-[40px] sm:min-h-[44px]"
                        />
                        <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {taskSearch && (
                          <button
                            onClick={() => setTaskSearch('')}
                            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#275559] p-1 touch-manipulation"
                            aria-label="Clear search"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {/* Filter Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setTaskFilter('all')}
                          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all min-h-[36px] sm:min-h-[40px] touch-manipulation ${
                            taskFilter === 'all'
                              ? 'bg-[#275559] text-white'
                              : 'bg-white border-2 border-[#C5E8E4] text-[#275559] hover:border-[#4DA8B0]'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setTaskFilter('open')}
                          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all min-h-[36px] sm:min-h-[40px] touch-manipulation ${
                            taskFilter === 'open'
                              ? 'bg-[#275559] text-white'
                              : 'bg-white border-2 border-[#C5E8E4] text-[#275559] hover:border-[#4DA8B0]'
                          }`}
                        >
                          Open
                        </button>
                        <button
                          onClick={() => setTaskFilter('completed')}
                          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all min-h-[36px] sm:min-h-[40px] touch-manipulation ${
                            taskFilter === 'completed'
                              ? 'bg-[#275559] text-white'
                              : 'bg-white border-2 border-[#C5E8E4] text-[#275559] hover:border-[#4DA8B0]'
                          }`}
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => setTaskFilter('high')}
                          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all min-h-[36px] sm:min-h-[40px] touch-manipulation ${
                            taskFilter === 'high'
                              ? 'bg-[#275559] text-white'
                              : 'bg-white border-2 border-[#C5E8E4] text-[#275559] hover:border-[#4DA8B0]'
                          }`}
                        >
                          <span className="hidden sm:inline">High Priority</span>
                          <span className="sm:hidden">High</span>
                        </button>
                      </div>
                    </div>
                  {isLoadingTasks ? (
                    <div className="text-center py-6">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#C5E8E4] border-t-[#275559]" />
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-600 text-sm">
                        {taskSearch || taskFilter !== 'all' 
                          ? 'No tasks match your search or filter criteria.'
                          : 'No tasks found. Create your first task to get started!'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
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
                            className={`flex items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all touch-manipulation ${
                              task.status === 'completed'
                                ? 'bg-gray-50 opacity-70 border border-gray-200'
                                : 'bg-white hover:shadow-sm active:scale-[0.98] border-2 border-[#C5E8E4] hover:border-[#4DA8B0]'
                            }`}
                          >
                            {/* Task Icon/Status Circle */}
                            <div className="flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskStatus(task);
                                }}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] ${
                                  task.status === 'completed' ? 'bg-[#4DA8B0]' : 'bg-[#275559]'
                                }`}
                              >
                                {task.status === 'completed' ? (
                                  <svg
                                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                ) : (
                                  <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                                    {getTaskIcon()}
                                  </div>
                                )}
                              </button>
                            </div>

                            {/* Task Content */}
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                <h3
                                  className={`text-xs sm:text-sm font-semibold text-[#275559] mb-0.5 sm:mb-1 truncate ${
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
                                    className="w-3 h-3 sm:w-4 sm:h-4 text-[#4DA8B0] flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                )}
                              </div>
                              {task.description && (
                                <p
                                  className={`text-xs text-gray-600 line-clamp-2 break-words ${
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
                                <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
                                  {task.assigned_to && (() => {
                                    if (task.assigned_to === 'self') {
                                      return (
                                        <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-[#E6F7F5] text-[#275559] rounded text-[10px] sm:text-xs font-medium border border-[#C5E8E4]">
                                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span className="hidden sm:inline">Assigned: </span>
                                          Self (me)
                                        </span>
                                      );
                                    }
                                    const assignedContact = contacts.find(c => c.id.toString() === task.assigned_to.toString());
                                    return assignedContact ? (
                                      <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-[#E6F7F5] text-[#275559] rounded text-[10px] sm:text-xs font-medium border border-[#C5E8E4]">
                                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="hidden sm:inline">Assigned: </span>
                                        {assignedContact.contact_name}
                                      </span>
                                    ) : null;
                                  })()}
                                  {Array.isArray(task.related_people) && task.related_people.length > 0 && (
                                    <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-[#E6F7F5] text-[#275559] rounded text-[10px] sm:text-xs font-medium border border-[#C5E8E4]">
                                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                </div>
              </div>
            )}

          {/* Full chat view */}
            {/* Chat View - Blue Header Style */}
            {currentView === 'chat' && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Blue Header */}
                <div className="bg-gradient-to-r from-[#275559] to-[#4DA8B0] text-white p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold">
                      Chat
                    </h2>
                      {threads.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowThreadsPanel(!showThreadsPanel)}
                          className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-semibold hover:bg-white/30 transition-colors border border-white/30 flex items-center gap-1.5"
                          title="View threads"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Threads ({threads.length})
                        </button>
                      )}
                    </div>
                    {!inviteLink && !hasCoParentConnected && (
                      <button
                        type="button"
                        onClick={handleLoadInvite}
                        disabled={isLoadingInvite || !isAuthenticated}
                        className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm font-semibold hover:bg-white/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors border border-white/30"
                        title="Invite your co-parent to join this mediation room"
                      >
                    {isLoadingInvite ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Loading…
                      </span>
                    ) : (
                      'Invite co-parent'
                    )}
                  </button>
                    )}
                  </div>
                </div>

                {/* Chat Content */}
                <div className="flex">
                  {/* Threads Sidebar */}
                  {showThreadsPanel && (
                    <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
                      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-gray-900">Threads</h3>
                        <button
                          type="button"
                          onClick={() => setShowThreadsPanel(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {threads.length === 0 ? (
                          <div className="p-4 text-xs text-gray-500 text-center">
                            No threads yet. Start a conversation about a specific topic to create one.
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
                              className={`w-full text-left p-3 border-b border-gray-100 hover:bg-white transition-colors ${
                                selectedThreadId === thread.id ? 'bg-white border-l-4 border-l-[#275559]' : ''
                              }`}
                            >
                              <div className="font-medium text-sm text-gray-900 mb-1">{thread.title}</div>
                              <div className="text-xs text-gray-500">
                                {thread.message_count || 0} messages
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Main Chat Area */}
                  <div className="flex-1 p-4 sm:p-6">
                  {inviteError && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                  <div className="font-semibold mb-1">⚠️ Error</div>
                  <div>{inviteError}</div>
                  {inviteError.includes('404') && (
                    <div className="mt-2 text-xs text-red-700">
                      The server may need to be restarted. Please contact support if this persists.
                    </div>
                  )}
                </div>
              )}

              {inviteLink && !hasCoParentConnected && (
                <div className="mb-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3 text-xs sm:text-sm text-emerald-900 shadow-sm">
                  <div className="font-semibold mb-2 text-base">
                    ✨ Invite your co-parent
                  </div>
                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 block p-2 bg-white rounded-lg border border-emerald-200 break-all text-emerald-800 font-mono text-xs hover:bg-emerald-100 transition-colors"
                    onClick={(e) => {
                      // Ensure link opens even if service worker tries to intercept
                      e.preventDefault();
                      window.location.href = inviteLink;
                    }}
                  >
                    {inviteLink}
                  </a>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {inviteCopied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy link
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
                      className="px-4 py-2 rounded-lg border border-emerald-300 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-emerald-700">
                    Share this link with your co-parent. When they click it, they'll join this mediation room. This room is for co-parents only.
                  </div>
                </div>
              )}

              <div className="h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] max-h-[600px] bg-white rounded-2xl flex flex-col overflow-hidden shadow-inner border border-slate-100">
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 bg-slate-50/50">
                {messages
                  .filter((msg) => msg.type !== 'contact_suggestion') // Hide contact suggestions from chat (they show in modal)
                  .map((msg) => {
                  const isOwn = msg.username === username;
                  const timeLabel =
                    msg.timestamp &&
                    new Date(msg.timestamp).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    });

                  // AI Moderator messages (interventions/comments)
                  if (msg.type === 'ai_intervention' || msg.type === 'ai_comment') {
                    const isIntervention = msg.type === 'ai_intervention';
                    const isComment = msg.type === 'ai_comment' && msg.text && !msg.validation;
                    
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
                        className="flex items-start gap-3 mb-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-[#275559] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 border-2 border-white shadow-lg">
                          {isComment ? '💬' : '🤖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="font-semibold text-[#275559]">
                              {msg.username || (isComment ? 'Alex' : 'AI Moderator')}
                            </span>
                            {timeLabel && (
                              <span className="text-xs text-gray-500">{timeLabel}</span>
                            )}
                          </div>
                          <div
                            className={`rounded-2xl px-5 py-4 max-w-full break-words space-y-4 shadow-lg ${
                              isIntervention
                                ? 'bg-pink-50 border-2 border-pink-300'
                                : isComment
                                ? 'bg-teal-50 border-2 border-teal-300'
                                : 'bg-blue-50 border-2 border-blue-300'
                            }`}
                          >
                            {/* COMMENT: Simple conversational message */}
                            {isComment && msg.text && (
                              <p className="text-sm text-slate-800 leading-relaxed">
                                {msg.text}
                              </p>
                            )}

                            {/* INTERVENTION: Validation, Tips, Rewrites */}
                            {!isComment && (
                              <>
                                {/* Explanation and Override Controls */}
                                {msg.explanation && (
                                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs text-blue-800 mb-2">
                                      <strong>Why I'm intervening:</strong> {msg.explanation}
                                    </p>
                                    {msg.confidence !== undefined && (
                                      <p className="text-xs text-blue-600">
                                        Confidence: {msg.confidence}%
                                      </p>
                                    )}
                                    {msg.overrideOptions && msg.overrideOptions.canOverride && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {msg.overrideOptions.overrideOptions.map((option, idx) => (
                                          <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                              if (option.action === 'send_anyway') {
                                                // Emit override event
                                                const socket = chatState.socket;
                                                if (socket) {
                                                  socket.emit('override_intervention', {
                                                    messageId: msg.originalMessage?.id || msg.timestamp,
                                                    overrideAction: option.action
                                                  });
                                                  // Remove intervention message
                                                  removeMessages((m) => m.id === msg.id);
                                                }
                                              } else if (option.action === 'edit_first') {
                                                // Pre-fill input with original message
                                                setInputMessage(msg.originalMessage?.text || '');
                                                removeMessages((m) => m.id === msg.id);
                                              }
                                            }}
                                            className="px-2 py-1 text-xs bg-white border border-blue-300 rounded text-blue-700 hover:bg-blue-100 transition-colors"
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
                                  <div className="mb-3 flex items-center gap-2 text-xs">
                                    <span className="text-gray-600">Was this helpful?</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const socket = chatState.socket;
                                        if (socket) {
                                          socket.emit('intervention_feedback', {
                                            interventionId: msg.id,
                                            helpful: true
                                          });
                                          // Show thank you message briefly
                                          const feedbackBtn = event.target;
                                          feedbackBtn.textContent = '✓ Thank you!';
                                          feedbackBtn.disabled = true;
                                          setTimeout(() => {
                                            feedbackBtn.textContent = 'Yes';
                                            feedbackBtn.disabled = false;
                                          }, 2000);
                                        }
                                      }}
                                      className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const socket = chatState.socket;
                                        if (socket) {
                                          socket.emit('intervention_feedback', {
                                            interventionId: msg.id,
                                            helpful: false
                                          });
                                          // Show thank you message briefly
                                          const feedbackBtn = event.target;
                                          feedbackBtn.textContent = '✓ Thank you!';
                                          feedbackBtn.disabled = true;
                                          setTimeout(() => {
                                            feedbackBtn.textContent = 'No';
                                            feedbackBtn.disabled = false;
                                          }, 2000);
                                        }
                                      }}
                                      className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                    >
                                      No
                                    </button>
                                  </div>
                                )}

                                {/* Validation (no label) */}
                                {msg.validation && (
                                  <div>
                                    <p
                                      className={`text-sm ${
                                        isIntervention ? 'text-red-800' : 'text-purple-800'
                                      }`}
                                    >
                                      {msg.validation}
                                    </p>
                                  </div>
                                )}

                                {/* Communication Tips (3 tips) */}
                                {(msg.tip1 || msg.tip2 || msg.tip3) && (
                                  <div>
                                    <p className="text-xs font-semibold text-[#275559] mb-2">
                                      💡 Communication Tips:
                                    </p>
                                    <ul className="space-y-2 list-disc list-inside">
                                      {msg.tip1 && (
                                        <li
                                          className={`text-sm ${
                                            isIntervention ? 'text-red-800' : 'text-purple-800'
                                          }`}
                                        >
                                          {msg.tip1}
                                        </li>
                                      )}
                                      {msg.tip2 && (
                                        <li
                                          className={`text-sm ${
                                            isIntervention ? 'text-red-800' : 'text-purple-800'
                                          }`}
                                        >
                                          {msg.tip2}
                                        </li>
                                      )}
                                      {msg.tip3 && (
                                        <li
                                          className={`text-sm ${
                                            isIntervention ? 'text-red-800' : 'text-purple-800'
                                          }`}
                                        >
                                          {msg.tip3}
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                )}

                                {/* Suggested Rewrites (2 clickable rewrites) */}
                                {(msg.rewrite1 || msg.rewrite2) && (
                                  <div className="pt-3 border-t border-gray-300 space-y-3">
                                    <p className="text-xs font-semibold text-green-600 mb-2">
                                      ✨ Suggested Rewrites:
                                    </p>
                                    {msg.rewrite1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleRewriteSelected();
                                          setInputMessage(msg.rewrite1);
                                          // Scroll to input
                                          setTimeout(() => {
                                            document.querySelector('input[type="text"][placeholder*="Type a message"]')?.focus();
                                          }, 100);
                                        }}
                                        className="w-full text-left p-3 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-colors"
                                      >
                                        <p className="text-xs font-semibold text-green-700 mb-1">
                                          Option 1:
                                        </p>
                                        <p className="text-sm text-green-800 font-medium">
                                          "{msg.rewrite1}"
                                        </p>
                                      </button>
                                    )}
                                    {msg.rewrite2 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleRewriteSelected();
                                          setInputMessage(msg.rewrite2);
                                          // Scroll to input
                                          setTimeout(() => {
                                            document.querySelector('input[type="text"][placeholder*="Type a message"]')?.focus();
                                          }, 100);
                                        }}
                                        className="w-full text-left p-3 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-colors"
                                      >
                                        <p className="text-xs font-semibold text-green-700 mb-1">
                                          Option 2:
                                        </p>
                                        <p className="text-sm text-green-800 font-medium">
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
                                      className="w-full mt-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                    >
                                      Try sending a new message
                                    </button>
                                  </div>
                                )}

                                {/* Fallback for old format (backward compatibility) */}
                                {msg.rewrite && !msg.rewrite1 && !msg.rewrite2 && (
                                  <div className="pt-3 border-t border-gray-300">
                                    <p className="text-xs font-semibold text-green-600 mb-1">
                                      ✨ Suggested Rewrite:
                                    </p>
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

                  // Regular user messages
                  const isFlagged = msg.user_flagged_by && Array.isArray(msg.user_flagged_by) && msg.user_flagged_by.length > 0;
                  const isFlaggedByMe = msg.user_flagged_by && Array.isArray(msg.user_flagged_by) && msg.user_flagged_by.includes(username);
                  const isInThread = msg.threadId !== null && msg.threadId !== undefined;
                  const thread = threads.find(t => t.id === msg.threadId);
                  
                  return (
                    <div
                      key={msg.id ?? `${msg.username}-${msg.timestamp}-${msg.text}`}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group ${isInThread ? 'pl-8' : ''}`}
                    >
                      {isInThread && (
                        <div className="absolute left-0 w-6 border-l-2 border-blue-300" />
                      )}
                      <div
                        className={`relative max-w-[80%] px-3 py-2 rounded-2xl text-sm shadow ${
                          isOwn
                            ? 'bg-[#275559] text-white rounded-br-sm'
                            : `bg-white text-slate-900 rounded-bl-sm ${isFlagged ? 'border-2 border-orange-300 bg-orange-50' : ''}`
                        } ${isInThread ? 'border-l-4 border-l-blue-400' : ''}`}
                      >
                        {isInThread && thread && (
                          <div className="text-[10px] text-blue-600 font-semibold mb-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {thread.title}
                          </div>
                        )}
                        <div className="flex items-baseline justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {!isOwn && (
                              <div className="text-[11px] font-semibold text-slate-500 mb-0.5">
                                {msg.username || 'Co-parent'}
                              </div>
                            )}
                            <div>{msg.text}</div>
                            {isFlagged && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-700">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>Flagged as problematic</span>
                          </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                          {timeLabel && (
                              <div className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>
                              {timeLabel}
                            </div>
                          )}
                            <div className="flex items-center gap-1">
                              {!isOwn && (
                                <>
                                  {threads.length > 0 && !isInThread && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Show thread selection menu
                                        const threadId = prompt('Select thread ID (or leave empty to create new):');
                                        if (threadId) {
                                          addToThread(msg.id || msg.timestamp, threadId);
                                        }
                                      }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-opacity-20 text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                                      title="Add to thread"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isFlaggedByMe) {
                                        // Unflag
                                        flagMessage(msg.id || msg.timestamp);
                                      } else {
                                        // Show flag modal
                                        setFlaggingMessage(msg);
                                        setFlagReason('');
                                      }
                                    }}
                                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-opacity-20 ${
                                      isFlaggedByMe
                                        ? 'opacity-100 text-orange-600 hover:bg-orange-100'
                                        : 'text-slate-400 hover:text-orange-600 hover:bg-slate-100'
                                    }`}
                                    title={isFlaggedByMe ? 'Unflag message' : 'Flag as problematic'}
                                  >
                                    <svg className="w-4 h-4" fill={isFlaggedByMe ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              {/* Proactive Coaching Banner */}
              {draftCoaching && draftCoaching.riskLevel !== 'low' && !draftCoaching.shouldSend && (
                <div className="border-t border-orange-200 bg-orange-50 px-3 py-2">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-orange-900 mb-1">
                        💡 {draftCoaching.coachingMessage}
                      </p>
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
                                setInputMessage(draftCoaching.rewrite1);
                                setDraftCoaching(null);
                              }}
                              className="text-left px-2 py-1.5 bg-white border border-orange-200 rounded-lg text-xs text-orange-900 hover:bg-orange-100 transition-colors"
                            >
                              ✨ Use: "{draftCoaching.rewrite1}"
                            </button>
                          )}
                          {draftCoaching.rewrite2 && (
                            <button
                              type="button"
                              onClick={() => {
                                setInputMessage(draftCoaching.rewrite2);
                                setDraftCoaching(null);
                              }}
                              className="text-left px-2 py-1.5 bg-white border border-orange-200 rounded-lg text-xs text-orange-900 hover:bg-orange-100 transition-colors"
                            >
                              ✨ Use: "{draftCoaching.rewrite2}"
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
                className="border-t border-slate-200 bg-white px-3 py-2 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                  placeholder="Type a message…"
                  className={`flex-1 px-3 py-1.5 border rounded-xl text-sm focus:outline-none focus:border-[#275559] ${
                    draftCoaching && draftCoaching.riskLevel !== 'low' && !draftCoaching.shouldSend
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-slate-200'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="px-3 py-1.5 bg-[#275559] text-white rounded-xl text-sm font-semibold disabled:bg-slate-400"
                >
                  Send
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
              <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden">
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
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="p-6 sm:p-8 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                    <p className="text-slate-600">
                      Customize notifications, privacy, and other preferences. Full controls are coming soon,
                      but here you can preview the sections that will live here.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Notifications Settings */}
                    <div className="border-2 border-[#C5E8E4] rounded-2xl p-6 bg-gradient-to-br from-[#E6F7F5] to-white">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#4DA8B0] flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-[#275559] mb-2">Desktop Notifications</h3>
                          <p className="text-sm text-slate-600 mb-4">
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
                                    className="w-full px-4 py-2 bg-white text-[#275559] border-2 border-[#4DA8B0] rounded-xl font-semibold hover:bg-[#E6F7F5] transition-all"
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
                                  className="w-full px-4 py-2.5 bg-[#4DA8B0] text-white rounded-xl font-semibold hover:bg-[#3d8a92] transition-all shadow-sm"
                                >
                                  Enable Notifications
                                </button>
                              )}

                              <p className="text-xs text-slate-500">
                                You'll get a notification every time your co-parent sends a message
                              </p>
                            </div>
                          ) : (
                            <div className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                              Notifications are not supported in this browser
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="border border-slate-200 rounded-2xl p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-2">Privacy</h3>
                          <p className="text-sm text-slate-600">Control who can see activity within your room.</p>
                          <p className="text-xs text-slate-500 mt-3">More privacy controls coming soon</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#275559] to-[#4DA8B0] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/95 rounded-3xl shadow-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center mb-6">
          <img 
            src="/assets/TransB.svg" 
            alt="@TransB" 
            className="logo-image"
            style={{ height: '64px', width: 'auto', marginBottom: '0', display: 'block' }}
          />
          <div style={{ marginTop: '-32px', marginBottom: '-32px', lineHeight: 0, overflow: 'hidden' }}>
          <img 
            src="/assets/LZlogo.svg" 
            alt="LiaiZen" 
            className="logo-image"
              style={{ 
                height: '96px', 
                width: 'auto', 
                display: 'block',
                lineHeight: 0,
                verticalAlign: 'top',
                margin: 0,
                padding: 0
              }}
          />
        </div>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-0.5">
            Collaborative Parenting
        </p>
        </div>

        {pendingInviteCode && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            <div className="font-semibold mb-1">✨ You've been invited to a co-parent mediation room!</div>
            <div>
              {isLoginMode
                ? 'Log in to join your co-parent in this mediation room.'
                : 'Create an account to join your co-parent in this mediation room. Already have an account? Switch to log in above.'}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#275559] text-slate-900 placeholder-slate-400"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#275559] text-slate-900 placeholder-slate-400"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || isSigningUp}
            className="w-full mt-2 bg-[#275559] text-white py-2.5 rounded-xl font-semibold text-sm sm:text-base shadow-md hover:bg-[#1f4447] transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isLoginMode
              ? isLoggingIn
                ? 'Logging in…'
                : 'Log in'
              : isSigningUp
              ? 'Creating account…'
              : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-600">
          {isLoginMode ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="text-[#275559] font-semibold hover:underline"
                onClick={() => {
                  setError('');
                  setIsLoginMode(false);
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="text-[#275559] font-semibold hover:underline"
                onClick={() => {
                  setError('');
                  setIsLoginMode(true);
                }}
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;
