import React from 'react';
import './index.css';
import { useAuth } from './features/auth';
import { useDashboard } from './features/dashboard';
import { useContacts } from './features/contacts';
import { useNotifications, useInAppNotifications } from './features/notifications';
import { useToast } from './hooks/ui/useToast.js';
import { useInviteManagement } from './features/invitations/model/useInviteManagement.js';
import { useModalControllerDefault } from './hooks/ui/useModalController.js';
import { ChatProvider, useChatContext } from './features/chat';
import { ToastContainer } from './components/ui/Toast/Toast.jsx';
import { ContactsPanel } from './features/contacts';
import { ProfilePanel } from './features/profile/components/ProfilePanel.jsx';
import { Navigation } from './features/shell/Navigation.jsx';
import { LandingPage } from './features/landing/LandingPage.jsx';
import { GlobalModals } from './features/shell/GlobalModals.jsx';
import { SettingsViewLegacy } from './features/settings';
import { DashboardView } from './features/dashboard';
import { ChatPage as ChatView } from './features/chat';

// Adapters - abstract third-party dependencies
import { useAppNavigation, NavigationPaths } from './adapters/navigation';
import { storage, StorageKeys } from './adapters/storage';

// Lazy-load AccountView for code-splitting
const AccountView = React.lazy(() => import('./features/profile/components/AccountView.jsx'));
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
  const {
    unreadCount,
    hasMeanMessage,
    searchQuery,
    searchMessages,
    searchMode,
    toggleSearchMode,
    exitSearchMode,
    messages,
  } = useChatContext();

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

  // Dashboard hook - ViewModel that owns its state
  // The Dashboard manages its own dependencies internally
  // This is the single source of truth for Dashboard-related state (tasks and modals)
  const dashboardProps = useDashboard({
    username,
    isAuthenticated,
    messages, // Use actual messages from context (for contact suggestions if needed)
    setCurrentView,
  });

  // Extract task state and Dashboard modals from useDashboard
  // This eliminates duplication - we use Dashboard's state for GlobalModals
  // Use abstracted interfaces, not raw state
  const {
    showTaskForm,
    editingTask,
    taskFormData,
    setShowTaskForm,
    setEditingTask,
    setTaskFormData,
    saveTask,
    loadTasks,
    toggleTaskStatus,
    // Modal objects (for backward compatibility)
    welcomeModal,
    profileTaskModal,
    inviteModal,
    taskFormModal,
    // Flat handlers (abstracted - no reaching inside)
    taskFormMode,
    setTaskFormMode,
    aiTaskDetails,
    setAiTaskDetails,
    isGeneratingTask,
    setIsGeneratingTask,
    setShowWelcomeModal,
    setShowProfileTaskModal,
    setShowInviteModal,
  } = dashboardProps;

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
    isCheckingCoParent,
    hasPendingInvitation,
    hasAcceptedInvitation,
    handleLoadInvite,
    handleCopyInvite,
    handleManualAcceptInvite,
  } = useInviteManagement({ username, isAuthenticated, messages: [], currentView });

  // Modal state for non-Dashboard views (contact suggestions, message flagging)
  // These modals need messages, so they're separate from Dashboard modals
  const { contactSuggestionModal, messageFlaggingModal } = useModalControllerDefault({
    messages,
    setCurrentView,
    dependencies: {},
  });

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

      <div className="h-dvh bg-white flex flex-col overflow-hidden overscroll-none relative z-0">
        <div
          className={`${currentView === 'chat' ? 'flex-1 min-h-0 overflow-hidden pt-0 pb-14 md:pt-14 md:pb-0' : currentView === 'profile' ? 'pt-0 md:pt-14 pb-0 overflow-y-auto' : 'pt-0 md:pt-14 pb-14 md:pb-6 overflow-y-auto px-3 sm:px-4 md:px-6'}`}
        >
          <div
            className={`${currentView === 'chat' ? 'h-full flex flex-col overflow-hidden' : currentView === 'profile' ? 'w-full' : 'max-w-7xl mx-auto w-full'}`}
          >
            {currentView === 'dashboard' && (
              <DashboardView
                username={username}
                hasCoParentConnected={hasCoParentConnected}
                isCheckingCoParent={isCheckingCoParent}
                contacts={contacts}
                setCurrentView={setCurrentView}
                taskState={dashboardProps.taskState}
                taskHandlers={dashboardProps.taskHandlers}
                modalHandlers={dashboardProps.modalHandlers}
                threadState={dashboardProps.threadState}
              />
            )}

            {currentView === 'chat' && (
              <ChatView
                username={username}
                isAuthenticated={isAuthenticated}
                inviteState={{
                  inviteLink,
                  inviteCode,
                  inviteCopied,
                  inviteError,
                  isLoadingInvite,
                  hasCoParentConnected,
                  hasPendingInvitation,
                  hasAcceptedInvitation,
                  showManualInvite,
                  manualInviteCode,
                  pendingInviteCode,
                  isAcceptingInvite,
                }}
                inviteHandlers={{
                  setInviteLink,
                  setInviteCode,
                  setInviteCopied,
                  setInviteError,
                  handleLoadInvite,
                  handleCopyInvite,
                  setShowManualInvite,
                  setManualInviteCode,
                  setPendingInviteCode,
                  handleManualAcceptInvite,
                }}
              />
            )}

            {currentView === 'contacts' && (
              <ContactsPanel username={username} setCurrentView={setCurrentView} />
            )}

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
              <SettingsViewLegacy
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
              showWelcomeModal={welcomeModal?.show || false}
              onCloseWelcome={() => {
                setShowWelcomeModal(false);
                setEditingTask(null);
              }}
              onCompleteWelcome={() => {
                toggleTaskStatus(editingTask);
                setShowWelcomeModal(false);
                setEditingTask(null);
              }}
              showProfileTaskModal={profileTaskModal?.show || false}
              onCloseProfileTask={() => {
                setShowProfileTaskModal(false);
                setEditingTask(null);
              }}
              onNavigateToProfile={() => {
                setShowProfileTaskModal(false);
                setEditingTask(null);
                setCurrentView('profile');
              }}
              showInviteModal={inviteModal?.show || false}
              onCloseInvite={() => setShowInviteModal(false)}
              onInviteSuccess={() => {
                setShowInviteModal(false);
                if (loadTasks) loadTasks();
                setHasCoParentConnected(true);
              }}
              pendingContactSuggestion={contactSuggestionModal.pendingContactSuggestion}
              onAddContact={contactSuggestionModal.handleAddContactFromSuggestion}
              onDismissContactSuggestion={() =>
                contactSuggestionModal.setPendingContactSuggestion(null)
              }
              setDismissedSuggestions={contactSuggestionModal.setDismissedSuggestions}
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
