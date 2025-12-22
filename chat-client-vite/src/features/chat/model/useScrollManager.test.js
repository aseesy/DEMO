/**
 * useScrollManager Hook Tests
 *
 * Tests for the scroll management functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollManager, isNearBottom, scrollToBottom } from './useScrollManager.js';

describe('isNearBottom', () => {
  it('should return false when containerRef is null', () => {
    expect(isNearBottom(null)).toBe(false);
    expect(isNearBottom({ current: null })).toBe(false);
  });

  it('should return true when at bottom of container', () => {
    const containerRef = {
      current: {
        scrollTop: 900,
        scrollHeight: 1000,
        clientHeight: 100,
      },
    };

    expect(isNearBottom(containerRef)).toBe(true);
  });

  it('should return true when within threshold of bottom', () => {
    const containerRef = {
      current: {
        scrollTop: 850,
        scrollHeight: 1000,
        clientHeight: 100,
      },
    };

    // Distance from bottom = 1000 - 850 - 100 = 50, which is < 100 threshold
    expect(isNearBottom(containerRef)).toBe(true);
  });

  it('should return false when far from bottom', () => {
    const containerRef = {
      current: {
        scrollTop: 0,
        scrollHeight: 1000,
        clientHeight: 100,
      },
    };

    // Distance from bottom = 1000 - 0 - 100 = 900, which is >= 100 threshold
    expect(isNearBottom(containerRef)).toBe(false);
  });

  it('should respect custom threshold', () => {
    const containerRef = {
      current: {
        scrollTop: 700,
        scrollHeight: 1000,
        clientHeight: 100,
      },
    };

    // Distance from bottom = 1000 - 700 - 100 = 200
    expect(isNearBottom(containerRef, 100)).toBe(false); // 200 >= 100
    expect(isNearBottom(containerRef, 250)).toBe(true); // 200 < 250
  });
});

describe('scrollToBottom', () => {
  it('should call scrollIntoView on ref', () => {
    const mockScrollIntoView = vi.fn();
    const ref = {
      current: {
        scrollIntoView: mockScrollIntoView,
      },
    };

    scrollToBottom(ref);

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('should use instant behavior when specified', () => {
    const mockScrollIntoView = vi.fn();
    const ref = {
      current: {
        scrollIntoView: mockScrollIntoView,
      },
    };

    scrollToBottom(ref, true);

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'instant' });
  });

  it('should handle null ref gracefully', () => {
    expect(() => scrollToBottom(null)).not.toThrow();
    expect(() => scrollToBottom({ current: null })).not.toThrow();
  });
});

describe('useScrollManager', () => {
  let mockMessagesContainerRef;
  let mockMessagesEndRef;

  beforeEach(() => {
    vi.useFakeTimers();
    mockMessagesContainerRef = {
      current: {
        scrollTop: 0,
        scrollHeight: 1000,
      },
    };
    mockMessagesEndRef = {
      current: {
        scrollIntoView: vi.fn(),
        parentElement: null,
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with isInitialLoad as true', () => {
      const { result } = renderHook(() =>
        useScrollManager({
          messagesContainerRef: mockMessagesContainerRef,
          messagesEndRef: mockMessagesEndRef,
        })
      );

      expect(result.current.isInitialLoad).toBe(true);
    });
  });

  describe('scrollToBottom', () => {
    it('should call scrollIntoView on messagesEndRef', () => {
      const { result } = renderHook(() =>
        useScrollManager({
          messagesContainerRef: mockMessagesContainerRef,
          messagesEndRef: mockMessagesEndRef,
        })
      );

      act(() => {
        result.current.scrollToBottom();
      });

      expect(mockMessagesEndRef.current.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
      });
    });

    it('should use instant behavior when specified', () => {
      const { result } = renderHook(() =>
        useScrollManager({
          messagesContainerRef: mockMessagesContainerRef,
          messagesEndRef: mockMessagesEndRef,
        })
      );

      act(() => {
        result.current.scrollToBottom(true);
      });

      expect(mockMessagesEndRef.current.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'instant',
      });
    });
  });

  describe('shouldAutoScroll', () => {
    it('should return false when messagesEndRef is null', () => {
      const { result } = renderHook(() =>
        useScrollManager({
          messagesContainerRef: mockMessagesContainerRef,
          messagesEndRef: { current: null },
        })
      );

      expect(result.current.shouldAutoScroll()).toBe(false);
    });

    it('should return false when no scrollable parent found', () => {
      const { result } = renderHook(() =>
        useScrollManager({
          messagesContainerRef: mockMessagesContainerRef,
          messagesEndRef: mockMessagesEndRef,
        })
      );

      expect(result.current.shouldAutoScroll()).toBe(false);
    });
  });

  describe('handleInitialScroll', () => {
    it('should set scrollTop to scrollHeight', () => {
      const { result } = renderHook(() =>
        useScrollManager({
          messagesContainerRef: mockMessagesContainerRef,
          messagesEndRef: mockMessagesEndRef,
        })
      );

      act(() => {
        result.current.handleInitialScroll();
      });

      expect(mockMessagesContainerRef.current.scrollTop).toBe(
        mockMessagesContainerRef.current.scrollHeight
      );
    });

    it('should call scrollIntoView on messagesEndRef', () => {
      const { result } = renderHook(() =>
        useScrollManager({
          messagesContainerRef: mockMessagesContainerRef,
          messagesEndRef: mockMessagesEndRef,
        })
      );

      act(() => {
        result.current.handleInitialScroll();
      });

      expect(mockMessagesEndRef.current.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'instant',
      });
    });

    it('should set isInitialLoad to false after timeout', () => {
      const { result } = renderHook(() =>
        useScrollManager({
          messagesContainerRef: mockMessagesContainerRef,
          messagesEndRef: mockMessagesEndRef,
        })
      );

      expect(result.current.isInitialLoad).toBe(true);

      act(() => {
        result.current.handleInitialScroll();
      });

      // Still true before timeout
      expect(result.current.isInitialLoad).toBe(true);

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(result.current.isInitialLoad).toBe(false);
    });
  });

  describe('setIsInitialLoad', () => {
    it('should allow setting isInitialLoad directly', () => {
      const { result } = renderHook(() =>
        useScrollManager({
          messagesContainerRef: mockMessagesContainerRef,
          messagesEndRef: mockMessagesEndRef,
        })
      );

      act(() => {
        result.current.setIsInitialLoad(false);
      });

      expect(result.current.isInitialLoad).toBe(false);
    });
  });
});
