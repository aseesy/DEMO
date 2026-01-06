import React from 'react';
import { trackTaskCreated, trackTaskCompleted } from '../../../utils/analytics.js';
import {
  getTaskAction as getTaskActionFromHelper,
  getNextTaskStatus,
  wasTaskCompleted,
  getDefaultTaskFormData,
} from './taskHelpers.js';
import { isPWAInstallTask } from './taskTypeDetection.js';
import {
  useTasksQuery,
  useUpdateTaskStatusMutation,
  useSaveTaskMutation,
  useDeleteTaskMutation,
} from './useTaskQueries.js';

/**
 * useTasks - Task management hook with TanStack Query
 *
 * Migrated from manual state management to TanStack Query for:
 * - Automatic caching and request deduplication
 * - Background refetching
 * - Optimistic updates
 * - Automatic cache invalidation after mutations
 */
export function useTasks(username, isAuthenticated = true) {
  // UI state (not related to data fetching)
  const [taskSearch, setTaskSearch] = React.useState('');
  const [taskFilter, setTaskFilter] = React.useState('open'); // Default to 'open' tasks
  const [showTaskForm, setShowTaskForm] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState(null);
  // Use utility function for default form data
  const [taskFormData, setTaskFormData] = React.useState(getDefaultTaskFormData());

  // TanStack Query hooks
  const {
    data: tasksData,
    isLoading: isLoadingTasks,
    refetch: refetchTasks,
  } = useTasksQuery({
    username,
    search: taskSearch,
    filter: taskFilter,
    enabled: isAuthenticated && !!username,
  });

  const updateTaskStatusMutation = useUpdateTaskStatusMutation();
  const saveTaskMutation = useSaveTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  // Extract tasks from query result (default to empty array)
  const tasks = tasksData?.tasks || [];

  // Auto-complete PWA install task when app is installed
  // Track if we've already completed the task to avoid duplicate API calls
  const pwaTaskCompletedRef = React.useRef(false);

  React.useEffect(() => {
    if (!username || !isAuthenticated || tasks.length === 0) return;

    // Check if PWA is installed
    const isPWAInstalled = () => {
      // Check via liaizenPWA global (set by usePWA hook)
      if (window.liaizenPWA?.isInstalled) return true;
      // Check via display-mode media query
      if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
      // Check iOS Safari standalone mode
      if (window.navigator?.standalone === true) return true;
      return false;
    };

    // Find uncompleted PWA install task
    const pwaTask = tasks.find(task => isPWAInstallTask(task) && task.status !== 'completed');

    // If no uncompleted task exists, nothing to do
    if (!pwaTask) {
      pwaTaskCompletedRef.current = false; // Reset for future tasks
      return;
    }

    // Skip if already processing or not installed
    if (pwaTaskCompletedRef.current || !isPWAInstalled()) return;

    // Mark it as completed using TanStack Query mutation
    const completePWATask = async () => {
      pwaTaskCompletedRef.current = true; // Prevent duplicate calls

      try {
        await updateTaskStatusMutation.mutateAsync({
          taskId: pwaTask.id,
          username,
          status: 'completed',
        });
        trackTaskCompleted('pwa_install');
        // TanStack Query automatically invalidates and refetches, no manual loadTasks() needed
      } catch (_error) {
        pwaTaskCompletedRef.current = false; // Allow retry on failure
      }
    };

    completePWATask();

    // Also listen for real-time installation (user installs during session)
    const handleAppInstalled = () => {
      if (!pwaTaskCompletedRef.current && pwaTask) {
        completePWATask();
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [tasks, username, isAuthenticated, updateTaskStatusMutation]);

  const toggleTaskStatus = async task => {
    if (!task?.id || !username) return;

    const previousStatus = task.status;
    const newStatus = getNextTaskStatus(previousStatus);

    try {
      await updateTaskStatusMutation.mutateAsync({
        taskId: task.id,
        username,
        status: newStatus,
      });

      // Track analytics when task is completed
      if (wasTaskCompleted(previousStatus, newStatus)) {
        trackTaskCompleted(task.type || 'general');
      }
      // TanStack Query automatically invalidates and refetches, no manual loadTasks() needed
    } catch (error) {
      // Error is handled by TanStack Query, but we could show a toast here if needed
      console.error('Failed to update task status:', error);
    }
  };

  /**
   * Get the action type for a task
   * Some tasks (like "Invite Your Co-Parent") should open a modal instead of toggling status
   * Uses extracted utility function for business logic
   * @param {Object} task - The task object
   * @returns {Object} - { type: 'modal' | 'toggle', modal?: string }
   */
  const getTaskAction = React.useCallback(task => {
    return getTaskActionFromHelper(task);
  }, []);

  const saveTask = async (taskDataOverride = null) => {
    const dataToSave = taskDataOverride || taskFormData;
    if (!dataToSave.title?.trim() || !username) return;

    const taskId = editingTask?.id || dataToSave.id || null;

    try {
      const result = await saveTaskMutation.mutateAsync({
        username,
        taskData: dataToSave,
        taskId,
      });

      // Track analytics for new task creation
      if (result.isNew) {
        trackTaskCreated(dataToSave.type || 'general', dataToSave.priority || 'medium');
      }
      setShowTaskForm(false);
      setEditingTask(null);
      setTaskFormData(getDefaultTaskFormData());
      // TanStack Query automatically invalidates and refetches, no manual loadTasks() needed
      return result.task;
    } catch (error) {
      alert(error.message || 'Failed to save task');
      throw error; // Re-throw so caller can handle if needed
    }
  };

  const deleteTask = async task => {
    if (!task?.id || !username) return;

    // Confirm deletion
    const confirmed = window.confirm(`Delete "${task.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteTaskMutation.mutateAsync({
        taskId: task.id,
        username,
      });

      setShowTaskForm(false);
      setEditingTask(null);
      setTaskFormData(getDefaultTaskFormData());
      // TanStack Query automatically invalidates and refetches, no manual loadTasks() needed
    } catch (error) {
      alert(error.message || 'Failed to delete task');
    }
  };

  return {
    tasks,
    isLoadingTasks,
    taskSearch,
    taskFilter,
    showTaskForm,
    editingTask,
    taskFormData,
    setTaskSearch,
    setTaskFilter,
    setShowTaskForm,
    setEditingTask,
    setTaskFormData,
    loadTasks: refetchTasks, // Expose refetch for manual refresh if needed
    toggleTaskStatus,
    saveTask,
    deleteTask,
    getTaskAction, // Feature 005: helper for special task actions
  };
}
