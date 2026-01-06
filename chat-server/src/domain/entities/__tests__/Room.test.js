/**
 * Room Entity Tests
 *
 * Tests for Room domain entity business rules and methods.
 */

const Room = require('../Room');
const RoomId = require('../../valueObjects/RoomId');

describe('Room Entity', () => {
  describe('Constructor', () => {
    it('should create a Room with required fields', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
      });

      expect(room.id).toBeInstanceOf(RoomId);
      expect(room.id.toString()).toBe('room-123');
      expect(room.name).toBe('Test Room');
      expect(room.createdBy).toBe(1);
      expect(room.isPrivate).toBe(true);
    });

    it('should throw error if id is missing', () => {
      expect(() => {
        new Room({
          name: 'Test Room',
          createdBy: 1,
        });
      }).toThrow('Room ID is required');
    });

    it('should throw error if name is missing', () => {
      expect(() => {
        new Room({
          id: 'room-123',
          createdBy: 1,
        });
      }).toThrow('Room name is required');
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        new Room({
          id: 'room-123',
          name: '   ',
          createdBy: 1,
        });
      }).toThrow('Room name is required');
    });

    it('should throw error if createdBy is missing', () => {
      expect(() => {
        new Room({
          id: 'room-123',
          name: 'Test Room',
        });
      }).toThrow('Room creator ID is required');
    });

    it('should accept RoomId value object', () => {
      const roomId = new RoomId('room-123');
      const room = new Room({
        id: roomId,
        name: 'Test Room',
        createdBy: 1,
      });

      expect(room.id).toBe(roomId);
    });

    it('should trim room name', () => {
      const room = new Room({
        id: 'room-123',
        name: '  Test Room  ',
        createdBy: 1,
      });

      expect(room.name).toBe('Test Room');
    });

    it('should enforce exactly 2 members for co-parent rooms', () => {
      expect(() => {
        new Room({
          id: 'room-123',
          name: 'Test Room',
          createdBy: 1,
          memberIds: [1, 2, 3], // 3 members
        });
      }).toThrow('Co-parent room must have exactly 2 members');
    });

    it('should allow 0 or 2 members', () => {
      const room1 = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
        memberIds: [],
      });

      const room2 = new Room({
        id: 'room-456',
        name: 'Test Room 2',
        createdBy: 1,
        memberIds: [1, 2],
      });

      expect(room1.memberIds.length).toBe(0);
      expect(room2.memberIds.length).toBe(2);
    });

    it('should make entity immutable', () => {
      'use strict';
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
      });

      expect(() => {
        room.name = 'New Name';
      }).toThrow(TypeError);
    });
  });

  describe('isMember', () => {
    it('should return true if user is a member', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
        memberIds: [1, 2],
      });

      expect(room.isMember(1)).toBe(true);
      expect(room.isMember(2)).toBe(true);
    });

    it('should return false if user is not a member', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
        memberIds: [1, 2],
      });

      expect(room.isMember(3)).toBe(false);
    });
  });

  describe('isCreator', () => {
    it('should return true if user is creator', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
      });

      expect(room.isCreator(1)).toBe(true);
    });

    it('should return false if user is not creator', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
      });

      expect(room.isCreator(2)).toBe(false);
    });
  });

  describe('addMember', () => {
    it('should add a member to the room', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
        memberIds: [], // Start with 0 members
      });

      const updated = room.addMember(1);

      expect(updated).not.toBe(room); // New instance
      expect(updated.memberIds).toEqual([1]);
    });

    it('should not add duplicate member', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
        memberIds: [1, 2], // Start with 2 members (valid co-parent room)
      });

      const updated = room.addMember(1);

      expect(updated).toBe(room); // Same instance
    });

    it('should throw error if room already has 2 members', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
        memberIds: [1, 2],
      });

      expect(() => {
        room.addMember(3);
      }).toThrow('Room already has maximum number of members (2)');
    });
  });

  describe('removeMember', () => {
    it('should remove a member from the room', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
        memberIds: [1, 2],
      });

      // Removing a member from a 2-member room results in 1 member,
      // which violates the business rule (must be 0 or 2 members)
      // The removeMember method should handle this by either:
      // 1. Setting to empty array, or
      // 2. Throwing an error
      // For now, we expect it to throw when trying to create invalid room
      expect(() => {
        room.removeMember(2);
      }).toThrow('Co-parent room must have exactly 2 members');
    });

    it('should not remove non-member', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
        memberIds: [1, 2], // Start with 2 members (valid co-parent room)
      });

      const updated = room.removeMember(3);

      expect(updated).toBe(room); // Same instance
    });
  });

  describe('isComplete', () => {
    it('should return true if room has 2 members', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
        memberIds: [1, 2],
      });

      expect(room.isComplete()).toBe(true);
    });

    it('should return false if room has less than 2 members', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
        memberIds: [], // Start with 0 members
      });

      expect(room.isComplete()).toBe(false);
    });
  });

  describe('getOtherMemberId', () => {
    it('should return other member ID', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
        memberIds: [1, 2],
      });

      expect(room.getOtherMemberId(1)).toBe(2);
      expect(room.getOtherMemberId(2)).toBe(1);
    });

    it('should return null if user is not a member', () => {
      const room = new Room({
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
        memberIds: [1, 2],
      });

      expect(room.getOtherMemberId(3)).toBe(null);
    });
  });

  describe('fromDatabaseRow', () => {
    it('should create Room from database row', () => {
      const row = {
        id: 'room-123',
        name: 'Test Room',
        created_by: 1,
        is_private: 1,
        created_at: new Date('2024-01-01'),
      };

      const room = Room.fromDatabaseRow(row, [1, 2]);

      expect(room.id.toString()).toBe('room-123');
      expect(room.name).toBe('Test Room');
      expect(room.createdBy).toBe(1);
      expect(room.isPrivate).toBe(true);
      expect(room.memberIds).toEqual([1, 2]);
    });
  });

  describe('fromApiData', () => {
    it('should create Room from API data', () => {
      const data = {
        id: 'room-123',
        name: 'Test Room',
        createdBy: 1,
        isPrivate: true,
        memberIds: [1, 2],
      };

      const room = Room.fromApiData(data);

      expect(room.id.toString()).toBe('room-123');
      expect(room.name).toBe('Test Room');
      expect(room.createdBy).toBe(1);
      expect(room.memberIds).toEqual([1, 2]);
    });

    it('should handle snake_case API data', () => {
      const data = {
        id: 'room-123',
        name: 'Test Room',
        created_by: 1,
        is_private: false,
        member_ids: [1, 2],
      };

      const room = Room.fromApiData(data);

      expect(room.createdBy).toBe(1);
      expect(room.isPrivate).toBe(false);
      expect(room.memberIds).toEqual([1, 2]);
    });
  });
});
