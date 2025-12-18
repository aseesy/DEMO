import React from 'react';
import { UpdatesPanel } from '../components/UpdatesPanel.jsx';
import { CommunicationStatsWidget } from '../components/CommunicationStatsWidget.jsx';

/**
 * DashboardView - Main dashboard with tasks, updates, stats, and threads
 *
 * Extracted from ChatRoom.jsx for better code organization.
 */
export function DashboardView({
  username,
  hasCoParentConnected,
  tasks,
  isLoadingTasks,
  taskSearch,
  setTaskSearch,
  taskFilter,
  setTaskFilter,
  contacts,
  threads,
  selectedThreadId,
  setSelectedThreadId,
  setCurrentView,
  setShowInviteModal,
  setEditingTask,
  setShowWelcomeModal,
  setShowProfileTaskModal,
  setShowTaskForm,
  setTaskFormMode,
  setAiTaskDetails,
  setIsGeneratingTask,
  setTaskFormData,
  toggleTaskStatus,
  getThreadMessages,
}) {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Co-parent connection prompt - subtle banner pointing to tasks */}
      {!hasCoParentConnected && (
        <button
          onClick={() => setShowInviteModal(true)}
          className="w-full rounded-xl border-2 border-teal-400 bg-linear-to-r from-teal-50 to-emerald-50 px-5 py-4 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-teal-800">Invite Someone to Chat</h3>
                <p className="text-sm text-teal-600">Send an invite or enter a code to start communicating</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-teal-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      )}

      {/* Dashboard Grid: Updates and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Updates Section */}
        <UpdatesPanel
          username={username}
          setCurrentView={setCurrentView}
          onContactClick={(_contactName) => {
            setCurrentView('contacts');
          }}
        />

        {/* Tasks Section */}
        <div className="bg-white rounded-xl border-2 border-teal-light p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-teal-dark">
              Your Tasks
            </h2>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-4 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full px-3 py-2 pl-9 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 text-sm bg-white min-h-[36px] transition-all"
              />
              <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {taskSearch && (
                <button
                  onClick={() => setTaskSearch('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-medium p-1 rounded-lg hover:bg-gray-50 transition-all touch-manipulation"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setTaskFilter('open')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[32px] touch-manipulation ${taskFilter === 'open'
                  ? 'bg-teal-medium text-white shadow-sm hover:shadow-md'
                  : 'bg-white border-2 border-teal-light text-teal-medium hover:border-teal-medium hover:bg-teal-lightest'
                  }`}
              >
                Open
              </button>
              <button
                onClick={() => setTaskFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[32px] touch-manipulation ${taskFilter === 'completed'
                  ? 'bg-teal-medium text-white shadow-sm hover:shadow-md'
                  : 'bg-white border-2 border-teal-light text-teal-medium hover:border-teal-medium hover:bg-teal-lightest'
                  }`}
              >
                Completed
              </button>
              <button
                onClick={() => setTaskFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[32px] touch-manipulation ${taskFilter === 'all'
                  ? 'bg-teal-medium text-white shadow-sm hover:shadow-md'
                  : 'bg-white border-2 border-teal-light text-teal-medium hover:border-teal-medium hover:bg-teal-lightest'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setEditingTask(null);
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
                  setShowTaskForm(true);
                }}
                className="px-3 py-1.5 bg-teal-dark text-white rounded-lg text-xs font-semibold hover:bg-teal-darkest transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 min-h-[32px] whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            </div>
          </div>
          {isLoadingTasks ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-teal-light border-t-teal-medium" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-sm">
                {taskSearch || taskFilter !== 'open'
                  ? 'No tasks match your search or filter criteria.'
                  : 'No open tasks found. Create your first task to get started!'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  contacts={contacts}
                  setCurrentView={setCurrentView}
                  setEditingTask={setEditingTask}
                  setShowWelcomeModal={setShowWelcomeModal}
                  setShowProfileTaskModal={setShowProfileTaskModal}
                  setShowInviteModal={setShowInviteModal}
                  setShowTaskForm={setShowTaskForm}
                  setTaskFormData={setTaskFormData}
                  toggleTaskStatus={toggleTaskStatus}
                />
              ))}
            </div>
          )}
        </div>

        {/* Communication Stats Widget */}
        <div className="mt-4">
          <CommunicationStatsWidget username={username} />
        </div>

        {/* Threads Section */}
        <div className="bg-white rounded-2xl border-2 border-teal-light shadow-sm hover:shadow-md transition-shadow overflow-hidden mt-6 md:mt-8">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-teal-dark mb-1">
                  Threads
                </h2>
                <p className="text-sm text-gray-600">Organized conversation topics</p>
              </div>
              {threads.length > 0 && (
                <button
                  onClick={() => setCurrentView('chat')}
                  className="text-sm text-teal-medium hover:text-teal-dark font-semibold px-4 py-2 rounded-lg hover:bg-teal-lightest transition-colors"
                >
                  View All ({threads.length})
                </button>
              )}
            </div>

            {threads.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-600 text-base">
                  No conversation threads yet. Start a chat to create threads!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {threads.slice(0, 3).map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => {
                      setSelectedThreadId(thread.id);
                      setCurrentView('chat');
                    }}
                    className="p-4 border-2 border-teal-light rounded-xl hover:border-teal-medium hover:bg-teal-lightest transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white border-2 border-teal-light rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                        <svg className="w-5 h-5 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <h3 className="text-base font-semibold text-teal-dark truncate">
                            {thread.title}
                          </h3>
                          {thread.message_count > 0 && (
                            <span className="text-xs text-gray-500 font-medium shrink-0 bg-gray-100 px-2 py-1 rounded-lg">
                              {thread.message_count} {thread.message_count === 1 ? 'msg' : 'msgs'}
                            </span>
                          )}
                        </div>
                        {thread.last_message_at && (
                          <p className="text-xs text-gray-500">
                            {new Date(thread.last_message_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TaskCard - Individual task card component
 */
function TaskCard({
  task,
  contacts,
  setCurrentView,
  setEditingTask,
  setShowWelcomeModal,
  setShowProfileTaskModal,
  setShowInviteModal,
  setShowTaskForm,
  setTaskFormData,
  toggleTaskStatus,
}) {
  const titleLower = (task.title || '').toLowerCase().trim();
  const isCoparentTask =
    titleLower.includes('add your co-parent') ||
    titleLower.includes('add coparent');
  const isProfileTask =
    titleLower.includes('complete your profile') ||
    titleLower.includes('complete profile');
  const isChildrenTask =
    titleLower.includes('add your children') ||
    titleLower.includes('add children');
  const isWelcomeTask = titleLower.includes('welcome');
  const isSmartTask =
    task.status !== 'completed' &&
    (isCoparentTask || isProfileTask || isChildrenTask);
  const isInviteTask = titleLower.includes('invite your co-parent');

  // Get icon based on task content
  const getTaskIcon = () => {
    const iconSize = "w-full h-full";
    if (isWelcomeTask) {
      return (
        <svg className={`${iconSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    }
    if (isProfileTask) {
      return (
        <svg className={`${iconSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    }
    if (isInviteTask) {
      return (
        <svg className={`${iconSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
    if (isCoparentTask) {
      return (
        <svg className={`${iconSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    }
    if (isChildrenTask) {
      return (
        <svg className={`${iconSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    }
    // Default task icon
    return (
      <svg className={`${iconSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    );
  };

  const handleTaskClick = () => {
    // Welcome task: show static info modal
    if (task.title === 'Welcome to LiaiZen') {
      setEditingTask(task);
      setShowWelcomeModal(true);
      return;
    }

    // Profile task: show profile task modal
    if (isProfileTask) {
      setEditingTask(task);
      setShowProfileTaskModal(true);
      return;
    }

    // Invite task opens InviteTaskModal
    if ((isCoparentTask || isInviteTask) && task.status !== 'completed') {
      setShowInviteModal(true);
      return;
    }

    if (isSmartTask) {
      if (isChildrenTask) {
        setCurrentView('contacts');
      }
      return;
    }

    // Regular task: open edit modal
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority || 'medium',
      due_date: task.due_date || '',
      assigned_to: task.assigned_to || 'self',
      related_people: Array.isArray(task.related_people) ? task.related_people : [],
    });
    setShowTaskForm(true);
  };

  return (
    <div
      onClick={handleTaskClick}
      className={`flex items-start sm:items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-lg cursor-pointer transition-all touch-manipulation ${task.status === 'completed'
        ? 'bg-gray-50 opacity-70 border-2 border-gray-200'
        : 'bg-white hover:shadow-md active:scale-[0.98] border-2 border-teal-light hover:border-teal-medium shadow-sm'
        }`}
    >
      {/* Task Icon/Status Circle */}
      <div className="shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskStatus(task);
          }}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all touch-manipulation shadow-sm hover:shadow-md ${task.status === 'completed' ? 'bg-teal-medium' : 'bg-teal-medium'
            }`}
        >
          {task.status === 'completed' ? (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
              {getTaskIcon()}
            </div>
          )}
        </button>
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 mb-0.5">
          <h3
            className={`text-xs sm:text-sm font-semibold text-teal-dark truncate ${task.status === 'completed'
              ? 'line-through text-gray-400'
              : ''
              }`}
          >
            {(() => {
              if (isInviteTask && task.status !== 'completed') {
                return 'Invite Someone';
              }
              if (isSmartTask) {
                if (isCoparentTask) return 'Add Co-parent';
                if (isProfileTask) return 'Complete Profile';
                if (isChildrenTask) return 'Add Children';
              }
              return task.title;
            })()}
          </h3>
          {/* Show arrow for actionable tasks */}
          {(isSmartTask || (isInviteTask && task.status !== 'completed')) && (
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-medium shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </div>
        {task.description && (
          <p
            className={`text-xs text-gray-600 line-clamp-2 wrap-break-word leading-relaxed ${task.status === 'completed'
              ? 'line-through text-gray-400'
              : ''
              }`}
          >
            {task.description}
          </p>
        )}
        {/* Assigned and Related People */}
        {(task.assigned_to || (Array.isArray(task.related_people) && task.related_people.length > 0)) && (
          <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
            {task.assigned_to && (() => {
              if (task.assigned_to === 'self') {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white text-teal-medium rounded text-[10px] font-medium border border-teal-light">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Assigned: </span>
                    Self
                  </span>
                );
              }
              const assignedContact = contacts.find(c => c.id.toString() === task.assigned_to.toString());
              return assignedContact ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white text-teal-medium rounded text-[10px] font-medium border border-teal-light">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">Assigned: </span>
                  {assignedContact.contact_name}
                </span>
              ) : null;
            })()}
            {Array.isArray(task.related_people) && task.related_people.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-white text-teal-medium rounded text-[10px] font-medium border border-teal-light">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {task.related_people.length} {task.related_people.length === 1 ? 'person' : 'people'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardView;
