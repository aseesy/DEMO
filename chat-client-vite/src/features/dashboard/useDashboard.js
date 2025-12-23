import React from 'react';
import { useTasks, createTaskCollection } from '../tasks';
import { useModalControllerDefault } from '../../hooks/ui/useModalController.js';
import { useChatContext } from '../chat/context/ChatContext.jsx';

/**
 * useDashboard - ViewModel for DashboardView
 *
 * We create explicit objects. This prepares the data for the view.
 * If you are using a custom hook (which you should be, to separate logic from view),
 * this is even easier.
 *
 * This hook acts as the ViewModel, encapsulating all dashboard state and behavior.
 * It internalizes state management (Dependency Inversion Principle) so the parent
 * component doesn't need to know about low-level details like taskSearch or taskFilter.
 *
 * The Dashboard owns its dependencies - it manages tasks, modals, and threads internally.
 * The parent component only needs to provide high-level dependencies (username, auth state).
 *
 * @param {Object} options
 * @param {string} options.username - Current user's username
 * @param {boolean} options.isAuthenticated - Whether user is authenticated
 * @param {Array} options.messages - Messages array (for modal controller)
 * @param {Function} options.setCurrentView - View navigation handler
 * @returns {Object} Dashboard props grouped into taskState, taskHandlers, modalHandlers, threadState
 */
export function useDashboard({ username, isAuthenticated, messages = [], setCurrentView }) {
  // ============================================
  // 1. DERIVED VALUES (computed from params)
  // ============================================
  const shouldLoadTasks = isAuthenticated && !!username;
  // Note: Threads are loaded via ChatContext, not here

  // ============================================
  // 2. HOOK CALLS (dependencies)
  // ============================================
  // Task state management - Dashboard owns its dependencies internally
  // The parent component doesn't need to know about taskSearch, taskFilter, etc.
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

  // Modal state management - single source of truth for Dashboard-related modals
  const {
    welcomeModal,
    profileTaskModal,
    inviteModal,
    taskFormModal,
    // Flat values for task operations (prevents reaching inside taskFormModal)
    taskFormMode,
    aiTaskDetails,
    isGeneratingTask,
    // Flat setters for task operations
    setTaskFormMode,
    setAiTaskDetails,
    setIsGeneratingTask,
    // Flat handlers for modal control (prevents reaching inside modal objects)
    setShowWelcomeModal,
    setShowProfileTaskModal,
    setShowInviteModal,
  } = useModalControllerDefault({
    messages,
    setCurrentView,
    dependencies: {},
  });

  // Thread state management - use threads from ChatContext (shared with Chat view)
  // This ensures threads are synchronized between Dashboard and Chat
  // IMPORTANT: Dashboard and Chat now share the same thread state via ChatContext
  const chatContext = useChatContext();

  // Extract thread-related state from ChatContext
  // ChatContext provides threads from useChatSocket which manages the socket connection
  const threads = chatContext?.threads || [];
  const selectedThreadId = chatContext?.selectedThreadId || null;
  const setSelectedThreadId = chatContext?.setSelectedThreadId || (() => {});
  const getThreadMessages = chatContext?.getThreadMessages || (() => {});

  // Loading state - ChatContext doesn't expose loading state directly
  // We infer it from context: if connected but no threads, might be loading
  // This is a simple heuristic - ChatContext manages actual loading internally
  const isLoadingThreads = React.useMemo(() => {
    if (!chatContext) return false;
    // If we have a connection but no threads yet, we might be loading
    return chatContext.isConnected && threads.length === 0;
  }, [chatContext, threads]);

  // Analyze conversation function
  // Note: Thread analysis is managed by ChatContext/useChatSocket
  // This function exists for API compatibility but delegates to ChatContext
  // Actual analysis happens automatically when threads are loaded in ChatContext
  const analyzeConversation = React.useCallback(async () => {
    // Threads are managed by ChatContext - analysis happens automatically
    // or can be triggered from the Chat view
    // This is a no-op here since Dashboard doesn't manage thread analysis
    if (process.env.NODE_ENV === 'development') {
      console.debug('[useDashboard] analyzeConversation called - threads managed by ChatContext');
    }
  }, []);

  // ============================================
  // 3. COMPUTED VALUES (useMemo - grouped props for DashboardView)
  // ============================================
  // We create explicit objects. This prepares the data for the view.
  // Using a custom hook makes this easier by separating logic from view.

  // Create abstracted task collection to hide array implementation
  const taskCollection = React.useMemo(() => createTaskCollection(tasks), [tasks]);

  const taskState = React.useMemo(
    () => ({
      // Return array for DashboardView compatibility (uses .length, .map, filterTasksForDashboard)
      tasks: taskCollection.getAll(),
      isLoadingTasks,
      taskSearch,
      taskFilter,
      setTaskSearch,
      setTaskFilter,
    }),
    [taskCollection, isLoadingTasks, taskSearch, taskFilter]
  );

  const taskHandlers = React.useMemo(
    () => ({
      setEditingTask,
      setShowTaskForm,
      setTaskFormMode,
      setAiTaskDetails,
      setIsGeneratingTask,
      setTaskFormData,
      toggleTaskStatus,
    }),
    [
      setEditingTask,
      setShowTaskForm,
      setTaskFormMode,
      setAiTaskDetails,
      setIsGeneratingTask,
      setTaskFormData,
      toggleTaskStatus,
    ]
  );

  const modalHandlers = React.useMemo(
    () => ({
      // Use flat handlers directly - no reaching inside modal objects
      setShowWelcomeModal,
      setShowProfileTaskModal,
      setShowInviteModal,
    }),
    [setShowWelcomeModal, setShowProfileTaskModal, setShowInviteModal]
  );

  const threadState = React.useMemo(
    () => ({
      threads,
      isLoadingThreads,
      selectedThreadId,
      setSelectedThreadId,
      getThreadMessages,
      analyzeConversation,
    }),
    [
      threads,
      isLoadingThreads,
      selectedThreadId,
      setSelectedThreadId,
      getThreadMessages,
      analyzeConversation,
    ]
  );

  // ============================================
  // 4. RETURN (organized by conceptual groups)
  // ============================================
  return {
    // Grouped props for DashboardView (abstracted interface)
    taskState,
    taskHandlers,
    modalHandlers,
    threadState,

    // Flat handlers for ChatRoom (abstracted - no reaching inside objects)
    // These come from useModalController's flattened interface
    taskFormMode,
    setTaskFormMode,
    aiTaskDetails,
    setAiTaskDetails,
    isGeneratingTask,
    setIsGeneratingTask,
    setShowWelcomeModal,
    setShowProfileTaskModal,
    setShowInviteModal,

    // Raw task state for ChatRoom (GlobalModals) - marked as implementation detail
    // TODO: Refactor ChatRoom to use abstracted interface
    // These are exposed for backward compatibility only
    _raw: {
      tasks,
      isLoadingTasks,
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
      welcomeModal,
      profileTaskModal,
      inviteModal,
      taskFormModal,
    },
  };
}
