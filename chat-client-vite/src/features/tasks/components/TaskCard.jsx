import React from 'react';
import { TaskIcon } from './TaskIcon.jsx';
import {
  isCoparentTask,
  isProfileTask,
  isChildrenTask,
  isInviteTask,
  isSmartTask,
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
  const handleTaskClick = () => {
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
            className={`text-xs text-gray-600 line-clamp-2 wrap-break-word leading-relaxed ${
              isCompleted ? 'line-through text-gray-400' : ''
            }`}
          >
            {task.description}
          </p>
        )}

        {/* Assigned and Related People */}
        <TaskAssignmentBadges task={task} contacts={contacts} />
      </div>
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

export default TaskCard;
