import React from 'react';
import { TaskIcon } from './TaskIcon.jsx';
import { IOSInstallGuide } from '../../pwa/IOSInstallGuide.jsx';
import {
  isCoparentTask,
  isProfileTask,
  isChildrenTask,
  isInviteTask,
  isSmartTask,
  isPWAInstallTask,
  getTaskDisplayTitle,
  shouldShowActionArrow,
} from '../model/taskTypeDetection.js';

/**
 * TaskCard - Individual task card component
 * Single responsibility: Render a task with appropriate styling and handle click actions
 */
export function TaskCard({
  task,
  contacts,
  onNavigate,
  onEditTask,
  onShowWelcomeModal,
  onShowProfileModal,
  onShowInviteModal,
  onShowTaskForm,
  onToggleStatus,
}) {
  const [isInstalling, setIsInstalling] = React.useState(false);
  const [showIOSGuide, setShowIOSGuide] = React.useState(false);

  // Get PWA state from window (set by App.jsx via usePWA hook)
  const pwa = window.liaizenPWA || {};
  const { isInstallable, isInstalled, showInstallPrompt } = pwa;

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handlePWAInstall = async e => {
    e.stopPropagation();

    if (!showInstallPrompt) {
      // Show platform-specific instructions
      if (isIOS) {
        setShowIOSGuide(true);
      } else {
        alert(
          '📲 Install LiaiZen:\n\n' +
            'Android: Tap menu (⋮) → "Install app" or "Add to Home Screen"\n' +
            'Desktop: Look for install icon (⊕) in the address bar'
        );
      }
      return;
    }

    setIsInstalling(true);
    try {
      const result = await showInstallPrompt();
      if (result) {
        // Mark task as completed after successful install
        onToggleStatus(task);
      }
    } catch (error) {
      console.error('[TaskCard] PWA install error:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleTaskClick = () => {
    // PWA install task: trigger install/instructions directly
    if (isPWAInstallTask(task) && task.status !== 'completed') {
      handlePWAInstall({ stopPropagation: () => {} });
      return;
    }

    // Welcome task: show static info modal
    if (task.title === 'Welcome to LiaiZen') {
      onEditTask(task);
      onShowWelcomeModal();
      return;
    }

    // Profile task: show profile task modal
    if (isProfileTask(task)) {
      onEditTask(task);
      onShowProfileModal();
      return;
    }

    // Invite task opens InviteTaskModal
    if ((isCoparentTask(task) || isInviteTask(task)) && task.status !== 'completed') {
      onShowInviteModal();
      return;
    }

    // Smart task navigation
    if (isSmartTask(task)) {
      if (isChildrenTask(task)) {
        onNavigate('contacts');
      }
      return;
    }

    // Regular task: open edit form
    onEditTask(task);
    onShowTaskForm(task);
  };

  const handleStatusToggle = e => {
    e.stopPropagation();
    onToggleStatus(task);
  };

  const displayTitle = getTaskDisplayTitle(task);
  const showArrow = shouldShowActionArrow(task);
  const isCompleted = task.status === 'completed';

  return (
    <div
      onClick={handleTaskClick}
      className={`flex items-start sm:items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-lg cursor-pointer transition-all touch-manipulation ${
        isCompleted
          ? 'bg-gray-50 opacity-70 border-2 border-gray-200'
          : 'bg-white hover:shadow-md active:scale-[0.98] border-2 border-teal-light hover:border-teal-medium shadow-sm'
      }`}
    >
      {/* Task Icon/Status Circle */}
      <div className="shrink-0">
        <button
          onClick={handleStatusToggle}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all touch-manipulation shadow-sm hover:shadow-md bg-teal-medium"
        >
          {isCompleted ? (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
              <TaskIcon task={task} />
            </div>
          )}
        </button>
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 mb-0.5">
          <h3
            className={`text-xs sm:text-sm font-semibold text-teal-dark truncate ${
              isCompleted ? 'line-through text-gray-400' : ''
            }`}
          >
            {displayTitle}
          </h3>
          {/* Show arrow for actionable tasks */}
          {showArrow && (
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-medium shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>

        {task.description && (
          <p
            className={`text-xs text-gray-600 line-clamp-2 break-words leading-relaxed ${
              isCompleted ? 'line-through text-gray-400' : ''
            }`}
          >
            {task.description}
          </p>
        )}

        {/* Due Date Display */}
        {task.due_date && (
          <DueDateBadge dueDate={task.due_date} isCompleted={isCompleted} />
        )}

        {/* PWA Install Button - shown for PWA install task when not completed */}
        {isPWAInstallTask(task) && !isCompleted && (
          <div className="mt-3">
            <button
              onClick={handlePWAInstall}
              disabled={isInstalling}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                isInstalled
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : isInstallable
                    ? 'bg-teal-medium text-white hover:bg-teal-dark active:scale-95 shadow-sm hover:shadow-md'
                    : 'bg-teal-light text-teal-dark hover:bg-teal-medium hover:text-white'
              }`}
            >
              {isInstalling ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Installing...
                </>
              ) : isInstalled ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Installed
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  {isInstallable
                    ? 'Install App'
                    : isIOS
                      ? 'Tap for Instructions'
                      : 'How to Install'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Assigned and Related People */}
        <TaskAssignmentBadges task={task} contacts={contacts} />
      </div>

      {/* iOS Install Guide Modal */}
      <IOSInstallGuide isOpen={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
    </div>
  );
}

/**
 * TaskAssignmentBadges - Shows assignment and related people badges
 * Single responsibility: Display task assignment metadata
 */
function TaskAssignmentBadges({ task, contacts }) {
  const hasAssignment = task.assigned_to;
  const hasRelatedPeople = Array.isArray(task.related_people) && task.related_people.length > 0;

  if (!hasAssignment && !hasRelatedPeople) return null;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
      {hasAssignment && <AssignedToBadge assignedTo={task.assigned_to} contacts={contacts} />}
      {hasRelatedPeople && <RelatedPeopleBadge count={task.related_people.length} />}
    </div>
  );
}

/**
 * AssignedToBadge - Shows who the task is assigned to
 */
function AssignedToBadge({ assignedTo, contacts }) {
  if (assignedTo === 'self') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-white text-teal-medium rounded text-[10px] font-medium border border-teal-light">
        <CheckCircleIcon />
        <span className="hidden sm:inline">Assigned: </span>
        Self
      </span>
    );
  }

  const assignedContact = contacts?.find(c => c.id?.toString() === assignedTo?.toString());
  if (!assignedContact) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white text-teal-medium rounded text-[10px] font-medium border border-teal-light">
      <CheckCircleIcon />
      <span className="hidden sm:inline">Assigned: </span>
      {assignedContact.contact_name}
    </span>
  );
}

/**
 * RelatedPeopleBadge - Shows count of related people
 */
function RelatedPeopleBadge({ count }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white text-teal-medium rounded text-[10px] font-medium border border-teal-light">
      <PeopleIcon />
      {count} {count === 1 ? 'person' : 'people'}
    </span>
  );
}

/**
 * CheckCircleIcon - Small check circle icon
 */
function CheckCircleIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/**
 * PeopleIcon - Small people icon
 */
function PeopleIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

/**
 * DueDateBadge - Shows task due date with visual indicator for overdue/upcoming
 */
function DueDateBadge({ dueDate, isCompleted }) {
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const isOverdue = !isCompleted && date < today;
  const isToday = date.getTime() === today.getTime();
  const isTomorrow = date.getTime() === today.getTime() + 86400000;

  // Format date
  let dateText;
  if (isToday) {
    dateText = 'Today';
  } else if (isTomorrow) {
    dateText = 'Tomorrow';
  } else {
    dateText = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  const baseClasses =
    'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium mt-1.5';
  const colorClasses = isCompleted
    ? 'bg-gray-100 text-gray-400'
    : isOverdue
      ? 'bg-red-50 text-red-600 border border-red-200'
      : isToday
        ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-gray-50 text-gray-600 border border-gray-200';

  return (
    <span className={`${baseClasses} ${colorClasses}`}>
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      {isOverdue && !isCompleted ? 'Overdue: ' : ''}
      {dateText}
    </span>
  );
}

export default TaskCard;
