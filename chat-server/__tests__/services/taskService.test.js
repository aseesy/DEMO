/**
 * TaskService Unit Tests
 *
 * Tests TaskService methods in isolation with mocked repositories.
 * Covers CRUD operations, filtering, deduplication, and AI generation.
 */

/* eslint-env jest */

const { TaskService } = require('../../src/services/task/taskService');
const {
  NotFoundError,
  ValidationError,
  ExternalServiceError,
} = require('../../src/services/errors');
const { mockRepository } = require('../utils/serviceMocks');

describe('TaskService', () => {
  let taskService;
  let mockTaskRepository;
  let mockUserRepository;

  beforeEach(() => {
    // Create mock repositories
    mockTaskRepository = mockRepository();
    mockUserRepository = mockRepository();

    // Create service instance with mocked repositories
    taskService = new TaskService();
    taskService.taskRepository = mockTaskRepository;
    taskService.repository = mockTaskRepository; // BaseService uses this.repository
    taskService.userRepository = mockUserRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // getTasks Tests
  // ─────────────────────────────────────────────────────────────

  describe('getTasks', () => {
    const mockTasks = [
      {
        id: 1,
        user_id: 1,
        title: 'Task 1',
        description: 'Description 1',
        status: 'open',
        priority: 'high',
        related_people: '["1", "2"]',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        user_id: 1,
        title: 'Task 2',
        description: 'Description 2',
        status: 'completed',
        priority: 'medium',
        related_people: null,
        created_at: '2024-01-02T00:00:00Z',
      },
    ];

    it('should return tasks for valid userId', async () => {
      mockTaskRepository.find.mockResolvedValue(mockTasks);

      const result = await taskService.getTasks(1);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Task 1');
      expect(result[0].related_people).toEqual(['1', '2']);
      expect(result[1].related_people).toEqual([]);
      expect(mockTaskRepository.find).toHaveBeenCalledWith(
        { user_id: 1 },
        { orderBy: 'created_at', orderDirection: 'DESC' }
      );
    });

    it('should filter by status when provided', async () => {
      mockTaskRepository.find.mockResolvedValue([mockTasks[0]]);

      await taskService.getTasks(1, { status: 'open' });

      expect(mockTaskRepository.find).toHaveBeenCalledWith(
        { user_id: 1, status: 'open' },
        expect.any(Object)
      );
    });

    it('should filter by priority when provided', async () => {
      mockTaskRepository.find.mockResolvedValue([mockTasks[0]]);

      await taskService.getTasks(1, { priority: 'high' });

      expect(mockTaskRepository.find).toHaveBeenCalledWith(
        { user_id: 1, priority: 'high' },
        expect.any(Object)
      );
    });

    it('should not add status filter when status is "all"', async () => {
      mockTaskRepository.find.mockResolvedValue(mockTasks);

      await taskService.getTasks(1, { status: 'all' });

      expect(mockTaskRepository.find).toHaveBeenCalledWith(
        { user_id: 1 },
        expect.any(Object)
      );
    });

    it('should apply search filter to title and description', async () => {
      mockTaskRepository.find.mockResolvedValue(mockTasks);

      const result = await taskService.getTasks(1, { search: 'Task 1' });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Task 1');
    });

    it('should search case-insensitively', async () => {
      mockTaskRepository.find.mockResolvedValue(mockTasks);

      const result = await taskService.getTasks(1, { search: 'TASK 1' });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Task 1');
    });

    it('should search in description', async () => {
      mockTaskRepository.find.mockResolvedValue(mockTasks);

      const result = await taskService.getTasks(1, { search: 'Description 2' });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Task 2');
    });

    it('should throw ValidationError for missing userId', async () => {
      await expect(taskService.getTasks(null)).rejects.toThrow(ValidationError);
      await expect(taskService.getTasks(undefined)).rejects.toThrow(ValidationError);
      await expect(taskService.getTasks(0)).rejects.toThrow(ValidationError);
    });

    it('should parse related_people JSON field', async () => {
      mockTaskRepository.find.mockResolvedValue([
        { ...mockTasks[0], related_people: '["contact1", "contact2"]' },
      ]);

      const result = await taskService.getTasks(1);

      expect(result[0].related_people).toEqual(['contact1', 'contact2']);
    });

    it('should handle invalid JSON in related_people gracefully', async () => {
      mockTaskRepository.find.mockResolvedValue([
        { ...mockTasks[0], related_people: 'invalid json' },
      ]);

      const result = await taskService.getTasks(1);

      expect(result[0].related_people).toEqual([]);
    });

    it('should deduplicate tasks by title keeping completed over open', async () => {
      const duplicateTasks = [
        { id: 1, title: 'Same Title', status: 'open', created_at: '2024-01-01' },
        { id: 2, title: 'Same Title', status: 'completed', created_at: '2024-01-02' },
      ];
      mockTaskRepository.find.mockResolvedValue(duplicateTasks);

      const result = await taskService.getTasks(1);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('completed');
    });

    it('should deduplicate tasks by title keeping most recent when same status', async () => {
      const duplicateTasks = [
        { id: 1, title: 'Same Title', status: 'open', created_at: '2024-01-01' },
        { id: 2, title: 'Same Title', status: 'open', created_at: '2024-01-15' },
      ];
      mockTaskRepository.find.mockResolvedValue(duplicateTasks);

      const result = await taskService.getTasks(1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2); // More recent
    });

    it('should call autoCompleteOnboardingTasks if set', async () => {
      const mockAutoComplete = jest.fn().mockResolvedValue(undefined);
      taskService.setAutoCompleteCallback(mockAutoComplete);
      mockTaskRepository.find.mockResolvedValue(mockTasks);

      await taskService.getTasks(1);

      expect(mockAutoComplete).toHaveBeenCalledWith(1);
      expect(mockTaskRepository.find).toHaveBeenCalledTimes(2); // Initial + refresh
    });

    it('should handle autoCompleteOnboardingTasks errors gracefully', async () => {
      const mockAutoComplete = jest.fn().mockRejectedValue(new Error('Auto-complete error'));
      taskService.setAutoCompleteCallback(mockAutoComplete);
      mockTaskRepository.find.mockResolvedValue(mockTasks);

      // Should not throw
      const result = await taskService.getTasks(1);

      expect(result).toHaveLength(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // createTask Tests
  // ─────────────────────────────────────────────────────────────

  describe('createTask', () => {
    const mockUser = { id: 1, username: 'testuser' };
    const validTaskData = {
      title: 'New Task',
      description: 'Task description',
      priority: 'high',
      status: 'open',
    };

    beforeEach(() => {
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);
      mockTaskRepository.create.mockResolvedValue({ id: 1, ...validTaskData });
    });

    it('should create task successfully', async () => {
      const result = await taskService.createTask('testuser', validTaskData);

      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
      expect(result.message).toBe('Task created successfully');
      expect(mockTaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          title: 'New Task',
          description: 'Task description',
          priority: 'high',
          status: 'open',
        })
      );
    });

    it('should trim title', async () => {
      await taskService.createTask('testuser', { title: '  Trimmed Title  ' });

      expect(mockTaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Trimmed Title' })
      );
    });

    it('should use default values for optional fields', async () => {
      await taskService.createTask('testuser', { title: 'Minimal Task' });

      expect(mockTaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'open',
          priority: 'medium',
          description: null,
          due_date: null,
          assigned_to: null,
        })
      );
    });

    it('should serialize related_people as JSON', async () => {
      await taskService.createTask('testuser', {
        title: 'Task with people',
        related_people: ['contact1', 'contact2'],
      });

      expect(mockTaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          related_people: '["contact1","contact2"]',
        })
      );
    });

    it('should throw ValidationError for missing username', async () => {
      await expect(taskService.createTask(null, validTaskData)).rejects.toThrow(ValidationError);
      await expect(taskService.createTask('', validTaskData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing title', async () => {
      await expect(taskService.createTask('testuser', {})).rejects.toThrow(ValidationError);
      await expect(taskService.createTask('testuser', { title: '' })).rejects.toThrow(
        ValidationError
      );
      await expect(taskService.createTask('testuser', { title: '   ' })).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw NotFoundError for non-existent user', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      await expect(taskService.createTask('nonexistent', validTaskData)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should set created_at and updated_at timestamps', async () => {
      const beforeCreate = new Date();
      await taskService.createTask('testuser', validTaskData);

      const createCall = mockTaskRepository.create.mock.calls[0][0];
      const createdAt = new Date(createCall.created_at);
      const updatedAt = new Date(createCall.updated_at);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    });
  });

  // ─────────────────────────────────────────────────────────────
  // updateTask Tests
  // ─────────────────────────────────────────────────────────────

  describe('updateTask', () => {
    const mockUser = { id: 1, username: 'testuser' };
    const mockTask = {
      id: 1,
      user_id: 1,
      title: 'Original Title',
      status: 'open',
      completed_at: null,
    };

    beforeEach(() => {
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.updateById.mockResolvedValue({ ...mockTask, title: 'Updated Title' });
    });

    it('should update task successfully', async () => {
      const result = await taskService.updateTask(1, 'testuser', { title: 'Updated Title' });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Task updated successfully');
      expect(mockTaskRepository.updateById).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ title: 'Updated Title' })
      );
    });

    it('should trim updated title', async () => {
      await taskService.updateTask(1, 'testuser', { title: '  Trimmed  ' });

      expect(mockTaskRepository.updateById).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ title: 'Trimmed' })
      );
    });

    it('should set completed_at when status changes to completed', async () => {
      const beforeUpdate = new Date();
      await taskService.updateTask(1, 'testuser', { status: 'completed' });

      const updateCall = mockTaskRepository.updateById.mock.calls[0][1];
      expect(updateCall.completed_at).toBeDefined();
      expect(new Date(updateCall.completed_at).getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime()
      );
    });

    it('should clear completed_at when status changes from completed to open', async () => {
      mockTaskRepository.findOne.mockResolvedValue({
        ...mockTask,
        status: 'completed',
        completed_at: '2024-01-01T00:00:00Z',
      });

      await taskService.updateTask(1, 'testuser', { status: 'open' });

      expect(mockTaskRepository.updateById).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ completed_at: null })
      );
    });

    it('should serialize related_people as JSON', async () => {
      await taskService.updateTask(1, 'testuser', {
        related_people: ['contact1'],
      });

      expect(mockTaskRepository.updateById).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ related_people: '["contact1"]' })
      );
    });

    it('should serialize empty related_people array as JSON', async () => {
      await taskService.updateTask(1, 'testuser', {
        related_people: [],
      });

      // Empty array is still JSON serialized (not null)
      expect(mockTaskRepository.updateById).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ related_people: '[]' })
      );
    });

    it('should set related_people to null when explicitly null', async () => {
      await taskService.updateTask(1, 'testuser', {
        related_people: null,
      });

      expect(mockTaskRepository.updateById).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ related_people: null })
      );
    });

    it('should always update updated_at timestamp', async () => {
      await taskService.updateTask(1, 'testuser', { title: 'New Title' });

      const updateCall = mockTaskRepository.updateById.mock.calls[0][1];
      expect(updateCall.updated_at).toBeDefined();
    });

    it('should return task unchanged if no update fields provided', async () => {
      // updateFieldsObj will only have updated_at, which is always added
      // But if called with empty object, no actual fields change
      const result = await taskService.updateTask(1, 'testuser', {});

      // Since updated_at is always added, updateById should still be called
      expect(mockTaskRepository.updateById).toHaveBeenCalled();
    });

    it('should throw ValidationError for missing taskId', async () => {
      await expect(taskService.updateTask(null, 'testuser', {})).rejects.toThrow(ValidationError);
      await expect(taskService.updateTask(0, 'testuser', {})).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing username', async () => {
      await expect(taskService.updateTask(1, null, {})).rejects.toThrow(ValidationError);
      await expect(taskService.updateTask(1, '', {})).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      await expect(taskService.updateTask(1, 'nonexistent', {})).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for task not owned by user', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        taskService.updateTask(999, 'testuser', { title: 'Hack' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should verify task ownership', async () => {
      await taskService.updateTask(1, 'testuser', { title: 'Test' });

      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        id: 1,
        user_id: 1,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // deleteTask Tests
  // ─────────────────────────────────────────────────────────────

  describe('deleteTask', () => {
    const mockUser = { id: 1, username: 'testuser' };
    const mockTask = { id: 1, user_id: 1, title: 'Task to delete' };

    beforeEach(() => {
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.deleteById.mockResolvedValue(undefined);
    });

    it('should delete task successfully', async () => {
      const result = await taskService.deleteTask(1, 'testuser');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Task deleted successfully');
      expect(mockTaskRepository.deleteById).toHaveBeenCalledWith(1);
    });

    it('should throw ValidationError for missing taskId', async () => {
      await expect(taskService.deleteTask(null, 'testuser')).rejects.toThrow(ValidationError);
      await expect(taskService.deleteTask(0, 'testuser')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing username', async () => {
      await expect(taskService.deleteTask(1, null)).rejects.toThrow(ValidationError);
      await expect(taskService.deleteTask(1, '')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      await expect(taskService.deleteTask(1, 'nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for task not owned by user', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(taskService.deleteTask(999, 'testuser')).rejects.toThrow(NotFoundError);
    });

    it('should verify task ownership before deletion', async () => {
      await taskService.deleteTask(1, 'testuser');

      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        id: 1,
        user_id: 1,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // generateTask Tests
  // ─────────────────────────────────────────────────────────────

  describe('generateTask', () => {
    const originalEnv = process.env.OPENAI_API_KEY;

    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    afterEach(() => {
      process.env.OPENAI_API_KEY = originalEnv;
    });

    it('should throw ValidationError for missing task details', async () => {
      await expect(taskService.generateTask(null)).rejects.toThrow(ValidationError);
      await expect(taskService.generateTask('')).rejects.toThrow(ValidationError);
      await expect(taskService.generateTask('   ')).rejects.toThrow(ValidationError);
    });

    it('should throw ExternalServiceError when API key is not configured', async () => {
      process.env.OPENAI_API_KEY = '';

      await expect(taskService.generateTask('Create a task')).rejects.toThrow(
        ExternalServiceError
      );
    });

    it('should throw ExternalServiceError when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY;

      await expect(taskService.generateTask('Create a task')).rejects.toThrow(
        ExternalServiceError
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Private Helper Methods Tests
  // ─────────────────────────────────────────────────────────────

  describe('_parseJsonField', () => {
    it('should parse valid JSON array', () => {
      const result = taskService._parseJsonField('["a", "b"]');
      expect(result).toEqual(['a', 'b']);
    });

    it('should return empty array for null', () => {
      const result = taskService._parseJsonField(null);
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      const result = taskService._parseJsonField(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array for invalid JSON', () => {
      const result = taskService._parseJsonField('not valid json');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const result = taskService._parseJsonField('');
      expect(result).toEqual([]);
    });
  });

  describe('_parseAiResponse', () => {
    it('should parse valid JSON response', () => {
      const response = '{"title": "Test", "description": "Desc", "priority": "high"}';
      const result = taskService._parseAiResponse(response, 'fallback');

      expect(result.title).toBe('Test');
      expect(result.description).toBe('Desc');
      expect(result.priority).toBe('high');
    });

    it('should extract JSON from response with surrounding text', () => {
      const response = 'Here is your task: {"title": "Test", "priority": "low"} Hope this helps!';
      const result = taskService._parseAiResponse(response, 'fallback');

      expect(result.title).toBe('Test');
      expect(result.priority).toBe('low');
    });

    it('should throw ExternalServiceError for invalid JSON', () => {
      const response = 'This is not JSON at all';

      expect(() => taskService._parseAiResponse(response, 'fallback')).toThrow(
        ExternalServiceError
      );
    });

    it('should parse multiline JSON response', () => {
      const response = `{
        "title": "Multiline Test",
        "description": "A longer description",
        "priority": "medium"
      }`;
      const result = taskService._parseAiResponse(response, 'fallback');

      expect(result.title).toBe('Multiline Test');
    });
  });

  describe('setAutoCompleteCallback', () => {
    it('should set the auto-complete callback', () => {
      const callback = jest.fn();
      taskService.setAutoCompleteCallback(callback);

      expect(taskService.autoCompleteOnboardingTasks).toBe(callback);
    });
  });
});
