/**
 * taskHelpers.js Unit Tests
 *
 * Tests pure task business logic functions.
 * Covers sorting, filtering, status transitions, and validation.
 */

import { describe, it, expect } from 'vitest';
import {
  PRIORITY_ORDER,
  INVITE_TASK_TITLES,
  sortTasksByPriorityAndDate,
  sortTasksByPriorityNewestFirst,
  getTaskAction,
  isInviteTask,
  getNextTaskStatus,
  wasTaskCompleted,
  filterTasksByStatus,
  filterTasksByPriority,
  searchTasks,
  getDefaultTaskFormData,
  validateTaskFormData,
} from './taskHelpers.js';

describe('PRIORITY_ORDER', () => {
  it('should have high as highest priority (0)', () => {
    expect(PRIORITY_ORDER.high).toBe(0);
  });

  it('should have medium as middle priority (1)', () => {
    expect(PRIORITY_ORDER.medium).toBe(1);
  });

  it('should have low as lowest priority (2)', () => {
    expect(PRIORITY_ORDER.low).toBe(2);
  });

  it('should have correct ordering: high < medium < low', () => {
    expect(PRIORITY_ORDER.high).toBeLessThan(PRIORITY_ORDER.medium);
    expect(PRIORITY_ORDER.medium).toBeLessThan(PRIORITY_ORDER.low);
  });
});

describe('INVITE_TASK_TITLES', () => {
  it('should include "Invite Your Co-Parent"', () => {
    expect(INVITE_TASK_TITLES).toContain('Invite Your Co-Parent');
  });

  it('should include "Add Your Co-parent"', () => {
    expect(INVITE_TASK_TITLES).toContain('Add Your Co-parent');
  });
});

describe('sortTasksByPriorityAndDate', () => {
  const createTask = (id, priority, dateStr) => ({
    id,
    priority,
    created_at: dateStr,
    title: `Task ${id}`,
  });

  describe('priority sorting', () => {
    it('should sort high priority first', () => {
      const tasks = [
        createTask(1, 'low', '2024-01-01'),
        createTask(2, 'high', '2024-01-01'),
        createTask(3, 'medium', '2024-01-01'),
      ];

      const sorted = sortTasksByPriorityAndDate(tasks);

      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('medium');
      expect(sorted[2].priority).toBe('low');
    });

    it('should treat undefined priority as medium', () => {
      const tasks = [
        createTask(1, 'low', '2024-01-01'),
        createTask(2, undefined, '2024-01-01'),
        createTask(3, 'high', '2024-01-01'),
      ];

      const sorted = sortTasksByPriorityAndDate(tasks);

      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBeUndefined(); // treated as medium
      expect(sorted[2].priority).toBe('low');
    });
  });

  describe('date sorting within same priority', () => {
    it('should sort oldest first within same priority', () => {
      const tasks = [
        createTask(1, 'high', '2024-01-03'),
        createTask(2, 'high', '2024-01-01'),
        createTask(3, 'high', '2024-01-02'),
      ];

      const sorted = sortTasksByPriorityAndDate(tasks);

      expect(sorted[0].id).toBe(2); // oldest
      expect(sorted[1].id).toBe(3);
      expect(sorted[2].id).toBe(1); // newest
    });

    it('should handle missing dates', () => {
      const tasks = [
        createTask(1, 'high', '2024-01-01'),
        createTask(2, 'high', null),
        createTask(3, 'high', undefined),
      ];

      const sorted = sortTasksByPriorityAndDate(tasks);
      // Tasks with missing dates get date 0 (epoch), so they come first
      expect(sorted).toHaveLength(3);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for non-array input', () => {
      expect(sortTasksByPriorityAndDate(null)).toEqual([]);
      expect(sortTasksByPriorityAndDate(undefined)).toEqual([]);
      expect(sortTasksByPriorityAndDate('string')).toEqual([]);
      expect(sortTasksByPriorityAndDate({})).toEqual([]);
    });

    it('should return empty array for empty input', () => {
      expect(sortTasksByPriorityAndDate([])).toEqual([]);
    });

    it('should handle single task', () => {
      const tasks = [createTask(1, 'high', '2024-01-01')];
      const sorted = sortTasksByPriorityAndDate(tasks);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe(1);
    });

    it('should not mutate original array', () => {
      const tasks = [
        createTask(1, 'low', '2024-01-01'),
        createTask(2, 'high', '2024-01-01'),
      ];
      const original = [...tasks];

      sortTasksByPriorityAndDate(tasks);

      expect(tasks[0].id).toBe(original[0].id);
    });
  });
});

