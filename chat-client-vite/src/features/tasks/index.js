/**
 * Tasks Feature
 *
 * Package-by-feature: Everything related to Tasks lives here.
 * Delete this folder to remove the Tasks feature entirely.
 */

// Hooks
export { useTasks } from './useTasks.js';
export { useTaskFormModal } from './useTaskFormModal.js';

// Utilities
export { createTaskCollection } from './taskAbstraction.js';
export { getDefaultTaskFormData } from './taskHelpers.js';
export { filterTasksForDashboard, getTaskType } from './taskTypeDetection.js';

// Components
export { TaskCard } from './components/TaskCard.jsx';
export { TaskIcon } from './components/TaskIcon.jsx';
export { TaskFormModal } from './components/TaskFormModal.jsx';
