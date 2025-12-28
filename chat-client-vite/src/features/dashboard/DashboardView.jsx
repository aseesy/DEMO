/**
 * DashboardView - Main dashboard with tasks, updates, stats, and threads
 *
 * Refactored to use grouped props for better organization.
 * Uses extracted TaskCard component for individual task rendering.
 */

import React from 'react';
import { UpdatesPanel } from '../updates/UpdatesPanel.jsx';
import { CommunicationStatsWidget } from './components/CommunicationStatsWidget.jsx';
import { TaskCard, filterTasksForDashboard, getDefaultTaskFormData } from '../tasks';

/**
 * Thread category configuration with colors and icons
 */
const THREAD_CATEGORIES = {
  schedule: { label: 'Schedule', color: 'bg-blue-100 text-blue-700', icon: '📅' },
  medical: { label: 'Medical', color: 'bg-red-100 text-red-700', icon: '🏥' },
  education: { label: 'Education', color: 'bg-purple-100 text-purple-700', icon: '📚' },
  finances: { label: 'Finances', color: 'bg-green-100 text-green-700', icon: '💰' },
  activities: { label: 'Activities', color: 'bg-orange-100 text-orange-700', icon: '⚽' },
  travel: { label: 'Travel', color: 'bg-cyan-100 text-cyan-700', icon: '✈️' },
  safety: { label: 'Safety', color: 'bg-yellow-100 text-yellow-800', icon: '🛡️' },
  logistics: { label: 'Logistics', color: 'bg-gray-100 text-gray-700', icon: '📦' },
  'co-parenting': { label: 'Co-Parenting', color: 'bg-teal-100 text-teal-700', icon: '🤝' },
};

/**
 * Category badge component for threads
 */
function CategoryBadge({ category }) {
  const config = THREAD_CATEGORIES[category] || THREAD_CATEGORIES.logistics;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

/**
 * DashboardView component
 *
 * Props have been grouped into logical objects:
 * - taskState: Task list state (tasks, loading, search, filter)
 * - taskHandlers: Task action handlers
 * - modalHandlers: Modal control handlers
 * - threadState: Thread-related state
 *
 * @param {Object} props
 * @param {string} props.username - Current user's username
 * @param {boolean} props.hasCoParentConnected - Whether co-parent is connected
 * @param {boolean} props.isCheckingCoParent - Whether we're still checking co-parent connection status
 * @param {Array} props.contacts - List of contacts
 * @param {Function} props.setCurrentView - View navigation handler
 * @param {Object} props.taskState - Task list state
 * @param {Object} props.taskHandlers - Task action handlers
 * @param {Object} props.modalHandlers - Modal control handlers
 * @param {Object} props.threadState - Thread-related state
 */
export function DashboardView({
  username,
  hasCoParentConnected,
  isCheckingCoParent = false,
  contacts,
  setCurrentView,
  taskState,
  taskHandlers,
  modalHandlers,
  threadState,
}) {
  // Destructure task state
  const { tasks, isLoadingTasks, taskSearch, taskFilter } = taskState;
  const { setTaskSearch, setTaskFilter } = taskState;

  // Destructure task handlers
  const {
    setEditingTask,
    setShowTaskForm,
    setTaskFormMode,
    setAiTaskDetails,
    setIsGeneratingTask,
    setTaskFormData,
    toggleTaskStatus,
  } = taskHandlers;

  // Destructure modal handlers
  const { setShowInviteModal, setShowWelcomeModal, setShowProfileTaskModal } = modalHandlers;

  // Destructure thread state
  const { threads, setSelectedThreadId } = threadState;

  const handleAddTask = () => {
    setEditingTask(null);
    setTaskFormMode('manual');
    setAiTaskDetails('');
    setIsGeneratingTask(false);
    setTaskFormData(getDefaultTaskFormData());
    setShowTaskForm(true);
  };

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Co-parent connection prompt - only show after checking is complete */}
      {!isCheckingCoParent && !hasCoParentConnected && (
        <InvitePromptBanner onInvite={() => setShowInviteModal(true)} />
      )}

      {/* Dashboard Grid: Updates and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Updates Section */}
        <UpdatesPanel
          username={username}
          setCurrentView={setCurrentView}
          onContactClick={() => setCurrentView('contacts')}
        />

        {/* Tasks Section */}
        <TasksSection
          tasks={tasks}
          isLoadingTasks={isLoadingTasks}
          taskSearch={taskSearch}
          setTaskSearch={setTaskSearch}
          taskFilter={taskFilter}
          setTaskFilter={setTaskFilter}
          hasCoParentConnected={hasCoParentConnected}
          contacts={contacts}
          setCurrentView={setCurrentView}
          setEditingTask={setEditingTask}
          setShowWelcomeModal={setShowWelcomeModal}
          setShowProfileTaskModal={setShowProfileTaskModal}
          setShowInviteModal={setShowInviteModal}
          setShowTaskForm={setShowTaskForm}
          setTaskFormData={setTaskFormData}
          toggleTaskStatus={toggleTaskStatus}
          onAddTask={handleAddTask}
        />

        {/* Communication Stats Widget */}
        <div className="mt-3">
          <CommunicationStatsWidget username={username} />
        </div>

        {/* Threads Section */}
        <ThreadsSection
          threads={threads}
          setSelectedThreadId={setSelectedThreadId}
          setCurrentView={setCurrentView}
          analyzeConversation={threadState.analyzeConversation}
          isLoadingThreads={threadState.isLoadingThreads}
          getThreadMessages={threadState.getThreadMessages}
          selectedThreadId={threadState.selectedThreadId}
          threadMessages={threadState.threadMessages}
          isLoadingThreadMessages={threadState.isLoadingThreadMessages}
        />
      </div>
    </div>
  );
}

