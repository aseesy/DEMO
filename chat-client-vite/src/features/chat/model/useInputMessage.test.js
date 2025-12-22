/**
 * useInputMessage Hook Tests
 *
 * Tests for the chat input message management hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInputMessage } from './useInputMessage.js';

describe('useInputMessage', () => {
  let mockSocketRef;
  let mockSetDraftCoaching;

  beforeEach(() => {
    vi.useFakeTimers();
    mockSocketRef = {
      current: {
        emit: vi.fn(),
        connected: true,
      },
    };
    mockSetDraftCoaching = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty input message', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      expect(result.current.inputMessage).toBe('');
    });

    it('should initialize with isPreApprovedRewrite as false', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      expect(result.current.isPreApprovedRewrite).toBe(false);
    });

    it('should initialize with empty originalRewrite', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      expect(result.current.originalRewrite).toBe('');
    });
  });

  describe('handleInputChange', () => {
    it('should update input message on change', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      act(() => {
        result.current.handleInputChange({ target: { value: 'Hello' } });
      });

      expect(result.current.inputMessage).toBe('Hello');
    });

    it('should emit typing indicator on input change', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      act(() => {
        result.current.handleInputChange({ target: { value: 'Hello' } });
      });

      expect(mockSocketRef.current.emit).toHaveBeenCalledWith('typing', { isTyping: true });
    });

    it('should emit typing false after timeout', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      act(() => {
        result.current.handleInputChange({ target: { value: 'Hello' } });
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockSocketRef.current.emit).toHaveBeenCalledWith('typing', { isTyping: false });
    });

    it('should emit analyze_draft for substantial messages after debounce', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      act(() => {
        result.current.handleInputChange({ target: { value: 'This is a substantial message' } });
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockSocketRef.current.emit).toHaveBeenCalledWith('analyze_draft', {
        draftText: 'This is a substantial message',
      });
    });

    it('should clear draft coaching for short messages', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      act(() => {
        result.current.handleInputChange({ target: { value: 'Hi' } });
      });

      expect(mockSetDraftCoaching).toHaveBeenCalledWith(null);
    });

    it('should handle missing socketRef gracefully', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: { current: null },
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      expect(() => {
        act(() => {
          result.current.handleInputChange({ target: { value: 'Hello' } });
        });
      }).not.toThrow();

      expect(result.current.inputMessage).toBe('Hello');
    });
  });

  describe('clearInput', () => {
    it('should clear input message', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      act(() => {
        result.current.setInputMessage('Hello');
      });

      act(() => {
        result.current.clearInput();
      });

      expect(result.current.inputMessage).toBe('');
    });

    it('should reset isPreApprovedRewrite', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      act(() => {
        result.current.setIsPreApprovedRewrite(true);
      });

      act(() => {
        result.current.clearInput();
      });

      expect(result.current.isPreApprovedRewrite).toBe(false);
    });

    it('should reset originalRewrite', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      act(() => {
        result.current.setOriginalRewrite('original text');
      });

      act(() => {
        result.current.clearInput();
      });

      expect(result.current.originalRewrite).toBe('');
    });
  });

  describe('stopTyping', () => {
    it('should emit typing false', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      act(() => {
        result.current.stopTyping();
      });

      expect(mockSocketRef.current.emit).toHaveBeenCalledWith('typing', { isTyping: false });
    });

    it('should handle missing socketRef gracefully', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: { current: null },
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      expect(() => {
        act(() => {
          result.current.stopTyping();
        });
      }).not.toThrow();
    });
  });

  describe('setters', () => {
    it('should allow setting inputMessage directly', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      act(() => {
        result.current.setInputMessage('Direct set');
      });

      expect(result.current.inputMessage).toBe('Direct set');
    });

    it('should allow setting isPreApprovedRewrite', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      act(() => {
        result.current.setIsPreApprovedRewrite(true);
      });

      expect(result.current.isPreApprovedRewrite).toBe(true);
    });

    it('should allow setting originalRewrite', () => {
      const { result } = renderHook(() =>
        useInputMessage({
          socketRef: mockSocketRef,
          setDraftCoaching: mockSetDraftCoaching,
        })
      );

      act(() => {
        result.current.setOriginalRewrite('Original text');
      });

      expect(result.current.originalRewrite).toBe('Original text');
    });
  });
});
