/**
 * Date utility functions - pure functions with no dependencies
 */

/**
 * Format a date string as relative time (e.g., "5m ago", "2h ago", "3d ago")
 * @param {string|Date} dateInput - ISO date string or Date object
 * @returns {string} Relative time string
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '';

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  // Check for invalid date
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now - date;

  // Handle future dates
  if (diffMs < 0) return 'Just now';

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Check if a date is within the last N minutes
 * @param {string|Date} dateInput - ISO date string or Date object
 * @param {number} minutes - Number of minutes
 * @returns {boolean}
 */
export function isWithinMinutes(dateInput, minutes) {
  if (!dateInput) return false;

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return false;

  const now = new Date();
  const diffMs = now - date;

  return diffMs >= 0 && diffMs < minutes * 60000;
}

/**
 * Check if a date is today
 * @param {string|Date} dateInput - ISO date string or Date object
 * @returns {boolean}
 */
export function isToday(dateInput) {
  if (!dateInput) return false;

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return false;

  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}
