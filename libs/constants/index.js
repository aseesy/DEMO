/**
 * Constants Library
 * 
 * Application-wide constants and configuration values.
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

/**
 * Validation Constants
 */
export const VALIDATION = {
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MAX_LENGTH: 100,
  MESSAGE_MAX_LENGTH: 5000,
};

/**
 * Task Status Values
 */
export const TASK_STATUS = {
  OPEN: 'open',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/**
 * Task Priority Values
 */
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

/**
 * Contact Relationship Types
 */
export const RELATIONSHIP_TYPES = {
  CO_PARENT: 'My Co-Parent',
  PARTNER: 'My Partner',
  CHILD: 'My Child',
  PARTNER_CHILD: "My Partner's Child",
  PARTNER_CO_PARENT: "My Partner's Co-Parent",
  OTHER: 'Other',
};

/**
 * UI Constants
 */
export const UI = {
  TOAST_DURATION: 3000, // 3 seconds
  DEBOUNCE_DELAY: 300, // 300ms
  ANIMATION_DURATION: 200, // 200ms
};

/**
 * Date/Time Formats
 */
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  FULL: 'MMMM DD, YYYY',
  TIME: 'HH:mm',
  DATETIME: 'MMM DD, YYYY HH:mm',
};