describe('sortTasksByPriorityNewestFirst', () => {
  const createTask = (id, priority, dateStr) => ({
    id,
    priority,
    created_at: dateStr,
    title: `Task ${id}`,
  });

  it('should sort newest first within same priority', () => {
    const tasks = [
      createTask(1, 'high', '2024-01-01'),
      createTask(2, 'high', '2024-01-03'),
      createTask(3, 'high', '2024-01-02'),
    ];

    const sorted = sortTasksByPriorityNewestFirst(tasks);

    expect(sorted[0].id).toBe(2); // newest
    expect(sorted[1].id).toBe(3);
    expect(sorted[2].id).toBe(1); // oldest
  });

  it('should still sort by priority first', () => {
    const tasks = [
      createTask(1, 'low', '2024-01-03'), // newest but low priority
      createTask(2, 'high', '2024-01-01'), // oldest but high priority
    ];

    const sorted = sortTasksByPriorityNewestFirst(tasks);

    expect(sorted[0].priority).toBe('high');
    expect(sorted[1].priority).toBe('low');
  });
});

describe('getTaskAction', () => {
  it('should return modal action for invite task', () => {
    const task = { title: 'Invite Your Co-Parent', status: 'open' };
    const action = getTaskAction(task);

    expect(action.type).toBe('modal');
    expect(action.modal).toBe('invite');
  });

  it('should return modal action for add co-parent task', () => {
    const task = { title: 'Add Your Co-parent', status: 'open' };
    const action = getTaskAction(task);

    expect(action.type).toBe('modal');
    expect(action.modal).toBe('invite');
  });

  it('should return toggle action for completed invite task', () => {
    const task = { title: 'Invite Your Co-Parent', status: 'completed' };
    const action = getTaskAction(task);

    expect(action.type).toBe('toggle');
  });

  it('should return toggle action for regular task', () => {
    const task = { title: 'Regular Task', status: 'open' };
    const action = getTaskAction(task);

    expect(action.type).toBe('toggle');
  });

  it('should return toggle action for null task', () => {
    const action = getTaskAction(null);
    expect(action.type).toBe('toggle');
  });

  it('should return toggle action for undefined task', () => {
    const action = getTaskAction(undefined);
    expect(action.type).toBe('toggle');
  });
});

describe('isInviteTask', () => {
  it('should return true for invite task title', () => {
    expect(isInviteTask({ title: 'Invite Your Co-Parent' })).toBe(true);
  });

  it('should return true for add co-parent task title', () => {
    expect(isInviteTask({ title: 'Add Your Co-parent' })).toBe(true);
  });

  it('should return false for regular task', () => {
    expect(isInviteTask({ title: 'Pick up kids' })).toBe(false);
  });

  it('should return false for null task', () => {
    expect(isInviteTask(null)).toBe(false);
  });

  it('should return false for undefined task', () => {
    expect(isInviteTask(undefined)).toBe(false);
  });

  it('should return false for task without title', () => {
    expect(isInviteTask({})).toBe(false);
  });
});

describe('getNextTaskStatus', () => {
  it('should return "completed" when current is "open"', () => {
    expect(getNextTaskStatus('open')).toBe('completed');
  });

  it('should return "open" when current is "completed"', () => {
    expect(getNextTaskStatus('completed')).toBe('open');
  });

  it('should return "completed" for any non-completed status', () => {
    expect(getNextTaskStatus('pending')).toBe('completed');
    expect(getNextTaskStatus('')).toBe('completed');
    expect(getNextTaskStatus(undefined)).toBe('completed');
  });
});

describe('wasTaskCompleted', () => {
  it('should return true when transitioning from open to completed', () => {
    expect(wasTaskCompleted('open', 'completed')).toBe(true);
  });

  it('should return false when transitioning from completed to open', () => {
    expect(wasTaskCompleted('completed', 'open')).toBe(false);
  });

  it('should return false when status unchanged', () => {
    expect(wasTaskCompleted('open', 'open')).toBe(false);
    expect(wasTaskCompleted('completed', 'completed')).toBe(false);
  });
});

describe('filterTasksByStatus', () => {
  const tasks = [
    { id: 1, status: 'open' },
    { id: 2, status: 'completed' },
    { id: 3, status: 'open' },
    { id: 4, status: 'completed' },
  ];

  it('should filter by open status', () => {
    const filtered = filterTasksByStatus(tasks, 'open');

    expect(filtered).toHaveLength(2);
    expect(filtered.every(t => t.status === 'open')).toBe(true);
  });

  it('should filter by completed status', () => {
    const filtered = filterTasksByStatus(tasks, 'completed');

    expect(filtered).toHaveLength(2);
    expect(filtered.every(t => t.status === 'completed')).toBe(true);
  });

  it('should return all tasks when status is "all"', () => {
    const filtered = filterTasksByStatus(tasks, 'all');
    expect(filtered).toHaveLength(4);
  });

  it('should return empty array for non-array input', () => {
    expect(filterTasksByStatus(null, 'open')).toEqual([]);
    expect(filterTasksByStatus(undefined, 'open')).toEqual([]);
  });
});

