/**
 * Mediation Service
 *
 * Actor: AI Mediation System
 * Responsibility: Message analysis, context gathering, and mediation orchestration
 *
 * Handles all business logic for message mediation:
 * - User and room context retrieval
 * - Contact data formatting
 * - Message analysis orchestration
 * - Response formatting
 */

const { BaseService } = require('../BaseService');
const { NotFoundError, ValidationError } = require('../errors');
const { PostgresGenericRepository } = require('../../repositories');
const dbSafe = require('../../../dbSafe');
const db = require('../../../dbPostgres');

class MediationService extends BaseService {
  constructor() {
    super(); // No default table - uses multiple repositories
    this.userRepository = new PostgresGenericRepository('users');
    this.roomMemberRepository = new PostgresGenericRepository('room_members');
    this.contactRepository = new PostgresGenericRepository('contacts');
    this.messageRepository = new PostgresGenericRepository('messages');
    this.aiMediator = null; // Injected via setAiMediator
  }

  /**
   * Set the AI mediator instance (injected from server.js)
   * @param {Object} aiMediator - AI mediator instance
   */
  setAiMediator(aiMediator) {
    this.aiMediator = aiMediator;
  }

  /**
   * Get user by username or email
   * @param {string} identifier - Username or email (case-insensitive)
   * @returns {Promise<Object>} User object with id
   * @throws {NotFoundError} If user not found
   */
  async getUserByUsername(identifier) {
    if (!identifier) {
      throw new ValidationError('Username or email is required', 'username');
    }

    const lowerIdentifier = identifier.toLowerCase();

    // Try to find by email first (most users use email now)
    let userResult = await dbSafe.safeSelect('users', { email: lowerIdentifier }, { limit: 1 });
    let users = dbSafe.parseResult(userResult);

    // If not found by email, try username
    if (users.length === 0) {
      userResult = await dbSafe.safeSelect('users', { username: lowerIdentifier }, { limit: 1 });
      users = dbSafe.parseResult(userResult);
    }

    if (users.length === 0) {
      throw new NotFoundError('User', identifier);
    }

    return users[0];
  }

  /**
   * Get user's room ID
   * @param {number} userId - User ID
   * @returns {Promise<string|null>} Room ID or null if user has no room
   */
  async getUserRoomId(userId) {
    if (!userId) {
      return null;
    }

    const roomMembersResult = await dbSafe.safeSelect(
      'room_members',
      { user_id: userId },
      { limit: 1 }
    );
    const roomMembers = dbSafe.parseResult(roomMembersResult);

    if (roomMembers && roomMembers.length > 0) {
      return roomMembers[0].room_id;
    }

    return null;
  }

