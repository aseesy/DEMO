import React from 'react';
import './index.css';
import { useAuth } from './hooks/useAuth.js';
import { useTasks } from './hooks/useTasks.js';
import { useContacts } from './hooks/useContacts.js';
import { useNotifications } from './hooks/useNotifications.js';
import { useInAppNotifications } from './hooks/useInAppNotifications.js';
import { useToast } from './hooks/useToast.js';
import { useInviteManagement } from './hooks/useInviteManagement.js';
import { useModalController } from './hooks/useModalController.js';
import { ChatProvider, useChatContext } from './context/ChatContext.jsx';
import { ToastContainer } from './components/ui/Toast/Toast.jsx';
import { ContactsPanel } from './components/ContactsPanel.jsx';
import { ProfilePanel } from './components/ProfilePanel.jsx';
import { Navigation } from './components/Navigation.jsx';
import { LandingPage } from './components/LandingPage.jsx';
import { GlobalModals } from './components/GlobalModals.jsx';
import { SettingsView, DashboardView, ChatView } from './views';

// Adapters - abstract third-party dependencies
import { useAppNavigation, NavigationPaths } from './adapters/navigation';
import { storage, StorageKeys } from './adapters/storage';

// Lazy-load AccountView for code-splitting
const AccountView = React.lazy(() => import('./components/AccountView.jsx'));
import { trackViewChange } from './utils/analytics.js';
import { setUserProperties } from './utils/analyticsEnhancements.js';
import { logger } from './utils/logger.js';

// Constants
const AVAILABLE_VIEWS = ['dashboard', 'chat', 'contacts', 'profile', 'settings', 'account'];

/**
 * ChatRoom - Main application component
 *
 * Responsibilities:
 * - Authentication and routing
 * - View navigation
 * - Task management
 * - Invite management (shared across views)
 * - Modal coordination
 *
 * Chat functionality is delegated to ChatView which manages its own state.
 */
