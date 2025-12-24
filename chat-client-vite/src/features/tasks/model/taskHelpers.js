/**
 * taskHelpers.js
 * Pure functions for task business logic with no React/DOM dependencies.
 * Extracted from useTasks.js hook.
 */

/**
 * Priority ordering for task sorting
 * Lower number = higher priority
 */
export const PRIORITY_ORDER = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Task title patterns that trigger special modal actions instead of status toggle
 * Uses lowercase for case-insensitive matching
 */
export const INVITE_TASK_PATTERNS = ['invite your co-parent', 'add your co-parent', 'add coparent'];

/**
 * Sort tasks by priority (high first) then by creation date (oldest first)
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted tasks array
 */
export function sortTasksByPriorityAndDate(tasks) {
  if (!Array.isArray(tasks)) return [];

  return [...tasks].sort((a, b) => {
    // First sort by priority
    const priorityA = PRIORITY_ORDER[a.priority] ?? PRIORITY_ORDER.medium;
    const priorityB = PRIORITY_ORDER[b.priority] ?? PRIORITY_ORDER.medium;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Then by creation date (oldest first)
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateA - dateB;
  });
}

/**
 * Sort tasks by priority (high first) then by creation date (newest first)
 * Alternative sorting for different views
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Sorted tasks array
 */
export function sortTasksByPriorityNewestFirst(tasks) {
  if (!Array.isArray(tasks)) return [];

  return [...tasks].sort((a, b) => {
    const priorityA = PRIORITY_ORDER[a.priority] ?? PRIORITY_ORDER.medium;
    const priorityB = PRIORITY_ORDER[b.priority] ?? PRIORITY_ORDER.medium;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Newest first
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB - dateA;
  });
}

/**
 * Normalize task title for case-insensitive comparison
 * @param {string} title - Task title
 * @returns {string} Lowercase trimmed title
 */
function normalizeTitle(title) {
  return (title || '').toLowerCase().trim();
}

/**
 * Check if title matches any pattern in the list (case-insensitive)
 * @param {string} title - Task title
 * @param {string[]} patterns - Patterns to match (lowercase)
 * @returns {boolean}
 */
function matchesPattern(title, patterns) {
  const normalized = normalizeTitle(title);
  return patterns.some(pattern => normalized.includes(pattern));
}

/**
 * Get the action type for a task
 * Some tasks (like "Invite Your Co-Parent") should open a modal instead of toggling status
 * @param {Object} task - The task object
 * @returns {{ type: 'modal' | 'toggle', modal?: string }}
 */
export function getTaskAction(task) {
  if (!task) return { type: 'toggle' };

  // Special handling for invite task - opens InviteTaskModal
  if (matchesPattern(task.title, INVITE_TASK_PATTERNS) && task.status !== 'completed') {
    return { type: 'modal', modal: 'invite' };
  }

  // Default action is to toggle status
  return { type: 'toggle' };
}

/**
 * Check if a task is an invite task (case-insensitive pattern matching)
 * @param {Object} task - The task object
 * @returns {boolean}
 */
export function isInviteTask(task) {
  if (!task) return false;
  return matchesPattern(task.title, INVITE_TASK_PATTERNS);
}

/**
 * Get the next status when toggling a task
 * @param {string} currentStatus - Current task status
 * @returns {string} New status
 */
export function getNextTaskStatus(currentStatus) {
  return currentStatus === 'completed' ? 'open' : 'completed';
}

/**
 * Check if a task was just completed (for analytics)
 * @param {string} previousStatus - Status before toggle
 * @param {string} newStatus - Status after toggle
 * @returns {boolean}
 */
export function wasTaskCompleted(previousStatus, newStatus) {
  return previousStatus === 'open' && newStatus === 'completed';
}

/**
 * Filter tasks by status
 * @param {Array} tasks - Array of tasks
 * @param {string} status - Status to filter by ('open', 'completed', 'all')
 * @returns {Array} Filtered tasks
 */
export function filterTasksByStatus(tasks, status) {
  if (!Array.isArray(tasks)) return [];
  if (status === 'all') return tasks;
  return tasks.filter(task => task.status === status);
}

/**
 * Filter tasks by priority
 * @param {Array} tasks - Array of tasks
 * @param {string} priority - Priority to filter by ('high', 'medium', 'low')
 * @returns {Array} Filtered tasks
 */
export function filterTasksByPriority(tasks, priority) {
  if (!Array.isArray(tasks)) return [];
  return tasks.filter(task => task.priority === priority);
}

/**
 * Search tasks by title and description
 * @param {Array} tasks - Array of tasks
 * @param {string} query - Search query
 * @returns {Array} Matching tasks
 */
export function searchTasks(tasks, query) {
  if (!Array.isArray(tasks) || !query) return tasks;

  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return tasks;

  return tasks.filter(task => {
    const title = (task.title || '').toLowerCase();
    const description = (task.description || '').toLowerCase();
    return title.includes(lowerQuery) || description.includes(lowerQuery);
  });
}

/**
 * Build default task form data
 * @returns {Object} Default task form data
 */
export function getDefaultTaskFormData() {
  return {
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    due_date: '',
    assigned_to: 'self',
    related_people: [],
  };
}

/**
 * Validate task form data
 * @param {Object} taskData - Task form data
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateTaskFormData(taskData) {
  const errors = {};

  if (!taskData.title?.trim()) {
    errors.title = 'Title is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