  /**
   * Get recent messages for a room
   * @param {string} roomId - Room ID
   * @param {number} limit - Maximum number of messages (default: 15)
   * @returns {Promise<Array>} Array of message objects
   */
  async getRecentMessages(roomId, limit = 15) {
    if (!roomId) {
      return [];
    }

    const messagesQuery = `
      SELECT * FROM messages
      WHERE room_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;
    const messagesResult = await db.query(messagesQuery, [roomId, limit]);
    return messagesResult.rows.length > 0 ? messagesResult.rows.reverse() : [];
  }

  /**
   * Get participant emails for a room
   * @param {string} roomId - Room ID
   * @param {string} fallbackEmail - Email to use if no room found
   * @returns {Promise<Array<string>>} Array of emails
   */
  async getParticipantUsernames(roomId, fallbackEmail) {
    if (!roomId) {
      return [fallbackEmail];
    }

    // Join room_members with users to get emails
    const query = `
      SELECT u.email
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = $1
    `;
    const result = await db.query(query, [roomId]);

    if (result.rows && result.rows.length > 0) {
      return result.rows.map(r => r.email);
    }

    return [fallbackEmail];
  }

  /**
   * Get and format contacts for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Object with existingContacts array and contactContextForAI string
   */
  async getContactContext(userId) {
    if (!userId) {
      return {
        existingContacts: [],
        contactContextForAI: null,
      };
    }

    const contactsResult = await dbSafe.safeSelect('contacts', { user_id: userId });
    const contactsData = dbSafe.parseResult(contactsResult);

    // Format as objects for mediator (used by language analyzer for child detection)
    const existingContacts = contactsData.map(c => ({
      name: c.contact_name,
      relationship: c.relationship || 'contact',
    }));

    // Format contact context string for AI prompt
    const contactContextForAI =
      contactsData.length > 0
        ? contactsData.map(c => `${c.contact_name} (${c.relationship || 'contact'})`).join(', ')
        : null;

    return {
      existingContacts,
      contactContextForAI,
    };
  }

  /**
   * Format analysis result for API response
   * @param {Object|null} analysis - Analysis result from AI mediator
   * @param {string} originalText - Original message text
   * @returns {Object} Formatted response object
   */
  formatAnalysisResponse(analysis, originalText) {
    if (!analysis) {
      // No intervention needed (STAY_SILENT)
      return {
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
        originalText: originalText.trim(),
      };
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
      originalText: originalText.trim(),
    };

    // Map intervention data based on type
    // Note: AI mediator returns 'validation' (removed 'insight' per user request)
    // We map to 'personalMessage' for backwards compatibility with client
    if (analysis.type === 'ai_intervention' && analysis.action === 'INTERVENE') {
      result.intervention = {
        personalMessage: analysis.validation || analysis.personalMessage || '',
        tip1: '', // Removed per user request - no longer showing "why this matters"
        refocusQuestions: analysis.refocusQuestions || [],
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

    return result;
  }

  /**
   * Analyze a message for mediation
   *
   * This is the main use case method that orchestrates all the business logic:
   * 1. Get room context (using userId from JWT)
   * 2. Get recent messages
   * 3. Get participant information
   * 4. Get contact context
   * 5. Call AI mediator
   * 6. Format response
   *
   * @param {Object} params - Analysis parameters
   * @param {string} params.text - Message text to analyze
   * @param {number} params.userId - User ID from JWT token
   * @param {string} params.email - User email for message attribution
   * @param {Object} [params.senderProfile] - Optional sender profile
   * @param {Object} [params.receiverProfile] - Optional receiver profile
   * @returns {Promise<Object>} Formatted analysis response
   * @throws {ValidationError} If required parameters missing
   */
  async analyzeMessage({ text, userId, email, senderProfile = {}, receiverProfile = {} }) {
    if (!text || !text.trim()) {
      throw new ValidationError('Message text is required', 'text');
    }

    if (!userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    if (!this.aiMediator) {
      throw new Error('AI mediator not available');
    }

    // userId comes directly from JWT - no lookup needed

    // 2. Get room context
    const roomId = await this.getUserRoomId(userId);

    // 3. Get recent messages
    const recentMessages = await this.getRecentMessages(roomId);

    // 4. Get participant emails/usernames
    const participantUsernames = await this.getParticipantUsernames(roomId, email);

    // 5. Get contact context
    const { existingContacts, contactContextForAI } = await this.getContactContext(userId);

    // 6. Create message object for analysis
    const message = {
      text: text.trim(),
      username: email, // Use email as identifier
      timestamp: new Date().toISOString(),
    };

    // 7. Call AI mediator
    const analysis = await this.aiMediator.analyzeMessage(
      message,
      recentMessages,
      participantUsernames,
      existingContacts,
      contactContextForAI,
      roomId,
      null, // taskContextForAI
      null, // flaggedMessagesContext
      null // roleContext (can be enhanced with senderProfile/receiverProfile)
    );

    // 8. Format and return response
    return this.formatAnalysisResponse(analysis, text);
  }
}

// Export singleton instance
const mediationService = new MediationService();

module.exports = { mediationService, MediationService };
