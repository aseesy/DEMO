/**
 * StorageAdapter Tests
 *
 * Tests the storage abstraction layer to ensure:
 * - Basic get/set/remove operations work correctly
 * - JSON serialization/deserialization works
 * - TTL (time-to-live) expiration works
 * - Helper functions (authStorage, preferencesStorage) work
 * - Edge cases are handled gracefully
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  StorageAdapter,
  StorageKeys,
  storage,
  authStorage,
  preferencesStorage,
} from './StorageAdapter.js';

describe('StorageAdapter', () => {
  let mockStorage;
  let adapter;

  beforeEach(() => {
    // Create a mock localStorage
    mockStorage = {};
    const mockProvider = {
      get: key => mockStorage[key] ?? null,
      set: (key, value) => {
        mockStorage[key] = value;
        return true;
      },
      remove: key => {
        delete mockStorage[key];
        return true;
      },
      clear: () => {
        mockStorage = {};
        return true;
      },
    };
    adapter = new StorageAdapter(mockProvider);
  });

  afterEach(() => {
    mockStorage = {};
  });

  describe('Basic Operations', () => {
    it('should set and get a string value', () => {
      adapter.set('testKey', 'testValue');
      expect(adapter.get('testKey')).toBe('testValue');
    });

    it('should set and get a number value', () => {
      adapter.set('numKey', 42);
      expect(adapter.get('numKey')).toBe(42);
    });

    it('should set and get an object value', () => {
      const obj = { name: 'test', count: 5 };
      adapter.set('objKey', obj);
      expect(adapter.get('objKey')).toEqual(obj);
    });

    it('should set and get an array value', () => {
      const arr = [1, 2, 3, 'four'];
      adapter.set('arrKey', arr);
      expect(adapter.get('arrKey')).toEqual(arr);
    });

    it('should return default value for non-existent key', () => {
      expect(adapter.get('nonExistent', 'default')).toBe('default');
    });

    it('should return null for non-existent key without default', () => {
      expect(adapter.get('nonExistent')).toBeNull();
    });

    it('should remove a value', () => {
      adapter.set('removeMe', 'value');
      expect(adapter.get('removeMe')).toBe('value');
      adapter.remove('removeMe');
      expect(adapter.get('removeMe')).toBeNull();
    });

    it('should check if key exists', () => {
      adapter.set('exists', 'yes');
      expect(adapter.has('exists')).toBe(true);
      expect(adapter.has('notExists')).toBe(false);
    });
  });

  describe('getString', () => {
    it('should return raw string without JSON parsing', () => {
      mockStorage['rawString'] = 'just a string';
      expect(adapter.getString('rawString')).toBe('just a string');
    });

    it('should return default for non-existent key', () => {
      expect(adapter.getString('missing', 'fallback')).toBe('fallback');
    });

    it('should return empty string as default', () => {
      expect(adapter.getString('missing')).toBe('');
    });
  });

  describe('TTL (Time-to-Live)', () => {
    it('should return value before TTL expires', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      adapter.set('ttlKey', 'ttlValue', { ttl: 60000 }); // 1 minute TTL
      expect(adapter.get('ttlKey')).toBe('ttlValue');

      vi.useRealTimers();
    });

    it('should return default after TTL expires', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      adapter.set('expireKey', 'expireValue', { ttl: 1000 }); // 1 second TTL

      // Move time forward by 2 seconds
      vi.setSystemTime(now + 2000);

      expect(adapter.get('expireKey', 'expired')).toBe('expired');

      vi.useRealTimers();
    });

    it('should remove expired key from storage', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      adapter.set('autoRemove', 'value', { ttl: 1000 });
      vi.setSystemTime(now + 2000);

      adapter.get('autoRemove'); // This should trigger removal
      expect(adapter.has('autoRemove')).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('Batch Operations', () => {
    it('should get multiple values at once', () => {
      adapter.set('key1', 'value1');
      adapter.set('key2', 'value2');
      adapter.set('key3', 'value3');

      const result = adapter.getMany(['key1', 'key2', 'key3']);
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      });
    });

    it('should set multiple values at once', () => {
      adapter.setMany({
        batch1: 'val1',
        batch2: 'val2',
        batch3: { nested: true },
      });

      expect(adapter.get('batch1')).toBe('val1');
      expect(adapter.get('batch2')).toBe('val2');
      expect(adapter.get('batch3')).toEqual({ nested: true });
    });

    it('should remove multiple values at once', () => {
      adapter.set('rem1', 'v1');
      adapter.set('rem2', 'v2');
      adapter.set('rem3', 'v3');

      adapter.removeMany(['rem1', 'rem2']);

      expect(adapter.has('rem1')).toBe(false);
      expect(adapter.has('rem2')).toBe(false);
      expect(adapter.has('rem3')).toBe(true);
    });
  });

  describe('Prefix Support', () => {
    it('should add prefix to keys when set', () => {
      adapter.setPrefix('myapp');
      adapter.set('key', 'value');

      // The mock stores with prefix
      expect(mockStorage['myapp:key']).toBeDefined();
      expect(adapter.get('key')).toBe('value');
    });
  });

  describe('Edge Cases', () => {
    it('should handle boolean values', () => {
      adapter.set('boolTrue', true);
      adapter.set('boolFalse', false);

      expect(adapter.get('boolTrue')).toBe(true);
      expect(adapter.get('boolFalse')).toBe(false);
    });

    it('should handle null values', () => {
      adapter.set('nullKey', null);
      // null gets stringified and parsed back
      expect(adapter.get('nullKey')).toBeNull();
    });

    it('should handle empty string', () => {
      adapter.set('emptyStr', '');
      expect(adapter.get('emptyStr')).toBe('');
    });

    it('should handle empty object', () => {
      adapter.set('emptyObj', {});
      expect(adapter.get('emptyObj')).toEqual({});
    });

    it('should handle empty array', () => {
      adapter.set('emptyArr', []);
      expect(adapter.get('emptyArr')).toEqual([]);
    });
  });
});

describe('StorageKeys', () => {
  it('should have all required auth keys', () => {
    expect(StorageKeys.AUTH_TOKEN).toBe('auth_token_backup');
    expect(StorageKeys.USERNAME).toBe('username');
    expect(StorageKeys.IS_AUTHENTICATED).toBe('isAuthenticated');
    expect(StorageKeys.USER_EMAIL).toBe('userEmail');
    expect(StorageKeys.CHAT_USER).toBe('chatUser');
  });

  it('should have invitation keys', () => {
    expect(StorageKeys.PENDING_INVITE_CODE).toBe('pendingInviteCode');
    expect(StorageKeys.INVITATION_TOKEN).toBe('invitationToken');
    expect(StorageKeys.PENDING_SENT_INVITATION).toBe('pendingSentInvitation');
  });

  it('should have application state keys', () => {
    expect(StorageKeys.CURRENT_VIEW).toBe('currentView');
    expect(StorageKeys.NOTIFICATION_PREFERENCES).toBe('notificationPreferences');
  });
});

describe('authStorage helper', () => {
  beforeEach(() => {
    // Clear real localStorage for these tests
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should set and get token', () => {
    authStorage.setToken('test-jwt-token');
    expect(authStorage.getToken()).toBe('test-jwt-token');
  });

  it('should set and get username', () => {
    authStorage.setUsername('testuser');
    expect(authStorage.getUsername()).toBe('testuser');
  });

  it('should set and check authenticated status', () => {
    authStorage.setAuthenticated(true);
    expect(authStorage.isAuthenticated()).toBe(true);

    authStorage.setAuthenticated(false);
    expect(authStorage.isAuthenticated()).toBe(false);
  });

  it('should clear all auth data', () => {
    authStorage.setToken('token');
    authStorage.setUsername('user');
    authStorage.setAuthenticated(true);

    authStorage.clearAuth();

    expect(authStorage.getToken()).toBe('');
    expect(authStorage.getUsername()).toBe('');
    expect(authStorage.isAuthenticated()).toBe(false);
  });
});

describe('preferencesStorage helper', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should return default notification preferences', () => {
    const prefs = preferencesStorage.getNotificationPrefs();
    expect(prefs).toEqual({
      newMessages: true,
      taskReminders: false,
      invitations: true,
    });
  });

  it('should set and get notification preferences', () => {
    const customPrefs = {
      newMessages: false,
      taskReminders: true,
      invitations: false,
    };
    preferencesStorage.setNotificationPrefs(customPrefs);
    expect(preferencesStorage.getNotificationPrefs()).toEqual(customPrefs);
  });

  it('should get default toast sound setting', () => {
    expect(preferencesStorage.getToastSound()).toBe(true);
  });

  it('should set and get toast sound setting', () => {
    preferencesStorage.setToastSound(false);
    expect(preferencesStorage.getToastSound()).toBe(false);
  });
});
