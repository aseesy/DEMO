/**
 * useSearchMessages Hook Tests
 *
 * Tests for the message search functionality hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchMessages } from './useSearchMessages.js';

describe('useSearchMessages', () => {
  let mockSocketRef;
  let mockSetError;

  beforeEach(() => {
    vi.useFakeTimers();
    mockSocketRef = {
      current: {
        emit: vi.fn(),
        connected: true,
      },
    };
    mockSetError = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty search query', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      expect(result.current.searchQuery).toBe('');
    });

    it('should initialize with empty search results', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      expect(result.current.searchResults).toEqual([]);
    });

    it('should initialize with searchTotal as 0', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      expect(result.current.searchTotal).toBe(0);
    });

    it('should initialize with isSearching as false', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      expect(result.current.isSearching).toBe(false);
    });

    it('should initialize with searchMode as false', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      expect(result.current.searchMode).toBe(false);
    });

    it('should initialize with highlightedMessageId as null', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      expect(result.current.highlightedMessageId).toBe(null);
    });
  });

  describe('searchMessages', () => {
    it('should emit search_messages event for valid query', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.searchMessages('hello world');
      });

      expect(mockSocketRef.current.emit).toHaveBeenCalledWith('search_messages', {
        query: 'hello world',
        limit: 50,
        offset: 0,
      });
    });

    it('should set isSearching to true when searching', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.searchMessages('hello world');
      });

      expect(result.current.isSearching).toBe(true);
    });

    it('should update searchQuery when searching', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.searchMessages('hello world');
      });

      expect(result.current.searchQuery).toBe('hello world');
    });

    it('should not emit for query less than 2 characters', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.searchMessages('h');
      });

      expect(mockSocketRef.current.emit).not.toHaveBeenCalled();
      expect(result.current.searchResults).toEqual([]);
    });

    it('should clear results for empty query', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      // First set some results
      act(() => {
        result.current.setSearchResults([{ id: 1, text: 'test' }]);
        result.current.setSearchTotal(1);
      });

      // Then search with empty query
      act(() => {
        result.current.searchMessages('');
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.searchTotal).toBe(0);
    });

    it('should set error when socket is not connected', () => {
      mockSocketRef.current.connected = false;

      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.searchMessages('hello');
      });

      expect(mockSetError).toHaveBeenCalledWith('Not connected to chat server.');
    });
  });

  describe('jumpToMessage', () => {
    it('should emit jump_to_message event', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.jumpToMessage('msg-123');
      });

      expect(mockSocketRef.current.emit).toHaveBeenCalledWith('jump_to_message', {
        messageId: 'msg-123',
      });
    });

    it('should set error when socket is not connected', () => {
      mockSocketRef.current.connected = false;

      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.jumpToMessage('msg-123');
      });

      expect(mockSetError).toHaveBeenCalledWith('Not connected to chat server.');
    });
  });

  describe('toggleSearchMode', () => {
    it('should toggle searchMode from false to true', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.toggleSearchMode();
      });

      expect(result.current.searchMode).toBe(true);
    });

    it('should toggle searchMode from true to false and clear search', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      // First enable search mode and set some state
      act(() => {
        result.current.setSearchMode(true);
        result.current.setSearchResults([{ id: 1, text: 'test' }]);
        result.current.setSearchTotal(1);
      });

      // Toggle off
      act(() => {
        result.current.toggleSearchMode();
      });

      expect(result.current.searchMode).toBe(false);
      expect(result.current.searchQuery).toBe('');
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.searchTotal).toBe(0);
    });
  });

  describe('exitSearchMode', () => {
    it('should set searchMode to false', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.setSearchMode(true);
      });

      act(() => {
        result.current.exitSearchMode();
      });

      expect(result.current.searchMode).toBe(false);
    });

    it('should clear all search state', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.setSearchMode(true);
        result.current.setSearchResults([{ id: 1, text: 'test' }]);
        result.current.setSearchTotal(5);
      });

      act(() => {
        result.current.exitSearchMode();
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.searchTotal).toBe(0);
    });

    it('should emit join event to reload messages', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.exitSearchMode();
      });

      expect(mockSocketRef.current.emit).toHaveBeenCalledWith('join', { email: 'testuser' });
    });
  });

  describe('handleSearchResults', () => {
    it('should update search results and total', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      const mockResults = [
        { id: 1, text: 'hello' },
        { id: 2, text: 'world' },
      ];

      act(() => {
        result.current.handleSearchResults({ messages: mockResults, total: 10 });
      });

      expect(result.current.searchResults).toEqual(mockResults);
      expect(result.current.searchTotal).toBe(10);
      expect(result.current.isSearching).toBe(false);
    });

    it('should handle empty results', () => {
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.handleSearchResults({ messages: null, total: 0 });
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.searchTotal).toBe(0);
    });
  });

  describe('handleJumpToMessageResult', () => {
    it('should set messages and highlighted message id', () => {
      const mockSetMessages = vi.fn();
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      const contextMsgs = [
        { id: 'msg-1', text: 'before' },
        { id: 'msg-2', text: 'target' },
        { id: 'msg-3', text: 'after' },
      ];

      act(() => {
        result.current.handleJumpToMessageResult({
          messages: contextMsgs,
          targetMessageId: 'msg-2',
          setMessages: mockSetMessages,
        });
      });

      expect(mockSetMessages).toHaveBeenCalledWith(contextMsgs);
      expect(result.current.highlightedMessageId).toBe('msg-2');
      expect(result.current.searchMode).toBe(false);
    });

    it('should clear highlighted message after timeout', () => {
      const mockSetMessages = vi.fn();
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.handleJumpToMessageResult({
          messages: [{ id: 'msg-1' }],
          targetMessageId: 'msg-1',
          setMessages: mockSetMessages,
        });
      });

      expect(result.current.highlightedMessageId).toBe('msg-1');

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.highlightedMessageId).toBe(null);
    });

    it('should not update state for empty messages', () => {
      const mockSetMessages = vi.fn();
      const { result } = renderHook(() =>
        useSearchMessages({
          socketRef: mockSocketRef,
          username: 'testuser',
          setError: mockSetError,
        })
      );

      act(() => {
        result.current.handleJumpToMessageResult({
          messages: [],
          targetMessageId: 'msg-1',
          setMessages: mockSetMessages,
        });
      });

      expect(mockSetMessages).not.toHaveBeenCalled();
      expect(result.current.highlightedMessageId).toBe(null);
    });
  });
});
