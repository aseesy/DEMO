import React from 'react';

/**
 * useTaskFormModal - Manages task form modal state and logic
 *
 * Encapsulates all state related to the task form modal:
 * - Form mode (manual vs AI)
 * - AI task generation state
 * - Task details input
 *
 * This hook owns the task form's business logic, following SRP.
 *
 * @returns {Object} Task form modal state and handlers
 * @returns {string} returns.taskFormMode - 'manual' or 'ai'
 * @returns {Function} returns.setTaskFormMode - Set form mode
 * @returns {string} returns.aiTaskDetails - AI-generated task details
 * @returns {Function} returns.setAiTaskDetails - Set AI task details
 * @returns {boolean} returns.isGeneratingTask - Whether task is being generated
 * @returns {Function} returns.setIsGeneratingTask - Set generation state
 */
export function useTaskFormModal() {
  const [taskFormMode, setTaskFormMode] = React.useState('manual'); // 'manual' or 'ai'
  const [aiTaskDetails, setAiTaskDetails] = React.useState('');
  const [isGeneratingTask, setIsGeneratingTask] = React.useState(false);

  return {
    taskFormMode,
    setTaskFormMode,
    aiTaskDetails,
    setAiTaskDetails,
    isGeneratingTask,
    setIsGeneratingTask,
  };
}
