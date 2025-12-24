/**
 * Pure Query/Command Functions for Tasks
 *
 * These functions handle API calls without managing React state.
 * Error handling is done by the caller.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '../../../apiClient.js';
import { logger } from '../../../utils/logger.js';
import { sortTasksByPriorityAndDate } from './taskHelpers.js';

/**
 * Query: Fetch tasks with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.username - Username
 * @param {string} params.search - Search term
 * @param {string} params.filter - Filter type: 'open', 'completed', 'high', 'all'
 * @returns {Promise<{ success: boolean, tasks?: Array, error?: string }>}
 */
export async function queryFetchTasks({ username, search = '', filter = 'open' }) {
  if (!username) {
    return { success: false, tasks: [], error: 'No username provided' };
  }

  const params = new URLSearchParams({ username, search });

  // Handle different filter types
  if (filter === 'open' || filter === 'completed') {
    params.append('status', filter);
  } else if (filter === 'high') {
    params.append('priority', 'high');
  }
  // 'all' filter doesn't need any params

  try {
    const response = await apiGet(`/api/tasks?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      logger.apiError(`/api/tasks`, response.status, errorData.error || 'Unknown error');

      if (response.status === 401) {
        return { success: false, tasks: [], authError: true };
      }

      return { success: false, tasks: [], error: errorData.error };
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      logger.warn('[taskQueries] Response data is not an array:', data);
      return { success: false, tasks: [], error: 'Invalid response format' };
    }

    const sortedTasks = sortTasksByPriorityAndDate(data);
    return { success: true, tasks: sortedTasks };
  } catch (err) {
    logger.error('[taskQueries] Error fetching tasks', err);
    return { success: false, tasks: [], error: err.message };
  }
}

/**
 * Command: Update task status
 * @param {Object} params - Update parameters
 * @param {string} params.taskId - Task ID
 * @param {string} params.username - Username
 * @param {string} params.status - New status
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function commandUpdateTaskStatus({ taskId, username, status }) {
  if (!taskId || !username) {
    return { success: false, error: 'Missing required parameters' };
  }

  try {
    const response = await apiPut(`/api/tasks/${taskId}`, {
      username,
      status,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: errorData.error };
    }

    return { success: true };
  } catch (err) {
    logger.error('[taskQueries] Error updating task status', err);
    return { success: false, error: err.message };
  }
}

/**
 * Command: Create or update a task
 * @param {Object} params - Task parameters
 * @param {string} params.username - Username
 * @param {Object} params.taskData - Task data
 * @param {string} [params.taskId] - Task ID for update (omit for create)
 * @returns {Promise<{ success: boolean, task?: Object, error?: string }>}
 */
export async function commandSaveTask({ username, taskData, taskId }) {
  if (!username || !taskData.title?.trim()) {
    return { success: false, error: 'Missing required parameters' };
  }

  const isUpdate = !!taskId;
  const path = isUpdate ? `/api/tasks/${taskId}` : '/api/tasks';
  const method = isUpdate ? apiPut : apiPost;

  try {
    const response = await method(path, {
      username,
      ...taskData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to save task' };
    }

    return { success: true, task: data, isNew: !isUpdate };
  } catch (err) {
    logger.error('[taskQueries] Error saving task', err);
    return { success: false, error: err.message };
  }
}

/**
 * Command: Delete a task
 * @param {Object} params - Delete parameters
 * @param {string|number} params.taskId - Task ID
 * @param {string} params.username - Username
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function commandDeleteTask({ taskId, username }) {
  if (!taskId || !username) {
    return { success: false, error: 'Missing required parameters' };
  }

  try {
    const response = await apiDelete(`/api/tasks/${taskId}`, { username });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: errorData.error || 'Failed to delete task' };
    }

    return { success: true };
  } catch (err) {
    logger.error('[taskQueries] Error deleting task', err);
    return { success: false, error: err.message };
  }
}
