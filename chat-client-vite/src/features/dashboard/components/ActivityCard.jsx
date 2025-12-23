import React from 'react';
import { Button } from '../../../components/ui';

export function ActivityCard({ activity, onEdit, onDelete }) {
  const formatTime = time => {
    if (!time) return '';
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDays = days => {
    if (!days || days.length === 0) return 'No specific days';
    if (days.length === 7) return 'Every day';
    return days.join(', ');
  };

  const formatCost = (cost, frequency) => {
    if (!cost || cost === 0) return 'Free';
    const formattedCost = `$${parseFloat(cost).toFixed(2)}`;
    return frequency ? `${formattedCost}/${frequency}` : formattedCost;
  };

  const formatRecurrence = recurrence => {
    const map = {
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      'one-time': 'One-time',
    };
    return map[recurrence] || recurrence;
  };

  return (
    <div className="bg-white rounded-lg border-2 border-teal-light p-3 sm:p-4 hover:border-teal-medium transition-all">
      {/* Header with Title and Actions */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-teal-medium text-sm sm:text-base truncate">
            {activity.activity_name}
          </h4>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-lightest text-teal-medium">
              {formatRecurrence(activity.recurrence)}
            </span>
            {activity.cost && activity.cost > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#D4F0EC] text-teal-medium">
                {formatCost(activity.cost, activity.cost_frequency)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            onClick={e => {
              e.stopPropagation();
              onEdit(activity);
            }}
            variant="ghost"
            size="small"
            className="p-1.5 hover:bg-teal-lightest text-teal-medium"
            aria-label="Edit activity"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            }
          />
          <Button
            onClick={e => {
              e.stopPropagation();
              if (confirm(`Delete "${activity.activity_name}"?`)) {
                onDelete(activity.id);
              }
            }}
            variant="ghost"
            size="small"
            className="p-1.5 hover:bg-red-50 text-red-500"
            aria-label="Delete activity"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            }
          />
        </div>
      </div>

      {/* Schedule Details */}
      {(activity.days_of_week && activity.days_of_week.length > 0) ||
      (activity.start_time && activity.end_time) ? (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2">
          <svg
            className="w-4 h-4 text-teal-medium flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="truncate">
            {formatDays(activity.days_of_week)}
            {activity.start_time && activity.end_time && (
              <span className="ml-1">
                • {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
              </span>
            )}
          </span>
        </div>
      ) : null}

      {/* Location */}
      {activity.location && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2">
          <svg
            className="w-4 h-4 text-teal-medium flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="truncate">{activity.location}</span>
        </div>
      )}

      {/* Instructor Contact */}
      {activity.instructor_contact && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2">
          <svg
            className="w-4 h-4 text-teal-medium flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="truncate">{activity.instructor_contact}</span>
        </div>
      )}

      {/* Description */}
      {activity.description && (
        <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">{activity.description}</p>
      )}

      {/* Cost Split Info */}
      {activity.split_type && activity.split_type !== 'equal' && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg
              className="w-3.5 h-3.5 text-teal-medium"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {activity.split_type === 'custom' && activity.split_percentage
                ? `${activity.split_percentage}% split`
                : 'Full cost'}
              {activity.paid_by && ` • Paid by ${activity.paid_by}`}
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      {activity.notes && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 italic line-clamp-2">{activity.notes}</p>
        </div>
      )}
    </div>
  );
}
