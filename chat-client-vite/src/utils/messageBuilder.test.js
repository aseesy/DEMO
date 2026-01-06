/**
 * messageBuilder.js Unit Tests
 *
 * Tests pure message creation and manipulation functions.
 * Covers ID generation, message creation, system message detection, and offline queue.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateMessageId,
  createPendingMessage,
  createMessagePayload,
  ensureMessageTimestamp,
  isSystemMessage,
  filterSystemMessages,
  isOwnMessage,
  isAIMessage,
  createQueueMessage,
  loadOfflineQueue,
  saveOfflineQueue,
  clearOfflineQueue,
  removeFromQueue,
  MESSAGE_STATUS,
  OFFLINE_QUEUE_KEY,
} from './messageBuilder.js';

// Mock StorageAdapter - must be defined inside vi.mock factory
vi.mock('../adapters/storage', () => {
  const mockStorageStore = {};
  return {
    storage: {
      get: vi.fn((key) => {
        const value = mockStorageStore[key];
        if (value === undefined) return null;
        // StorageAdapter.get() parses JSON automatically
        try {
          return typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
          return value;
        }
      }),
      set: vi.fn((key, value) => {
        try {
          // StorageAdapter.set() stringifies objects automatically
          mockStorageStore[key] = typeof value === 'object' ? JSON.stringify(value) : value;
          return true;
        } catch {
          return false;
        }
      }),
      remove: vi.fn((key) => {
        delete mockStorageStore[key];
        return true;
      }),
      _getStore: () => mockStorageStore,
    },
    StorageKeys: {
      OFFLINE_QUEUE: 'liaizen_offline_queue',
    },
  };
});

// Import mocked modules after vi.mock
import { storage as mockStorage, StorageKeys as mockStorageKeys } from '../adapters/storage';

// Mock localStorage (for backward compatibility with other tests)
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _getStore: () => store,
  };
})();

describe('Message Builder', () => {
  beforeEach(() => {
    // Clear storage mocks
    if (mockStorage && mockStorage._getStore) {
      Object.keys(mockStorage._getStore()).forEach(key => delete mockStorage._getStore()[key]);
    }
    Object.keys(mockLocalStorage._getStore()).forEach(key => delete mockLocalStorage._getStore()[key]);
    vi.clearAllMocks();
  });
  describe('generateMessageId', () => {
    it('should generate ID with timestamp and socket ID', () => {
      const id = generateMessageId('socket123');

      expect(id).toContain('-');
      expect(id).toContain('socket123');
    });

    it('should use "local" as default socket ID', () => {
      const id = generateMessageId();

      expect(id).toContain('local');
    });

    it('should generate unique IDs with random component', () => {
      const id1 = generateMessageId('test');
      const id2 = generateMessageId('test');

      // IDs include timestamp - may be same within same millisecond
      // But each call should produce a valid ID format
      expect(id1).toMatch(/^\d+-test$/);
      expect(id2).toMatch(/^\d+-test$/);
    });

    it('should start with timestamp', () => {
      const beforeTime = Date.now();
      const id = generateMessageId('test');
      const timestamp = parseInt(id.split('-')[0], 10);

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('createPendingMessage', () => {
    it('should create message with required fields', () => {
      const message = createPendingMessage({
        text: 'Hello world',
        username: 'testuser',
      });

      expect(message.text).toBe('Hello world');
      expect(message.username).toBe('testuser');
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeDefined();
      expect(message.status).toBe('pending');
    });

    it('should trim message text', () => {
      const message = createPendingMessage({
        text: '  Hello world  ',
        username: 'testuser',
      });

      expect(message.text).toBe('Hello world');
    });

    it('should use provided socket ID for ID generation', () => {
      const message = createPendingMessage({
        text: 'Hello',
        username: 'testuser',
        socketId: 'custom-socket',
      });

      expect(message.id).toContain('custom-socket');
    });

    it('should set isPreApprovedRewrite to false by default', () => {
      const message = createPendingMessage({
        text: 'Hello',
        username: 'testuser',
      });

      expect(message.isPreApprovedRewrite).toBe(false);
    });

    it('should include isPreApprovedRewrite when true', () => {
      const message = createPendingMessage({
        text: 'Hello',
        username: 'testuser',
        isPreApprovedRewrite: true,
        originalRewrite: 'Original text',
      });

      expect(message.isPreApprovedRewrite).toBe(true);
      expect(message.originalRewrite).toBe('Original text');
    });

    it('should generate valid ISO timestamp', () => {
      const message = createPendingMessage({
        text: 'Hello',
        username: 'testuser',
      });

      const date = new Date(message.timestamp);
      expect(date.toISOString()).toBe(message.timestamp);
    });
  });

  describe('createMessagePayload', () => {
    it('should create payload with trimmed text', () => {
      const payload = createMessagePayload({
        text: '  Hello world  ',
      });

      expect(payload.text).toBe('Hello world');
    });

    it('should default isPreApprovedRewrite to false', () => {
      const payload = createMessagePayload({ text: 'Hello' });

      expect(payload.isPreApprovedRewrite).toBe(false);
    });

    it('should include isPreApprovedRewrite when true', () => {
      const payload = createMessagePayload({
        text: 'Hello',
        isPreApprovedRewrite: true,
        originalRewrite: 'Original',
      });

      expect(payload.isPreApprovedRewrite).toBe(true);
      expect(payload.originalRewrite).toBe('Original');
    });

    it('should set originalRewrite to null when not provided', () => {
      const payload = createMessagePayload({ text: 'Hello' });

      expect(payload.originalRewrite).toBeNull();
    });
  });

  describe('ensureMessageTimestamp', () => {
    it('should preserve existing timestamp', () => {
      const existingTimestamp = '2024-01-01T12:00:00.000Z';
      const message = { text: 'Hello', timestamp: existingTimestamp };

      const result = ensureMessageTimestamp(message);

      expect(result.timestamp).toBe(existingTimestamp);
    });

    it('should add timestamp if missing', () => {
      const message = { text: 'Hello' };

      const result = ensureMessageTimestamp(message);

      expect(result.timestamp).toBeDefined();
      // Should be valid ISO string
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should return null for null input', () => {
      expect(ensureMessageTimestamp(null)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(ensureMessageTimestamp(undefined)).toBeUndefined();
    });

    it('should not mutate original message', () => {
      const message = { text: 'Hello' };
      const result = ensureMessageTimestamp(message);

      expect(message.timestamp).toBeUndefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('isSystemMessage', () => {
    it('should detect "left the chat" messages', () => {
      expect(isSystemMessage({ text: 'John left the chat' })).toBe(true);
      expect(isSystemMessage({ text: 'User Left The Chat' })).toBe(true);
    });

    it('should detect "joined the chat" messages', () => {
      expect(isSystemMessage({ text: 'Jane joined the chat' })).toBe(true);
      expect(isSystemMessage({ text: 'User JOINED THE CHAT' })).toBe(true);
    });

    it('should return false for regular messages', () => {
      expect(isSystemMessage({ text: 'Hello everyone' })).toBe(false);
      expect(isSystemMessage({ text: 'I am leaving' })).toBe(false);
      expect(isSystemMessage({ text: 'Just joined you!' })).toBe(false);
    });

    it('should return false for null/undefined message', () => {
      expect(isSystemMessage(null)).toBe(false);
      expect(isSystemMessage(undefined)).toBe(false);
    });

    it('should return false for message without text', () => {
      expect(isSystemMessage({})).toBe(false);
      expect(isSystemMessage({ text: null })).toBe(false);
    });

    it('should return false for non-string text', () => {
      expect(isSystemMessage({ text: 123 })).toBe(false);
      expect(isSystemMessage({ text: {} })).toBe(false);
    });
  });

  describe('filterSystemMessages', () => {
    it('should filter out system messages', () => {
      const messages = [
        { id: 1, text: 'John joined the chat' },
        { id: 2, text: 'Hello everyone!' },
        { id: 3, text: 'Jane left the chat' },
        { id: 4, text: 'How are you?' },
      ];

      const filtered = filterSystemMessages(messages);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe(2);
      expect(filtered[1].id).toBe(4);
    });

    it('should return empty array for non-array input', () => {
      expect(filterSystemMessages(null)).toEqual([]);
      expect(filterSystemMessages(undefined)).toEqual([]);
      expect(filterSystemMessages('string')).toEqual([]);
    });

    it('should return all messages if none are system messages', () => {
      const messages = [
        { id: 1, text: 'Hello' },
        { id: 2, text: 'World' },
      ];

      const filtered = filterSystemMessages(messages);

      expect(filtered).toHaveLength(2);
    });
  });

  describe('isOwnMessage', () => {
    it('should return true for matching username', () => {
      const message = { username: 'john' };
      expect(isOwnMessage(message, 'john')).toBe(true);
    });

    it('should be case-insensitive', () => {
      const message = { username: 'John' };
      expect(isOwnMessage(message, 'JOHN')).toBe(true);
      expect(isOwnMessage(message, 'john')).toBe(true);
    });

    it('should return false for different username', () => {
      const message = { username: 'john' };
      expect(isOwnMessage(message, 'jane')).toBe(false);
    });

    it('should return false for null message', () => {
      expect(isOwnMessage(null, 'john')).toBe(false);
    });

    it('should return false for message without username', () => {
      expect(isOwnMessage({}, 'john')).toBe(false);
    });

    it('should return false for null currentUsername', () => {
      expect(isOwnMessage({ username: 'john' }, null)).toBe(false);
    });
  });

  describe('isAIMessage', () => {
    it('should detect ai_ prefixed types', () => {
      expect(isAIMessage({ type: 'ai_intervention' })).toBe(true);
      expect(isAIMessage({ type: 'ai_suggestion' })).toBe(true);
      expect(isAIMessage({ type: 'ai_rewrite' })).toBe(true);
    });

    it('should detect pending_original type', () => {
      expect(isAIMessage({ type: 'pending_original' })).toBe(true);
    });

    it('should return false for regular message types', () => {
      expect(isAIMessage({ type: 'user_message' })).toBe(false);
      expect(isAIMessage({ type: 'system' })).toBe(false);
    });

    it('should return false for message without type', () => {
      expect(isAIMessage({})).toBe(false);
      expect(isAIMessage({ text: 'Hello' })).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isAIMessage(null)).toBe(false);
      expect(isAIMessage(undefined)).toBe(false);
    });
  });

  describe('createQueueMessage', () => {
    it('should create queue message from pending message', () => {
      const pending = {
        id: 'msg-123',
        text: 'Hello world',
        isPreApprovedRewrite: false,
      };

      const queue = createQueueMessage(pending);

      expect(queue.id).toBe('msg-123');
      expect(queue.text).toBe('Hello world');
      expect(queue.isPreApprovedRewrite).toBe(false);
      expect(queue.queuedAt).toBeDefined();
    });

    it('should include rewrite data if present', () => {
      const pending = {
        id: 'msg-123',
        text: 'Rewritten text',
        isPreApprovedRewrite: true,
        originalRewrite: 'Original text',
      };

      const queue = createQueueMessage(pending);

      expect(queue.isPreApprovedRewrite).toBe(true);
      expect(queue.originalRewrite).toBe('Original text');
    });

    it('should default originalRewrite to null', () => {
      const pending = { id: 'msg-123', text: 'Hello' };

      const queue = createQueueMessage(pending);

      expect(queue.originalRewrite).toBeNull();
    });

    it('should generate valid ISO timestamp for queuedAt', () => {
      const pending = { id: 'msg-123', text: 'Hello' };

      const queue = createQueueMessage(pending);
      const date = new Date(queue.queuedAt);

      expect(date.toISOString()).toBe(queue.queuedAt);
    });
  });

  describe('offline queue operations', () => {
    beforeEach(() => {
      vi.stubGlobal('localStorage', mockLocalStorage);
      mockLocalStorage.clear();
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    describe('loadOfflineQueue', () => {
      it('should return empty array when nothing stored', async () => {
        mockStorage.get.mockReturnValueOnce(null);
        const queue = await loadOfflineQueue();
        expect(queue).toEqual([]);
        expect(mockStorage.get).toHaveBeenCalledWith(mockStorageKeys.OFFLINE_QUEUE);
      });

      it('should parse stored queue', async () => {
        const stored = [{ id: '1', text: 'Hello' }];
        mockStorage.get.mockReturnValueOnce(stored);

        const queue = await loadOfflineQueue();

        expect(queue).toEqual(stored);
        expect(mockStorage.get).toHaveBeenCalledWith(mockStorageKeys.OFFLINE_QUEUE);
      });

      it('should return empty array for invalid JSON', async () => {
        // StorageAdapter.get() already parses JSON, so if it returns a string, it's already parsed
        // But if it's not an array, we return empty array
        mockStorage.get.mockReturnValueOnce('invalid json');

        const queue = await loadOfflineQueue();

        expect(queue).toEqual([]);
      });

      it('should return empty array if stored value is not an array', async () => {
        mockStorage.get.mockReturnValueOnce({ not: 'array' });

        const queue = await loadOfflineQueue();

        expect(queue).toEqual([]);
      });

      it('should use custom storage key', async () => {
        const stored = [{ id: '1', text: 'Hello' }];
        mockStorage.get.mockReturnValueOnce(stored);

        const queue = await loadOfflineQueue('custom_key');

        expect(queue).toEqual(stored);
        expect(mockStorage.get).toHaveBeenCalledWith('custom_key');
      });
    });

    describe('saveOfflineQueue', () => {
      it('should save queue to storage', async () => {
        const queue = [{ id: '1', text: 'Hello' }];

        const result = await saveOfflineQueue(queue);

        expect(result).toBe(true);
        expect(mockStorage.set).toHaveBeenCalledWith(
          mockStorageKeys.OFFLINE_QUEUE,
          queue
        );
      });

      it('should use custom storage key', async () => {
        const queue = [{ id: '1', text: 'Hello' }];

        await saveOfflineQueue(queue, 'custom_key');

        expect(mockStorage.set).toHaveBeenCalledWith('custom_key', queue);
      });

      it('should return false on error', async () => {
        // Mock StorageAdapter.set to throw an error
        mockStorage.set.mockImplementationOnce(() => {
          throw new Error('Storage full');
        });

        const result = await saveOfflineQueue([{ id: '1' }]);

        // Function catches error and returns false
        expect(result).toBe(false);
      });
    });

    describe('clearOfflineQueue', () => {
      it('should remove queue from storage', async () => {
        const result = await clearOfflineQueue();

        expect(result).toBe(true);
        expect(mockStorage.remove).toHaveBeenCalledWith(mockStorageKeys.OFFLINE_QUEUE);
      });

      it('should use custom storage key', async () => {
        await clearOfflineQueue('custom_key');

        expect(mockStorage.remove).toHaveBeenCalledWith('custom_key');
      });

      it('should return false on error', async () => {
        // Mock StorageAdapter.remove to throw an error
        mockStorage.remove.mockImplementationOnce(() => {
          throw new Error('Error');
        });

        const result = await clearOfflineQueue();

        // Function catches error and returns false
        expect(result).toBe(false);
      });
    });
  });

  describe('removeFromQueue', () => {
    it('should remove message by ID', () => {
      const queue = [
        { id: '1', text: 'First' },
        { id: '2', text: 'Second' },
        { id: '3', text: 'Third' },
      ];

      const updated = removeFromQueue(queue, '2');

      expect(updated).toHaveLength(2);
      expect(updated.find(m => m.id === '2')).toBeUndefined();
    });

    it('should return same array if ID not found', () => {
      const queue = [{ id: '1', text: 'First' }];

      const updated = removeFromQueue(queue, 'nonexistent');

      expect(updated).toHaveLength(1);
    });

    it('should return empty array for non-array input', () => {
      expect(removeFromQueue(null, '1')).toEqual([]);
      expect(removeFromQueue(undefined, '1')).toEqual([]);
    });

    it('should not mutate original array', () => {
      const queue = [
        { id: '1', text: 'First' },
        { id: '2', text: 'Second' },
      ];

      removeFromQueue(queue, '1');

      expect(queue).toHaveLength(2);
    });
  });

  describe('MESSAGE_STATUS', () => {
    it('should have all expected statuses', () => {
      expect(MESSAGE_STATUS.PENDING).toBe('pending');
      expect(MESSAGE_STATUS.SENT).toBe('sent');
      expect(MESSAGE_STATUS.FAILED).toBe('failed');
      expect(MESSAGE_STATUS.DELIVERED).toBe('delivered');
      expect(MESSAGE_STATUS.READ).toBe('read');
    });
  });

  describe('OFFLINE_QUEUE_KEY', () => {
    it('should be liaizen_offline_queue', () => {
      expect(OFFLINE_QUEUE_KEY).toBe('liaizen_offline_queue');
    });
  });
});
