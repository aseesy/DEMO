/**
 * Unit Tests: Mediation Context Builder
 *
 * Tests for building role-aware context that distinguishes
 * sender from receiver in AI mediation prompts.
 *
 * Feature: 002-sender-profile-mediation
 */

const mediationContext = require('../mediationContext');

describe('Mediation Context Builder', () => {
  const mockSenderProfile = {
    display_name: 'Alex',
    last_profile_update: new Date().toISOString(),
    communication_patterns: {
      tone_tendencies: ['assertive', 'direct'],
      common_phrases: ['I think', 'We need to'],
    },
    triggers: {
      topics: ['schedule', 'money'],
      phrases: ['always late', 'never listen'],
      intensity: 0.7,
    },
    successful_rewrites: [
      {
        original: 'You never pick her up on time',
        rewrite: 'I feel worried when pickup times vary',
        accepted_at: new Date().toISOString(),
      },
    ],
    intervention_history: {
      total_interventions: 5,
      accepted_count: 3,
      acceptance_rate: 0.6,
    },
  };

  const mockReceiverProfile = {
    display_name: 'Jordan',
    last_profile_update: new Date().toISOString(),
    communication_patterns: {
      tone_tendencies: ['defensive', 'brief'],
    },
    triggers: {
      topics: ['parenting decisions'],
      phrases: ['you should'],
      intensity: 0.5,
    },
  };

  describe('buildContext', () => {
    it('should build complete context with sender/receiver distinction', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test message',
        recentMessages: [],
      });

      expect(context.roles.sender.id).toBe('alex');
      expect(context.roles.receiver.id).toBe('jordan');
      expect(context.roles.sender.display_name).toBe('Alex');
      expect(context.roles.receiver.display_name).toBe('Jordan');
    });

    it('should include sender profile with full details', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test message',
      });

      expect(context.sender.profile).toBeDefined();
      expect(context.sender.intervention_stats).toBeDefined();
      expect(context.sender.recent_accepted_rewrites).toHaveLength(1);
    });

    it('should include receiver context with limited details (read-only)', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test message',
      });

      expect(context.receiver.known_triggers).toBeDefined();
      expect(context.receiver.communication_style).toBeDefined();
      // Receiver should NOT have intervention history
      expect(context.receiver.intervention_stats).toBeUndefined();
    });

    it('should include message details', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'This is a test message',
      });

      expect(context.message.text).toBe('This is a test message');
      expect(context.message.length).toBe(22);
    });

    it('should include recent conversation history', () => {
      const recentMessages = [
        { text: 'msg1', sender: 'alex' },
        { text: 'msg2', sender: 'jordan' },
      ];

      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test',
        recentMessages,
      });

      expect(context.conversation.recent_messages).toHaveLength(2);
      expect(context.conversation.message_count).toBe(2);
    });

    it('should limit recent messages to last 10', () => {
      const recentMessages = [];
      for (let i = 0; i < 15; i++) {
        recentMessages.push({ text: `msg${i}`, sender: 'alex' });
      }

      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test',
        recentMessages,
      });

      expect(context.conversation.recent_messages).toHaveLength(10);
    });

    it('should include metadata about profile freshness', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test',
      });

      expect(context.meta).toBeDefined();
      expect(context.meta.context_version).toBe(1);
      expect(context.meta.built_at).toBeDefined();
    });

    it('should handle null profiles gracefully', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: null,
        receiverProfile: null,
        messageText: 'Test',
      });

      expect(context.roles.sender.id).toBe('alex');
      expect(context.roles.receiver.id).toBe('jordan');
      expect(context.sender.profile).toBeNull();
    });

    it('should use user ID as display name fallback', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: {},
        receiverProfile: {},
        messageText: 'Test',
      });

      expect(context.roles.sender.display_name).toBe('alex');
      expect(context.roles.receiver.display_name).toBe('jordan');
    });
  });

  describe('buildCoachingNotes', () => {
    it('should note high trigger intensity', () => {
      const patterns = {
        triggers: { intensity: 0.8 },
      };

      const notes = mediationContext.buildCoachingNotes(patterns);

      expect(notes).toContain('Sender has high sensitivity to conflict triggers');
    });

    it('should note high acceptance rate', () => {
      const patterns = {
        acceptance_rate: 0.85,
      };

      const notes = mediationContext.buildCoachingNotes(patterns);

      expect(notes).toContain('Sender typically accepts AI suggestions (receptive to coaching)');
    });

    it('should note low acceptance rate', () => {
      const patterns = {
        acceptance_rate: 0.2,
      };

      const notes = mediationContext.buildCoachingNotes(patterns);

      expect(notes).toContain('Sender often rejects AI suggestions (adjust approach)');
    });

    it('should note successful rewrite history', () => {
      const patterns = {
        successful_rewrites: new Array(6), // 6 items
      };

      const notes = mediationContext.buildCoachingNotes(patterns);

      expect(notes).toContain('Sender has history of successful communication improvements');
    });

    it('should note stale profile', () => {
      const patterns = {
        is_stale: true,
      };

      const notes = mediationContext.buildCoachingNotes(patterns);

      expect(notes).toContain('Profile data is older - patterns may have changed');
    });

    it('should return empty array for null patterns', () => {
      expect(mediationContext.buildCoachingNotes(null)).toEqual([]);
    });
  });

  describe('formatSenderContext', () => {
    it('should format sender identity', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test',
      });

      const formatted = mediationContext.formatSenderContext(context);

      expect(formatted).toContain('SENDER: Alex');
    });

    it('should include tone tendencies', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test',
      });

      const formatted = mediationContext.formatSenderContext(context);

      expect(formatted).toContain('Typical tone:');
    });

    it('should include sensitive topics', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test',
      });

      const formatted = mediationContext.formatSenderContext(context);

      expect(formatted).toContain('Sensitive topics for sender:');
    });

    it('should return empty string for null context', () => {
      expect(mediationContext.formatSenderContext(null)).toBe('');
      expect(mediationContext.formatSenderContext({})).toBe('');
    });
  });

  describe('formatReceiverContext', () => {
    it('should format receiver identity', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test',
      });

      const formatted = mediationContext.formatReceiverContext(context);

      expect(formatted).toContain('RECEIVER: Jordan');
    });

    it('should include receiver sensitivities', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test',
      });

      const formatted = mediationContext.formatReceiverContext(context);

      expect(formatted).toContain('Receiver is sensitive to:');
    });

    it('should return empty string for null context', () => {
      expect(mediationContext.formatReceiverContext(null)).toBe('');
      expect(mediationContext.formatReceiverContext({})).toBe('');
    });
  });

  describe('formatFullContext', () => {
    it('should include role-aware header', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test',
      });

      const formatted = mediationContext.formatFullContext(context);

      expect(formatted).toContain('ROLE-AWARE MEDIATION CONTEXT');
      expect(formatted).toContain('helping Alex send a better message to Jordan');
    });

    it('should include the "IMPORTANT" coaching directive', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test',
      });

      const formatted = mediationContext.formatFullContext(context);

      expect(formatted).toContain('IMPORTANT:');
      expect(formatted).toContain('coaching is for the SENDER only');
      expect(formatted).toContain('Never use "we/us/our/both"');
    });

    it('should include both sender and receiver sections', () => {
      const context = mediationContext.buildContext({
        senderId: 'alex',
        receiverId: 'jordan',
        senderProfile: mockSenderProfile,
        receiverProfile: mockReceiverProfile,
        messageText: 'Test',
      });

      const formatted = mediationContext.formatFullContext(context);

      expect(formatted).toContain('SENDER:');
      expect(formatted).toContain('RECEIVER:');
    });
  });
});
