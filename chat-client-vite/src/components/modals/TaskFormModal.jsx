import React from 'react';
import { apiPost } from '../../apiClient.js';

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
          setTaskFormData({
            title: data.task.title,
            description: data.task.description,
            status: data.task.status || 'open',
            priority: data.task.priority || 'medium',
            due_date: data.task.due_date || '',
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-2 sm:px-4 py-2 sm:py-4 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xl my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)]">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base sm:text-lg font-semibold">
            {editingTask ? 'Edit Task' : 'Add Task'}
          </h3>
          <button
            className="text-2xl leading-none text-gray-500 hover:text-gray-700 p-1 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
            onClick={handleClose}
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 min-h-0">
          {/* Mode Toggle - Only show when creating new task */}
          {!editingTask && (
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setTaskFormMode('manual')}
                className={`flex-1 px-3 py-2.5 sm:py-2 rounded-md text-sm font-semibold transition-all min-h-[40px] touch-manipulation ${
                  taskFormMode === 'manual'
                    ? 'bg-white text-[#275559] shadow-sm'
                    : 'text-gray-600 hover:text-[#275559]'
                }`}
              >
                Manual
              </button>
              <button
                onClick={() => setTaskFormMode('ai')}
                className={`flex-1 px-3 py-2.5 sm:py-2 rounded-md text-sm font-semibold transition-all min-h-[40px] touch-manipulation ${
                  taskFormMode === 'ai'
                    ? 'bg-white text-[#275559] shadow-sm'
                    : 'text-gray-600 hover:text-[#275559]'
                }`}
              >
                AI-Assisted
              </button>
            </div>
          )}

          {taskFormMode === 'ai' && !editingTask ? (
            /* AI Mode */
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Describe your task
                </label>
                <textarea
                  value={aiTaskDetails}
                  onChange={(e) => setAiTaskDetails(e.target.value)}
                  placeholder="e.g., Schedule pediatrician appointment for Emma next week"
                  className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-[#275559] text-sm min-h-[100px]"
                  rows={4}
                />
                <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                  AI will generate a structured task with title, description, priority, and due date.
                </p>
              </div>
              <button
                onClick={handleGenerateTask}
                disabled={!aiTaskDetails.trim() || isGeneratingTask}
                className="w-full bg-[#4DA8B0] text-white py-3 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-sm hover:bg-[#3d8a92] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
              >
                {isGeneratingTask ? (
                  <>
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate Task</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Manual Mode or Edit Mode */
            <div className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={taskFormData.title}
                  onChange={(e) =>
                    setTaskFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-[#275559] text-sm min-h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={taskFormData.description}
                  onChange={(e) =>
                    setTaskFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-[#275559] text-sm min-h-[80px]"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskFormData.priority}
                    onChange={(e) =>
                      setTaskFormData((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-[#275559] text-sm min-h-[44px]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskFormData.due_date || ''}
                    onChange={(e) =>
                      setTaskFormData((prev) => ({
                        ...prev,
                        due_date: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-[#275559] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  value={taskFormData.assigned_to || 'self'}
                  onChange={(e) =>
                    setTaskFormData((prev) => ({
                      ...prev,
                      assigned_to: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 sm:px-3 sm:py-2 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-[#275559] text-sm text-gray-900 min-h-[44px]"
                >
                  <option value="self">Self (me)</option>
                  <option value="">No one (unassigned)</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.contact_name} ({contact.relationship || 'Contact'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Add People for Context
                </label>
                <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                  {contacts.map((contact) => {
                    const isSelected = Array.isArray(taskFormData.related_people) && taskFormData.related_people.includes(contact.id.toString());
                    return (
                      <label key={contact.id} className="flex items-center gap-1.5 sm:gap-2 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const currentPeople = Array.isArray(taskFormData.related_people) ? taskFormData.related_people : [];
                            if (e.target.checked) {
                              setTaskFormData((prev) => ({
                                ...prev,
                                related_people: [...currentPeople, contact.id.toString()],
                              }));
                            } else {
                              setTaskFormData((prev) => ({
                                ...prev,
                                related_people: currentPeople.filter((id) => id !== contact.id.toString()),
                              }));
                            }
                          }}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-[#275559] border-gray-300 rounded focus:ring-[#275559] flex-shrink-0 touch-manipulation"
                        />
                        <span className="text-xs sm:text-sm text-gray-700 truncate">
                          {contact.contact_name} ({contact.relationship || 'Contact'})
                        </span>
                      </label>
                    );
                  })}
                  {contacts.length === 0 && (
                    <p className="text-[10px] sm:text-xs text-gray-500">No contacts available. Add contacts to assign tasks.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {taskFormMode === 'manual' || editingTask ? (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={onSave}
              disabled={!taskFormData.title.trim()}
              className="flex-1 bg-[#275559] text-white py-3 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-sm hover:bg-[#1f4447] transition-colors disabled:bg-gray-400 min-h-[44px] touch-manipulation"
            >
              {editingTask ? (taskFormData.title === 'Welcome to LiaiZen' ? 'OK' : 'Update') : 'Create'}
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-3 sm:px-4 sm:py-2.5 border-2 border-gray-300 rounded-lg sm:rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px] touch-manipulation"
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

