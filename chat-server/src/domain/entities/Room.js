/**
 * Room Domain Entity
 *
 * Represents a private communication space for two co-parents.
 * Encapsulates business rules for room operations.
 *
 * @module domain/entities/Room
 */

'use strict';

const { RoomId } = require('../valueObjects');

class Room {
  /**
   * Create a Room entity
   * @param {Object} params - Room properties
   * @param {string|RoomId} params.id - Room ID
   * @param {string} params.name - Room name
   * @param {number} params.createdBy - User ID of creator
   * @param {boolean} [params.isPrivate=true] - Whether room is private
   * @param {Date} [params.createdAt] - Creation timestamp
   * @param {Array<number>} [params.memberIds=[]] - User IDs of room members
   */
  constructor({
    id,
    name,
    createdBy,
    isPrivate = true,
    createdAt = new Date(),
    memberIds = [],
  }) {
    if (!id) {
      throw new Error('Room ID is required');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Room name is required');
    }
    if (!createdBy) {
      throw new Error('Room creator ID is required');
    }

    this.id = id instanceof RoomId ? id : new RoomId(id);
    this.name = name.trim();
    this.createdBy = createdBy;
    this.isPrivate = isPrivate;
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.memberIds = [...memberIds]; // Copy array to prevent mutation

    // Business rule: Co-parent rooms must have exactly 2 members
    if (this.memberIds.length > 0 && this.memberIds.length !== 2) {
      throw new Error('Co-parent room must have exactly 2 members');
    }

    // Make immutable
    Object.freeze(this);
    Object.freeze(this.memberIds);
  }

  /**
   * Check if user is a member of this room
   * @param {number} userId - User ID to check
   * @returns {boolean} True if user is a member
   */
  isMember(userId) {
    return this.memberIds.includes(userId);
  }

  /**
   * Check if user is the creator
   * @param {number} userId - User ID to check
   * @returns {boolean} True if user is the creator
   */
  isCreator(userId) {
    return this.createdBy === userId;
  }

  /**
   * Add a member to the room
   * @param {number} userId - User ID to add
   * @returns {Room} New Room instance with added member
   */
  addMember(userId) {
    if (this.isMember(userId)) {
      return this; // Already a member
    }

    if (this.memberIds.length >= 2) {
      throw new Error('Room already has maximum number of members (2)');
    }

    return new Room({
      ...this.toPlainObject(),
      memberIds: [...this.memberIds, userId],
    });
  }

  /**
   * Remove a member from the room
   * @param {number} userId - User ID to remove
   * @returns {Room} New Room instance with removed member
   */
  removeMember(userId) {
    if (!this.isMember(userId)) {
      return this; // Not a member
    }

    return new Room({
      ...this.toPlainObject(),
      memberIds: this.memberIds.filter(id => id !== userId),
    });
  }

  /**
   * Check if room is complete (has 2 members)
   * @returns {boolean} True if room has 2 members
   */
  isComplete() {
    return this.memberIds.length === 2;
  }

  /**
   * Get the other member's ID (for co-parent rooms)
   * @param {number} userId - Current user ID
   * @returns {number|null} Other member's ID or null
   */
  getOtherMemberId(userId) {
    if (!this.isMember(userId)) {
      return null;
    }
    const otherMember = this.memberIds.find(id => id !== userId);
    return otherMember || null;
  }

  /**
   * Convert to plain object (for serialization)
   * @returns {Object} Plain object representation
   */
  toPlainObject() {
    return {
      id: this.id.toString(),
      name: this.name,
      createdBy: this.createdBy,
      isPrivate: this.isPrivate,
      createdAt: this.createdAt,
      memberIds: [...this.memberIds],
    };
  }

  /**
   * Create Room from database row
   * @param {Object} row - Database row
   * @param {Array<number>} [memberIds=[]] - Member IDs (from join query)
   * @returns {Room} Room entity
   */
  static fromDatabaseRow(row, memberIds = []) {
    return new Room({
      id: row.id,
      name: row.name,
      createdBy: row.created_by,
      isPrivate: row.is_private !== 0 && row.is_private !== false,
      createdAt: row.created_at,
      memberIds: memberIds.length > 0 ? memberIds : (row.member_ids || []),
    });
  }

  /**
   * Create Room from API data
   * @param {Object} data - API data
   * @returns {Room} Room entity
   */
  static fromApiData(data) {
    return new Room({
      id: data.id || data.roomId,
      name: data.name,
      createdBy: data.createdBy || data.created_by,
      isPrivate: data.isPrivate !== undefined ? data.isPrivate : data.is_private !== false,
      createdAt: data.createdAt || data.created_at,
      memberIds: data.memberIds || data.member_ids || [],
    });
  }
}

module.exports = Room;

