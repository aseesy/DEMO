/**
 * Date Utilities
 *
 * Generic, stateless date/time functions for formatting,
 * calculation, and expiration handling.
 *
 * @module src/utils/dates
 */

/**
 * Get current ISO timestamp
 *
 * @returns {string} ISO 8601 formatted timestamp
 *
 * @example
 * now() // '2024-01-15T10:30:00.000Z'
 */
function now() {
  return new Date().toISOString();
}

/**
 * Get current Unix timestamp in milliseconds
 *
 * @returns {number} Unix timestamp (ms)
 *
 * @example
 * timestamp() // 1705315800000
 */
function timestamp() {
  return Date.now();
}

/**
 * Get current Unix timestamp in seconds
 *
 * @returns {number} Unix timestamp (seconds)
 *
 * @example
 * timestampSeconds() // 1705315800
 */
function timestampSeconds() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Calculate expiration time from now
 *
 * @param {number} duration - Duration value
 * @param {string} unit - Time unit: 'ms', 's', 'm', 'h', 'd', 'w' (default: 'ms')
 * @returns {Date} Expiration date
 *
 * @example
 * expiresIn(24, 'h') // Date 24 hours from now
 * expiresIn(7, 'd') // Date 7 days from now
 * expiresIn(30, 'm') // Date 30 minutes from now
 */
function expiresIn(duration, unit = 'ms') {
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };
  const ms = duration * (multipliers[unit] || 1);
  return new Date(Date.now() + ms);
}

/**
 * Calculate expiration time and return as ISO string
 *
 * @param {number} duration - Duration value
 * @param {string} unit - Time unit: 'ms', 's', 'm', 'h', 'd', 'w'
 * @returns {string} ISO 8601 expiration timestamp
 *
 * @example
 * expiresInISO(24, 'h') // '2024-01-16T10:30:00.000Z'
 */
function expiresInISO(duration, unit = 'ms') {
  return expiresIn(duration, unit).toISOString();
}

/**
 * Check if a date/timestamp has expired
 *
 * @param {Date|string|number} expiration - Expiration date, ISO string, or timestamp
 * @returns {boolean} True if expired (past current time)
 *
 * @example
 * isExpired(new Date('2020-01-01')) // true
 * isExpired('2030-01-01T00:00:00Z') // false
 * isExpired(Date.now() - 1000) // true
 */
function isExpired(expiration) {
  if (!expiration) return true;
  const expDate = new Date(expiration);
  return expDate.getTime() < Date.now();
}

/**
 * Get time remaining until expiration in milliseconds
 *
 * @param {Date|string|number} expiration - Expiration date
 * @returns {number} Milliseconds remaining (negative if expired)
 *
 * @example
 * timeRemaining(expiresIn(1, 'h')) // ~3600000
 */
function timeRemaining(expiration) {
  if (!expiration) return -1;
  const expDate = new Date(expiration);
  return expDate.getTime() - Date.now();
}

/**
 * Format a date for display (locale-aware)
 *
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 *
 * @example
 * formatDate(new Date()) // 'Jan 15, 2024'
 * formatDate(new Date(), { dateStyle: 'full' }) // 'Monday, January 15, 2024'
 */
function formatDate(date, options = { dateStyle: 'medium' }) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', options).format(d);
}

/**
 * Format a date with time for display
 *
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date and time string
 *
 * @example
 * formatDateTime(new Date()) // 'Jan 15, 2024, 10:30 AM'
 */
function formatDateTime(date) {
  return formatDate(date, { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Get relative time description
 *
 * @param {Date|string|number} date - Date to compare
 * @returns {string} Relative time string
 *
 * @example
 * relativeTime(Date.now() - 60000) // '1 minute ago'
 * relativeTime(Date.now() - 3600000) // '1 hour ago'
 */
function relativeTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return formatDate(d);
}

/**
 * Check if a date is today
 *
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is today
 *
 * @example
 * isToday(new Date()) // true
 * isToday('2020-01-01') // false
 */
function isToday(date) {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Get start of day (midnight)
 *
 * @param {Date|string|number} date - Date (default: now)
 * @returns {Date} Date set to 00:00:00.000
 *
 * @example
 * startOfDay(new Date('2024-01-15T15:30:00')) // Date for 2024-01-15T00:00:00
 */
function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day (23:59:59.999)
 *
 * @param {Date|string|number} date - Date (default: now)
 * @returns {Date} Date set to 23:59:59.999
 *
 * @example
 * endOfDay(new Date('2024-01-15T15:30:00')) // Date for 2024-01-15T23:59:59.999
 */
function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Add duration to a date
 *
 * @param {Date|string|number} date - Starting date
 * @param {number} duration - Duration to add
 * @param {string} unit - Time unit: 'ms', 's', 'm', 'h', 'd', 'w'
 * @returns {Date} New date with duration added
 *
 * @example
 * addTime(new Date(), 1, 'd') // Date 1 day from now
 * addTime('2024-01-15', 2, 'w') // Date 2 weeks later
 */
function addTime(date, duration, unit = 'ms') {
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };
  const d = new Date(date);
  const ms = duration * (multipliers[unit] || 1);
  return new Date(d.getTime() + ms);
}

module.exports = {
  now,
  timestamp,
  timestampSeconds,
  expiresIn,
  expiresInISO,
  isExpired,
  timeRemaining,
  formatDate,
  formatDateTime,
  relativeTime,
  isToday,
  startOfDay,
  endOfDay,
  addTime,
};
