/**
 * Types Library
 * 
 * Type definitions and interfaces (JSDoc format for JavaScript).
 * 
 * Note: For TypeScript projects, these would be .ts files with proper types.
 */

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {string} [first_name] - First name
 * @property {string} [last_name] - Last name
 */

/**
 * @typedef {Object} Task
 * @property {string|number} id - Task ID
 * @property {string} title - Task title
 * @property {string} [description] - Task description
 * @property {string} status - Task status (open, completed, cancelled)
 * @property {string} priority - Task priority (low, medium, high)
 * @property {string} [due_date] - Due date (ISO string)
 * @property {string} [assigned_to] - Assigned user/contact ID
 * @property {string[]} [related_people] - Related people IDs
 * @property {string} [created_at] - Creation timestamp
 * @property {string} [updated_at] - Update timestamp
 */

/**
 * @typedef {Object} Contact
 * @property {string|number} id - Contact ID
 * @property {string} contact_name - Contact name
 * @property {string} relationship - Relationship type
 * @property {string} [contact_email] - Contact email
 * @property {string} [phone] - Phone number
 * @property {string} [notes] - Additional notes
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} ok - Whether the request was successful
 * @property {any} [data] - Response data
 * @property {string} [error] - Error message if request failed
 */

/**
 * @typedef {Object} PaginationParams
 * @property {number} [page] - Page number (1-indexed)
 * @property {number} [limit] - Items per page
 * @property {number} [offset] - Offset for pagination
 */