/**
 * Invite prompt banner component
 */
function InvitePromptBanner({ onInvite }) {
  return (
    <button
      onClick={onInvite}
      className="w-full rounded-xl border-2 border-teal-400 bg-linear-to-r from-teal-50 to-emerald-50 px-5 py-4 shadow-sm hover:shadow-md transition-all text-left group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-teal-800">Invite Someone to Chat</h3>
            <p className="text-sm text-teal-600">
              Send an invite or enter a code to start communicating
            </p>
          </div>
        </div>
        <svg
          className="w-5 h-5 text-teal-500 group-hover:translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

/**
 * Tasks section component
 */
function TasksSection({
  tasks,
  isLoadingTasks,
  taskSearch,
  setTaskSearch,
  taskFilter,
  setTaskFilter,
  hasCoParentConnected,
  contacts,
  setCurrentView,
  setEditingTask,
  setShowWelcomeModal,
  setShowProfileTaskModal,
  setShowInviteModal,
  setShowTaskForm,
  setTaskFormData,
  toggleTaskStatus,
  onAddTask,
}) {
  return (
    <div className="bg-white rounded-xl border-2 border-teal-light p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3">
        <h2 className="text-lg md:text-xl font-semibold text-teal-dark">Your Tasks</h2>
      </div>

      {/* Search and Filter Controls */}
      <TaskFilters
        taskSearch={taskSearch}
        setTaskSearch={setTaskSearch}
        taskFilter={taskFilter}
        setTaskFilter={setTaskFilter}
        onAddTask={onAddTask}
      />

      {/* Task List */}
      <TaskList
        tasks={tasks}
        isLoadingTasks={isLoadingTasks}
        taskSearch={taskSearch}
        taskFilter={taskFilter}
        hasCoParentConnected={hasCoParentConnected}
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
    </div>
  );
}

/**
 * Task filter controls
 */
function TaskFilters({ taskSearch, setTaskSearch, taskFilter, setTaskFilter, onAddTask }) {
  const filterButtons = [
    { value: 'open', label: 'Open' },
    { value: 'completed', label: 'Completed' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="mb-3 space-y-2">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={taskSearch}
          onChange={e => setTaskSearch(e.target.value)}
          placeholder="Search tasks..."
          className="w-full px-3 py-2 pl-9 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 text-sm bg-white min-h-[36px] transition-all"
        />
        <svg
          className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {taskSearch && (
          <button
            onClick={() => setTaskSearch('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-medium p-1 rounded-lg hover:bg-gray-50 transition-all touch-manipulation"
            aria-label="Clear search"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterButtons.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTaskFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[32px] touch-manipulation ${
              taskFilter === value
                ? 'bg-teal-medium text-white shadow-sm hover:shadow-md'
                : 'bg-white border-2 border-teal-light text-teal-medium hover:border-teal-medium hover:bg-teal-lightest'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={onAddTask}
          className="px-3 py-1.5 bg-teal-dark text-white rounded-lg text-xs font-semibold hover:bg-teal-darkest transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 min-h-[32px] whitespace-nowrap"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>
    </div>
  );
}

/**
 * Task list display
 */
function TaskList({
  tasks,
  isLoadingTasks,
  taskSearch,
  taskFilter,
  hasCoParentConnected,
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
  if (isLoadingTasks) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-teal-light border-t-teal-medium" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 text-sm">
          {taskSearch || taskFilter !== 'open'
            ? 'No tasks match your search or filter criteria.'
            : 'No open tasks found. Create your first task to get started!'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filterTasksForDashboard(tasks, hasCoParentConnected).map(task => (
        <TaskCard
          key={task.id}
          task={task}
          contacts={contacts}
          onNavigate={setCurrentView}
          onEditTask={setEditingTask}
          onShowWelcomeModal={() => setShowWelcomeModal(true)}
          onShowProfileModal={() => setShowProfileTaskModal(true)}
          onShowInviteModal={() => setShowInviteModal(true)}
          onShowTaskForm={taskToEdit => {
            setTaskFormData({
              title: taskToEdit.title,
              description: taskToEdit.description || '',
              status: taskToEdit.status,
              priority: taskToEdit.priority || 'medium',
              due_date: taskToEdit.due_date || '',
              assigned_to: taskToEdit.assigned_to || 'self',
              related_people: Array.isArray(taskToEdit.related_people)
                ? taskToEdit.related_people
                : [],
            });
            setShowTaskForm(true);
          }}
          onToggleStatus={toggleTaskStatus}
        />
      ))}
    </div>
  );
}

/**
 * Threads section component
 */
function ThreadsSection({
  threads,
  setSelectedThreadId,
  setCurrentView,
  analyzeConversation,
  isLoadingThreads,
  getThreadMessages,
  selectedThreadId,
  threadMessages,
  isLoadingThreadMessages,
}) {
  const [expandedThreadId, setExpandedThreadId] = React.useState(null);

  const handleThreadClick = threadId => {
    if (expandedThreadId === threadId) {
      // Collapse if already expanded
      setExpandedThreadId(null);
      setSelectedThreadId(null);
    } else {
      // Expand and load messages
      setExpandedThreadId(threadId);
      setSelectedThreadId(threadId);
      if (getThreadMessages) {
        getThreadMessages(threadId);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-teal-light shadow-sm hover:shadow-md transition-shadow overflow-hidden mt-4 md:mt-6">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-teal-dark mb-1">Conversations</h2>
            <p className="text-sm text-gray-600">Recent discussion threads</p>
          </div>
          {threads.length > 0 && (
            <button
              onClick={() => setCurrentView('chat')}
              className="text-sm text-teal-medium hover:text-teal-dark font-semibold px-4 py-2 rounded-lg hover:bg-teal-lightest transition-colors"
            >
              Go to Chat
            </button>
          )}
        </div>

        {threads.length === 0 ? (
          <EmptyThreadsState onAnalyze={analyzeConversation} isLoading={isLoadingThreads} />
        ) : (
          <div className="space-y-2">
            {threads.slice(0, 5).map(thread => (
              <div key={thread.id}>
                <ThreadCard
                  thread={thread}
                  isExpanded={expandedThreadId === thread.id}
                  onClick={() => handleThreadClick(thread.id)}
                />
                {/* Inline thread messages */}
                {expandedThreadId === thread.id && (
                  <ThreadMessagesInline
                    messages={threadMessages[thread.id] || []}
                    isLoading={isLoadingThreadMessages}
                    onClose={() => {
                      setExpandedThreadId(null);
                      setSelectedThreadId(null);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Empty threads state
 */
function EmptyThreadsState({ onAnalyze, isLoading }) {
  return (
    <div className="text-center py-8">
      <svg
        className="w-16 h-16 text-gray-300 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {isLoading ? (
        <>
          <p className="text-gray-600 text-base mb-4">
            Automatically analyzing your conversation history to organize it into threads...
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-light text-teal-dark rounded-lg text-sm font-semibold">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-teal-dark border-t-transparent" />
            Analyzing conversation...
          </div>
        </>
      ) : (
        <>
          <p className="text-gray-600 text-base mb-4">
            No conversation threads yet. Analysis runs automatically, or you can trigger it manually
            below.
          </p>
          {onAnalyze && (
            <button
              onClick={onAnalyze}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-medium text-white rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Analyze Conversation History
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Thread card component
 */
function ThreadCard({ thread, onClick, isExpanded }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-2 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md ${
        isExpanded
          ? 'border-teal-medium bg-teal-lightest'
          : 'border-teal-light hover:border-teal-medium hover:bg-teal-lightest'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isExpanded
              ? 'bg-teal-medium text-white'
              : 'bg-white border-2 border-teal-light text-teal-medium'
          }`}
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="text-base font-semibold text-teal-dark truncate">{thread.title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              {thread.message_count > 0 && (
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-lg">
                  {thread.message_count} {thread.message_count === 1 ? 'msg' : 'msgs'}
                </span>
              )}
              <svg
                className={`w-4 h-4 text-teal-medium transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {/* Category badge and date */}
          <div className="flex items-center gap-2 flex-wrap">
            {thread.category && <CategoryBadge category={thread.category} />}
            {thread.last_message_at && (
              <span className="text-xs text-gray-500">
                {new Date(thread.last_message_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline thread messages display
 */
function ThreadMessagesInline({ messages, isLoading, onClose }) {
  if (isLoading) {
    return (
      <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center justify-center py-4">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-teal-light border-t-teal-medium" />
          <span className="ml-2 text-sm text-gray-600">Loading messages...</span>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-sm text-gray-500 text-center">No messages in this conversation yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-2 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      <div className="max-h-64 overflow-y-auto p-3 space-y-2">
        {messages.slice(-10).map((msg, idx) => (
          <div key={msg.id || idx} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-teal-700">
                {(msg.username || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-teal-dark">
                  {msg.username || 'User'}
                </span>
                <span className="text-xs text-gray-400">
                  {msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>
              <p className="text-sm text-gray-700 break-words">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-gray-200 bg-white flex justify-end">
        <button
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
          className="text-xs text-gray-500 hover:text-teal-dark px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/**
 * Legacy prop adapter for backwards compatibility
 *
 * This wrapper converts the old individual props format to the new grouped format.
 * Use DashboardView directly with grouped props for new code.
 */
export function DashboardViewLegacy({
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
  // Group task state
  const taskState = {
    tasks,
    isLoadingTasks,
    taskSearch,
    setTaskSearch,
    taskFilter,
    setTaskFilter,
  };

  // Group task handlers
  const taskHandlers = {
    setEditingTask,
    setShowTaskForm,
    setTaskFormMode,
    setAiTaskDetails,
    setIsGeneratingTask,
    setTaskFormData,
    toggleTaskStatus,
  };

  // Group modal handlers
  const modalHandlers = {
    setShowInviteModal,
    setShowWelcomeModal,
    setShowProfileTaskModal,
  };

  // Group thread state
  const threadState = {
    threads,
    selectedThreadId,
    setSelectedThreadId,
    getThreadMessages,
  };

  return (
    <DashboardView
      username={username}
      hasCoParentConnected={hasCoParentConnected}
      contacts={contacts}
      setCurrentView={setCurrentView}
      taskState={taskState}
      taskHandlers={taskHandlers}
      modalHandlers={modalHandlers}
      threadState={threadState}
    />
  );
}

export default DashboardViewLegacy;
