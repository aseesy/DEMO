/**
 * Task Entity Tests
 *
 * Tests for Task domain entity business rules and methods.
 */

const Task = require('../Task');

describe('Task Entity', () => {
  describe('Constructor', () => {
    it('should create a Task with required fields', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
      });

      expect(task.id).toBe(1);
      expect(task.title).toBe('Test Task');
      expect(task.userId).toBe(1);
      expect(task.status).toBe('open');
      expect(task.priority).toBe('medium');
      expect(task.type).toBe('general');
    });

    it('should throw error if id is missing', () => {
      expect(() => {
        new Task({
          title: 'Test Task',
          userId: 1,
        });
      }).toThrow('Task ID is required');
    });

    it('should throw error if title is missing', () => {
      expect(() => {
        new Task({
          id: 1,
          userId: 1,
        });
      }).toThrow('Task title is required');
    });

    it('should throw error if title is empty', () => {
      expect(() => {
        new Task({
          id: 1,
          title: '   ',
          userId: 1,
        });
      }).toThrow('Task title is required');
    });

    it('should throw error if userId is missing', () => {
      expect(() => {
        new Task({
          id: 1,
          title: 'Test Task',
        });
      }).toThrow('Task userId is required');
    });

    it('should validate status', () => {
      expect(() => {
        new Task({
          id: 1,
          title: 'Test Task',
          userId: 1,
          status: 'invalid',
        });
      }).toThrow('Invalid task status');
    });

    it('should validate priority', () => {
      expect(() => {
        new Task({
          id: 1,
          title: 'Test Task',
          userId: 1,
          priority: 'invalid',
        });
      }).toThrow('Invalid task priority');
    });

    it('should set completedAt when status is completed', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
        status: 'completed',
      });

      expect(task.completedAt).toBeInstanceOf(Date);
    });

    it('should clear completedAt when status is open', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
        status: 'open',
        completedAt: new Date(),
      });

      expect(task.completedAt).toBe(null);
    });

    it('should trim title', () => {
      const task = new Task({
        id: 1,
        title: '  Test Task  ',
        userId: 1,
      });

      expect(task.title).toBe('Test Task');
    });

    it('should make entity immutable', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
      });

      expect(() => {
        task.title = 'New Title';
      }).toThrow();
    });
  });

  describe('isCompleted', () => {
    it('should return true for completed tasks', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
        status: 'completed',
      });

      expect(task.isCompleted()).toBe(true);
    });

    it('should return false for open tasks', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
        status: 'open',
      });

      expect(task.isCompleted()).toBe(false);
    });
  });

  describe('isOpen', () => {
    it('should return true for open tasks', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
        status: 'open',
      });

      expect(task.isOpen()).toBe(true);
    });

    it('should return false for completed tasks', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
        status: 'completed',
      });

      expect(task.isOpen()).toBe(false);
    });
  });

  describe('isOverdue', () => {
    it('should return true if due date passed and task is open', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
        status: 'open',
        dueDate: pastDate,
      });

      expect(task.isOverdue()).toBe(true);
    });

    it('should return false if task is completed', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
        status: 'completed',
        dueDate: pastDate,
      });

      expect(task.isOverdue()).toBe(false);
    });

    it('should return false if no due date', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
      });

      expect(task.isOverdue()).toBe(false);
    });
  });

  describe('markCompleted', () => {
    it('should create new Task marked as completed', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
        status: 'open',
      });

      const completed = task.markCompleted();

      expect(completed).not.toBe(task); // New instance
      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('reopen', () => {
    it('should reopen a completed task', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
        status: 'completed',
      });

      const reopened = task.reopen();

      expect(reopened).not.toBe(task); // New instance
      expect(reopened.status).toBe('open');
      expect(reopened.completedAt).toBe(null);
    });

    it('should return same instance if already open', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
        status: 'open',
      });

      const reopened = task.reopen();

      expect(reopened).toBe(task); // Same instance
    });
  });

  describe('updateTitle', () => {
    it('should create new Task with updated title', () => {
      const task = new Task({
        id: 1,
        title: 'Old Title',
        userId: 1,
      });

      const updated = task.updateTitle('New Title');

      expect(updated).not.toBe(task); // New instance
      expect(updated.title).toBe('New Title');
    });

    it('should throw error if new title is empty', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
      });

      expect(() => {
        task.updateTitle('');
      }).toThrow('Task title cannot be empty');
    });
  });

  describe('assignTo', () => {
    it('should assign task to a user', () => {
      const task = new Task({
        id: 1,
        title: 'Test Task',
        userId: 1,
      });

      const assigned = task.assignTo('username');

      expect(assigned).not.toBe(task); // New instance
      expect(assigned.assignedTo).toBe('username');
    });
  });

  describe('fromDatabaseRow', () => {
    it('should create Task from database row', () => {
      const row = {
        id: 1,
        title: 'Test Task',
        user_id: 1,
        description: 'Description',
        status: 'open',
        priority: 'high',
        type: 'general',
        due_date: new Date('2024-12-31'),
        completed_at: null,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
        assigned_to: 'username',
      };

      const task = Task.fromDatabaseRow(row);

      expect(task.id).toBe(1);
      expect(task.title).toBe('Test Task');
      expect(task.userId).toBe(1);
      expect(task.status).toBe('open');
      expect(task.priority).toBe('high');
      expect(task.assignedTo).toBe('username');
    });
  });

  describe('fromApiData', () => {
    it('should create Task from API data', () => {
      const data = {
        id: 1,
        title: 'Test Task',
        userId: 1,
        status: 'open',
        priority: 'high',
      };

      const task = Task.fromApiData(data);

      expect(task.id).toBe(1);
      expect(task.title).toBe('Test Task');
      expect(task.userId).toBe(1);
    });

    it('should handle snake_case API data', () => {
      const data = {
        id: 1,
        title: 'Test Task',
        user_id: 1,
        status: 'open',
        priority: 'high',
        due_date: '2024-12-31',
      };

      const task = Task.fromApiData(data);

      expect(task.userId).toBe(1);
      expect(task.dueDate).toBeInstanceOf(Date);
    });
  });
});
