/**
 * Task Service
 *
 * Actor: Product/UX (task management flows)
 * Responsibility: Task CRUD operations, filtering, and AI generation
 *
 * Consolidates task-related business logic from task routes.
 */

const { BaseService } = require('../BaseService');
const { NotFoundError, ValidationError, ExternalServiceError } = require('../errors');
const { PostgresTaskRepository, PostgresUserRepository } = require('../../repositories');

class TaskService extends BaseService {
  constructor() {
    // Use task repository instead of direct table access
    super(null, new PostgresTaskRepository());
    this.taskRepository = this.repository; // Alias for clarity
    this.userRepository = new PostgresUserRepository();
    this.autoCompleteOnboardingTasks = null;
  }

  /**
   * Set the auto-complete callback (injected from server.js)
   */
  setAutoCompleteCallback(callback) {
    this.autoCompleteOnboardingTasks = callback;
  }

  /**
   * Get tasks for a user with optional filtering
   * @param {number} userId - User ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} User's tasks
   */
  async getTasks(userId, options = {}) {
    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    const { status, priority, search } = options;

    // Use repository method instead of raw SQL
    const queryOptions = {
      orderBy: 'created_at',
      orderDirection: 'DESC',
    };

    // Build conditions for repository find method
    const conditions = { user_id: userId };
    if (status && status !== 'all') {
      conditions.status = status;
    }
    if (priority && priority !== 'all') {
      conditions.priority = priority;
    }

    let tasks = await this.taskRepository.find(conditions, queryOptions);

    // Auto-complete onboarding tasks if callback is set
    if (this.autoCompleteOnboardingTasks) {
      try {
        await this.autoCompleteOnboardingTasks(userId);
        // Refresh tasks after auto-complete
        tasks = await this.taskRepository.find(conditions, queryOptions);
      } catch (error) {
        console.error('Error auto-completing onboarding tasks:', error);
      }
    }

    // Parse JSON fields
    tasks = tasks.map(task => ({
      ...task,
      related_people: this._parseJsonField(task.related_people),
    }));

    // Deduplicate tasks by title (keep the most recent one, or completed if one exists)
    // This prevents duplicate "Welcome to LiaiZen" tasks from showing
    const taskMap = new Map();
    const duplicateTitles = new Set();

    for (const task of tasks) {
      const taskTitle = (task.title || '').trim();
      if (!taskTitle) continue; // Skip tasks without titles

      const existing = taskMap.get(taskTitle);
      if (!existing) {
        taskMap.set(taskTitle, task);
      } else {
        duplicateTitles.add(taskTitle);
        // If we have a duplicate, prefer:
        // 1. Completed over open
        // 2. Most recent if same status
        const existingIsCompleted = existing.status === 'completed';
        const taskIsCompleted = task.status === 'completed';
        const existingDate = new Date(existing.created_at || 0);
        const taskDate = new Date(task.created_at || 0);

        let keepExisting = false;
        if (existingIsCompleted && !taskIsCompleted) {
          keepExisting = true; // Prefer completed
        } else if (!existingIsCompleted && taskIsCompleted) {
          keepExisting = false; // Prefer completed (the new one)
        } else {
          // Same status - prefer most recent
          keepExisting = existingDate >= taskDate;
        }

        if (!keepExisting) {
          taskMap.set(taskTitle, task);
        }
      }
    }

    // Log duplicates for debugging
    if (duplicateTitles.size > 0) {
      console.warn(
        `[TaskService] Found duplicate tasks for user ${userId}:`,
        Array.from(duplicateTitles)
      );
    }

    tasks = Array.from(taskMap.values());

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      tasks = tasks.filter(
        task =>
          task.title.toLowerCase().includes(searchLower) ||
          (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }

    return tasks;
  }

  /**
   * Create a new task
   * @param {string} username - Username
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} Created task info
   */
  async createTask(username, taskData) {
    if (!username) {
      throw new ValidationError('Username is required', 'username');
    }
    if (!taskData?.title?.trim()) {
      throw new ValidationError('Title is required', 'title');
    }

    const user = await this._getUserByUsername(username);
    const now = new Date().toISOString();

    const task = await this.taskRepository.create({
      user_id: user.id,
      title: taskData.title.trim(),
      description: taskData.description || null,
      status: taskData.status || 'open',
      priority: taskData.priority || 'medium',
      due_date: taskData.due_date || null,
      assigned_to: taskData.assigned_to || null,
      related_people: taskData.related_people ? JSON.stringify(taskData.related_people) : null,
      created_at: now,
      updated_at: now,
    });

    return {
      success: true,
      id: task.id,
      message: 'Task created successfully',
    };
  }

  /**
   * Update a task
   * @param {number} taskId - Task ID
   * @param {string} username - Username (for ownership verification)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  async updateTask(taskId, username, updateData) {
    if (!taskId) {
      throw new ValidationError('Task ID is required', 'taskId');
    }
    if (!username) {
      throw new ValidationError('Username is required', 'username');
    }

    const user = await this._getUserByUsername(username);
    const task = await this._verifyTaskOwnership(taskId, user.id);

    // Build update data object, filtering out undefined values and formatting
    const updateFieldsObj = {};
    if (updateData.title !== undefined) {
      updateFieldsObj.title = updateData.title.trim();
    }
    if (updateData.description !== undefined) {
      updateFieldsObj.description = updateData.description || null;
    }
    if (updateData.status !== undefined) {
      updateFieldsObj.status = updateData.status;
      // Handle completed_at based on status
      if (updateData.status === 'completed') {
        updateFieldsObj.completed_at = new Date().toISOString();
      } else if (updateData.status === 'open' && task.completed_at) {
        updateFieldsObj.completed_at = null;
      }
    }
    if (updateData.priority !== undefined) {
      updateFieldsObj.priority = updateData.priority;
    }
    if (updateData.due_date !== undefined) {
      updateFieldsObj.due_date = updateData.due_date || null;
    }
    if (updateData.assigned_to !== undefined) {
      updateFieldsObj.assigned_to = updateData.assigned_to || null;
    }
    if (updateData.related_people !== undefined) {
      updateFieldsObj.related_people = updateData.related_people
        ? JSON.stringify(updateData.related_people)
        : null;
    }

    // Always update updated_at
    updateFieldsObj.updated_at = new Date().toISOString();

    if (Object.keys(updateFieldsObj).length === 0) {
      return task;
    }

    await this.taskRepository.updateById(taskId, updateFieldsObj);

    return {
      success: true,
      message: 'Task updated successfully',
    };
  }

  /**
   * Delete a task
   * @param {number} taskId - Task ID
   * @param {string} username - Username (for ownership verification)
   * @returns {Promise<Object>} Delete result
   */
  async deleteTask(taskId, username) {
    if (!taskId) {
      throw new ValidationError('Task ID is required', 'taskId');
    }
    if (!username) {
      throw new ValidationError('Username is required', 'username');
    }

    const user = await this._getUserByUsername(username);
    await this._verifyTaskOwnership(taskId, user.id);

    await this.taskRepository.deleteById(taskId);

    return {
      success: true,
      message: 'Task deleted successfully',
    };
  }

  /**
   * Generate task using AI
   * @param {string} taskDetails - Task description from user
   * @returns {Promise<Object>} Generated task data
   */
  async generateTask(taskDetails) {
    if (!taskDetails?.trim()) {
      throw new ValidationError('Task details are required', 'taskDetails');
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
      throw new ExternalServiceError('AI service is not configured');
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are a helpful task management assistant for a co-parenting app. Based on the following task description, create a well-structured task with:
- A clear, concise title (max 60 characters)
- A detailed description that expands on the task
- An appropriate priority level (low, medium, or high)
- A suggested due date if applicable (format: YYYY-MM-DD, or null if not applicable)

Task description from user: "${taskDetails}"

Respond in JSON format only with this structure:
{
  "title": "Task title here",
  "description": "Detailed description here",
  "priority": "medium",
  "due_date": "2024-12-31" or null
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful task management assistant. Always respond with valid JSON only, no additional text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content.trim();
      const taskData = this._parseAiResponse(response, taskDetails);

      return {
        success: true,
        task: {
          title: (taskData.title || taskDetails.substring(0, 60)).trim(),
          description: (taskData.description || taskDetails).trim(),
          priority: ['low', 'medium', 'high'].includes(taskData.priority?.toLowerCase())
            ? taskData.priority.toLowerCase()
            : 'medium',
          due_date: taskData.due_date || null,
          status: 'open',
        },
      };
    } catch (error) {
      console.error('Error generating task with AI:', error);
      throw new ExternalServiceError('Failed to generate task: ' + error.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Private Helper Methods
  // ─────────────────────────────────────────────────────────────

  async _getUserByUsername(username) {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      throw new NotFoundError('User', username);
    }

    return user;
  }

  async _verifyTaskOwnership(taskId, userId) {
    const task = await this.taskRepository.findOne({
      id: parseInt(taskId),
      user_id: userId,
    });

    if (!task) {
      throw new NotFoundError('Task', taskId);
    }

    return task;
  }

  _parseJsonField(value) {
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  _parseAiResponse(response, fallbackDetails) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new ExternalServiceError('Failed to parse AI response. Please try again.');
    }
  }
}

// Export singleton instance
const taskService = new TaskService();

module.exports = { taskService, TaskService };

module.exports = { taskService, TaskService };
