import React from 'react';
import { useModalController } from './useModalController.js';

/**
 * useDashboard - Prepares all props for DashboardView
 * 
 * We create explicit objects. This prepares the data for the view.
 * If you are using a custom hook (which you should be, to separate logic from view),
 * this is even easier.
 * 
 * This hook groups task state, task handlers, modal handlers, and thread state
 * into explicit objects that DashboardView expects. By using a custom hook,
 * we separate the logic of preparing data from the view component, making
 * the code more maintainable and testable.
 * 
 * @param {Object} options
 * @param {Array} options.tasks - Task list
 * @param {boolean} options.isLoadingTasks - Loading state for tasks
 * @param {string} options.taskSearch - Task search query
 * @param {string} options.taskFilter - Task filter value
 * @param {Function} options.setTaskSearch - Set task search query
 * @param {Function} options.setTaskFilter - Set task filter
 * @param {Function} options.setShowTaskForm - Show/hide task form
 * @param {Function} options.setEditingTask - Set task being edited
 * @param {Function} options.setTaskFormData - Set task form data
 * @param {Function} options.toggleTaskStatus - Toggle task status
 * @param {Array} options.messages - Messages array (for modal controller)
 * @param {Function} options.setCurrentView - View navigation handler
 * @returns {Object} Dashboard props grouped into taskState, taskHandlers, modalHandlers, threadState
 */
export function useDashboard({
  tasks,
  isLoadingTasks,
  taskSearch,
  taskFilter,
  setTaskSearch,
  setTaskFilter,
  setShowTaskForm,
  setEditingTask,
  setTaskFormData,
  toggleTaskStatus,
  messages = [],
  setCurrentView,
}) {
  // Modal handlers
  const {
    taskFormMode,
    setTaskFormMode,
    aiTaskDetails,
    setAiTaskDetails,
    isGeneratingTask,
    setIsGeneratingTask,
    setShowWelcomeModal,
    setShowProfileTaskModal,
    setShowInviteModal,
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

  return {
    taskState,
    taskHandlers,
    modalHandlers,
    threadState,
  };
}

