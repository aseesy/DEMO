import React from 'react';
import './index.css';
import { useAuth } from './hooks/useAuth.js';
import { useTasks } from './hooks/useTasks.js';
import { useChat } from './hooks/useChat.js';
import { ContactsPanel } from './components/ContactsPanel.jsx';
import { ProfilePanel } from './components/ProfilePanel.jsx';
import { Navigation } from './components/Navigation.jsx';
import { API_BASE_URL } from './config.js';

// Vite-migrated shell for the main LiaiZen app.
// Currently focuses on login/signup; chat, tasks, contacts, and profile
// will be brought over next.

function ChatRoom() {
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
  const [currentView, setCurrentView] = React.useState(() => {
    const stored = localStorage.getItem('currentView');
    return stored && ['dashboard', 'chat', 'contacts', 'profile'].includes(stored)
      ? stored
      : 'dashboard';
  });

  React.useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('currentView', currentView);
    }
  }, [isAuthenticated, currentView]);

  const tasksState = useTasks(username);
  const {
    tasks,
    isLoadingTasks,
    showTaskForm,
    editingTask,
    taskFormData,
    setShowTaskForm,
    setEditingTask,
    setTaskFormData,
    toggleTaskStatus,
    saveTask,
  } = tasksState;

  const chatState = useChat({ username, isAuthenticated, currentView });
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
  } = chatState;

  // Invite state for sharing a room with a co-parent
  const [inviteLink, setInviteLink] = React.useState('');
  const [inviteCode, setInviteCode] = React.useState('');
  const [inviteError, setInviteError] = React.useState('');
  const [isLoadingInvite, setIsLoadingInvite] = React.useState(false);
  const [inviteCopied, setInviteCopied] = React.useState(false);
  const [pendingInviteCode, setPendingInviteCode] = React.useState(null);
  const [isAcceptingInvite, setIsAcceptingInvite] = React.useState(false);
  const [hasCoParentConnected, setHasCoParentConnected] = React.useState(false);
  
  // Contact suggestion modal state
  const [pendingContactSuggestion, setPendingContactSuggestion] = React.useState(null);
  const [dismissedSuggestions, setDismissedSuggestions] = React.useState(new Set());

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
      await handleLogin(e);
    } else {
      await handleSignup(e);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#275559] to-[#4DA8B0] flex items-center justify-center px-4">
        <div className="text-white text-lg">Checking your session…</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#275559] to-[#4DA8B0]">
        {/* Navigation - Top for desktop, Bottom for mobile */}
        <Navigation currentView={currentView} setCurrentView={setCurrentView} />

        {/* Main Content Area */}
        <div className="pt-20 md:pt-36 pb-24 md:pb-8 px-3 sm:px-4 md:px-6 lg:px-8 min-h-screen">
          <div className="max-w-7xl mx-auto w-full">
            {/* Dashboard View - Large Card Style */}
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                {/* Welcome Card */}
                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                    Welcome back{username ? `, ${username}` : ''} 👋
                  </h1>
                  <p className="text-base text-slate-600">
                    Here are your top onboarding tasks to get started with LiaiZen.
                  </p>
                </div>

                {/* Invite acceptance notification */}
                {isAcceptingInvite && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    <div className="flex items-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-300 border-t-blue-600" />
                      <span>Accepting invite and joining room…</span>
                    </div>
                  </div>
                )}

                {/* Tasks Card */}
                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                    Your Tasks
                  </h2>
                  {isLoadingTasks ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#275559]" />
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm sm:text-base">
                        No tasks found. Create your first task to get started!
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
                        const isSmartTask =
                          task.status !== 'completed' &&
                          (isCoparentTask || isProfileTask || isChildrenTask);

                        return (
                          <div
                            key={task.id}
                            onClick={() => {
                              if (isSmartTask) {
                                if (isCoparentTask) {
                                  localStorage.setItem('liaizen_smart_task', 'add_coparent');
                                  setCurrentView('contacts');
                                } else if (isProfileTask) {
                                  setCurrentView('profile');
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
                              });
                              setShowTaskForm(true);
                            }}
                            className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl cursor-pointer transition-all shadow-sm ${
                              task.status === 'completed'
                                ? 'bg-slate-50 opacity-70'
                                : 'bg-white hover:shadow-md active:scale-[0.98] border border-slate-100'
                            }`}
                          >
                            {/* Task Icon/Status Circle */}
                            <div className="flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskStatus(task);
                                }}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                  task.status === 'completed' ? 'bg-green-500' : 'bg-teal'
                                }`}
                              >
                                {task.status === 'completed' ? (
                                  <svg
                                    className="w-6 h-6 text-white"
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
                                  <span className="text-white font-bold text-lg">
                                    {task.title?.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </button>
                            </div>

                            {/* Task Content */}
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center gap-2 min-w-0">
                                <h3
                                  className={`text-sm sm:text-base font-semibold text-gray-800 mb-1 truncate ${
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
                                    className="w-4 h-4 text-teal flex-shrink-0"
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
                                  className={`text-xs sm:text-sm text-gray-500 line-clamp-2 break-words ${
                                    task.status === 'completed'
                                      ? 'line-through text-gray-400'
                                      : ''
                                  }`}
                                >
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                    <h2 className="text-xl sm:text-2xl font-bold">
                      Chat
                    </h2>
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
                <div className="p-4 sm:p-6">
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
                  return (
                    <div
                      key={msg.id ?? `${msg.username}-${msg.timestamp}-${msg.text}`}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm shadow ${
                          isOwn
                            ? 'bg-[#275559] text-white rounded-br-sm'
                            : 'bg-white text-slate-900 rounded-bl-sm'
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <div>
                            {!isOwn && (
                              <div className="text-[11px] font-semibold text-slate-500 mb-0.5">
                                {msg.username || 'Co-parent'}
                              </div>
                            )}
                            <div>{msg.text}</div>
                          </div>
                          {timeLabel && (
                            <div className="text-[10px] text-slate-400 flex-shrink-0">
                              {timeLabel}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form
                onSubmit={sendMessage}
                className="border-t border-slate-200 bg-white px-3 py-2 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                  placeholder="Type a message…"
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#275559]"
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
          )}

            {/* Contacts View - Blue Header Style */}
            {currentView === 'contacts' && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Blue Header */}
                <div className="bg-gradient-to-r from-[#275559] to-[#4DA8B0] text-white p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold">Contacts</h2>
                </div>
                <div className="h-[60vh] sm:h-[65vh] max-h-[700px] overflow-y-auto">
                  <ContactsPanel username={username} />
                </div>
              </div>
            )}

            {/* Profile View - Blue Header Style */}
            {currentView === 'profile' && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Blue Header */}
                <div className="bg-gradient-to-r from-[#275559] to-[#4DA8B0] text-white p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold">Profile</h2>
                </div>
                <div className="h-[60vh] sm:h-[65vh] max-h-[700px] overflow-y-auto">
                  <ProfilePanel username={username} onLogout={handleLogout} />
                </div>
              </div>
            )}

          {/* Simple task form modal (reuses existing API behavior) */}
          {showTaskForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {editingTask ? 'Edit Task' : 'Add Task'}
                  </h3>
                  <button
                    className="text-2xl leading-none"
                    onClick={() => {
                      setShowTaskForm(false);
                      setEditingTask(null);
                      setTaskFormData({
                        title: '',
                        description: '',
                        status: 'open',
                        priority: 'medium',
                        due_date: '',
                      });
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={taskFormData.title}
                      onChange={(e) =>
                        setTaskFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#275559]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={taskFormData.description}
                      onChange={(e) =>
                        setTaskFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#275559]"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={saveTask}
                    disabled={!taskFormData.title.trim()}
                    className="flex-1 bg-[#275559] text-white py-2.5 rounded-xl font-semibold hover:bg-[#1f4447] transition-colors disabled:bg-gray-400"
                  >
                    {editingTask ? 'Update' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowTaskForm(false);
                      setEditingTask(null);
                      setTaskFormData({
                        title: '',
                        description: '',
                        status: 'open',
                        priority: 'medium',
                        due_date: '',
                      });
                    }}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contact Suggestion Modal */}
          {pendingContactSuggestion && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-[#275559] flex items-center justify-center text-white font-bold text-sm">
                      💡
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Add Contact?
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      if (pendingContactSuggestion?.id) {
                        setDismissedSuggestions((prev) => new Set(prev).add(pendingContactSuggestion.id));
                      }
                      setPendingContactSuggestion(null);
                    }}
                    className="text-2xl leading-none text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm text-gray-700 mb-4">
                    {pendingContactSuggestion.text || 
                     `Would you like to add "${pendingContactSuggestion.detectedName}" to your contacts?`}
                  </p>
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-teal-900 mb-1">
                      Detected name:
                    </p>
                    <p className="text-sm text-teal-800 font-medium">
                      {pendingContactSuggestion.detectedName}
                    </p>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      // Navigate to contacts and open form with name pre-filled
                      setCurrentView('contacts');
                      localStorage.setItem('liaizen_add_contact', JSON.stringify({
                        name: pendingContactSuggestion.detectedName,
                        context: pendingContactSuggestion.text
                      }));
                      if (pendingContactSuggestion?.id) {
                        setDismissedSuggestions((prev) => new Set(prev).add(pendingContactSuggestion.id));
                      }
                      setPendingContactSuggestion(null);
                    }}
                    className="flex-1 bg-[#4DA8B0] text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-[#3d8a92] transition-colors shadow-sm"
                  >
                    Yes, Add Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (pendingContactSuggestion?.id) {
                        setDismissedSuggestions((prev) => new Set(prev).add(pendingContactSuggestion.id));
                      }
                      setPendingContactSuggestion(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border-2 border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Not Now
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#275559] to-[#4DA8B0] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/95 rounded-3xl shadow-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3 mb-6">
          <img 
            src="/assets/TransB.svg" 
            alt="@TransB" 
            className="logo-image"
            style={{ height: '48px', width: 'auto' }}
          />
          <img 
            src="/assets/LZlogo.svg" 
            alt="LiaiZen" 
            className="logo-image"
            style={{ height: '96px', width: 'auto' }}
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-center text-slate-900 mb-2">
          {isLoginMode ? 'Log in to LiaiZen' : 'Create your LiaiZen account'}
        </h1>
        <p className="text-center text-slate-600 mb-4 text-sm">
          Use your email and password to {isLoginMode ? 'sign in' : 'get started'}.
        </p>

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



