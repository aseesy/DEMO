/**
 * Task Data Abstraction Layer
 *
 * Provides abstracted interface for task operations, hiding implementation details.
 * This allows us to change the internal structure (array, Set, Map) without
 * breaking consumers.
 *
 * Principle: Consumers should not know tasks is an array or know about task.id structure.
 */

/**
 * Task Collection Abstraction
 *
 * Wraps task array to provide abstracted interface.
 * Consumers use methods, not direct array access.
 */
export class TaskCollection {
  constructor(tasks = []) {
    this._tasks = Array.isArray(tasks) ? tasks : [];
  }

  /**
   * Get all tasks (returns array for compatibility, but consumers shouldn't assume array)
   */
  getAll() {
    return [...this._tasks]; // Return copy to prevent mutation
  }

  /**
   * Get task count
   */
  getCount() {
    return this._tasks.length;
  }

  /**
   * Check if collection is empty
   */
  isEmpty() {
    return this._tasks.length === 0;
  }

  /**
   * Filter tasks using a predicate function
   */
  filter(predicate) {
    return new TaskCollection(this._tasks.filter(predicate));
  }

  /**
   * Map tasks using a transform function
   */
  map(transform) {
    return this._tasks.map(transform);
  }

  /**
   * Find task by predicate
   */
  find(predicate) {
    return this._tasks.find(predicate);
  }

  /**
   * Get tasks as array (for compatibility with existing code)
   * @deprecated Use getAll() instead
   */
  toArray() {
    return this.getAll();
  }
}

/**
 * Task Abstraction
 *
 * Wraps task object to provide abstracted interface.
 * Consumers use methods, not direct property access.
 */
export class Task {
  constructor(taskData) {
    this._data = taskData || {};
  }

  /**
   * Get task identifier (abstracts task.id)
   */
  getId() {
    return this._data.id;
  }

  /**
   * Get task title (abstracts task.title)
   */
  getTitle() {
    return this._data.title || '';
  }

  /**
   * Get task status (abstracts task.status)
   */
  getStatus() {
    return this._data.status || 'open';
  }

  /**
   * Get task description (abstracts task.description)
   */
  getDescription() {
    return this._data.description || '';
  }

  /**
   * Get task priority (abstracts task.priority)
   */
  getPriority() {
    return this._data.priority || 'medium';
  }

  /**
   * Get task due date (abstracts task.due_date)
   */
  getDueDate() {
    return this._data.due_date || null;
  }

  /**
   * Get assigned to (abstracts task.assigned_to)
   */
  getAssignedTo() {
    return this._data.assigned_to || 'self';
  }

  /**
   * Get related people (abstracts task.related_people)
   */
  getRelatedPeople() {
    return Array.isArray(this._data.related_people) ? [...this._data.related_people] : [];
  }

  /**
   * Get task type (abstracts task.type)
   */
  getType() {
    return this._data.type || 'general';
  }

  /**
   * Get raw task data (for backward compatibility)
   * @deprecated Use methods instead
   */
  getData() {
    return { ...this._data };
  }
}

/**
 * Create task collection from array
 */
export function createTaskCollection(tasks) {
  return new TaskCollection(tasks);
}

/**
 * Create task from data
 */
export function createTask(taskData) {
  return new Task(taskData);
}
