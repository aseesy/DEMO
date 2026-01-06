/**
 * Task Domain Entity
 *
 * Represents a shared parenting responsibility with assignment and status.
 * Encapsulates business rules for task operations.
 *
 * @module domain/entities/Task
 */

'use strict';

class Task {
  /**
   * Create a Task entity
   * @param {Object} params - Task properties
   * @param {number} params.id - Task ID
   * @param {string} params.title - Task title
   * @param {number} params.userId - User ID (owner/creator)
   * @param {string} [params.description] - Task description
   * @param {string} [params.status='open'] - Task status (open, completed, cancelled)
   * @param {string} [params.priority='medium'] - Task priority (low, medium, high)
   * @param {string} [params.type='general'] - Task type
   * @param {Date} [params.dueDate] - Due date
   * @param {Date} [params.completedAt] - Completion timestamp
   * @param {Date} [params.createdAt] - Creation timestamp
   * @param {Date} [params.updatedAt] - Last update timestamp
   * @param {string} [params.assignedTo] - Username of assignee
   */
  constructor({
    id,
    title,
    userId,
    description = null,
    status = 'open',
    priority = 'medium',
    type = 'general',
    dueDate = null,
    completedAt = null,
    createdAt = new Date(),
    updatedAt = new Date(),
    assignedTo = null,
  }) {
    if (!id && id !== 0) {
      throw new Error('Task ID is required');
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Task title is required');
    }
    if (!userId) {
      throw new Error('Task userId is required');
    }

    // Validate status
    const validStatuses = ['open', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid task status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      throw new Error(`Invalid task priority: ${priority}. Must be one of: ${validPriorities.join(', ')}`);
    }

    this.id = id;
    this.title = title.trim();
    this.userId = userId;
    this.description = description ? description.trim() : null;
    this.status = status;
    this.priority = priority;
    this.type = type;
    this.dueDate = dueDate ? (dueDate instanceof Date ? dueDate : new Date(dueDate)) : null;
    this.completedAt = completedAt ? (completedAt instanceof Date ? completedAt : new Date(completedAt)) : null;
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
    this.assignedTo = assignedTo;

    // Business rule: Completed tasks must have completedAt timestamp
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    }

    // Business rule: Open tasks cannot have completedAt
    if (this.status === 'open' && this.completedAt) {
      this.completedAt = null;
    }

    // Make immutable
    Object.freeze(this);
  }

  /**
   * Check if task is completed
   * @returns {boolean} True if completed
   */
  isCompleted() {
    return this.status === 'completed';
  }

  /**
   * Check if task is open
   * @returns {boolean} True if open
   */
  isOpen() {
    return this.status === 'open';
  }

  /**
   * Check if task is overdue
   * @returns {boolean} True if overdue
   */
  isOverdue() {
    if (!this.dueDate || this.isCompleted()) {
      return false;
    }
    return new Date() > this.dueDate;
  }

  /**
   * Mark task as completed
   * @returns {Task} New Task instance marked as completed
   */
  markCompleted() {
    return new Task({
      ...this.toPlainObject(),
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reopen a completed task
   * @returns {Task} New Task instance reopened
   */
  reopen() {
    if (this.status !== 'completed') {
      return this; // Already open
    }

    return new Task({
      ...this.toPlainObject(),
      status: 'open',
      completedAt: null,
      updatedAt: new Date(),
    });
  }

  /**
   * Update task title
   * @param {string} newTitle - New title
   * @returns {Task} New Task instance with updated title
   */
  updateTitle(newTitle) {
    if (!newTitle || typeof newTitle !== 'string' || newTitle.trim().length === 0) {
      throw new Error('Task title cannot be empty');
    }

    return new Task({
      ...this.toPlainObject(),
      title: newTitle.trim(),
      updatedAt: new Date(),
    });
  }

  /**
   * Update task description
   * @param {string} newDescription - New description
   * @returns {Task} New Task instance with updated description
   */
  updateDescription(newDescription) {
    return new Task({
      ...this.toPlainObject(),
      description: newDescription ? newDescription.trim() : null,
      updatedAt: new Date(),
    });
  }

  /**
   * Assign task to a user
   * @param {string} username - Username of assignee
   * @returns {Task} New Task instance with assignment
   */
  assignTo(username) {
    return new Task({
      ...this.toPlainObject(),
      assignedTo: username,
      updatedAt: new Date(),
    });
  }

  /**
   * Convert to plain object (for serialization)
   * @returns {Object} Plain object representation
   */
  toPlainObject() {
    return {
      id: this.id,
      title: this.title,
      userId: this.userId,
      description: this.description,
      status: this.status,
      priority: this.priority,
      type: this.type,
      dueDate: this.dueDate,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      assignedTo: this.assignedTo,
    };
  }

  /**
   * Create Task from database row
   * @param {Object} row - Database row
   * @returns {Task} Task entity
   */
  static fromDatabaseRow(row) {
    return new Task({
      id: row.id,
      title: row.title,
      userId: row.user_id,
      description: row.description,
      status: row.status,
      priority: row.priority,
      type: row.type,
      dueDate: row.due_date,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      assignedTo: row.assigned_to,
    });
  }

  /**
   * Create Task from API data
   * @param {Object} data - API data
   * @returns {Task} Task entity
   */
  static fromApiData(data) {
    return new Task({
      id: data.id,
      title: data.title,
      userId: data.userId || data.user_id,
      description: data.description,
      status: data.status || 'open',
      priority: data.priority || 'medium',
      type: data.type || 'general',
      dueDate: data.dueDate || data.due_date,
      completedAt: data.completedAt || data.completed_at,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at,
      assignedTo: data.assignedTo || data.assigned_to,
    });
  }
}

module.exports = Task;

