/**
 * Message Domain Entity
 *
 * Represents a communication unit between co-parents.
 * May trigger AI intervention if hostile.
 *
 * @module domain/entities/Message
 */

'use strict';

const { MessageId } = require('../valueObjects');
const { RoomId } = require('../valueObjects');

class Message {
  /**
   * Create a Message entity
   * @param {Object} params - Message properties
   * @param {string|MessageId} params.id - Message ID
   * @param {string} params.type - Message type (e.g., 'message', 'system', 'ai_intervention')
   * @param {string} params.text - Message content
   * @param {string} params.username - Sender username
   * @param {string|RoomId} params.roomId - Room ID
   * @param {Date} params.timestamp - Message timestamp
   * @param {string} [params.threadId] - Thread ID (if part of a thread)
   * @param {number} [params.threadSequence] - Thread sequence number (for ordering within thread)
   * @param {string} [params.originalContent] - Original content before mediation
   * @param {boolean} [params.wasMediated=false] - Whether message was AI-mediated
   */
  constructor({
    id,
    type,
    text,
    username,
    roomId,
    timestamp,
    threadId = null,
    threadSequence = null,
    originalContent = null,
    wasMediated = false,
  }) {
    if (!id) {
      throw new Error('Message ID is required');
    }
    if (!type || typeof type !== 'string') {
      throw new Error('Message type is required');
    }
    if (!text || typeof text !== 'string') {
      throw new Error('Message text is required');
    }
    if (!username || typeof username !== 'string') {
      throw new Error('Message username is required');
    }
    if (!roomId) {
      throw new Error('Message roomId is required');
    }
    if (!timestamp) {
      throw new Error('Message timestamp is required');
    }

    this.id = id instanceof MessageId ? id : new MessageId(id);
    this.type = type;
    this.text = text.trim();
    this.username = username;
    this.roomId = roomId instanceof RoomId ? roomId : new RoomId(roomId);
    this.timestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);
    this.threadId = threadId;
    this.threadSequence = threadSequence !== null && threadSequence !== undefined ? Number(threadSequence) : null;
    this.originalContent = originalContent;
    this.wasMediated = wasMediated;

    // Business rule: Text cannot be empty after trimming
    if (this.text.length === 0 && this.type !== 'system') {
      throw new Error('Message text cannot be empty');
    }

    // Make immutable
    Object.freeze(this);
  }

  /**
   * Check if message is a system message
   * @returns {boolean} True if system message
   */
  isSystemMessage() {
    return this.type === 'system';
  }

  /**
   * Check if message is an AI intervention
   * @returns {boolean} True if AI intervention
   */
  isAIIntervention() {
    return this.type === 'ai_intervention';
  }

  /**
   * Check if message was mediated
   * @returns {boolean} True if was mediated
   */
  wasMediatedByAI() {
    return this.wasMediated;
  }

  /**
   * Check if message is part of a thread
   * @returns {boolean} True if part of thread
   */
  isThreaded() {
    return !!this.threadId;
  }

  /**
   * Get thread sequence number (for ordering within thread)
   * @returns {number|null} Sequence number or null if not in thread
   */
  getThreadSequence() {
    return this.threadSequence;
  }

  /**
   * Get the original content (before mediation) or current text
   * @returns {string} Original content or current text
   */
  getOriginalContent() {
    return this.originalContent || this.text;
  }

  /**
   * Create a new message with updated content (for edits)
   * @param {string} newText - New message text
   * @returns {Message} New Message instance with updated text
   */
  updateText(newText) {
    if (!newText || typeof newText !== 'string' || newText.trim().length === 0) {
      throw new Error('New message text cannot be empty');
    }

    return new Message({
      ...this.toPlainObject(),
      text: newText.trim(),
    });
  }

  /**
   * Mark message as mediated
   * @param {string} originalContent - Original content before mediation
   * @returns {Message} New Message instance marked as mediated
   */
  markAsMediated(originalContent) {
    return new Message({
      ...this.toPlainObject(),
      wasMediated: true,
      originalContent: originalContent || this.text,
    });
  }

  /**
   * Convert to plain object (for serialization)
   * @returns {Object} Plain object representation
   */
  toPlainObject() {
    return {
      id: this.id.toString(),
      type: this.type,
      text: this.text,
      username: this.username,
      roomId: this.roomId.toString(),
      timestamp: this.timestamp,
      threadId: this.threadId,
      threadSequence: this.threadSequence,
      originalContent: this.originalContent,
      wasMediated: this.wasMediated,
    };
  }

  /**
   * Create Message from database row
   * @param {Object} row - Database row
   * @returns {Message} Message entity
   */
  static fromDatabaseRow(row) {
    // Handle both username and user_email fields (migration support)
    const username = row.username || row.user_email || row.userEmail || '';
    
    return new Message({
      id: row.id,
      type: row.type || 'user',
      text: row.text || '',
      username: username,
      roomId: row.room_id || row.roomId,
      timestamp: row.timestamp,
      threadId: row.thread_id || row.threadId || null,
      threadSequence: row.thread_sequence !== null && row.thread_sequence !== undefined 
        ? Number(row.thread_sequence) 
        : (row.threadSequence !== null && row.threadSequence !== undefined 
          ? Number(row.threadSequence) 
          : null),
      originalContent: row.original_content || row.originalContent || null,
      wasMediated: row.was_mediated || row.wasMediated || false,
    });
  }

  /**
   * Create Message from API data
   * @param {Object} data - API data
   * @returns {Message} Message entity
   */
  static fromApiData(data) {
    // Handle both username and user_email fields (migration support)
    const username = data.username || data.user_email || data.userEmail || '';
    
    return new Message({
      id: data.id || data.messageId,
      type: data.type || 'message',
      text: data.text || data.content || '',
      username: username,
      roomId: data.roomId || data.room_id,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      threadId: data.threadId || data.thread_id || null,
      threadSequence: data.threadSequence !== null && data.threadSequence !== undefined
        ? Number(data.threadSequence)
        : (data.thread_sequence !== null && data.thread_sequence !== undefined
          ? Number(data.thread_sequence)
          : null),
      originalContent: data.originalContent || data.original_content || null,
      wasMediated: data.wasMediated || data.was_mediated || false,
    });
  }
}

module.exports = Message;

