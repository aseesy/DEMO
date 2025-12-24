/**
 * Unit Tests for messageUtils.js
 *
 * Tests pure functions for message handling.
 * Each function has a single responsibility and is easily testable.
 */

import { describe, it, expect } from 'vitest';
import {
  isOwnMessage,
  isSystemMessage,
  isOptimisticMessage,
  messageExistsById,
  messageExistsByContent,
  findMatchingOptimisticIndex,
  determineMessageAction,
  applyMessageAction,
} from './messageUtils.js';

describe('messageUtils', () => {
  describe('isOwnMessage', () => {
    it('should return true when usernames match (same case)', () => {
      const message = { username: 'testuser' };
      expect(isOwnMessage(message, 'testuser')).toBe(true);
    });

    it('should return true when usernames match (different case)', () => {
      const message = { username: 'TestUser' };
      expect(isOwnMessage(message, 'testuser')).toBe(true);
    });

    it('should return false when usernames differ', () => {
      const message = { username: 'otheruser' };
      expect(isOwnMessage(message, 'testuser')).toBe(false);
    });

    it('should return false for null message', () => {
      expect(isOwnMessage(null, 'testuser')).toBe(false);
    });

    it('should return false for message without username', () => {
      const message = { text: 'hello' };
      expect(isOwnMessage(message, 'testuser')).toBe(false);
    });

    it('should return false for null currentUsername', () => {
      const message = { username: 'testuser' };
      expect(isOwnMessage(message, null)).toBe(false);
    });

    it('should return false for empty username', () => {
      const message = { username: '' };
      expect(isOwnMessage(message, 'testuser')).toBe(false);
    });
  });

  describe('isSystemMessage', () => {
    it('should return true for "left the chat" message', () => {
      const message = { text: 'User left the chat' };
      expect(isSystemMessage(message)).toBe(true);
    });

    it('should return true for "joined the chat" message', () => {
      const message = { text: 'User joined the chat' };
      expect(isSystemMessage(message)).toBe(true);
    });

    it('should be case insensitive', () => {
      const message = { text: 'USER LEFT THE CHAT' };
      expect(isSystemMessage(message)).toBe(true);
    });

    it('should return false for regular message', () => {
      const message = { text: 'Hello world' };
      expect(isSystemMessage(message)).toBe(false);
    });

    it('should return false for null message', () => {
      expect(isSystemMessage(null)).toBe(false);
    });

    it('should return false for message without text', () => {
      const message = { username: 'user' };
      expect(isSystemMessage(message)).toBe(false);
    });

    it('should return false for non-string text', () => {
      const message = { text: 123 };
      expect(isSystemMessage(message)).toBe(false);
    });
  });

  describe('isOptimisticMessage', () => {
    it('should return true for message with isOptimistic flag', () => {
      const message = { id: 'msg1', isOptimistic: true };
      expect(isOptimisticMessage(message)).toBe(true);
    });

    it('should return true for message with pending_ prefix ID', () => {
      const message = { id: 'pending_123456_abc' };
      expect(isOptimisticMessage(message)).toBe(true);
    });

    it('should return false for server message', () => {
      const message = { id: '1706789123-socket123' };
      expect(isOptimisticMessage(message)).toBe(false);
    });

    it('should return false for null message', () => {
      expect(isOptimisticMessage(null)).toBe(false);
    });

    it('should return false for message without id', () => {
      const message = { text: 'hello' };
      expect(isOptimisticMessage(message)).toBe(false);
    });

    it('should return true when isOptimistic is truthy', () => {
      const message = { id: 'msg1', isOptimistic: 1 };
      expect(isOptimisticMessage(message)).toBe(true);
    });
  });

  describe('messageExistsById', () => {
    const messages = [
      { id: 'msg1', text: 'Hello' },
      { id: 'msg2', text: 'World' },
    ];

    it('should return true when message ID exists', () => {
      expect(messageExistsById(messages, 'msg1')).toBe(true);
    });

    it('should return false when message ID does not exist', () => {
      expect(messageExistsById(messages, 'msg3')).toBe(false);
    });

    it('should return false for null messageId', () => {
      expect(messageExistsById(messages, null)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(messageExistsById([], 'msg1')).toBe(false);
    });

    it('should return false for non-array messages', () => {
      expect(messageExistsById(null, 'msg1')).toBe(false);
    });
  });

  describe('messageExistsByContent', () => {
    const baseTime = new Date('2024-01-15T12:00:00.000Z').getTime();

    const messages = [
      {
        id: 'msg1',
        text: 'Hello world',
        username: 'user1',
        timestamp: new Date(baseTime).toISOString(),
      },
    ];

    it('should return true when ID matches', () => {
      const message = { id: 'msg1', text: 'different', username: 'different' };
      expect(messageExistsByContent(messages, message)).toBe(true);
    });

    it('should return true when content matches within time window', () => {
      const message = {
        id: 'newId',
        text: 'Hello world',
        username: 'user1',
        timestamp: new Date(baseTime + 2000).toISOString(), // 2 seconds later
      };
      expect(messageExistsByContent(messages, message)).toBe(true);
    });

    it('should return false when text differs', () => {
      const message = {
        id: 'newId',
        text: 'Different text',
        username: 'user1',
        timestamp: new Date(baseTime).toISOString(),
      };
      expect(messageExistsByContent(messages, message)).toBe(false);
    });

    it('should return false when username differs', () => {
      const message = {
        id: 'newId',
        text: 'Hello world',
        username: 'user2',
        timestamp: new Date(baseTime).toISOString(),
      };
      expect(messageExistsByContent(messages, message)).toBe(false);
    });

    it('should return false when outside time window', () => {
      const message = {
        id: 'newId',
        text: 'Hello world',
        username: 'user1',
        timestamp: new Date(baseTime + 10000).toISOString(), // 10 seconds later
      };
      expect(messageExistsByContent(messages, message)).toBe(false);
    });

    it('should use custom time window', () => {
      const message = {
        id: 'newId',
        text: 'Hello world',
        username: 'user1',
        timestamp: new Date(baseTime + 10000).toISOString(),
      };
      expect(messageExistsByContent(messages, message, 15000)).toBe(true);
    });

    it('should be case insensitive for text', () => {
      const message = {
        id: 'newId',
        text: 'HELLO WORLD',
        username: 'user1',
        timestamp: new Date(baseTime).toISOString(),
      };
      expect(messageExistsByContent(messages, message)).toBe(true);
    });

    it('should return false for null messages array', () => {
      expect(messageExistsByContent(null, { id: 'msg1' })).toBe(false);
    });

    it('should return false for null message', () => {
      expect(messageExistsByContent(messages, null)).toBe(false);
    });
  });

  describe('findMatchingOptimisticIndex', () => {
    const baseTime = new Date('2024-01-15T12:00:00.000Z').getTime();

    it('should find match by optimisticId', () => {
      const messages = [
        { id: 'pending_123', text: 'Hello', username: 'testuser', isOptimistic: true },
      ];
      const serverMessage = {
        id: 'server_456',
        optimisticId: 'pending_123',
        text: 'Hello',
        username: 'testuser',
        timestamp: new Date(baseTime).toISOString(),
      };

      expect(findMatchingOptimisticIndex(messages, serverMessage, 'testuser')).toBe(0);
    });

    it('should find match by text+time when no optimisticId', () => {
      const messages = [
        {
          id: 'pending_123',
          text: 'Hello world',
          username: 'testuser',
          isOptimistic: true,
          timestamp: new Date(baseTime).toISOString(),
        },
      ];
      const serverMessage = {
        id: 'server_456',
        text: 'Hello world',
        username: 'testuser',
        timestamp: new Date(baseTime + 2000).toISOString(),
      };

      expect(findMatchingOptimisticIndex(messages, serverMessage, 'testuser')).toBe(0);
    });

    it('should return -1 when no match found', () => {
      const messages = [
        { id: 'pending_123', text: 'Different', username: 'testuser', isOptimistic: true },
      ];
      const serverMessage = {
        id: 'server_456',
        text: 'Hello',
        username: 'testuser',
        timestamp: new Date(baseTime).toISOString(),
      };

      expect(findMatchingOptimisticIndex(messages, serverMessage, 'testuser')).toBe(-1);
    });

    it('should not match non-optimistic messages', () => {
      const messages = [{ id: 'server_123', text: 'Hello', username: 'testuser' }];
      const serverMessage = {
        id: 'server_456',
        optimisticId: 'server_123',
        text: 'Hello',
        username: 'testuser',
      };

      expect(findMatchingOptimisticIndex(messages, serverMessage, 'testuser')).toBe(-1);
    });

    it('should not match messages from other users', () => {
      const messages = [
        { id: 'pending_123', text: 'Hello', username: 'otheruser', isOptimistic: true },
      ];
      const serverMessage = {
        id: 'server_456',
        optimisticId: 'pending_123',
        text: 'Hello',
        username: 'testuser',
      };

      expect(findMatchingOptimisticIndex(messages, serverMessage, 'testuser')).toBe(-1);
    });

    it('should return -1 for messages from others', () => {
      const messages = [
        { id: 'pending_123', text: 'Hello', username: 'testuser', isOptimistic: true },
      ];
      const serverMessage = {
        id: 'server_456',
        text: 'Hello',
        username: 'otheruser',
      };

      expect(findMatchingOptimisticIndex(messages, serverMessage, 'testuser')).toBe(-1);
    });

    it('should prioritize optimisticId over text+time', () => {
      const messages = [
        {
          id: 'pending_123',
          text: 'Hello',
          username: 'testuser',
          isOptimistic: true,
          timestamp: new Date(baseTime).toISOString(),
        },
        {
          id: 'pending_456',
          text: 'Hello',
          username: 'testuser',
          isOptimistic: true,
          timestamp: new Date(baseTime).toISOString(),
        },
      ];
      const serverMessage = {
        id: 'server_789',
        optimisticId: 'pending_456',
        text: 'Hello',
        username: 'testuser',
        timestamp: new Date(baseTime).toISOString(),
      };

      // Should match pending_456 (index 1) by optimisticId, not pending_123 (index 0) by text
      expect(findMatchingOptimisticIndex(messages, serverMessage, 'testuser')).toBe(1);
    });

    it('should return -1 for null messages array', () => {
      expect(findMatchingOptimisticIndex(null, { id: '1' }, 'user')).toBe(-1);
    });

    it('should return -1 for null serverMessage', () => {
      expect(findMatchingOptimisticIndex([], null, 'user')).toBe(-1);
    });

    it('should return -1 for null currentUsername', () => {
      expect(findMatchingOptimisticIndex([], { id: '1' }, null)).toBe(-1);
    });
  });

  describe('determineMessageAction', () => {
    const baseTime = new Date('2024-01-15T12:00:00.000Z').getTime();

    it('should return ignore for system messages', () => {
      const message = { text: 'User left the chat' };
      const result = determineMessageAction([], message, 'testuser');

      expect(result).toEqual({ action: 'ignore', reason: 'system_message' });
    });

    it('should return skip when message already exists by ID', () => {
      const messages = [{ id: 'msg1' }];
      const message = { id: 'msg1', text: 'Hello' };
      const result = determineMessageAction(messages, message, 'testuser');

      expect(result).toEqual({ action: 'skip', reason: 'already_exists_by_id' });
    });

    it('should return replace when optimistic message matches by optimisticId', () => {
      const messages = [
        { id: 'pending_123', text: 'Hello', username: 'testuser', isOptimistic: true },
      ];
      const message = {
        id: 'server_456',
        optimisticId: 'pending_123',
        text: 'Hello',
        username: 'testuser',
      };
      const result = determineMessageAction(messages, message, 'testuser');

      expect(result).toEqual({
        action: 'replace',
        removeIndex: 0,
        matchedBy: 'optimisticId',
      });
    });

    it('should return replace when optimistic message matches by text+time', () => {
      const messages = [
        {
          id: 'pending_123',
          text: 'Hello',
          username: 'testuser',
          isOptimistic: true,
          timestamp: new Date(baseTime).toISOString(),
        },
      ];
      const message = {
        id: 'server_456',
        text: 'Hello',
        username: 'testuser',
        timestamp: new Date(baseTime + 1000).toISOString(),
      };
      const result = determineMessageAction(messages, message, 'testuser');

      expect(result).toEqual({
        action: 'replace',
        removeIndex: 0,
        matchedBy: 'text_time',
      });
    });

    it('should return append for own message with no optimistic match', () => {
      const messages = [];
      const message = { id: 'server_456', text: 'Hello', username: 'testuser' };
      const result = determineMessageAction(messages, message, 'testuser');

      expect(result).toEqual({ action: 'append', reason: 'no_optimistic_match' });
    });

    it('should return skip for duplicate content from others', () => {
      const messages = [
        {
          id: 'msg1',
          text: 'Hello',
          username: 'otheruser',
          timestamp: new Date(baseTime).toISOString(),
        },
      ];
      const message = {
        id: 'msg2',
        text: 'Hello',
        username: 'otheruser',
        timestamp: new Date(baseTime + 1000).toISOString(),
      };
      const result = determineMessageAction(messages, message, 'testuser');

      expect(result).toEqual({ action: 'skip', reason: 'duplicate_content' });
    });

    it('should return append for new message from others', () => {
      const messages = [];
      const message = { id: 'msg1', text: 'Hello', username: 'otheruser' };
      const result = determineMessageAction(messages, message, 'testuser');

      expect(result).toEqual({ action: 'append', reason: 'new_message' });
    });
  });

  describe('applyMessageAction', () => {
    const messages = [
      { id: 'msg1', text: 'Hello' },
      { id: 'msg2', text: 'World' },
    ];
    const newMessage = { id: 'msg3', text: 'New' };

    it('should return same array for ignore action', () => {
      const result = applyMessageAction(messages, newMessage, { action: 'ignore' });
      expect(result).toBe(messages);
    });

    it('should return same array for skip action', () => {
      const result = applyMessageAction(messages, newMessage, { action: 'skip' });
      expect(result).toBe(messages);
    });

    it('should remove and append for replace action', () => {
      const result = applyMessageAction(messages, newMessage, {
        action: 'replace',
        removeIndex: 0,
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('msg2');
      expect(result[1].id).toBe('msg3');
    });

    it('should append for append action', () => {
      const result = applyMessageAction(messages, newMessage, { action: 'append' });

      expect(result).toHaveLength(3);
      expect(result[2].id).toBe('msg3');
    });

    it('should not mutate original array', () => {
      const original = [...messages];
      applyMessageAction(messages, newMessage, { action: 'append' });

      expect(messages).toEqual(original);
    });

    it('should return original for unknown action', () => {
      const result = applyMessageAction(messages, newMessage, { action: 'unknown' });
      expect(result).toBe(messages);
    });
  });
});
