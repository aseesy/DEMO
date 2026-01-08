/**
 * Task Manager - Centralized Background Task Management
 *
 * Phase 2: Server Reliability - Background Task Management
 * Manages all background tasks (setTimeout, setInterval) with lifecycle tracking
 * Ensures proper cleanup on shutdown
 */

const { defaultLogger } = require('../logging/logger');

const logger = defaultLogger.child({
  module: 'taskManager',
});

class TaskManager {
  constructor() {
    this.tasks = new Map(); // taskId -> { type, fn, timeoutId/intervalId, name, createdAt }
    this.nextTaskId = 1;
  }

  /**
   * Schedule a one-time task
   * @param {Function} fn - Function to execute
   * @param {number} delay - Delay in milliseconds
   * @param {string} name - Task name for logging
   * @returns {string} Task ID
   */
  schedule(name, fn, delay) {
    const taskId = `task-${this.nextTaskId++}`;
    const timeoutId = setTimeout(async () => {
      try {
        await fn();
      } catch (error) {
        logger.error('Log message', {
          arg0: `[TaskManager] Error in task '${name}':`,
          message: error.message,
        });
      } finally {
        this.tasks.delete(taskId);
      }
    }, delay);

    this.tasks.set(taskId, {
      type: 'timeout',
      fn,
      timeoutId,
      name,
      createdAt: new Date().toISOString(),
    });

    return taskId;
  }

  /**
   * Schedule a recurring task
   * @param {string} name - Task name for logging
   * @param {Function} fn - Function to execute
   * @param {number} interval - Interval in milliseconds
   * @returns {string} Task ID
   */
  scheduleRecurring(name, fn, interval) {
    const taskId = `task-${this.nextTaskId++}`;
    const intervalId = setInterval(async () => {
      try {
        await fn();
      } catch (error) {
        logger.error('Log message', {
          arg0: `[TaskManager] Error in recurring task '${name}':`,
          message: error.message,
        });
      }
    }, interval);

    this.tasks.set(taskId, {
      type: 'interval',
      fn,
      intervalId,
      name,
      createdAt: new Date().toISOString(),
    });

    if (process.env.NODE_ENV !== 'test') {
      logger.debug('Log message', {
        value: `[TaskManager] Scheduled recurring task: ${name} (interval: ${interval}ms, id: ${taskId})`,
      });
    }

    return taskId;
  }

  /**
   * Cancel a task
   * @param {string} taskId - Task ID
   * @returns {boolean} True if task was cancelled
   */
  cancel(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if (task.type === 'timeout') {
      clearTimeout(task.timeoutId);
    } else if (task.type === 'interval') {
      clearInterval(task.intervalId);
    }

    if (process.env.NODE_ENV !== 'test') {
      logger.debug('Log message', {
        value: `[TaskManager] Cancelled task: ${task.name} (id: ${taskId})`,
      });
    }

    this.tasks.delete(taskId);
    return true;
  }

  /**
   * Cancel all tasks
   * Used during graceful shutdown
   * @returns {number} Number of tasks cancelled
   */
  cancelAll() {
    let count = 0;
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.type === 'timeout') {
        clearTimeout(task.timeoutId);
      } else if (task.type === 'interval') {
        clearInterval(task.intervalId);
      }
      count++;
    }
    this.tasks.clear();
    logger.debug('Log message', {
      value: `[TaskManager] Cancelled ${count} background tasks`,
    });
    return count;
  }

  /**
   * Get all active tasks (for debugging)
   * @returns {Array} Array of task info
   */
  getActiveTasks() {
    return Array.from(this.tasks.entries()).map(([id, task]) => ({
      id,
      name: task.name,
      type: task.type,
      createdAt: task.createdAt,
    }));
  }

  /**
   * Get task count
   * @returns {number} Number of active tasks
   */
  getTaskCount() {
    return this.tasks.size;
  }
}

// Export singleton instance
const taskManager = new TaskManager();

module.exports = { taskManager, TaskManager };
