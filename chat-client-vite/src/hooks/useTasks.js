import React from 'react';
import { trackTaskCreated, trackTaskCompleted } from '../utils/analytics.js';
import {
  getTaskAction as getTaskActionFromHelper,
  getNextTaskStatus,
  wasTaskCompleted,
  getDefaultTaskFormData,
} from '../utils/taskHelpers.js';
import {
  queryFetchTasks,
  commandUpdateTaskStatus,
  commandSaveTask,
} from '../utils/taskQueries.js';

// Minimal tasks hook to mirror the existing dashboard task behavior.
// This focuses on loading tasks, limiting to 5, toggling status,
// and creating/updating tasks.

export function useTasks(username, isAuthenticated = true) {
  const [tasks, setTasks] = React.useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = React.useState(false);
  const [taskSearch, setTaskSearch] = React.useState('');
  const [taskFilter, setTaskFilter] = React.useState('open'); // Default to 'open' tasks
  const [showTaskForm, setShowTaskForm] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState(null);
  // Use utility function for default form data
  const [taskFormData, setTaskFormData] = React.useState(getDefaultTaskFormData());

  const loadTasks = React.useCallback(async () => {
    if (!username || !isAuthenticated) {
      setTasks([]);
      return;
    }

    setIsLoadingTasks(true);
    const result = await queryFetchTasks({
      username,
      search: taskSearch,
      filter: taskFilter,
    });
    setTasks(result.tasks);
    setIsLoadingTasks(false);
  }, [username, taskFilter, taskSearch, isAuthenticated]);

  React.useEffect(() => {
    // Only load tasks if authenticated and username is available
    // This prevents race conditions during auth verification
    if (isAuthenticated && username) {
      loadTasks();
    } else {
      setTasks([]);
    }
  }, [loadTasks, isAuthenticated, username]);

  const toggleTaskStatus = async task => {
    if (!task?.id || !username) return;

    const previousStatus = task.status;
    const newStatus = getNextTaskStatus(previousStatus);

    const result = await commandUpdateTaskStatus({
      taskId: task.id,
      username,
      status: newStatus,
    });

    if (result.success) {
      // Track analytics when task is completed
      if (wasTaskCompleted(previousStatus, newStatus)) {
        trackTaskCompleted(task.type || 'general');
      }
      loadTasks();
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

    const result = await commandSaveTask({
      username,
      taskData: dataToSave,
      taskId,
    });

    if (result.success) {
      // Track analytics for new task creation
      if (result.isNew) {
        trackTaskCreated(dataToSave.type || 'general', dataToSave.priority || 'medium');
      }
      setShowTaskForm(false);
      setEditingTask(null);
      setTaskFormData(getDefaultTaskFormData());
      loadTasks();
      return result.task;
    } else {
      alert(result.error || 'Failed to save task');
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
    loadTasks,
    toggleTaskStatus,
    saveTask,
    getTaskAction, // Feature 005: helper for special task actions
  };
}
