/**
 * AI Routes
 * @di-pattern: injected
 *
 * Handles AI-powered features including task generation and message mediation.
 * Extracted from server.js for better maintainability.
 *
 * ARCHITECTURE: Route handlers should only:
 * 1. Validate input
 * 2. Call service/use case
 * 3. Return result
 *
 * Business logic belongs in services, not route handlers.
 */

const express = require('express');
const router = express.Router();

const { verifyAuth } = require('../middleware/auth');
const { handleServiceError } = require('../middleware/errorHandlers');

const { defaultLogger: defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'ai',
});

// Service references - set from server.js
let aiMediator;
let mediationService;

router.setHelpers = function (helpers) {
  aiMediator = helpers.aiMediator;
  mediationService = helpers.mediationService;
};

// ========================================
// AI Task Generation
// ========================================

/**
 * POST /api/tasks/generate
 * Generate task using AI
 */
router.post('/tasks/generate', async (req, res) => {
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

    // Parse JSON response
    let taskData;
    try {
      // Remove any markdown code blocks if present
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        taskData = JSON.parse(jsonMatch[0]);
      } else {
        taskData = JSON.parse(response);
      }
    } catch (parseError) {
      logger.error('Error parsing AI response', {
        parseError: parseError,
      });
      logger.error('AI response was', {
        response: response,
      });
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    // Validate and sanitize the response
    const generatedTask = {
      title: (taskData.title || taskDetails.substring(0, 60)).trim(),
      description: (taskData.description || taskDetails).trim(),
      priority: ['low', 'medium', 'high'].includes(taskData.priority?.toLowerCase())
        ? taskData.priority.toLowerCase()
        : 'medium',
      due_date: taskData.due_date || null,
      status: 'open',
    };

    res.json({
      success: true,
      task: generatedTask,
    });
  } catch (error) {
    logger.error('Error generating task with AI', {
      error: error,
    });
    res.status(500).json({ error: error.message || 'Failed to generate task' });
  }
});

// ========================================
// Observer/Mediator Analysis
// ========================================

/**
 * POST /api/mediate/analyze
 * Analyze message using Observer/Mediator framework
 *
 * Route Handler Responsibilities:
 * 1. Validate input (text is required)
 * 2. Call service (mediationService.analyzeMessage)
 * 3. Return result (or handle errors)
 *
 * All business logic (database queries, data formatting, etc.) is in MediationService.
 */
router.post('/mediate/analyze', verifyAuth, async (req, res) => {
  try {
    const { text, senderProfile = {}, receiverProfile = {} } = req.body;

    // 1. Validate input
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    if (!mediationService) {
      logger.error('❌ mediationService is not initialized!');
      return res.status(500).json({ error: 'Mediation service not available' });
    }

    const user = req.user;
    // Use email as primary identifier (migrated from username)
    const userIdentifier = user?.email || user?.username;
    logger.debug('🔍 /api/mediate/analyze called', {
      ...{
        text: text.substring(0, 50),
        identifier: userIdentifier,
      },
    });

    // 2. Call service (all business logic is in the service)
    const result = await mediationService.analyzeMessage({
      text,
      username: userIdentifier, // Use email as identifier (service accepts email)
      senderProfile,
      receiverProfile,
    });

    logger.debug('📤 Sending response', {
      ...{
        action: result.action,
        hasIntervention: !!result.intervention,
      },
    });

    // 3. Return result
    res.json(result);
  } catch (error) {
    logger.error('❌ Error analyzing message', {
      error: error,
    });
    logger.error('Error stack', {
      stack: error.stack,
    });

    // Use service error handler for proper error formatting
    return handleServiceError(error, res, {
      defaultMessage: 'Failed to analyze message',
      logError: true,
    });
  }
});

module.exports = router;
