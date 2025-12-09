/**
 * Task Routes
 *
 * Handles task management including CRUD operations and AI generation.
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();

const dbSafe = require('../dbSafe');
const db = require('../dbPostgres');
const { verifyAuth } = require('../middleware/auth');

// Helper functions placeholder - set from server.js
let autoCompleteOnboardingTasks;
let backfillOnboardingTasks;

router.setHelpers = function(helpers) {
  autoCompleteOnboardingTasks = helpers.autoCompleteOnboardingTasks;
  backfillOnboardingTasks = helpers.backfillOnboardingTasks;
};

/**
 * GET /api/tasks
 * Get user's tasks with optional filtering
 */
router.get('/', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get tasks with optional filtering
    const status = req.query.status || req.query.filter;
    const search = req.query.search;
    const priority = req.query.priority;

    // Build filter conditions
    const filterConditions = { user_id: userId };

    if (status && status !== 'all') {
      filterConditions.status = status;
    }

    if (priority && priority !== 'all') {
      filterConditions.priority = priority;
    }

    let tasks = await dbSafe.safeSelect('tasks', filterConditions, {
      orderBy: 'created_at',
      orderDirection: 'DESC'
    });

    // Auto-complete onboarding tasks if conditions are met
    if (autoCompleteOnboardingTasks) {
      try {
        await autoCompleteOnboardingTasks(userId);
        tasks = await dbSafe.safeSelect('tasks', filterConditions, {
          orderBy: 'created_at',
          orderDirection: 'DESC'
        });
      } catch (error) {
        console.error('Error auto-completing onboarding tasks:', error);
      }
    }

    // Parse JSON fields
    tasks = tasks.map(task => {
      if (task.related_people) {
        try {
          task.related_people = JSON.parse(task.related_people);
        } catch (e) {
          task.related_people = [];
        }
      } else {
        task.related_people = [];
      }
      return task;
    });

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      tasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', async (req, res) => {
  try {
    const { username, title, description, status, priority, due_date, assigned_to, related_people } = req.body;

    if (!username || !title || !title.trim()) {
      return res.status(400).json({ error: 'Username and title are required' });
    }

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;
    const now = new Date().toISOString();

    const taskId = await dbSafe.safeInsert('tasks', {
      user_id: userId,
      title: title.trim(),
      description: description || null,
      status: status || 'open',
      priority: priority || 'medium',
      due_date: due_date || null,
      assigned_to: assigned_to || null,
      related_people: related_people ? JSON.stringify(related_people) : null,
      created_at: now,
      updated_at: now,
      completed_at: null
    });

    res.json({
      success: true,
      id: taskId,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/tasks/:taskId
 * Update a task
 */
router.put('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { username, title, description, status, priority, due_date, assigned_to, related_people } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify task belongs to user
    const taskResult = await dbSafe.safeSelect('tasks', { id: parseInt(taskId), user_id: userId }, { limit: 1 });
    const tasks = dbSafe.parseResult(taskResult);

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description || null;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'open' && tasks[0].completed_at) {
        updateData.completed_at = null;
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (due_date !== undefined) updateData.due_date = due_date || null;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to || null;
    if (related_people !== undefined) updateData.related_people = related_people ? JSON.stringify(related_people) : null;

    await dbSafe.safeUpdate('tasks', updateData, { id: parseInt(taskId) });

    res.json({
      success: true,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/tasks/:taskId
 * Delete a task
 */
router.delete('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const username = req.query.username || req.body.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Get user
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify task belongs to user
    const taskResult = await dbSafe.safeSelect('tasks', { id: parseInt(taskId), user_id: userId }, { limit: 1 });
    const tasks = dbSafe.parseResult(taskResult);

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await dbSafe.safeDelete('tasks', { id: parseInt(taskId) });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tasks/generate
 * Generate task using AI
 */
router.post('/generate', async (req, res) => {
  try {
    const { username, taskDetails } = req.body;

    if (!username || !taskDetails || !taskDetails.trim()) {
      return res.status(400).json({ error: 'Username and task details are required' });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
      return res.status(503).json({ error: 'AI service is not configured' });
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful task management assistant. Always respond with valid JSON only, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content.trim();

    // Parse JSON response
    let taskData;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        taskData = JSON.parse(jsonMatch[0]);
      } else {
        taskData = JSON.parse(response);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    const generatedTask = {
      title: (taskData.title || taskDetails.substring(0, 60)).trim(),
      description: (taskData.description || taskDetails).trim(),
      priority: ['low', 'medium', 'high'].includes(taskData.priority?.toLowerCase())
        ? taskData.priority.toLowerCase()
        : 'medium',
      due_date: taskData.due_date || null,
      status: 'open'
    };

    res.json({
      success: true,
      task: generatedTask
    });
  } catch (error) {
    console.error('Error generating task with AI:', error);
    res.status(500).json({ error: error.message || 'Failed to generate task' });
  }
});

module.exports = router;
