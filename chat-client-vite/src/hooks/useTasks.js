import React from 'react';
import { apiGet, apiPost, apiPut } from '../apiClient.js';
import { logger } from '../utils/logger.js';

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
  const [taskFormData, setTaskFormData] = React.useState({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    due_date: '',
    assigned_to: 'self',
    related_people: [],
  });

  const loadTasks = React.useCallback(async () => {
    if (!username || !isAuthenticated) {
      setTasks([]);
      return;
    }
    setIsLoadingTasks(true);
    try {
      const params = new URLSearchParams({
        username,
        search: taskSearch,
      });

      // Handle different filter types
      if (taskFilter === 'open' || taskFilter === 'completed') {
        params.append('status', taskFilter);
      } else if (taskFilter === 'high') {
        params.append('priority', 'high');
      }
      // 'all' filter doesn't need any params

      const url = `/api/tasks?${params.toString()}`;
      const response = await apiGet(url);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          // Sort by priority (high first) then by creation date (oldest first for dashboard)
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const sorted = [...data].sort((a, b) => {
            // First sort by priority
            const priorityA = priorityOrder[a.priority] ?? 1;
            const priorityB = priorityOrder[b.priority] ?? 1;
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            // Then by creation date (oldest first)
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateA - dateB;
          });
          // Show all tasks (Feature 005: removed 5-task limit)
          setTasks(sorted);

        } else {
          logger.warn('[useTasks] Response data is not an array:', data);
          setTasks([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        logger.apiError(`/api/tasks`, response.status, errorData.error || 'Unknown error');
        if (response.status === 401) {
          // User not authenticated - silently ignore
          setTasks([]);
        } else {
          // Other errors - log but don't show to user
          setTasks([]);
        }
      }
    } catch (err) {
      logger.error('[useTasks] Error loading tasks', err);
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
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

  const toggleTaskStatus = async (task) => {
    if (!task?.id || !username) return;
    try {
      const newStatus = task.status === 'completed' ? 'open' : 'completed';
      const response = await apiPut(`/api/tasks/${task.id}`, {
        username,
        status: newStatus,
      });
      if (response.ok) {
        loadTasks();
      }
    } catch (err) {
      logger.error('Error updating task status', err);
    }
  };

  /**
   * Get the action type for a task
   * Some tasks (like "Invite Your Co-Parent") should open a modal instead of toggling status
   * @param {Object} task - The task object
   * @returns {Object} - { type: 'modal' | 'toggle', modal?: string }
   */
  const getTaskAction = React.useCallback((task) => {
    // Special handling for invite task - opens InviteTaskModal
    if ((task.title === 'Invite Your Co-Parent' || task.title === 'Add Your Co-parent') && task.status !== 'completed') {
      return { type: 'modal', modal: 'invite' };
    }
    // Default action is to toggle status
    return { type: 'toggle' };
  }, []);

  const saveTask = async () => {
    if (!taskFormData.title.trim() || !username) return;
    try {
      const path = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? apiPut : apiPost;
      const response = await method(path, {
        username,
        ...taskFormData,
      });
      const data = await response.json();
      if (response.ok) {
        setShowTaskForm(false);
        setEditingTask(null);
        setTaskFormData({
          title: '',
          description: '',
          status: 'open',
          priority: 'medium',
          due_date: '',
          assigned_to: 'self',
          related_people: [],
        });
        loadTasks();
        return data;
      } else {
        alert(data.error || 'Failed to save task');
      }
    } catch (err) {
      logger.error('Error saving task', err);
      alert('Failed to save task. Please try again.');
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


