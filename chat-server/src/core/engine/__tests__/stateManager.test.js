/**
 * Unit Tests: State Manager
 *
 * Tests for conversation state management (escalation state only).
 * Note: Emotional and policy state tracking have been removed as unproven.
 *
 * @module src/liaizen/core/__tests__/stateManager.test
 */

const stateManager = require('../stateManager');

describe('State Manager', () => {
  // Mock conversation context
  let mockConversationContext;

  beforeEach(() => {
    // Create fresh mock context for each test
    mockConversationContext = {
      escalationState: new Map(),
    };
  });

  afterEach(() => {
    // Clean up
    mockConversationContext = null;
  });

  describe('context parameter', () => {
    it('should require conversation context parameter', () => {
      expect(() => {
        stateManager.initializeEscalationState(null, 'test-room');
      }).toThrow('conversationContext is required');
    });

    it('should work with valid conversation context', () => {
      // Should not throw
      expect(() => {
        stateManager.initializeEscalationState(mockConversationContext, 'test-room');
      }).not.toThrow();
    });
  });

  describe('initializeEscalationState', () => {
    it('should create new escalation state for room', () => {
      const roomId = 'room-123';
      const state = stateManager.initializeEscalationState(mockConversationContext, roomId);

      expect(state).toBeDefined();
      expect(state.lastInterventionTime).toBeNull();
      expect(state.recentInterventionCount).toBe(0);
      expect(state.lastInterventionResetTime).toBeGreaterThan(0);
      expect(state.patternCounts).toEqual({
        accusatory: 0,
        triangulation: 0,
      });
    });

    it('should return existing state if already initialized', () => {
      const roomId = 'room-123';
      const state1 = stateManager.initializeEscalationState(mockConversationContext, roomId);
      state1.recentInterventionCount = 5;

      const state2 = stateManager.initializeEscalationState(mockConversationContext, roomId);

      expect(state2).toBe(state1);
      expect(state2.recentInterventionCount).toBe(5);
    });

    it('should handle multiple rooms independently', () => {
      const room1 = stateManager.initializeEscalationState(mockConversationContext, 'room-1');
      const room2 = stateManager.initializeEscalationState(mockConversationContext, 'room-2');

      room1.recentInterventionCount = 5;
      room2.recentInterventionCount = 10;

      expect(room1.recentInterventionCount).toBe(5);
      expect(room2.recentInterventionCount).toBe(10);
    });

    it('should create escalationState Map if it does not exist', () => {
      const contextWithoutMap = {};
      const roomId = 'room-123';

      const state = stateManager.initializeEscalationState(contextWithoutMap, roomId);

      expect(contextWithoutMap.escalationState).toBeInstanceOf(Map);
      expect(state).toBeDefined();
    });
  });

  describe('updateEscalationScore', () => {
    it('should increment accusatory pattern count', () => {
      const roomId = 'room-123';
      const patterns = {
        hasAccusatory: true,
        hasTriangulation: false,
      };

      const state = stateManager.updateEscalationScore(mockConversationContext, roomId, patterns);

      expect(state.patternCounts.accusatory).toBe(1);
      expect(state.patternCounts.triangulation).toBe(0);
    });

    it('should increment triangulation pattern count', () => {
      const roomId = 'room-123';
      const patterns = {
        hasAccusatory: false,
        hasTriangulation: true,
      };

      const state = stateManager.updateEscalationScore(mockConversationContext, roomId, patterns);

      expect(state.patternCounts.accusatory).toBe(0);
      expect(state.patternCounts.triangulation).toBe(1);
    });

    it('should increment both pattern counts when both are present', () => {
      const roomId = 'room-123';
      const patterns = {
        hasAccusatory: true,
        hasTriangulation: true,
      };

      const state = stateManager.updateEscalationScore(mockConversationContext, roomId, patterns);

      expect(state.patternCounts.accusatory).toBe(1);
      expect(state.patternCounts.triangulation).toBe(1);
    });

    it('should not increment counts when no patterns are present', () => {
      const roomId = 'room-123';
      const patterns = {
        hasAccusatory: false,
        hasTriangulation: false,
      };

      const state = stateManager.updateEscalationScore(mockConversationContext, roomId, patterns);

      expect(state.patternCounts.accusatory).toBe(0);
      expect(state.patternCounts.triangulation).toBe(0);
    });

    it('should reset intervention count after 24 hours', () => {
      const roomId = 'room-123';

      // Initialize state and set old reset time
      const state = stateManager.initializeEscalationState(mockConversationContext, roomId);
      state.recentInterventionCount = 5;
      const oldResetTime = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      state.lastInterventionResetTime = oldResetTime;

      const patterns = { hasAccusatory: false };
      const updatedState = stateManager.updateEscalationScore(
        mockConversationContext,
        roomId,
        patterns
      );

      expect(updatedState.recentInterventionCount).toBe(0);
      expect(updatedState.lastInterventionResetTime).toBeGreaterThanOrEqual(oldResetTime);
      expect(updatedState.lastInterventionResetTime).toBeGreaterThanOrEqual(
        state.lastInterventionResetTime
      );
    });

    it('should not reset intervention count if less than 24 hours', () => {
      const roomId = 'room-123';

      // Initialize state with recent reset time
      const state = stateManager.initializeEscalationState(mockConversationContext, roomId);
      state.recentInterventionCount = 5;
      state.lastInterventionResetTime = Date.now() - 23 * 60 * 60 * 1000; // 23 hours ago

      const patterns = { hasAccusatory: false };
      const updatedState = stateManager.updateEscalationScore(
        mockConversationContext,
        roomId,
        patterns
      );

      expect(updatedState.recentInterventionCount).toBe(5); // Not reset
    });
  });

  describe('recordIntervention', () => {
    it('should record intervention time and increment count', () => {
      const roomId = 'room-123';
      const before = Date.now();

      const state = stateManager.recordIntervention(mockConversationContext, roomId);
      const after = Date.now();

      expect(state.lastInterventionTime).toBeGreaterThanOrEqual(before);
      expect(state.lastInterventionTime).toBeLessThanOrEqual(after);
      expect(state.recentInterventionCount).toBe(1);
    });

    it('should increment count on multiple interventions', () => {
      const roomId = 'room-123';

      stateManager.recordIntervention(mockConversationContext, roomId);
      const state = stateManager.recordIntervention(mockConversationContext, roomId);

      expect(state.recentInterventionCount).toBe(2);
    });
  });

  describe('getInterventionThrottle', () => {
    it('should return throttle info for new room', () => {
      const roomId = 'room-123';
      const throttle = stateManager.getInterventionThrottle(mockConversationContext, roomId);

      expect(throttle.shouldThrottle).toBe(false);
      expect(throttle.lastInterventionTime).toBeNull();
      expect(throttle.recentCount).toBe(0);
      expect(throttle.maxPerDay).toBe(10);
    });

    it('should throttle when intervention count exceeds max', () => {
      const roomId = 'room-123';
      const maxPerDay = 5;

      // Record more than max interventions
      for (let i = 0; i < maxPerDay + 1; i++) {
        stateManager.recordIntervention(mockConversationContext, roomId);
      }

      const throttle = stateManager.getInterventionThrottle(
        mockConversationContext,
        roomId,
        maxPerDay
      );

      expect(throttle.shouldThrottle).toBe(true);
      expect(throttle.recentCount).toBe(maxPerDay + 1);
    });

    it('should not throttle when intervention count is below max', () => {
      const roomId = 'room-123';
      const maxPerDay = 5;

      // Record fewer than max interventions
      for (let i = 0; i < maxPerDay - 1; i++) {
        stateManager.recordIntervention(mockConversationContext, roomId);
      }

      const throttle = stateManager.getInterventionThrottle(
        mockConversationContext,
        roomId,
        maxPerDay
      );

      expect(throttle.shouldThrottle).toBe(false);
      expect(throttle.recentCount).toBe(maxPerDay - 1);
    });

    it('should use custom maxPerDay value', () => {
      const roomId = 'room-123';
      const customMax = 3;

      const throttle = stateManager.getInterventionThrottle(
        mockConversationContext,
        roomId,
        customMax
      );

      expect(throttle.maxPerDay).toBe(customMax);
    });
  });

  describe('Deprecated functions', () => {
    it('should return null for deprecated initializeEmotionalState', () => {
      const roomId = 'room-123';
      const result = stateManager.initializeEmotionalState(mockConversationContext, roomId);
      expect(result).toBeNull();
    });

    it('should return null for deprecated initializePolicyState', () => {
      const roomId = 'room-123';
      const result = stateManager.initializePolicyState(mockConversationContext, roomId);
      expect(result).toBeNull();
    });

    it('should return null for deprecated updateEmotionalState', () => {
      const roomId = 'room-123';
      const result = stateManager.updateEmotionalState(
        mockConversationContext,
        roomId,
        'user1',
        {}
      );
      expect(result).toBeNull();
    });

    it('should return null for deprecated updatePolicyState', () => {
      const roomId = 'room-123';
      const result = stateManager.updatePolicyState(mockConversationContext, roomId, {});
      expect(result).toBeNull();
    });

    it('should handle deprecated recordInterventionFeedback without error', () => {
      const roomId = 'room-123';
      expect(() => {
        stateManager.recordInterventionFeedback(mockConversationContext, roomId, true);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined roomId gracefully', () => {
      // Should work with null/undefined roomId (roomId is not validated)
      expect(() => {
        stateManager.initializeEscalationState(mockConversationContext, null);
      }).not.toThrow();

      expect(() => {
        stateManager.initializeEscalationState(mockConversationContext, undefined);
      }).not.toThrow();
    });

    it('should handle empty patterns object', () => {
      const roomId = 'room-123';
      const patterns = {};

      // Should throw when conversationContext is null (fail-fast design)
      expect(() => {
        stateManager.updateEscalationScore(null, roomId, patterns);
      }).toThrow('conversationContext is required');

      // Should work with valid context and empty patterns
      expect(() => {
        stateManager.updateEscalationScore(mockConversationContext, roomId, patterns);
      }).not.toThrow();
    });

    it('should handle patterns with undefined values', () => {
      const roomId = 'room-123';
      const patterns = {
        hasAccusatory: undefined,
        hasTriangulation: undefined,
      };

      const state = stateManager.updateEscalationScore(mockConversationContext, roomId, patterns);

      expect(state.patternCounts.accusatory).toBe(0);
      expect(state.patternCounts.triangulation).toBe(0);
    });
  });
});
