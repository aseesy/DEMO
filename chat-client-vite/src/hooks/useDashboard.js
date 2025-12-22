import React from 'react';
import { useTasks } from './useTasks.js';
import { useModalControllerDefault } from './useModalController.js';
import { createTaskCollection } from './taskAbstraction.js';

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
    // Flat handlers for task operations (no need to reach inside taskFormModal)
    setTaskFormMode,
    setAiTaskDetails,
    setIsGeneratingTask,
    // Flat handlers for modal control (no need to reach inside modal objects)
    setShowWelcomeModal,
    setShowProfileTaskModal,
    setShowInviteModal,
  } = useModalControllerDefault({ 
    messages, 
    setCurrentView,
    dependencies: {},
  });

  // ============================================
  // 3. COMPUTED VALUES (useMemo - grouped props for DashboardView)
  // ============================================
  // We create explicit objects. This prepares the data for the view.
  // Using a custom hook makes this easier by separating logic from view.
  
  // Create abstracted task collection to hide array implementation
  const taskCollection = React.useMemo(
    () => createTaskCollection(tasks),
    [tasks]
  );

  const taskState = React.useMemo(
    () => ({
      // Abstracted task collection (hides array implementation)
      tasks: taskCollection,
      // Expose array for backward compatibility (DashboardView still uses .length, .map)
      // TODO: Refactor DashboardView to use taskCollection methods
      tasksArray: taskCollection.getAll(),
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
    [setEditingTask, setShowTaskForm, setTaskFormMode, setAiTaskDetails, setIsGeneratingTask, setTaskFormData, toggleTaskStatus]
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
      threads: [],
      selectedThreadId: null,
      setSelectedThreadId: () => {},
      getThreadMessages: () => {},
    }),
    []
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
    // These are extracted from modalController to prevent reaching inside
    taskFormMode: taskFormModal.taskFormMode,
    setTaskFormMode,
    aiTaskDetails: taskFormModal.aiTaskDetails,
    setAiTaskDetails,
    isGeneratingTask: taskFormModal.isGeneratingTask,
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

