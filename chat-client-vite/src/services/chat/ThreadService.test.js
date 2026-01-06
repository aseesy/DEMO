/**
 * ThreadService Tests
 * 
 * Tests for thread management service including new features:
 * - Reply in thread
 * - Move message to thread
 * - Archive threads
 * - Pagination
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock socketService - must be defined before import
vi.mock('../socket', () => {
  const mockEmit = vi.fn();
  const mockSubscribe = vi.fn();
  return {
    socketService: {
      subscribe: mockSubscribe,
      emit: mockEmit,
    },
  };
});

import { threadService } from './ThreadService.js';
import { socketService } from '../socket';

describe('ThreadService', () => {
  beforeEach(() => {
    threadService.clear();
    vi.clearAllMocks();
  });

  describe('New Methods', () => {
    it('should emit reply_in_thread event', () => {
      threadService.replyInThread('thread-123', 'Hello world', { metadata: 'test' });
      
      expect(socketService.emit).toHaveBeenCalledWith('reply_in_thread', {
        threadId: 'thread-123',
        text: 'Hello world',
        messageData: { metadata: 'test' },
      });
    });

    it('should emit move_message_to_thread event', () => {
      threadService.moveMessageToThread('msg-123', 'thread-456', 'room-789');
      
      expect(socketService.emit).toHaveBeenCalledWith('move_message_to_thread', {
        messageId: 'msg-123',
        targetThreadId: 'thread-456',
        roomId: 'room-789',
      });
    });

    it('should emit archive_thread event', () => {
      threadService.archiveThread('thread-123', true, true);
      
      expect(socketService.emit).toHaveBeenCalledWith('archive_thread', {
        threadId: 'thread-123',
        archived: true,
        cascade: true,
      });
    });

    it('should emit archive_thread with default values', () => {
      threadService.archiveThread('thread-123');
      
      expect(socketService.emit).toHaveBeenCalledWith('archive_thread', {
        threadId: 'thread-123',
        archived: true,
        cascade: true,
      });
    });
  });

  describe('Event Handlers', () => {
    it('should handle reply_in_thread_success', () => {
      // This handler only logs in dev mode, doesn't change state or notify
      // Just verify it doesn't throw
      expect(() => {
        threadService.handleReplySuccess({ threadId: 'thread-123', messageId: 'msg-456' });
      }).not.toThrow();
    });

    it('should handle message_moved_to_thread_success and update state', () => {
      // Setup initial state
      threadService.threads = [
        { id: 'thread-1', message_count: 5 },
        { id: 'thread-2', message_count: 3 },
      ];
      threadService.threadMessages = {
        'thread-1': [{ id: 'msg-1' }, { id: 'msg-2' }],
        'thread-2': [{ id: 'msg-3' }],
      };

      const callback = vi.fn();
      threadService.subscribe(callback);

      threadService.handleMoveSuccess({
        messageId: 'msg-1',
        oldThreadId: 'thread-1',
        newThreadId: 'thread-2',
        affectedThreads: [
          { threadId: 'thread-1', messageCount: 4 },
          { threadId: 'thread-2', messageCount: 4 },
        ],
      });

      // Should update thread counts
      const state = threadService.getState();
      expect(state.threads.find(t => t.id === 'thread-1')?.message_count).toBe(4);
      expect(state.threads.find(t => t.id === 'thread-2')?.message_count).toBe(4);

      // Should remove message from old thread messages
      expect(state.threadMessages['thread-1']).not.toContainEqual({ id: 'msg-1' });

      expect(callback).toHaveBeenCalled();
    });

    it('should handle thread_archived and update archived state', () => {
      threadService.threads = [
        { id: 'thread-1', is_archived: 0 },
        { id: 'thread-2', is_archived: 0 },
        { id: 'thread-3', is_archived: 0 },
      ];

      const callback = vi.fn();
      threadService.subscribe(callback);

      threadService.handleThreadArchived({
        threadId: 'thread-1',
        archived: true,
        cascade: true,
        affectedThreadIds: ['thread-1', 'thread-2'],
      });

      const state = threadService.getState();
      expect(state.threads.find(t => t.id === 'thread-1')?.is_archived).toBe(1);
      expect(state.threads.find(t => t.id === 'thread-2')?.is_archived).toBe(1);
      expect(state.threads.find(t => t.id === 'thread-3')?.is_archived).toBe(0);

      expect(callback).toHaveBeenCalled();
    });

    it('should handle thread_archived_success', () => {
      // This handler only logs in dev mode, doesn't change state or notify
      // Just verify it doesn't throw
      expect(() => {
        threadService.handleArchiveSuccess({ threadId: 'thread-123', archived: true });
      }).not.toThrow();
    });

    it('should handle thread_message_count_changed', () => {
      threadService.threads = [
        { id: 'thread-1', message_count: 5, last_message_at: '2025-01-01T10:00:00Z' },
      ];

      const callback = vi.fn();
      threadService.subscribe(callback);

      threadService.handleMessageCountChanged({
        threadId: 'thread-1',
        messageCount: 6,
        lastMessageAt: '2025-01-01T10:05:00Z',
      });

      const state = threadService.getState();
      const thread = state.threads.find(t => t.id === 'thread-1');
      expect(thread?.message_count).toBe(6);
      expect(thread?.last_message_at).toBe('2025-01-01T10:05:00Z');

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('State Update Helpers', () => {
    it('should update thread counts correctly', () => {
      threadService.threads = [
        { id: 'thread-1', message_count: 5 },
        { id: 'thread-2', message_count: 3 },
      ];

      threadService.updateThreadCounts([
        { threadId: 'thread-1', messageCount: 6 },
        { threadId: 'thread-2', messageCount: 4 },
      ]);

      const state = threadService.getState();
      expect(state.threads.find(t => t.id === 'thread-1')?.message_count).toBe(6);
      expect(state.threads.find(t => t.id === 'thread-2')?.message_count).toBe(4);
    });

    it('should move message in state correctly', () => {
      threadService.threadMessages = {
        'thread-1': [{ id: 'msg-1' }, { id: 'msg-2' }],
        'thread-2': [{ id: 'msg-3' }],
      };

      const callback = vi.fn();
      threadService.subscribe(callback);

      threadService.moveMessageInState('msg-1', 'thread-1', 'thread-2');

      const state = threadService.getState();
      expect(state.threadMessages['thread-1']).not.toContainEqual({ id: 'msg-1' });
      expect(callback).toHaveBeenCalled();
    });

    it('should update archived state correctly', () => {
      threadService.threads = [
        { id: 'thread-1', is_archived: 0 },
        { id: 'thread-2', is_archived: 0 },
      ];

      threadService.updateArchivedState(['thread-1', 'thread-2'], true);

      const state = threadService.getState();
      expect(state.threads.find(t => t.id === 'thread-1')?.is_archived).toBe(1);
      expect(state.threads.find(t => t.id === 'thread-2')?.is_archived).toBe(1);
    });

    it('should update thread message count correctly', () => {
      threadService.threads = [
        { id: 'thread-1', message_count: 5, last_message_at: '2025-01-01T10:00:00Z' },
      ];

      threadService.updateThreadMessageCount('thread-1', 6, '2025-01-01T10:05:00Z');

      const state = threadService.getState();
      const thread = state.threads.find(t => t.id === 'thread-1');
      expect(thread?.message_count).toBe(6);
      expect(thread?.last_message_at).toBe('2025-01-01T10:05:00Z');
    });
  });

  describe('Pagination', () => {
    it('should emit get_thread_messages with pagination params', () => {
      threadService.loadThreadMessages('thread-123', 50, 0);
      
      expect(socketService.emit).toHaveBeenCalledWith('get_thread_messages', {
        threadId: 'thread-123',
        limit: 50,
        offset: 0,
      });
    });

    it('should use default pagination values', () => {
      threadService.loadThreadMessages('thread-123');
      
      expect(socketService.emit).toHaveBeenCalledWith('get_thread_messages', {
        threadId: 'thread-123',
        limit: 50,
        offset: 0,
      });
    });

    it('should replace messages when offset is 0', () => {
      threadService.threadMessages = {
        'thread-123': [{ id: 'msg-1' }, { id: 'msg-2' }],
      };

      threadService.handleThreadMessages({
        threadId: 'thread-123',
        messages: [{ id: 'msg-3' }, { id: 'msg-4' }],
        limit: 50,
        offset: 0,
      });

      const state = threadService.getState();
      expect(state.threadMessages['thread-123']).toHaveLength(2);
      expect(state.threadMessages['thread-123'][0].id).toBe('msg-3');
      expect(state.threadMessages['thread-123'][1].id).toBe('msg-4');
    });

    it('should append messages when offset is greater than 0', () => {
      threadService.threadMessages = {
        'thread-123': [{ id: 'msg-1' }, { id: 'msg-2' }],
      };

      threadService.handleThreadMessages({
        threadId: 'thread-123',
        messages: [{ id: 'msg-3' }, { id: 'msg-4' }],
        limit: 50,
        offset: 2,
      });

      const state = threadService.getState();
      expect(state.threadMessages['thread-123']).toHaveLength(4);
      expect(state.threadMessages['thread-123'][0].id).toBe('msg-1');
      expect(state.threadMessages['thread-123'][1].id).toBe('msg-2');
      expect(state.threadMessages['thread-123'][2].id).toBe('msg-3');
      expect(state.threadMessages['thread-123'][3].id).toBe('msg-4');
    });
  });

  describe('Subscriptions', () => {
    it('should have handlers for all new events', () => {
      // Verify that all new event handlers exist and are callable
      expect(typeof threadService.handleReplySuccess).toBe('function');
      expect(typeof threadService.handleMoveSuccess).toBe('function');
      expect(typeof threadService.handleThreadArchived).toBe('function');
      expect(typeof threadService.handleArchiveSuccess).toBe('function');
      expect(typeof threadService.handleMessageCountChanged).toBe('function');
      
      // Verify handlers can be called without errors
      expect(() => threadService.handleReplySuccess({})).not.toThrow();
      expect(() => threadService.handleMoveSuccess({})).not.toThrow();
      expect(() => threadService.handleThreadArchived({})).not.toThrow();
      expect(() => threadService.handleArchiveSuccess({})).not.toThrow();
      expect(() => threadService.handleMessageCountChanged({})).not.toThrow();
    });
  });
});

