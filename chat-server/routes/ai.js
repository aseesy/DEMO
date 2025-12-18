/**
 * AI Routes
 *
 * Handles AI-powered features including task generation and message mediation.
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();

const dbSafe = require('../dbSafe');
const db = require('../dbPostgres');
const { verifyAuth } = require('../middleware/auth');

// Service references - set from server.js
let aiMediator;

router.setHelpers = function(helpers) {
  aiMediator = helpers.aiMediator;
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
      // Remove any markdown code blocks if present
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        taskData = JSON.parse(jsonMatch[0]);
      } else {
        taskData = JSON.parse(response);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('AI response was:', response);
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

// ========================================
// Observer/Mediator Analysis
// ========================================

/**
 * POST /api/mediate/analyze
 * Analyze message using Observer/Mediator framework
 */
router.post('/mediate/analyze', verifyAuth, async (req, res) => {
  try {
    const { text, senderProfile = {}, receiverProfile = {} } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const user = req.user;

    // Get recent messages for context
    const userResult = await dbSafe.safeSelect('users', { username: user.username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;
    const roomId = user.roomId || null;

    // Get recent messages
    let recentMessages = [];
    if (roomId) {
      const messagesQuery = `
        SELECT * FROM messages
        WHERE room_id = $1
        ORDER BY timestamp DESC
        LIMIT 15
      `;
      const messagesResult = await db.query(messagesQuery, [roomId]);
      recentMessages = messagesResult.rows.length > 0 ? messagesResult.rows.reverse() : [];
    }

    // Get participant usernames
    const participantUsernames = roomId
      ? await dbSafe.safeSelect('room_members', { room_id: roomId })
          .then(result => dbSafe.parseResult(result).map(m => m.username))
      : [user.username];

    // Get contacts for context
    const contactsResult = await dbSafe.safeSelect('contacts', { user_id: userId });
    const contactsData = dbSafe.parseResult(contactsResult);

    // Format as objects for mediator (used by language analyzer for child detection)
    const existingContacts = contactsData.map(c => ({
      name: c.contact_name,
      relationship: c.relationship || 'contact',
    }));

    // Format contact context string for AI prompt
    const contactContextForAI = contactsData.length > 0
      ? contactsData.map(c => `${c.contact_name} (${c.relationship || 'contact'})`).join(', ')
      : null;

    // Create message object for analysis
    const message = {
      text: text.trim(),
      username: user.username,
      timestamp: new Date().toISOString(),
    };

    // Analyze using the Observer/Mediator framework
    const analysis = await aiMediator.analyzeMessage(
      message,
      recentMessages,
      participantUsernames,
      existingContacts,
      contactContextForAI,
      roomId,
      null, // taskContextForAI
      null, // flaggedMessagesContext
      null  // roleContext (can be enhanced with senderProfile/receiverProfile)
    );

    if (!analysis) {
      // No intervention needed (STAY_SILENT)
      return res.json({
        action: 'STAY_SILENT',
        escalation: { riskLevel: 'low', confidence: 0, reasons: [] },
        emotion: {
          currentEmotion: 'neutral',
          stressLevel: 0,
          stressTrajectory: 'stable',
          emotionalMomentum: 0,
          triggers: [],
          conversationEmotion: 'neutral',
        },
        intervention: null,
        originalText: text.trim(),
      });
    }

    // Map the mediator's return format to the expected API format
    const result = {
      action: analysis.action || 'STAY_SILENT',
      escalation: analysis.escalation || {
        riskLevel: 'low',
        confidence: 0,
        reasons: [],
      },
      emotion: analysis.emotion || {
        currentEmotion: 'neutral',
        stressLevel: 0,
        stressTrajectory: 'stable',
        emotionalMomentum: 0,
        triggers: [],
        conversationEmotion: 'neutral',
      },
      intervention: null,
      originalText: text.trim(),
    };

    // Map intervention data based on type
    // Note: AI mediator returns 'validation' and 'insight' (new names)
    // We map to 'personalMessage' and 'tip1' for backwards compatibility with client
    if (analysis.type === 'ai_intervention' && analysis.action === 'INTERVENE') {
      result.intervention = {
        personalMessage: analysis.validation || analysis.personalMessage || '',
        tip1: analysis.insight || analysis.tip1 || '',
        rewrite1: analysis.rewrite1 || '',
        rewrite2: analysis.rewrite2 || '',
        comment: null,
      };
    } else if (analysis.type === 'ai_comment' && analysis.action === 'COMMENT') {
      result.intervention = {
        personalMessage: null,
        tip1: null,
        rewrite1: null,
        rewrite2: null,
        comment: analysis.text || '',
      };
    }

    res.json(result);
  } catch (error) {
    console.error('Error analyzing message:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
