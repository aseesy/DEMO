import React from 'react';
import { apiGet, apiPost, apiPut } from '../apiClient.js';

// Minimal tasks hook to mirror the existing dashboard task behavior.
// This focuses on loading tasks, limiting to 5, toggling status,
// and creating/updating tasks.

export function useTasks(username) {
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
    if (!username) return;
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

      const response = await apiGet(`/api/tasks?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          // Sort by creation date (oldest first for dashboard)
          const sorted = [...data].sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateA - dateB;
          });
          // Only limit to 5 if no search is active
          if (!taskSearch) {
            setTasks(sorted.slice(0, 5));
          } else {
            setTasks(sorted);
          }
        }
      }
    } catch (err) {
      console.error('Error loading tasks (Vite):', err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [username, taskFilter, taskSearch]);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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
      console.error('Error updating task status (Vite):', err);
    }
  };

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
      console.error('Error saving task (Vite):', err);
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
  };
}


