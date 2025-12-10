/**
 * Unit Tests: State Manager
 * 
 * Tests for conversation state management (escalation, emotional, policy state).
 * 
 * @module src/liaizen/core/__tests__/stateManager.test
 */

const stateManager = require('../stateManager');
const { ESCALATION, MESSAGE } = require('../../../utils/constants');

describe('State Manager', () => {
  // Mock conversation context
  let mockConversationContext;

  beforeEach(() => {
    // Create fresh mock context for each test
    mockConversationContext = {
      escalationState: new Map(),
      emotionalState: new Map(),
      policyState: new Map(),
    };

    // Initialize state manager with mock context
    stateManager.initialize(mockConversationContext);
  });

  afterEach(() => {
    // Clean up
    mockConversationContext = null;
  });

  describe('initialize', () => {
    it('should initialize with conversation context', () => {
      const context = {
        escalationState: new Map(),
        emotionalState: new Map(),
        policyState: new Map(),
      };

      stateManager.initialize(context);

      // Should not throw
      expect(() => {
        stateManager.initializeEscalationState('test-room');
      }).not.toThrow();
    });

    it('should throw error if not initialized before use', () => {
      // Reset state manager
      stateManager.initialize(null);

      expect(() => {
        stateManager.initializeEscalationState('test-room');
      }).toThrow('StateManager not initialized');
    });
  });

  describe('initializeEscalationState', () => {
    it('should create new escalation state for room', () => {
      const roomId = 'room-123';
      const state = stateManager.initializeEscalationState(roomId);

      expect(state).toBeDefined();
      expect(state.escalationScore).toBe(0);
      expect(state.lastNegativeTime).toBeNull();
      expect(state.patternCounts).toEqual({
        accusatory: 0,
        triangulation: 0,
        comparison: 0,
        blaming: 0,
      });
    });

    it('should return existing state if already initialized', () => {
      const roomId = 'room-123';
      const state1 = stateManager.initializeEscalationState(roomId);
      state1.escalationScore = 10;

      const state2 = stateManager.initializeEscalationState(roomId);

      expect(state2).toBe(state1);
      expect(state2.escalationScore).toBe(10);
    });

    it('should handle multiple rooms independently', () => {
      const room1 = stateManager.initializeEscalationState('room-1');
      const room2 = stateManager.initializeEscalationState('room-2');

      room1.escalationScore = 5;
      room2.escalationScore = 10;

      expect(room1.escalationScore).toBe(5);
      expect(room2.escalationScore).toBe(10);
    });
  });

  describe('initializeEmotionalState', () => {
    it('should create new emotional state for room', () => {
      const roomId = 'room-123';
      const state = stateManager.initializeEmotionalState(roomId);

      expect(state).toBeDefined();
      expect(state.participants).toEqual({});
      expect(state.conversationEmotion).toBe('neutral');
      expect(state.escalationRisk).toBe(0);
      expect(state.lastUpdated).toBeGreaterThan(0);
    });

    it('should return existing state if already initialized', () => {
      const roomId = 'room-123';
      const state1 = stateManager.initializeEmotionalState(roomId);
      state1.conversationEmotion = 'frustrated';

      const state2 = stateManager.initializeEmotionalState(roomId);

      expect(state2).toBe(state1);
      expect(state2.conversationEmotion).toBe('frustrated');
    });
  });

  describe('initializePolicyState', () => {
    it('should create new policy state for room', () => {
      const roomId = 'room-123';
      const state = stateManager.initializePolicyState(roomId);

      expect(state).toBeDefined();
      expect(state.interventionThreshold).toBe(50);
      expect(state.interventionHistory).toEqual([]);
      expect(state.adaptationLevel).toBe('moderate');
    });

    it('should return existing state if already initialized', () => {
      const roomId = 'room-123';
      const state1 = stateManager.initializePolicyState(roomId);
      state1.interventionThreshold = 75;

      const state2 = stateManager.initializePolicyState(roomId);

      expect(state2).toBe(state1);
      expect(state2.interventionThreshold).toBe(75);
    });
  });

  describe('updateEscalationScore', () => {
    it('should increment score for accusatory patterns', () => {
      const roomId = 'room-123';
      const patterns = {
        accusatory: true,
        triangulation: false,
        comparison: false,
        blaming: false,
      };

      const state = stateManager.updateEscalationScore(roomId, patterns);

      expect(state.escalationScore).toBe(ESCALATION.SCORE_INCREMENT);
      expect(state.patternCounts.accusatory).toBe(1);
      expect(state.lastNegativeTime).toBeGreaterThan(0);
    });

    it('should increment score for multiple patterns', () => {
      const roomId = 'room-123';
      const patterns = {
        accusatory: true,
        triangulation: true,
        comparison: false,
        blaming: false,
      };

      const state = stateManager.updateEscalationScore(roomId, patterns);

      expect(state.escalationScore).toBe(ESCALATION.SCORE_INCREMENT * 2); // Two patterns
      expect(state.patternCounts.accusatory).toBe(1);
      expect(state.patternCounts.triangulation).toBe(1);
    });

    it('should increment score for all pattern types', () => {
      const roomId = 'room-123';
      const patterns = {
        accusatory: true,
        triangulation: true,
        comparison: true,
        blaming: true,
      };

      const state = stateManager.updateEscalationScore(roomId, patterns);

      expect(state.patternCounts.accusatory).toBe(1);
      expect(state.patternCounts.triangulation).toBe(1);
      expect(state.patternCounts.comparison).toBe(1);
      expect(state.patternCounts.blaming).toBe(1);
      expect(state.escalationScore).toBe(ESCALATION.SCORE_INCREMENT * 4); // Four patterns
    });

    it('should not increment score for no patterns', () => {
      const roomId = 'room-123';
      const patterns = {
        accusatory: false,
        triangulation: false,
        comparison: false,
        blaming: false,
      };

      const state = stateManager.updateEscalationScore(roomId, patterns);

      expect(state.escalationScore).toBe(0);
      expect(state.lastNegativeTime).toBeNull();
    });

    it('should decay score after decay interval', () => {
      const roomId = 'room-123';
      
      // Set up state with old negative time
      const state = stateManager.initializeEscalationState(roomId);
      state.escalationScore = 10;
      state.lastNegativeTime = Date.now() - ESCALATION.DECAY_INTERVAL_MS - 1000; // 1 second past decay interval

      const patterns = { hasAccusatory: false };
      const updatedState = stateManager.updateEscalationScore(roomId, patterns);

      expect(updatedState.escalationScore).toBe(9); // 10 - 1 (decay)
    });

    it('should not decay score if within decay interval', () => {
      const roomId = 'room-123';
      
      // Set up state with recent negative time
      const state = stateManager.initializeEscalationState(roomId);
      state.escalationScore = 10;
      state.lastNegativeTime = Date.now() - 1000; // 1 second ago (within interval)

      const patterns = { hasAccusatory: false };
      const updatedState = stateManager.updateEscalationScore(roomId, patterns);

      expect(updatedState.escalationScore).toBe(10); // No decay
    });

    it('should not allow negative escalation score', () => {
      const roomId = 'room-123';
      
      // Set up state with score of 1 and old negative time
      const state = stateManager.initializeEscalationState(roomId);
      state.escalationScore = 1;
      state.lastNegativeTime = Date.now() - ESCALATION.DECAY_INTERVAL_MS - 1000;

      const patterns = { hasAccusatory: false };
      const updatedState = stateManager.updateEscalationScore(roomId, patterns);

      expect(updatedState.escalationScore).toBe(0); // Should not go negative
    });
  });

  describe('updateEmotionalState', () => {
    it('should create participant state if not exists', () => {
      const roomId = 'room-123';
      const username = 'user1';
      const emotionData = {
        currentEmotion: 'frustrated',
        stressLevel: 75,
      };

      stateManager.updateEmotionalState(roomId, username, emotionData);
      const emotionalState = stateManager.initializeEmotionalState(roomId);

      expect(emotionalState.participants[username]).toBeDefined();
      expect(emotionalState.participants[username].currentEmotion).toBe('frustrated');
      expect(emotionalState.participants[username].stressLevel).toBe(75);
    });

    it('should update existing participant state', () => {
      const roomId = 'room-123';
      const username = 'user1';

      // First update
      stateManager.updateEmotionalState(roomId, username, {
        currentEmotion: 'neutral',
        stressLevel: 50,
      });

      // Second update
      stateManager.updateEmotionalState(roomId, username, {
        currentEmotion: 'frustrated',
        stressLevel: 80,
      });

      const emotionalState = stateManager.initializeEmotionalState(roomId);
      expect(emotionalState.participants[username].currentEmotion).toBe('frustrated');
      expect(emotionalState.participants[username].stressLevel).toBe(80);
    });

    it('should track emotion history', () => {
      const roomId = 'room-123';
      const username = 'user1';

      stateManager.updateEmotionalState(roomId, username, {
        currentEmotion: 'frustrated',
        stressLevel: 75,
      });

      const emotionalState = stateManager.initializeEmotionalState(roomId);
      const participant = emotionalState.participants[username];

      expect(participant.emotionHistory.length).toBe(1);
      expect(participant.emotionHistory[0].emotion).toBe('frustrated');
      expect(participant.emotionHistory[0].intensity).toBe(75);
    });

    it('should limit emotion history to MAX_EMOTION_HISTORY', () => {
      const roomId = 'room-123';
      const username = 'user1';

      // Add more than MAX_EMOTION_HISTORY entries
      for (let i = 0; i < MESSAGE.MAX_EMOTION_HISTORY + 5; i++) {
        stateManager.updateEmotionalState(roomId, username, {
          currentEmotion: 'neutral',
          stressLevel: 50,
        });
      }

      const emotionalState = stateManager.initializeEmotionalState(roomId);
      const participant = emotionalState.participants[username];

      expect(participant.emotionHistory.length).toBe(MESSAGE.MAX_EMOTION_HISTORY);
    });

    it('should track recent triggers', () => {
      const roomId = 'room-123';
      const username = 'user1';

      stateManager.updateEmotionalState(roomId, username, {
        currentEmotion: 'frustrated',
        stressLevel: 75,
        triggers: ['schedule', 'communication'],
      });

      const emotionalState = stateManager.initializeEmotionalState(roomId);
      const participant = emotionalState.participants[username];

      expect(participant.recentTriggers).toContain('schedule');
      expect(participant.recentTriggers).toContain('communication');
    });

    it('should limit recent triggers to MAX_RECENT_TRIGGERS', () => {
      const roomId = 'room-123';
      const username = 'user1';

      // Add more than MAX_RECENT_TRIGGERS
      const manyTriggers = Array.from({ length: MESSAGE.MAX_RECENT_TRIGGERS + 5 }, (_, i) => `trigger-${i}`);
      
      stateManager.updateEmotionalState(roomId, username, {
        currentEmotion: 'frustrated',
        stressLevel: 75,
        triggers: manyTriggers,
      });

      const emotionalState = stateManager.initializeEmotionalState(roomId);
      const participant = emotionalState.participants[username];

      expect(participant.recentTriggers.length).toBe(MESSAGE.MAX_RECENT_TRIGGERS);
    });

    it('should update conversation-level emotion', () => {
      const roomId = 'room-123';
      const username = 'user1';

      stateManager.updateEmotionalState(roomId, username, {
        currentEmotion: 'frustrated',
        conversationEmotion: 'tense',
      });

      const emotionalState = stateManager.initializeEmotionalState(roomId);
      expect(emotionalState.conversationEmotion).toBe('tense');
    });

    it('should calculate escalation risk from average stress', () => {
      const roomId = 'room-123';

      // Add two participants with different stress levels
      stateManager.updateEmotionalState(roomId, 'user1', {
        currentEmotion: 'frustrated',
        stressLevel: 80,
      });

      stateManager.updateEmotionalState(roomId, 'user2', {
        currentEmotion: 'neutral',
        stressLevel: 20,
      });

      const emotionalState = stateManager.initializeEmotionalState(roomId);
      // Recalculate to ensure it's updated
      const allStressLevels = Object.values(emotionalState.participants).map(p => p.stressLevel);
      const avgStress = allStressLevels.length > 0
        ? allStressLevels.reduce((a, b) => a + b, 0) / allStressLevels.length
        : 0;
      expect(avgStress).toBe(50); // (80 + 20) / 2
      expect(emotionalState.escalationRisk).toBe(50);
    });

    it('should update lastUpdated timestamp', () => {
      const roomId = 'room-123';
      const username = 'user1';
      const before = Date.now();

      stateManager.updateEmotionalState(roomId, username, {
        currentEmotion: 'neutral',
        stressLevel: 50,
      });

      const after = Date.now();
      const emotionalState = stateManager.initializeEmotionalState(roomId);

      expect(emotionalState.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(emotionalState.lastUpdated).toBeLessThanOrEqual(after);
    });
  });

  describe('updatePolicyState', () => {
    it('should add intervention to history', () => {
      const roomId = 'room-123';
      const intervention = {
        type: 'intervene',
        escalationRisk: 'high',
        emotionalState: 'frustrated',
      };

      stateManager.updatePolicyState(roomId, intervention);
      const policyState = stateManager.initializePolicyState(roomId);

      expect(policyState.interventionHistory.length).toBe(1);
      expect(policyState.interventionHistory[0].type).toBe('intervene');
      expect(policyState.interventionHistory[0].escalationRisk).toBe('high');
    });

    it('should limit intervention history to MAX_INTERVENTION_HISTORY', () => {
      const roomId = 'room-123';

      // Add more than MAX_INTERVENTION_HISTORY interventions
      for (let i = 0; i < MESSAGE.MAX_INTERVENTION_HISTORY + 5; i++) {
        stateManager.updatePolicyState(roomId, {
          type: 'intervene',
          escalationRisk: 'medium',
        });
      }

      const policyState = stateManager.initializePolicyState(roomId);
      expect(policyState.interventionHistory.length).toBe(MESSAGE.MAX_INTERVENTION_HISTORY);
    });

    it('should update lastInterventionTime', () => {
      const roomId = 'room-123';
      const before = Date.now();

      stateManager.updatePolicyState(roomId, {
        type: 'intervene',
        escalationRisk: 'medium',
      });

      const after = Date.now();
      const policyState = stateManager.initializePolicyState(roomId);

      expect(policyState.lastInterventionTime).toBeGreaterThanOrEqual(before);
      expect(policyState.lastInterventionTime).toBeLessThanOrEqual(after);
    });

    it('should handle multiple interventions', () => {
      const roomId = 'room-123';

      stateManager.updatePolicyState(roomId, { type: 'intervene', escalationRisk: 'high' });
      stateManager.updatePolicyState(roomId, { type: 'comment', escalationRisk: 'low' });
      stateManager.updatePolicyState(roomId, { type: 'intervene', escalationRisk: 'medium' });

      const policyState = stateManager.initializePolicyState(roomId);
      expect(policyState.interventionHistory.length).toBe(3);
    });
  });

  describe('recordInterventionFeedback', () => {
    it('should update last intervention with helpful feedback', () => {
      const roomId = 'room-123';

      // Add an intervention first
      stateManager.updatePolicyState(roomId, {
        type: 'intervene',
        escalationRisk: 'medium',
      });

      // Record helpful feedback
      stateManager.recordInterventionFeedback(roomId, true);
      const policyState = stateManager.initializePolicyState(roomId);

      expect(policyState.interventionHistory[0].outcome).toBe('helpful');
      expect(policyState.interventionHistory[0].feedback).toBe('User found helpful');
    });

    it('should update last intervention with unhelpful feedback', () => {
      const roomId = 'room-123';

      // Add an intervention first
      stateManager.updatePolicyState(roomId, {
        type: 'intervene',
        escalationRisk: 'medium',
      });

      // Record unhelpful feedback
      stateManager.recordInterventionFeedback(roomId, false);
      const policyState = stateManager.initializePolicyState(roomId);

      expect(policyState.interventionHistory[0].outcome).toBe('unhelpful');
      expect(policyState.interventionHistory[0].feedback).toBe('User found unhelpful');
    });

    it('should increase threshold for unhelpful feedback', () => {
      const roomId = 'room-123';
      const initialThreshold = 50;

      // Initialize and set threshold
      const policyState = stateManager.initializePolicyState(roomId);
      policyState.interventionThreshold = initialThreshold;

      // Add intervention and record unhelpful feedback
      stateManager.updatePolicyState(roomId, { type: 'intervene' });
      stateManager.recordInterventionFeedback(roomId, false);

      const updatedState = stateManager.initializePolicyState(roomId);
      expect(updatedState.interventionThreshold).toBe(
        initialThreshold + ESCALATION.INTERVENTION_THRESHOLD_INCREMENT
      );
    });

    it('should decrease threshold for helpful feedback', () => {
      const roomId = 'room-123';
      const initialThreshold = 50;

      // Initialize and set threshold
      const policyState = stateManager.initializePolicyState(roomId);
      policyState.interventionThreshold = initialThreshold;

      // Add intervention and record helpful feedback
      stateManager.updatePolicyState(roomId, { type: 'intervene' });
      stateManager.recordInterventionFeedback(roomId, true);

      const updatedState = stateManager.initializePolicyState(roomId);
      expect(updatedState.interventionThreshold).toBe(
        initialThreshold - ESCALATION.INTERVENTION_THRESHOLD_DECREMENT
      );
    });

    it('should not exceed max threshold', () => {
      const roomId = 'room-123';

      // Set threshold to max
      const policyState = stateManager.initializePolicyState(roomId);
      policyState.interventionThreshold = ESCALATION.INTERVENTION_THRESHOLD_MAX;

      // Add intervention and record unhelpful feedback
      stateManager.updatePolicyState(roomId, { type: 'intervene' });
      stateManager.recordInterventionFeedback(roomId, false);

      const updatedState = stateManager.initializePolicyState(roomId);
      expect(updatedState.interventionThreshold).toBe(ESCALATION.INTERVENTION_THRESHOLD_MAX);
    });

    it('should not go below min threshold', () => {
      const roomId = 'room-123';

      // Set threshold to min
      const policyState = stateManager.initializePolicyState(roomId);
      policyState.interventionThreshold = ESCALATION.INTERVENTION_THRESHOLD_MIN;

      // Add intervention and record helpful feedback
      stateManager.updatePolicyState(roomId, { type: 'intervene' });
      stateManager.recordInterventionFeedback(roomId, true);

      const updatedState = stateManager.initializePolicyState(roomId);
      expect(updatedState.interventionThreshold).toBe(ESCALATION.INTERVENTION_THRESHOLD_MIN);
    });

    it('should handle empty intervention history gracefully', () => {
      const roomId = 'room-123';

      // Record feedback without any interventions
      expect(() => {
        stateManager.recordInterventionFeedback(roomId, true);
      }).not.toThrow();

      const policyState = stateManager.initializePolicyState(roomId);
      expect(policyState.interventionHistory.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined roomId gracefully', () => {
      expect(() => {
        stateManager.initializeEscalationState(null);
      }).not.toThrow();

      expect(() => {
        stateManager.initializeEmotionalState(undefined);
      }).not.toThrow();
    });

    it('should handle empty patterns object', () => {
      const roomId = 'room-123';
      const patterns = {};

      expect(() => {
        stateManager.updateEscalationScore(roomId, patterns);
      }).not.toThrow();
    });

    it('should handle missing emotion data', () => {
      const roomId = 'room-123';
      const username = 'user1';

      expect(() => {
        stateManager.updateEmotionalState(roomId, username, null);
      }).not.toThrow();

      expect(() => {
        stateManager.updateEmotionalState(roomId, username, {});
      }).not.toThrow();
    });

    it('should handle missing intervention data', () => {
      const roomId = 'room-123';

      // Should handle null gracefully
      expect(() => {
        stateManager.updatePolicyState(roomId, null);
      }).not.toThrow();

      // Should handle empty object
      expect(() => {
        stateManager.updatePolicyState(roomId, {});
      }).not.toThrow();

      // Should create intervention with defaults
      const policyState = stateManager.initializePolicyState(roomId);
      expect(policyState.interventionHistory.length).toBeGreaterThan(0);
      const lastIntervention = policyState.interventionHistory[policyState.interventionHistory.length - 1];
      expect(lastIntervention.type).toBe('intervene');
      expect(lastIntervention.escalationRisk).toBe('unknown');
    });
  });
});

