/**
 * useThreads Hook Tests
 * 
 * Tests for the useThreads React hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock ThreadService - must be defined before import
vi.mock('../../services/chat', () => {
  const mockThreadService = {
    getState: vi.fn(() => ({
      threads: [],
      threadMessages: {},
      isLoading: false,
      isAnalysisComplete: false,
    })),
    subscribe: vi.fn(() => () => {}), // Returns unsubscribe function
    create: vi.fn(),
    loadThreads: vi.fn(),
    loadThreadMessages: vi.fn(),
    addToThread: vi.fn(),
    replyInThread: vi.fn(),
    moveMessageToThread: vi.fn(),
    archiveThread: vi.fn(),
    clear: vi.fn(),
  };
  return {
    threadService: mockThreadService,
  };
});

import { useThreads } from './useThreads.js';
import { threadService } from '../../services/chat';

describe('useThreads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    threadService.getState.mockReturnValue({
      threads: [],
      threadMessages: {},
      isLoading: false,
      isAnalysisComplete: false,
    });
  });

  it('should return initial state from ThreadService', () => {
    const { result } = renderHook(() => useThreads());
    
    expect(result.current.threads).toEqual([]);
    expect(result.current.threadMessages).toEqual({});
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAnalysisComplete).toBe(false);
  });

  it('should subscribe to ThreadService on mount', () => {
    renderHook(() => useThreads());
    
    expect(threadService.subscribe).toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    const unsubscribe = vi.fn();
    threadService.subscribe.mockReturnValue(unsubscribe);
    
    const { unmount } = renderHook(() => useThreads());
    unmount();
    
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should provide create callback', () => {
    const { result } = renderHook(() => useThreads());
    
    act(() => {
      result.current.create('room-123', 'Test Thread', 'msg-123', 'logistics');
    });
    
    expect(threadService.create).toHaveBeenCalledWith('room-123', 'Test Thread', 'msg-123', 'logistics');
  });

  it('should provide loadThreads callback', () => {
    const { result } = renderHook(() => useThreads());
    
    act(() => {
      result.current.loadThreads('room-123');
    });
    
    expect(threadService.loadThreads).toHaveBeenCalledWith('room-123');
  });

  it('should provide loadThreadMessages callback with pagination', () => {
    const { result } = renderHook(() => useThreads());
    
    act(() => {
      result.current.loadThreadMessages('thread-123', 50, 10);
    });
    
    expect(threadService.loadThreadMessages).toHaveBeenCalledWith('thread-123', 50, 10);
  });

  it('should provide addToThread callback', () => {
    const { result } = renderHook(() => useThreads());
    
    act(() => {
      result.current.addToThread('msg-123', 'thread-456');
    });
    
    expect(threadService.addToThread).toHaveBeenCalledWith('msg-123', 'thread-456');
  });

  it('should provide replyInThread callback', () => {
    const { result } = renderHook(() => useThreads());
    
    act(() => {
      result.current.replyInThread('thread-123', 'Hello', { metadata: 'test' });
    });
    
    expect(threadService.replyInThread).toHaveBeenCalledWith('thread-123', 'Hello', { metadata: 'test' });
  });

  it('should provide moveMessageToThread callback', () => {
    const { result } = renderHook(() => useThreads());
    
    act(() => {
      result.current.moveMessageToThread('msg-123', 'thread-456', 'room-789');
    });
    
    expect(threadService.moveMessageToThread).toHaveBeenCalledWith('msg-123', 'thread-456', 'room-789');
  });

  it('should provide archiveThread callback', () => {
    const { result } = renderHook(() => useThreads());
    
    act(() => {
      result.current.archiveThread('thread-123', true, true);
    });
    
    expect(threadService.archiveThread).toHaveBeenCalledWith('thread-123', true, true);
  });

  it('should provide clear callback', () => {
    const { result } = renderHook(() => useThreads());
    
    act(() => {
      result.current.clear();
    });
    
    expect(threadService.clear).toHaveBeenCalled();
  });

  it('should update state when ThreadService notifies', () => {
    const { result } = renderHook(() => useThreads());
    
    // Get the callback passed to subscribe
    const subscribeCallback = threadService.subscribe.mock.calls[0][0];
    
    // Simulate state update
    act(() => {
      subscribeCallback({
        threads: [{ id: 'thread-1', title: 'Test' }],
        threadMessages: { 'thread-1': [] },
        isLoading: true,
        isAnalysisComplete: true,
      });
    });
    
    expect(result.current.threads).toEqual([{ id: 'thread-1', title: 'Test' }]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAnalysisComplete).toBe(true);
  });

  it('should maintain stable callback references', () => {
    const { result, rerender } = renderHook(() => useThreads());
    
    const firstCreate = result.current.create;
    const firstReply = result.current.replyInThread;
    
    rerender();
    
    expect(result.current.create).toBe(firstCreate);
    expect(result.current.replyInThread).toBe(firstReply);
  });
});

