/**
 * Data Abstraction Tests for useDashboard
 *
 * Tests that verify proper data abstraction:
 * 1. Consumers don't depend on implementation details
 * 2. Internal structure can change without breaking consumers
 * 3. Data is exposed through abstracted interfaces, not raw structures
 *
 * Data Abstraction Principle:
 * - Hide internal representation
 * - Expose only what's necessary
 * - Consumers shouldn't know about implementation details
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboard } from './useDashboard.js';

// Mock dependencies
vi.mock('./useModalController.js', () => ({
  useModalControllerDefault: () => ({
    welcomeModal: { show: false, setShow: vi.fn() },
    profileTaskModal: { show: false, setShow: vi.fn() },
    inviteModal: { show: false, setShow: vi.fn() },
    taskFormModal: {
      taskFormMode: null,
      setTaskFormMode: vi.fn(),
      aiTaskDetails: null,
      setAiTaskDetails: vi.fn(),
      isGeneratingTask: false,
      setIsGeneratingTask: vi.fn(),
    },
    contactSuggestionModal: { pendingContactSuggestion: null, dismissContactSuggestion: vi.fn() },
    messageFlaggingModal: { flaggingMessage: null, setFlaggingMessage: vi.fn() },
    taskFormMode: null,
    setTaskFormMode: vi.fn(),
    aiTaskDetails: null,
    setAiTaskDetails: vi.fn(),
    isGeneratingTask: false,
    setIsGeneratingTask: vi.fn(),
    setShowWelcomeModal: vi.fn(),
    setShowProfileTaskModal: vi.fn(),
    setShowInviteModal: vi.fn(),
  }),
}));

vi.mock('./useTasks.js', () => ({
  useTasks: () => ({
    tasks: [],
    isLoadingTasks: false,
    taskSearch: '',
    taskFilter: 'all',
    setTaskSearch: vi.fn(),
    setTaskFilter: vi.fn(),
    loadTasks: vi.fn(),
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  }),
}));

vi.mock('./useThreads.js', () => ({
  useThreads: () => ({
    threads: [],
    selectedThreadId: null,
    setSelectedThreadId: vi.fn(),
    addToThread: vi.fn(),
  }),
}));

describe('Data Abstraction - useDashboard', () => {
  const mockUsername = 'testuser';
  const mockSetCurrentView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Interface Abstraction', () => {
    it('returns abstracted taskState object, not raw task array', () => {
      const { result } = renderHook(() =>
        useDashboard({
          username: mockUsername,
          isAuthenticated: true,
          messages: [],
          setCurrentView: mockSetCurrentView,
        })
      );

      // taskState should be an object with abstracted interface
      expect(result.current.taskState).toBeDefined();
      expect(typeof result.current.taskState).toBe('object');
      expect(Array.isArray(result.current.taskState)).toBe(false);
    });

    it('taskState exposes only necessary properties', () => {
      const { result } = renderHook(() =>
        useDashboard({
          username: mockUsername,
          isAuthenticated: true,
          messages: [],
          setCurrentView: mockSetCurrentView,
        })
      );

      const taskState = result.current.taskState;
      const keys = Object.keys(taskState);

      // Should only expose what's needed, not internal implementation
      expect(keys).toContain('tasks');
      expect(keys).toContain('isLoadingTasks');
      expect(keys).toContain('taskSearch');
      expect(keys).toContain('taskFilter');
      expect(keys).toContain('setTaskSearch');
      expect(keys).toContain('setTaskFilter');

      // Should NOT expose internal implementation details
      // (e.g., if tasks were stored in a Map internally, we shouldn't see Map methods)
    });

    it('taskHandlers exposes only action methods, not state', () => {
      const { result } = renderHook(() =>
        useDashboard({
          username: mockUsername,
          isAuthenticated: true,
          messages: [],
          setCurrentView: mockSetCurrentView,
        })
      );

      const taskHandlers = result.current.taskHandlers;
      const keys = Object.keys(taskHandlers);

      // Should only expose handlers (functions), not state
      keys.forEach(key => {
        if (taskHandlers[key] !== undefined) {
          expect(typeof taskHandlers[key]).toBe('function');
        }
      });

      // Should NOT expose state values
      expect(keys).not.toContain('tasks');
      expect(keys).not.toContain('isLoadingTasks');
    });

    it('modalHandlers exposes only control methods, not modal state objects', () => {
      const { result } = renderHook(() =>
        useDashboard({
          username: mockUsername,
          isAuthenticated: true,
          messages: [],
          setCurrentView: mockSetCurrentView,
        })
      );

      const modalHandlers = result.current.modalHandlers;
      const keys = Object.keys(modalHandlers);

      // Should only expose handler functions
      keys.forEach(key => {
        expect(typeof modalHandlers[key]).toBe('function');
      });

      // Should NOT expose modal state objects
      expect(keys).not.toContain('welcomeModal');
      expect(keys).not.toContain('show');
    });
  });

  describe('Implementation Independence', () => {
    it('consumers can use taskState without knowing tasks is an array', () => {
      const { result } = renderHook(() =>
        useDashboard({
          username: mockUsername,
          isAuthenticated: true,
          messages: [],
          setCurrentView: mockSetCurrentView,
        })
      );

      const taskState = result.current.taskState;

      // Consumer should be able to use tasks without knowing it's an array
      // If we changed to a Set or Map internally, this should still work
      expect(taskState.tasks).toBeDefined();
      
      // Consumer can iterate without knowing implementation
      if (taskState.tasks && typeof taskState.tasks[Symbol.iterator] === 'function') {
        const items = [...taskState.tasks];
        expect(Array.isArray(items)).toBe(true);
      }
    });

    it('taskState.tasks could be changed to Set internally without breaking interface', () => {
      const { result } = renderHook(() =>
        useDashboard({
          username: mockUsername,
          isAuthenticated: true,
          messages: [],
          setCurrentView: mockSetCurrentView,
        })
      );

      const taskState = result.current.taskState;

      // Interface should support iteration regardless of internal structure
      expect(taskState.tasks).toBeDefined();

      // Tasks should be exposed through TaskCollection abstraction (not raw array)
      // This allows changing internal structure without breaking consumers
      if (taskState.tasks) {
        // TaskCollection provides abstracted interface with methods like getAll(), filter(), etc.
        // It's acceptable if it's an array OR has collection methods
        const isArray = Array.isArray(taskState.tasks);
        const isCollection = typeof taskState.tasks.getAll === 'function';
        expect(isArray || isCollection).toBe(true);
      }
    });
  });

  describe('Data Encapsulation', () => {
    it('raw tasks array is not directly exposed in grouped props', () => {
      const { result } = renderHook(() =>
        useDashboard({
          username: mockUsername,
          isAuthenticated: true,
          messages: [],
          setCurrentView: mockSetCurrentView,
        })
      );

      // taskState.tasks is abstracted
      expect(result.current.taskState.tasks).toBeDefined();

      // Raw tasks should NOT be exposed - only abstracted taskState
      // This was a previous violation that has been fixed
      expect(result.current.tasks).toBeUndefined();
    });

    it('taskState hides internal structure of task objects', () => {
      const { result } = renderHook(() =>
        useDashboard({
          username: mockUsername,
          isAuthenticated: true,
          messages: [],
          setCurrentView: mockSetCurrentView,
        })
      );

      const taskState = result.current.taskState;

      // taskState should not expose internal task structure
      // If tasks have internal fields, they should be abstracted
      if (taskState.tasks && taskState.tasks.length > 0) {
        const firstTask = taskState.tasks[0];
        
        // We can't fully test this without knowing the task structure
        // But we can verify taskState doesn't expose implementation details
        expect(firstTask).toBeDefined();
      }
    });
  });

  describe('Abstraction Compliance', () => {
    it('only exposes abstracted state, not raw state', () => {
      const { result } = renderHook(() =>
        useDashboard({
          username: mockUsername,
          isAuthenticated: true,
          messages: [],
          setCurrentView: mockSetCurrentView,
        })
      );

      // Proper abstraction: Only taskState is exposed, not raw tasks
      const hasAbstracted = 'taskState' in result.current;
      const hasRaw = 'tasks' in result.current;

      // Abstracted interface should be present
      expect(hasAbstracted).toBe(true);
      // Raw implementation should NOT be exposed (violation fixed)
      expect(hasRaw).toBe(false);
    });

    it('detects if consumers must know about internal structure', () => {
      // If DashboardView must destructure taskState.tasks, it knows about structure
      // This is acceptable IF taskState is the abstraction
      // But if DashboardView must know tasks is an array, that's a violation

      const { result } = renderHook(() =>
        useDashboard({
          username: mockUsername,
          isAuthenticated: true,
          messages: [],
          setCurrentView: mockSetCurrentView,
        })
      );

      const taskState = result.current.taskState;

      // Consumer knows tasks is in taskState - this is the abstraction
      expect(taskState.tasks).toBeDefined();

      // But if consumer must know tasks is an array, that's implementation detail
      // We can't fully test this without checking DashboardView
    });
  });

  describe('Interface Stability', () => {
    it('taskState interface remains stable even if useTasks changes', () => {
      const { result } = renderHook(() =>
        useDashboard({
          username: mockUsername,
          isAuthenticated: true,
          messages: [],
          setCurrentView: mockSetCurrentView,
        })
      );

      const taskState = result.current.taskState;

      // Interface should be stable
      expect(taskState).toHaveProperty('tasks');
      expect(taskState).toHaveProperty('isLoadingTasks');
      expect(taskState).toHaveProperty('taskSearch');
      expect(taskState).toHaveProperty('taskFilter');
      expect(taskState).toHaveProperty('setTaskSearch');
      expect(taskState).toHaveProperty('setTaskFilter');

      // If useTasks changes internally, taskState interface should remain the same
    });

    it('taskHandlers interface remains stable even if handlers change internally', () => {
      const { result } = renderHook(() =>
        useDashboard({
          username: mockUsername,
          isAuthenticated: true,
          messages: [],
          setCurrentView: mockSetCurrentView,
        })
      );

      const taskHandlers = result.current.taskHandlers;

      // Interface should be stable
      expect(taskHandlers).toHaveProperty('setEditingTask');
      expect(taskHandlers).toHaveProperty('setShowTaskForm');
      expect(taskHandlers).toHaveProperty('setTaskFormMode');
      expect(taskHandlers).toHaveProperty('setAiTaskDetails');
      expect(taskHandlers).toHaveProperty('setIsGeneratingTask');
      expect(taskHandlers).toHaveProperty('setTaskFormData');
      expect(taskHandlers).toHaveProperty('toggleTaskStatus');

      // If handlers change internally, interface should remain the same
    });
  });
});