describe('filterTasksByPriority', () => {
  const tasks = [
    { id: 1, priority: 'high' },
    { id: 2, priority: 'medium' },
    { id: 3, priority: 'high' },
    { id: 4, priority: 'low' },
  ];

  it('should filter by high priority', () => {
    const filtered = filterTasksByPriority(tasks, 'high');

    expect(filtered).toHaveLength(2);
    expect(filtered.every(t => t.priority === 'high')).toBe(true);
  });

  it('should filter by medium priority', () => {
    const filtered = filterTasksByPriority(tasks, 'medium');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].priority).toBe('medium');
  });

  it('should filter by low priority', () => {
    const filtered = filterTasksByPriority(tasks, 'low');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].priority).toBe('low');
  });

  it('should return empty array for non-array input', () => {
    expect(filterTasksByPriority(null, 'high')).toEqual([]);
  });
});

describe('searchTasks', () => {
  const tasks = [
    { id: 1, title: 'Pick up kids from school', description: 'At 3pm' },
    { id: 2, title: 'Doctor appointment', description: 'Annual checkup for kids' },
    { id: 3, title: 'Buy groceries', description: 'Milk, bread, eggs' },
  ];

  it('should find tasks by title match', () => {
    const results = searchTasks(tasks, 'school');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(1);
  });

  it('should find tasks by description match', () => {
    const results = searchTasks(tasks, 'checkup');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(2);
  });

  it('should be case-insensitive', () => {
    const results = searchTasks(tasks, 'DOCTOR');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(2);
  });

  it('should find multiple matches', () => {
    const results = searchTasks(tasks, 'kids');
    expect(results).toHaveLength(2);
  });

  it('should return all tasks for empty query', () => {
    expect(searchTasks(tasks, '')).toEqual(tasks);
    expect(searchTasks(tasks, '   ')).toEqual(tasks);
  });

  it('should return all tasks for null query', () => {
    expect(searchTasks(tasks, null)).toEqual(tasks);
  });

  it('should return null for null input', () => {
    expect(searchTasks(null, 'query')).toBeNull();
  });

  it('should handle tasks with missing fields', () => {
    const tasksWithMissing = [
      { id: 1, title: 'Has title' },
      { id: 2, description: 'Has description' },
      { id: 3 },
    ];

    const results = searchTasks(tasksWithMissing, 'title');
    expect(results).toHaveLength(1);
  });
});

describe('getDefaultTaskFormData', () => {
  it('should return object with empty title', () => {
    const data = getDefaultTaskFormData();
    expect(data.title).toBe('');
  });

  it('should return object with empty description', () => {
    const data = getDefaultTaskFormData();
    expect(data.description).toBe('');
  });

  it('should return object with open status', () => {
    const data = getDefaultTaskFormData();
    expect(data.status).toBe('open');
  });

  it('should return object with medium priority', () => {
    const data = getDefaultTaskFormData();
    expect(data.priority).toBe('medium');
  });

  it('should return object with self assignment', () => {
    const data = getDefaultTaskFormData();
    expect(data.assigned_to).toBe('self');
  });

  it('should return object with empty related_people array', () => {
    const data = getDefaultTaskFormData();
    expect(data.related_people).toEqual([]);
  });

  it('should return new object each time (no mutation)', () => {
    const data1 = getDefaultTaskFormData();
    const data2 = getDefaultTaskFormData();

    data1.title = 'Modified';

    expect(data2.title).toBe('');
  });
});

describe('validateTaskFormData', () => {
  it('should return valid for task with title', () => {
    const result = validateTaskFormData({ title: 'Valid Task' });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should return invalid for empty title', () => {
    const result = validateTaskFormData({ title: '' });

    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it('should return invalid for whitespace-only title', () => {
    const result = validateTaskFormData({ title: '   ' });

    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it('should return invalid for missing title', () => {
    const result = validateTaskFormData({});

    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it('should return invalid for null title', () => {
    const result = validateTaskFormData({ title: null });

    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it('should trim title for validation', () => {
    const result = validateTaskFormData({ title: '  Valid Task  ' });
    expect(result.valid).toBe(true);
  });
});
