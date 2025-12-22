/**
 * taskTypeDetection.js
 * Pure functions for detecting task types based on title/content.
 * No React/DOM dependencies.
 */

/**
 * Task title patterns for detection
 */
const TASK_PATTERNS = {
  coparent: ['add your co-parent', 'add coparent'],
  profile: ['complete your profile', 'complete profile'],
  children: ['add your children', 'add children'],
  welcome: ['welcome'],
  invite: ['invite your co-parent'],
};

/**
 * Normalize task title for comparison
 * @param {string} title - Task title
 * @returns {string} Lowercase trimmed title
 */
function normalizeTitle(title) {
  return (title || '').toLowerCase().trim();
}

/**
 * Check if title matches any pattern in the list
 * @param {string} title - Task title
 * @param {string[]} patterns - Patterns to match
 * @returns {boolean}
 */
function matchesPattern(title, patterns) {
  const normalized = normalizeTitle(title);
  return patterns.some(pattern => normalized.includes(pattern));
}

/**
 * Check if task is a co-parent related task
 * @param {Object} task - Task object
 * @returns {boolean}
 */
export function isCoparentTask(task) {
  return matchesPattern(task?.title, TASK_PATTERNS.coparent);
}

/**
 * Check if task is a profile completion task
 * @param {Object} task - Task object
 * @returns {boolean}
 */
export function isProfileTask(task) {
  return matchesPattern(task?.title, TASK_PATTERNS.profile);
}

/**
 * Check if task is a children-related task
 * @param {Object} task - Task object
 * @returns {boolean}
 */
export function isChildrenTask(task) {
  return matchesPattern(task?.title, TASK_PATTERNS.children);
}

/**
 * Check if task is a welcome task
 * @param {Object} task - Task object
 * @returns {boolean}
 */
export function isWelcomeTask(task) {
  return matchesPattern(task?.title, TASK_PATTERNS.welcome);
}

/**
 * Check if task is an invite task
 * @param {Object} task - Task object
 * @returns {boolean}
 */
export function isInviteTask(task) {
  return matchesPattern(task?.title, TASK_PATTERNS.invite);
}

/**
 * Check if task is a "smart" task (special handling required)
 * @param {Object} task - Task object
 * @returns {boolean}
 */
export function isSmartTask(task) {
  if (!task || task.status === 'completed') return false;
  return isCoparentTask(task) || isProfileTask(task) || isChildrenTask(task);
}

/**
 * Check if task is invite-related (for filtering when connected)
 * @param {Object} task - Task object
 * @returns {boolean}
 */
export function isInviteRelatedTask(task) {
  const title = normalizeTitle(task?.title);
  return (
    title.includes('invite your co-parent') ||
    title.includes('add your co-parent') ||
    title.includes('add coparent')
  );
}

/**
 * Get task type as a string
 * @param {Object} task - Task object
 * @returns {string} Task type: 'welcome' | 'profile' | 'invite' | 'coparent' | 'children' | 'default'
 */
export function getTaskType(task) {
  if (isWelcomeTask(task)) return 'welcome';
  if (isProfileTask(task)) return 'profile';
  if (isInviteTask(task)) return 'invite';
  if (isCoparentTask(task)) return 'coparent';
  if (isChildrenTask(task)) return 'children';
  return 'default';
}

/**
 * Get display title for task (may differ from actual title)
 * @param {Object} task - Task object
 * @returns {string} Display title
 */
export function getTaskDisplayTitle(task) {
  if (!task) return '';

  if (isInviteTask(task) && task.status !== 'completed') {
    return 'Invite Someone';
  }

  if (isSmartTask(task)) {
    if (isCoparentTask(task)) return 'Add Co-parent';
    if (isProfileTask(task)) return 'Complete Profile';
    if (isChildrenTask(task)) return 'Add Children';
  }

  return task.title || '';
}

/**
 * Determine if task should show action arrow
 * @param {Object} task - Task object
 * @returns {boolean}
 */
export function shouldShowActionArrow(task) {
  return isSmartTask(task) || (isInviteTask(task) && task?.status !== 'completed');
}

/**
 * Filter tasks for dashboard display based on co-parent connection status
 * @param {Array} tasks - Array of tasks
 * @param {boolean} hasCoParentConnected - Whether co-parent is connected
 * @returns {Array} Filtered tasks
 */
export function filterTasksForDashboard(tasks, hasCoParentConnected) {
  if (!Array.isArray(tasks)) return [];
  if (!hasCoParentConnected) return tasks;

  return tasks.filter(task => {
    // Hide incomplete invite-related tasks when connected
    // Show completed ones for history
    return !isInviteRelatedTask(task) || task.status === 'completed';
  });
}
