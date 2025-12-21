import React from 'react';
import { useTasks } from './useTasks.js';
import { useModalController } from './useModalController.js';

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
  const shouldLoadTasks = isAuthenticated && !!username;

  // Internalize state management - Dashboard owns its dependencies
  // The parent component doesn't need to know about taskSearch, taskFilter, etc.
  const {
    tasks,
    isLoadingTasks,
    taskSearch,
    taskFilter,
    setShowTaskForm,
    setEditingTask,
    setTaskFormData,
    setTaskSearch,
    setTaskFilter,
    toggleTaskStatus,
  } = useTasks(username, shouldLoadTasks);

  // Modal handlers - also internalized
  const {
    welcomeModal,
    profileTaskModal,
    inviteModal,
    taskFormModal,
  } = useModalController({ messages, setCurrentView });

  // We create explicit objects. This prepares the data for the view.
  // Using a custom hook makes this easier by separating logic from view.
  
  // Prepare grouped props for DashboardView
  const taskState = React.useMemo(
    () => ({
      tasks,
      isLoadingTasks,
      taskSearch,
      taskFilter,
      setTaskSearch,
      setTaskFilter,
    }),
    [tasks, isLoadingTasks, taskSearch, taskFilter]
  );

  const taskHandlers = React.useMemo(
    () => ({
      setEditingTask,
      setShowTaskForm,
      setTaskFormMode: taskFormModal.setTaskFormMode,
      setAiTaskDetails: taskFormModal.setAiTaskDetails,
      setIsGeneratingTask: taskFormModal.setIsGeneratingTask,
      setTaskFormData,
      toggleTaskStatus,
    }),
    [setEditingTask, setShowTaskForm, taskFormModal.setTaskFormMode, taskFormModal.setAiTaskDetails, taskFormModal.setIsGeneratingTask, setTaskFormData, toggleTaskStatus]
  );

  const modalHandlers = React.useMemo(
    () => ({
      setShowWelcomeModal: welcomeModal.setShow,
      setShowProfileTaskModal: profileTaskModal.setShow,
      setShowInviteModal: inviteModal.setShow,
    }),
    [welcomeModal.setShow, profileTaskModal.setShow, inviteModal.setShow]
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

  return {
    taskState,
    taskHandlers,
    modalHandlers,
    threadState,
  };
}