function ChatRoomContent({
  usernameFromParent,
  isAuthenticatedFromParent,
  isCheckingAuthFromParent,
  currentViewFromParent,
  setCurrentViewFromParent,
}) {
  // Use navigation adapter instead of direct react-router imports
  const { navigate, getQueryParam } = useAppNavigation();

  // Use auth state from parent (lifted for ChatProvider)
  const username = usernameFromParent;
  const isAuthenticated = isAuthenticatedFromParent;
  const isCheckingAuth = isCheckingAuthFromParent;
  const currentView = currentViewFromParent;

  // Get logout handler from useAuth (it's safe to call for just the handler)
  const { handleLogout } = useAuth();

  // Shared chat state from context
  const { unreadCount, hasMeanMessage, searchQuery, searchMessages, searchMode, toggleSearchMode, exitSearchMode, messages } = useChatContext();

  // Landing page state
  const [showLanding, setShowLanding] = React.useState(() => {
    return !storage.has(StorageKeys.AUTH_TOKEN) && !storage.has(StorageKeys.IS_AUTHENTICATED);
  });

  // In-app notifications
  const { unreadCount: notificationCount, refresh: refreshNotifications } = useInAppNotifications({
    enabled: isAuthenticated && !showLanding && !isCheckingAuth,
  });

  // View navigation with analytics
  const setCurrentView = React.useCallback(
    view => {
      if (view !== currentView) {
        trackViewChange(view);
      }
      setCurrentViewFromParent(view);
    },
    [currentView, setCurrentViewFromParent]
  );

  // Notification preferences (using storage adapter with automatic JSON handling)
  const [notificationPrefs, setNotificationPrefs] = React.useState(() => {
    return storage.get(StorageKeys.NOTIFICATION_PREFERENCES, {
      newMessages: true,
      taskReminders: false,
      invitations: true,
    });
  });

  React.useEffect(() => {
    storage.set(StorageKeys.NOTIFICATION_PREFERENCES, notificationPrefs);
  }, [notificationPrefs]);

  // Auth effects
  React.useEffect(() => {
    if (isAuthenticated) setShowLanding(false);
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      const inviteCode = getQueryParam('invite');
      if (inviteCode) {
        navigate(NavigationPaths.withQuery(NavigationPaths.SIGN_IN, { invite: inviteCode }));
        return;
      }
      if (!showLanding && window.location.pathname === '/') {
        setShowLanding(true);
        return;
      }
      if (showLanding) return;
      navigate(NavigationPaths.SIGN_IN);
    }
  }, [isCheckingAuth, isAuthenticated, showLanding, navigate, getQueryParam]);

  React.useEffect(() => {
    if (isAuthenticated) {
      storage.set(StorageKeys.CURRENT_VIEW, currentView);
    }
  }, [isAuthenticated, currentView]);

  // Tasks
  const shouldLoadTasks = isAuthenticated && !showLanding && !isCheckingAuth;
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
    loadTasks,
  } = useTasks(username, shouldLoadTasks);

  // Contacts
  const { contacts } = useContacts(
    showLanding ? null : username,
    isAuthenticated && !showLanding && !isCheckingAuth
  );

  // Notifications
  const notifications = useNotifications({
    username,
    enabled: isAuthenticated && !showLanding && notificationPrefs.newMessages,
  });

  const toast = useToast();

  // Invite management (shared across views)
  const {
    inviteLink,
    setInviteLink,
    inviteCode,
    setInviteCode,
    inviteError,
    setInviteError,
    isLoadingInvite,
    inviteCopied,
    setInviteCopied,
    pendingInviteCode,
    setPendingInviteCode,
    isAcceptingInvite,
    manualInviteCode,
    setManualInviteCode,
    showManualInvite,
    setShowManualInvite,
    hasCoParentConnected,
    setHasCoParentConnected,
    hasPendingInvitation,
    hasAcceptedInvitation,
    handleLoadInvite,
    handleCopyInvite,
    handleManualAcceptInvite,
  } = useInviteManagement({ username, isAuthenticated, messages: [], currentView });

  // Modal state (extracted to hook for SRP)
  const {
    showWelcomeModal,
    setShowWelcomeModal,
    showProfileTaskModal,
    setShowProfileTaskModal,
    showInviteModal,
    setShowInviteModal,
    taskFormMode,
    setTaskFormMode,
    aiTaskDetails,
    setAiTaskDetails,
    isGeneratingTask,
    setIsGeneratingTask,
    pendingContactSuggestion,
    setPendingContactSuggestion,
    dismissedSuggestions,
    setDismissedSuggestions,
    handleAddContactFromSuggestion,
  } = useModalController({ messages: [], setCurrentView });

  // Handlers
  const handleNavigateToContacts = React.useCallback(
    memberName => {
      setCurrentView('contacts');
      logger.debug('Navigating to contacts for:', memberName);
    },
    [setCurrentView]
  );

  const handleGetStarted = React.useCallback(() => {
    navigate(NavigationPaths.SIGN_IN);
  }, [navigate]);

  // handleAddContactFromSuggestion is now provided by useModalController

  const handleInvitationAccepted = React.useCallback(
    result => {
      refreshNotifications();
      setHasCoParentConnected(true);
      setUserProperties({ hasCoparent: true, roomStatus: 'multi_user' });
      window.dispatchEvent(
        new CustomEvent('coparent-joined', {
          detail: { coparentId: result?.coParent?.id, coparentName: result?.coParent?.name },
        })
      );
    },
    [refreshNotifications, setHasCoParentConnected]
  );

  // New message handler for toast notifications
  const handleNewMessage = React.useCallback(
    message => {
      toast.show({
        sender: message.username,
        message: message.text || message.content || '',
        timestamp: message.timestamp
          ? new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : undefined,
        username,
      });
      if (notifications.permission === 'granted') {
        notifications.showNotification(message);
      }
    },
    [toast, username, notifications]
  );

  // Landing page
  if (!isAuthenticated && showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Loading states
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-gray-600 text-lg">Checking your session…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-gray-600 text-lg">Redirecting to sign in…</div>
      </div>
    );
  }

  // Main authenticated UI
  return (
    <>
      <Navigation
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
        unreadCount={unreadCount}
        notificationCount={notificationCount}
        onInvitationAccepted={handleInvitationAccepted}
        hasMeanMessage={hasMeanMessage}
        // Search props for chat view
        searchQuery={currentView === 'chat' ? searchQuery : ''}
        searchMessages={currentView === 'chat' ? searchMessages : () => {}}
        searchMode={currentView === 'chat' ? searchMode : false}
        toggleSearchMode={currentView === 'chat' ? toggleSearchMode : () => {}}
        exitSearchMode={currentView === 'chat' ? exitSearchMode : () => {}}
        messages={currentView === 'chat' ? messages : []}
        username={username}
      />

      <ToastContainer
        toasts={toast.toasts}
        onDismiss={toast.dismiss}
        onClick={clickedToast => {
          setCurrentView('chat');
          toast.dismiss(clickedToast.id);
        }}
      />

      <div className="h-dvh bg-white flex flex-col overflow-hidden overscroll-none">
        <div
          className={`${currentView === 'chat' ? 'flex-1 min-h-0 overflow-hidden pt-0 pb-14 md:pt-14 md:pb-0' : currentView === 'profile' ? 'pt-0 md:pt-14 pb-0 overflow-y-auto' : 'pt-0 md:pt-14 pb-14 md:pb-8 overflow-y-auto px-4 sm:px-6 md:px-8'} relative z-10`}
        >
          <div
            className={`${currentView === 'chat' ? 'h-full flex flex-col overflow-hidden' : currentView === 'profile' ? 'w-full' : 'max-w-7xl mx-auto w-full'}`}
          >
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
                threads={[]}
                selectedThreadId={null}
                setSelectedThreadId={() => {}}
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
                getThreadMessages={() => {}}
              />
            )}

            {currentView === 'chat' && (
              <ChatView
                username={username}
                isAuthenticated={isAuthenticated}
                currentView={currentView}
                onNewMessage={handleNewMessage}
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
              />
            )}

            {currentView === 'contacts' && <ContactsPanel username={username} />}

            {currentView === 'profile' && (
              <div className="pb-20 md:pb-8">
                <ProfilePanel
                  username={username}
                  onLogout={handleLogout}
                  onNavigateToContacts={handleNavigateToContacts}
                />
              </div>
            )}

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

            {currentView === 'account' && (
              <React.Suspense
                fallback={
                  <div className="bg-white rounded-2xl border-2 border-teal-light shadow-lg overflow-hidden p-8">
                    <div className="text-center py-16">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-teal-medium" />
                      <p className="mt-6 text-teal-medium font-semibold text-lg">
                        Loading account...
                      </p>
                    </div>
                  </div>
                }
              >
                <AccountView username={username} />
              </React.Suspense>
            )}

            <GlobalModals
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
              onCloseTaskForm={() => {
                setShowTaskForm(false);
                setEditingTask(null);
              }}
              onSaveTask={saveTask}
              showWelcomeModal={showWelcomeModal}
              onCloseWelcome={() => {
                setShowWelcomeModal(false);
                setEditingTask(null);
              }}
              onCompleteWelcome={() => {
                toggleTaskStatus(editingTask);
                setShowWelcomeModal(false);
                setEditingTask(null);
              }}
              showProfileTaskModal={showProfileTaskModal}
              onCloseProfileTask={() => {
                setShowProfileTaskModal(false);
                setEditingTask(null);
              }}
              onNavigateToProfile={() => {
                setShowProfileTaskModal(false);
                setEditingTask(null);
                setCurrentView('profile');
              }}
              showInviteModal={showInviteModal}
              onCloseInvite={() => setShowInviteModal(false)}
              onInviteSuccess={() => {
                setShowInviteModal(false);
                if (loadTasks) loadTasks();
                setHasCoParentConnected(true);
              }}
              pendingContactSuggestion={pendingContactSuggestion}
              onAddContact={handleAddContactFromSuggestion}
              onDismissContactSuggestion={() => setPendingContactSuggestion(null)}
              setDismissedSuggestions={setDismissedSuggestions}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// Wrap with ChatProvider - auth state lifted here so ChatProvider has access
function ChatRoom() {
  const { username, isAuthenticated, isCheckingAuth } = useAuth();
  const [currentView, setCurrentView] = React.useState(() => {
    const stored = storage.getString(StorageKeys.CURRENT_VIEW);
    return stored && AVAILABLE_VIEWS.includes(stored) ? stored : 'dashboard';
  });

  return (
    <ChatProvider username={username} isAuthenticated={isAuthenticated} currentView={currentView}>
      <ChatRoomContent
        usernameFromParent={username}
        isAuthenticatedFromParent={isAuthenticated}
        isCheckingAuthFromParent={isCheckingAuth}
        currentViewFromParent={currentView}
        setCurrentViewFromParent={setCurrentView}
      />
    </ChatProvider>
  );
}

export default ChatRoom;
