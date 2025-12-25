import React from 'react';
import { apiPost } from '../../../apiClient.js';
import { Button, Input, Textarea, Select } from '../../../components/ui';

// Onboarding task titles that should not be deletable
const PROTECTED_TASK_TITLES = [
  'Welcome to LiaiZen',
  'Complete Your Profile',
  'Add Your Co-parent',
  'Add Your Children',
  'Invite Your Co-Parent',
  'Install LiaiZen on Your Phone',
];

export function TaskFormModal({
  showTaskForm,
  editingTask,
  taskFormMode,
  setTaskFormMode,
  aiTaskDetails,
  setAiTaskDetails,
  isGeneratingTask,
  setIsGeneratingTask,
  taskFormData,
  setTaskFormData,
  contacts,
  username,
  onClose,
  onSave,
  onDelete,
}) {
  if (!showTaskForm) return null;

  const handleClose = () => {
    setTaskFormMode('manual');
    setAiTaskDetails('');
    setIsGeneratingTask(false);
    setTaskFormData({
      title: '',
      description: '',
      status: 'open',
      priority: 'medium',
      due_date: '',
      assigned_to: 'self',
      related_people: [],
    });
    onClose();
  };

  const handleGenerateTask = async () => {
    if (!aiTaskDetails.trim() || !username) return;
    setIsGeneratingTask(true);
    try {
      const response = await apiPost('/api/tasks/generate', {
        username,
        taskDetails: aiTaskDetails,
      });
      if (response.ok) {
        const data = await response.json();
        if (data.task) {
          // Destructure at boundary - don't reach inside data.task multiple times
          const {
            title,
            description,
            status = 'open',
            priority = 'medium',
            due_date = '',
          } = data.task;

          setTaskFormData({
            title,
            description,
            status,
            priority,
            due_date,
            assigned_to: 'self',
            related_people: [],
          });
          setTaskFormMode('manual');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate task' }));
        alert(errorData.error || 'Failed to generate task');
      }
    } catch (err) {
      console.error('Error generating task:', err);
      alert('Failed to generate task. Please try again.');
    } finally {
      setIsGeneratingTask(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 overflow-y-auto overflow-x-hidden"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <div
        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xl flex flex-col my-auto"
        style={{
          maxHeight:
            'calc(100dvh - max(2rem, env(safe-area-inset-top)) - max(2rem, env(safe-area-inset-bottom)))',
          maxWidth:
            'calc(100vw - max(2rem, env(safe-area-inset-left)) - max(2rem, env(safe-area-inset-right)))',
        }}
      >
        {/* Header - Always visible */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base sm:text-lg font-semibold">
            {editingTask ? 'Edit Task' : 'Add Task'}
          </h3>
          <Button
            variant="ghost"
            size="small"
            className="text-2xl leading-none text-gray-500 hover:text-teal-medium p-1 min-w-[36px]"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </Button>
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 min-h-0">
          {/* Mode Toggle - Only show when creating new task */}
          {!editingTask && (
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
              <Button
                onClick={() => setTaskFormMode('manual')}
                variant={taskFormMode === 'manual' ? 'tertiary' : 'ghost'}
                size="small"
                className={`flex-1 py-2.5 sm:py-2 text-sm ${
                  taskFormMode === 'manual'
                    ? 'bg-white text-teal-medium shadow-sm'
                    : 'text-gray-600 hover:text-teal-medium'
                }`}
              >
                Manual
              </Button>
              <Button
                onClick={() => setTaskFormMode('ai')}
                variant={taskFormMode === 'ai' ? 'tertiary' : 'ghost'}
                size="small"
                className={`flex-1 py-2.5 sm:py-2 text-sm ${
                  taskFormMode === 'ai'
                    ? 'bg-white text-teal-medium shadow-sm'
                    : 'text-gray-600 hover:text-teal-medium'
                }`}
              >
                AI-Assisted
              </Button>
            </div>
          )}

          {taskFormMode === 'ai' && !editingTask ? (
            /* AI Mode */
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-teal-medium mb-1.5 sm:mb-2">
                  Describe your task
                </label>
                <textarea
                  value={aiTaskDetails}
                  onChange={e => setAiTaskDetails(e.target.value)}
                  placeholder="e.g., Schedule pediatrician appointment for Emma next week"
                  className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-teal-medium text-sm min-h-[100px]"
                  rows={4}
                />
                <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                  AI will generate a structured task with title, description, priority, and due
                  date.
                </p>
              </div>
              <Button
                onClick={handleGenerateTask}
                disabled={!aiTaskDetails.trim() || isGeneratingTask}
                loading={isGeneratingTask}
                variant="secondary"
                size="medium"
                fullWidth
                className="py-3 sm:py-2.5 text-sm"
                icon={
                  !isGeneratingTask && (
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  )
                }
              >
                Generate Task
              </Button>
            </div>
          ) : (
            /* Manual Mode or Edit Mode */
            <div className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-teal-medium mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={taskFormData.title}
                  onChange={e =>
                    setTaskFormData(prev => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-teal-medium text-sm min-h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-teal-medium mb-1">
                  Description
                </label>
                <textarea
                  value={taskFormData.description}
                  onChange={e =>
                    setTaskFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-teal-medium text-sm min-h-[80px]"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-teal-medium mb-1">
                    Priority
                  </label>
                  <select
                    value={taskFormData.priority}
                    onChange={e =>
                      setTaskFormData(prev => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-teal-medium text-sm min-h-[44px]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-teal-medium mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskFormData.due_date || ''}
                    onChange={e =>
                      setTaskFormData(prev => ({
                        ...prev,
                        due_date: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-teal-medium text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-teal-medium mb-1">
                  Assign To
                </label>
                <select
                  value={taskFormData.assigned_to || 'self'}
                  onChange={e =>
                    setTaskFormData(prev => ({
                      ...prev,
                      assigned_to: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-teal-medium text-sm text-gray-900 min-h-[44px]"
                >
                  <option value="self">Self (me)</option>
                  <option value="">No one (unassigned)</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.contact_name} ({contact.relationship || 'Contact'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-teal-medium mb-1">
                  Add People for Context
                </label>
                <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                  {contacts.map(contact => {
                    const isSelected =
                      Array.isArray(taskFormData.related_people) &&
                      taskFormData.related_people.includes(contact.id.toString());
                    return (
                      <label
                        key={contact.id}
                        className="flex items-center gap-1.5 sm:gap-2 cursor-pointer py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            const currentPeople = Array.isArray(taskFormData.related_people)
                              ? taskFormData.related_people
                              : [];
                            if (e.target.checked) {
                              setTaskFormData(prev => ({
                                ...prev,
                                related_people: [...currentPeople, contact.id.toString()],
                              }));
                            } else {
                              setTaskFormData(prev => ({
                                ...prev,
                                related_people: currentPeople.filter(
                                  id => id !== contact.id.toString()
                                ),
                              }));
                            }
                          }}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-teal-medium border-gray-300 rounded focus:ring-[#4DA8B0] flex-shrink-0 touch-manipulation"
                        />
                        <span className="text-xs sm:text-sm text-teal-medium truncate">
                          {contact.contact_name} ({contact.relationship || 'Contact'})
                        </span>
                      </label>
                    );
                  })}
                  {contacts.length === 0 && (
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      No contacts available. Add contacts to assign tasks.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {taskFormMode === 'manual' || editingTask ? (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex gap-2 sm:gap-3 flex-shrink-0 bg-white sticky bottom-0">
            <Button
              onClick={onSave}
              disabled={!taskFormData.title.trim()}
              variant="secondary"
              className="flex-1"
            >
              {editingTask
                ? taskFormData.title === 'Welcome to LiaiZen'
                  ? 'OK'
                  : 'Update'
                : 'Create'}
            </Button>
            <Button onClick={handleClose} variant="tertiary">
              Cancel
            </Button>
            {/* Delete button - only for existing user-created tasks */}
            {editingTask && onDelete && !PROTECTED_TASK_TITLES.includes(editingTask.title) && (
              <Button
                onClick={() => onDelete(editingTask)}
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                aria-label="Delete task"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
