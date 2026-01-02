/**
 * MessageService Tests
 * 
 * Tests for the deterministic merge algorithm implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock socketService
vi.mock('../socket', () => ({
  socketService: {
    subscribe: vi.fn(),
    emit: vi.fn(),
  },
}));

import { messageService } from './MessageService.js';

describe('MessageService - Merge Algorithm', () => {
  beforeEach(() => {
    messageService.clear();
  });

  describe('mergeMessages - Deduplication', () => {
    it('should deduplicate messages by ID', () => {
      const msg1 = { id: 'msg1', text: 'Hello', timestamp: '2025-01-01T10:00:00Z' };
      const msg2 = { id: 'msg2', text: 'World', timestamp: '2025-01-01T10:01:00Z' };
      const duplicate = { id: 'msg1', text: 'Hello Updated', timestamp: '2025-01-01T10:00:00Z' };

      const result = messageService.mergeMessages(
        [msg1, msg2, duplicate],
        [],
        new Map()
      );

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('msg1');
      expect(result[0].text).toBe('Hello Updated'); // Server version takes precedence
      expect(result[1].id).toBe('msg2');
    });

    it('should deduplicate by tempId for optimistic messages', () => {
      const optimistic = { tempId: 'temp-123', text: 'Hello', timestamp: '2025-01-01T10:00:00Z' };
      const confirmed = { id: 'server-456', tempId: 'temp-123', text: 'Hello', timestamp: '2025-01-01T10:00:00Z' };

      const result = messageService.mergeMessages(
        [confirmed],
        [optimistic],
        new Map()
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('server-456'); // Server version replaces optimistic
      expect(result[0].tempId).toBe('temp-123');
    });
  });

  describe('handleMessageHistory - Preserve Pending', () => {
    it('should preserve pending optimistic messages on reconnect', () => {
      const serverHistory = [
        { id: 'msg1', text: 'Hello', timestamp: '2025-01-01T10:00:00Z' },
        { id: 'msg2', text: 'World', timestamp: '2025-01-01T10:01:00Z' },
      ];

      const pending = new Map([
        ['temp-123', { tempId: 'temp-123', text: 'Pending', timestamp: '2025-01-01T10:02:00Z' }],
      ]);

      // Manually set pending (since send() would add it)
      messageService.pendingMessages = pending;

      messageService.handleMessageHistory({ messages: serverHistory, hasMore: false });

      const state = messageService.getState();
      
      // Should have server messages + pending
      expect(state.messages.length).toBe(3);
      expect(state.messages.find(m => m.tempId === 'temp-123')).toBeDefined();
      expect(state.messages.find(m => m.id === 'msg1')).toBeDefined();
      expect(state.messages.find(m => m.id === 'msg2')).toBeDefined();
    });

    it('should remove confirmed pending messages', () => {
      const serverHistory = [
        { id: 'msg1', text: 'Hello', timestamp: '2025-01-01T10:00:00Z' },
        { id: 'server-456', tempId: 'temp-123', text: 'Confirmed', timestamp: '2025-01-01T10:02:00Z' },
      ];

      const pending = new Map([
        ['temp-123', { tempId: 'temp-123', text: 'Pending', timestamp: '2025-01-01T10:02:00Z' }],
      ]);

      messageService.pendingMessages = pending;

      messageService.handleMessageHistory({ messages: serverHistory, hasMore: false });

      const state = messageService.getState();
      
      // Pending should be removed (confirmed)
      expect(messageService.pendingMessages.has('temp-123')).toBe(false);
      // Should have server version with id
      expect(state.messages.find(m => m.id === 'server-456')).toBeDefined();
      expect(state.messages.find(m => m.tempId === 'temp-123' && !m.id)).toBeUndefined();
    });
  });

  describe('handleOlderMessages - Pagination Deduplication', () => {
    it('should not duplicate messages when loading older messages', () => {
      const existing = [
        { id: 'msg3', text: 'Latest', timestamp: '2025-01-01T10:03:00Z' },
        { id: 'msg2', text: 'Middle', timestamp: '2025-01-01T10:02:00Z' },
      ];

      const older = [
        { id: 'msg2', text: 'Middle', timestamp: '2025-01-01T10:02:00Z' }, // Overlap
        { id: 'msg1', text: 'Oldest', timestamp: '2025-01-01T10:01:00Z' },
      ];

      messageService.messages = existing;

      messageService.handleOlderMessages({ messages: older, hasMore: false });

      const state = messageService.getState();
      
      expect(state.messages.length).toBe(3); // No duplicate of msg2
      expect(state.messages.map(m => m.id)).toEqual(['msg1', 'msg2', 'msg3']);
    });

    it('should prepend older messages in correct order', () => {
      const existing = [
        { id: 'msg3', text: 'Latest', timestamp: '2025-01-01T10:03:00Z' },
      ];

      const older = [
        { id: 'msg2', text: 'Middle', timestamp: '2025-01-01T10:02:00Z' },
        { id: 'msg1', text: 'Oldest', timestamp: '2025-01-01T10:01:00Z' },
      ];

      messageService.messages = existing;

      messageService.handleOlderMessages({ messages: older, hasMore: false });

      const state = messageService.getState();
      
      // Should be sorted by timestamp (oldest to newest)
      expect(state.messages.map(m => m.id)).toEqual(['msg1', 'msg2', 'msg3']);
    });
  });

  describe('handleNewMessage - Deduplication', () => {
    it('should not duplicate if message already exists', () => {
      const existing = [
        { id: 'msg1', text: 'Hello', timestamp: '2025-01-01T10:00:00Z' },
      ];

      messageService.messages = existing;

      // Server sends same message again
      messageService.handleNewMessage({ id: 'msg1', text: 'Hello', timestamp: '2025-01-01T10:00:00Z' });

      const state = messageService.getState();
      
      expect(state.messages.length).toBe(1);
      expect(state.messages[0].id).toBe('msg1');
    });

    it('should add new message if it does not exist', () => {
      const existing = [
        { id: 'msg1', text: 'Hello', timestamp: '2025-01-01T10:00:00Z' },
      ];

      messageService.messages = existing;

      messageService.handleNewMessage({ id: 'msg2', text: 'World', timestamp: '2025-01-01T10:01:00Z' });

      const state = messageService.getState();
      
      expect(state.messages.length).toBe(2);
      expect(state.messages.map(m => m.id)).toEqual(['msg1', 'msg2']);
    });
  });

  describe('Deterministic Sorting', () => {
    it('should sort messages by timestamp (oldest to newest)', () => {
      const messages = [
        { id: 'msg3', text: 'Third', timestamp: '2025-01-01T10:03:00Z' },
        { id: 'msg1', text: 'First', timestamp: '2025-01-01T10:01:00Z' },
        { id: 'msg2', text: 'Second', timestamp: '2025-01-01T10:02:00Z' },
      ];

      const result = messageService.mergeMessages(messages, [], new Map());

      expect(result.map(m => m.id)).toEqual(['msg1', 'msg2', 'msg3']);
    });

    it('should use ID as tiebreaker for same timestamp', () => {
      const sameTime = '2025-01-01T10:00:00Z';
      const messages = [
        { id: 'msg-c', text: 'C', timestamp: sameTime },
        { id: 'msg-a', text: 'A', timestamp: sameTime },
        { id: 'msg-b', text: 'B', timestamp: sameTime },
      ];

      const result = messageService.mergeMessages(messages, [], new Map());

      // Should be sorted by ID (alphabetical)
      expect(result.map(m => m.id)).toEqual(['msg-a', 'msg-b', 'msg-c']);
    });
  });

  describe('handleMessageReconciled', () => {
    it('should replace optimistic message with server version', () => {
      const optimistic = {
        tempId: 'temp-123',
        optimisticId: 'temp-123',
        text: 'Hello',
        timestamp: '2025-01-01T10:00:00Z',
        isOptimistic: true,
      };

      messageService.messages = [optimistic];
      messageService.pendingMessages.set('temp-123', optimistic);

      messageService.handleMessageReconciled({
        optimisticId: 'temp-123',
        messageId: 'server-456',
        timestamp: '2025-01-01T10:00:05Z',
      });

      const state = messageService.getState();
      
      // Should have server version
      expect(state.messages.length).toBe(1);
      expect(state.messages[0].id).toBe('server-456');
      expect(state.messages[0].isOptimistic).toBe(false);
      expect(state.messages[0].isPending).toBe(false);
      
      // Pending should be removed
      expect(messageService.pendingMessages.has('temp-123')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle messages without ID or tempId gracefully', () => {
      const messages = [
        { text: 'No ID', timestamp: '2025-01-01T10:00:00Z' },
        { id: 'msg1', text: 'Has ID', timestamp: '2025-01-01T10:01:00Z' },
      ];

      const result = messageService.mergeMessages(messages, [], new Map());

      // Should include message with ID
      expect(result.find(m => m.id === 'msg1')).toBeDefined();
      // Message without ID might be skipped (depends on implementation)
    });

    it('should handle empty server messages array', () => {
      const existing = [
        { id: 'msg1', text: 'Hello', timestamp: '2025-01-01T10:00:00Z' },
      ];

      messageService.messages = existing;

      const result = messageService.mergeMessages([], existing, new Map());

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('msg1');
    });
  });
});

