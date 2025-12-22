/**
 * Tasks Feature
 *
 * Package-by-feature: Everything related to Tasks lives here.
 * Delete this folder to remove the Tasks feature entirely.
 */

// Model (The Logic)
export { useTasks } from './model/useTasks.js';
export { useTaskFormModal } from './model/useTaskFormModal.js';
export { createTaskCollection } from './model/taskAbstraction.js';
export { getDefaultTaskFormData } from './model/taskHelpers.js';
export { filterTasksForDashboard, getTaskType } from './model/taskTypeDetection.js';

// Components (The UI Details)
export { TaskCard } from './components/TaskCard.jsx';
export { TaskIcon } from './components/TaskIcon.jsx';
export { TaskFormModal } from './components/TaskFormModal.jsx';
