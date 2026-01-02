/**
 * Message Service
 *
 * Business logic layer for message operations.
 * Handles validation, formatting, and business rules.
 *
 * @module services/messages/messageService
 */

const MessageRepository = require('../../repositories/postgres/MessageRepository');
const { buildUserObject } = require('../../../socketHandlers/utils');
const dbPostgres = require('../../../dbPostgres');

class MessageService {
  constructor() {
    this.repository = new MessageRepository();
  }

  /**
   * Get messages for a room
   * @param {string} roomId - Room ID
   * @param {Object} options - Query options
   * @param {string} userEmail - Current user email (for receiver resolution)
   * @returns {Promise<Object>} { messages, total, hasMore, limit, offset }
   */
  async getRoomMessages(roomId, options = {}, userEmail = null) {
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Invalid roomId: must be a non-empty string');
    }

    const result = await this.repository.findByRoomId(roomId, options);
    
    // Resolve receivers for messages
    if (userEmail && result.messages.length > 0) {
      const roomMembers = await this._getRoomMembers(roomId);
      result.messages = this._resolveReceivers(result.messages, roomMembers, userEmail);
    }

    return result;
  }

  /**
   * Get messages for a thread
   * @param {string} threadId - Thread ID
   * @param {Object} options - Query options
   * @param {string} userEmail - Current user email (for receiver resolution)
   * @returns {Promise<Object>} { messages, total, hasMore, limit, offset }
   */
  async getThreadMessages(threadId, options = {}, userEmail = null) {
    if (!threadId || typeof threadId !== 'string') {
      throw new Error('Invalid threadId: must be a non-empty string');
    }

    const result = await this.repository.findByThreadId(threadId, options);
    
    // Get room ID from first message to resolve receivers
    if (userEmail && result.messages.length > 0) {
      const roomId = result.messages[0].roomId;
      if (roomId) {
        const roomMembers = await this._getRoomMembers(roomId);
        result.messages = this._resolveReceivers(result.messages, roomMembers, userEmail);
      }
    }

    return result;
  }

  /**
   * Get a single message by ID
   * @param {string} messageId - Message ID
   * @param {string} userEmail - Current user email (for receiver resolution)
   * @returns {Promise<Object|null>} Message or null
   */
  async getMessage(messageId, userEmail = null) {
    if (!messageId || typeof messageId !== 'string') {
      throw new Error('Invalid messageId: must be a non-empty string');
    }

    const message = await this.repository.findById(messageId);
    if (!message) {
      return null;
    }

    // Resolve receiver if room ID available
    if (userEmail && message.roomId) {
      const roomMembers = await this._getRoomMembers(message.roomId);
      const messages = this._resolveReceivers([message], roomMembers, userEmail);
      return messages[0];
    }

    return message;
  }

  /**
   * Create a new message
   * @param {Object} messageData - Message data
   * @param {string} userEmail - Sender email
   * @returns {Promise<Object>} Created message
   */
  async createMessage(messageData, userEmail) {
    // Validate
    this._validateMessageData(messageData, userEmail);

    // Generate ID if not provided
    const id = messageData.id || this._generateMessageId(userEmail);

    // Prepare data
    const data = {
      id,
      type: messageData.type || 'user',
      user_email: userEmail.toLowerCase().trim(),
      text: messageData.text || '',
      timestamp: messageData.timestamp || new Date().toISOString(),
      room_id: messageData.roomId || messageData.room_id,
      thread_id: messageData.threadId || messageData.thread_id || null,
      thread_sequence: messageData.threadSequence || messageData.thread_sequence || null,
      socket_id: messageData.socketId || messageData.socket_id || null,
      private: messageData.private || false,
      flagged: messageData.flagged || false,
      validation: messageData.metadata?.validation || messageData.validation || null,
      tip1: messageData.metadata?.tip1 || messageData.tip1 || null,
      tip2: messageData.metadata?.tip2 || messageData.tip2 || null,
      rewrite: messageData.metadata?.rewrite || messageData.rewrite || null,
      original_message: messageData.metadata?.originalMessage || messageData.originalMessage || null,
      edited: false,
      edited_at: null,
      reactions: messageData.reactions || {},
      user_flagged_by: messageData.user_flagged_by || [],
    };

    // Don't save private, flagged, or pending_original messages
    if (data.private || data.flagged || data.type === 'pending_original') {
      throw new Error('Cannot save private, flagged, or pending_original messages');
    }

    const message = await this.repository.create(data);

    // Resolve receiver
    if (message.roomId) {
      const roomMembers = await this._getRoomMembers(message.roomId);
      const messages = this._resolveReceivers([message], roomMembers, userEmail);
      return messages[0];
    }

    return message;
  }

  /**
   * Update a message (edit)
   * @param {string} messageId - Message ID
   * @param {Object} updates - Fields to update
   * @param {string} userEmail - User email (for authorization)
   * @returns {Promise<Object|null>} Updated message or null
   */
  async updateMessage(messageId, updates, userEmail) {
    if (!messageId || typeof messageId !== 'string') {
      throw new Error('Invalid messageId: must be a non-empty string');
    }

    // Check authorization
    const message = await this.repository.findById(messageId);
    if (!message) {
      return null;
    }

    if (message.user_email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new Error('Unauthorized: cannot edit another user\'s message');
    }

    // Prepare updates
    const updateData = {};
    if (updates.text !== undefined) {
      updateData.text = updates.text;
      updateData.edited = true;
      updateData.edited_at = new Date().toISOString();
    }
    if (updates.metadata) {
      if (updates.metadata.validation !== undefined) {
        updateData.validation = updates.metadata.validation;
      }
      if (updates.metadata.tip1 !== undefined) {
        updateData.tip1 = updates.metadata.tip1;
      }
      if (updates.metadata.tip2 !== undefined) {
        updateData.tip2 = updates.metadata.tip2;
      }
      if (updates.metadata.rewrite !== undefined) {
        updateData.rewrite = updates.metadata.rewrite;
      }
      if (updates.metadata.originalMessage !== undefined) {
        updateData.original_message = updates.metadata.originalMessage;
      }
    }
    if (updates.reactions !== undefined) {
      updateData.reactions = updates.reactions;
    }
    if (updates.user_flagged_by !== undefined) {
      updateData.user_flagged_by = updates.user_flagged_by;
    }

    const updated = await this.repository.update(messageId, updateData);
    
    // Resolve receiver
    if (updated && updated.roomId) {
      const roomMembers = await this._getRoomMembers(updated.roomId);
      const messages = this._resolveReceivers([updated], roomMembers, userEmail);
      return messages[0];
    }

    return updated;
  }

  /**
   * Delete a message (soft delete)
   * @param {string} messageId - Message ID
   * @param {string} userEmail - User email (for authorization)
   * @returns {Promise<boolean>} Success
   */
  async deleteMessage(messageId, userEmail) {
    if (!messageId || typeof messageId !== 'string') {
      throw new Error('Invalid messageId: must be a non-empty string');
    }

    // Check authorization
    const message = await this.repository.findById(messageId);
    if (!message) {
      return false;
    }

    if (message.user_email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new Error('Unauthorized: cannot delete another user\'s message');
    }

    return await this.repository.delete(messageId);
  }

  /**
   * Add a reaction to a message
   * @param {string} messageId - Message ID
   * @param {string} emoji - Emoji string
   * @param {string} userEmail - User email
   * @returns {Promise<Object|null>} Updated message or null
   */
  async addReaction(messageId, emoji, userEmail) {
    const message = await this.repository.findById(messageId);
    if (!message) {
      return null;
    }

    const reactions = message.reactions || {};
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }
    if (!reactions[emoji].includes(userEmail)) {
      reactions[emoji].push(userEmail);
    }

    return await this.updateMessage(messageId, { reactions }, userEmail);
  }

  /**
   * Remove a reaction from a message
   * @param {string} messageId - Message ID
   * @param {string} emoji - Emoji string
   * @param {string} userEmail - User email
   * @returns {Promise<Object|null>} Updated message or null
   */
  async removeReaction(messageId, emoji, userEmail) {
    const message = await this.repository.findById(messageId);
    if (!message) {
      return null;
    }

    const reactions = message.reactions || {};
    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter(email => email !== userEmail);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    }

    return await this.updateMessage(messageId, { reactions }, userEmail);
  }

  /**
   * Get room members for receiver resolution
   * @private
   */
  async _getRoomMembers(roomId) {
    try {
      const query = `
        SELECT rm.user_id, u.email, u.first_name, u.last_name
        FROM room_members rm
        JOIN users u ON rm.user_id = u.id
        WHERE rm.room_id = $1
      `;
      const result = await dbPostgres.query(query, [roomId]);
      return result.rows;
    } catch (error) {
      console.error('[MessageService] Error getting room members:', error);
      return [];
    }
  }

  /**
   * Resolve receiver for messages
   * @private
   */
  _resolveReceivers(messages, roomMembers, senderEmail) {
    if (roomMembers.length < 2) {
      return messages.map(msg => ({ ...msg, receiver: null }));
    }

    const senderEmailLower = senderEmail.toLowerCase();
    const otherMember = roomMembers.find(
      member => member.email && member.email.toLowerCase() !== senderEmailLower
    );

    if (!otherMember) {
      return messages.map(msg => ({ ...msg, receiver: null }));
    }

    const receiver = buildUserObject({
      id: otherMember.user_id,
      email: otherMember.email,
      first_name: otherMember.first_name || null,
      last_name: otherMember.last_name || null,
    });

    return messages.map(msg => ({ ...msg, receiver }));
  }

  /**
   * Validate message data
   * @private
   */
  _validateMessageData(messageData, userEmail) {
    if (!userEmail || typeof userEmail !== 'string') {
      throw new Error('userEmail is required');
    }

    if (!messageData.roomId && !messageData.room_id) {
      throw new Error('roomId is required');
    }

    if (messageData.text === undefined && messageData.type !== 'system') {
      throw new Error('text is required for non-system messages');
    }
  }

  /**
   * Generate a unique message ID
   * @private
   */
  _generateMessageId(userEmail) {
    return `${Date.now()}-${userEmail.split('@')[0]}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = MessageService;

