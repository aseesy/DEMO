/**
 * Task Routes
 *
 * Handles task management including CRUD operations and AI generation.
 * Business logic delegated to services layer.
 *
 * Actor: Product/UX
 */

const express = require('express');
const router = express.Router();

const { verifyAuth } = require('../middleware/auth');
const { handleServiceError } = require('../middleware/errorHandlers');
const { taskService } = require('../src/services');

router.setHelpers = function (helpers) {
  if (helpers.autoCompleteOnboardingTasks) {
    taskService.setAutoCompleteCallback(helpers.autoCompleteOnboardingTasks);
  }
};

// ============================================
// Task CRUD Endpoints
// ============================================

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

    const tasks = await taskService.getTasks(userId, {
      status: req.query.status || req.query.filter,
      priority: req.query.priority,
      search: req.query.search,
    });

    res.json(tasks);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', verifyAuth, async (req, res) => {
  try {
    const { username, ...taskData } = req.body;
    const result = await taskService.createTask(username, taskData);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * PUT /api/tasks/:taskId
 * Update a task
 */
router.put('/:taskId', verifyAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { username, ...updateData } = req.body;
    const result = await taskService.updateTask(parseInt(taskId), username, updateData);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

/**
 * DELETE /api/tasks/:taskId
 * Delete a task
 */
router.delete('/:taskId', verifyAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const username = req.query.username || req.body.username;
    const result = await taskService.deleteTask(parseInt(taskId), username);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// ============================================
// AI Generation Endpoint
// ============================================

/**
 * POST /api/tasks/generate
 * Generate task using AI
 */
router.post('/generate', verifyAuth, async (req, res) => {
  try {
    const { taskDetails } = req.body;
    const result = await taskService.generateTask(taskDetails);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
});

module.exports = router;
