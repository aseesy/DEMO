/**
 * Unit Tests: Rewrite Validator
 *
 * Tests for sender/receiver perspective validation.
 *
 * Feature: 006-mediator-speaker-perspective
 */

const validator = require('../index');
const fallbacks = require('../fallbacks');

describe('Rewrite Validator', () => {
  describe('validateRewritePerspective', () => {
    // Receiver perspective patterns (should FAIL)
    describe('should reject receiver-perspective rewrites', () => {
      const receiverRewrites = [
        "I understand you're frustrated, but let's talk calmly.",
        "That hurt me. Can we discuss what's bothering you?",
        'When you said that, I felt attacked.',
        "That's not fair. I'm doing my best.",
        "I don't appreciate being spoken to that way.",
        "I'm sorry you feel that way.",
        'Can you explain what I did wrong?',
        'What exactly do you mean by that?',
        "I didn't mean to upset you.",
        'Hearing that was really painful.',
        "I don't deserve to be treated this way.",
        "That's hurtful. Why would you say that?",
        "I see you're upset, but please calm down.",
        'What you said was really mean.',
        'That is not okay to say.',
      ];

      receiverRewrites.forEach(rewrite => {
        it(`should reject: "${rewrite.substring(0, 50)}..."`, () => {
          const result = validator.validateRewritePerspective(rewrite, 'you suck');
          expect(result.valid).toBe(false);
          expect(result.reason).toBe('receiver_perspective_detected');
        });
      });
    });

    // Sender perspective patterns (should PASS)
    describe('should accept sender-perspective rewrites', () => {
      const senderRewrites = [
        "I'm feeling really frustrated right now.",
        'I feel overwhelmed and need help.',
        'I need us to communicate more respectfully.',
        "I've noticed things aren't going well. Can we discuss?",
        "I'm concerned about how things are going.",
        'I would like us to find a better approach.',
        "Can we discuss what's happening?",
        "Something isn't working for me.",
        'This situation is difficult for me.',
        "I'd prefer if we could talk about this calmly.",
        "I'm worried about her grades and want to discuss.",
        "I'm having a hard time with this situation.",
        'Can we find a solution together?',
        'I need to talk about something important.',
        "I'm frustrated and need us to work this out.",
      ];

      senderRewrites.forEach(rewrite => {
        it(`should accept: "${rewrite.substring(0, 50)}..."`, () => {
          const result = validator.validateRewritePerspective(rewrite, 'you suck');
          expect(result.valid).toBe(true);
        });
      });
    });

    // Edge cases
    describe('edge cases', () => {
      it('should reject empty string', () => {
        const result = validator.validateRewritePerspective('');
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('empty_or_invalid');
      });

      it('should reject null', () => {
        const result = validator.validateRewritePerspective(null);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('empty_or_invalid');
      });

      it('should reject undefined', () => {
        const result = validator.validateRewritePerspective(undefined);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('empty_or_invalid');
      });

      it('should reject whitespace-only string', () => {
        const result = validator.validateRewritePerspective('   ');
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('empty_or_invalid');
      });

      it('should handle ambiguous rewrites cautiously', () => {
        const result = validator.validateRewritePerspective(
          "Let's talk about this later.",
          'you suck'
        );
        // Ambiguous but not clearly receiver perspective
        expect(result.valid).toBe(true);
      });

      it('should accept neutral statements', () => {
        const result = validator.validateRewritePerspective(
          "We should schedule a time to discuss the kids' activities.",
          'you never help'
        );
        expect(result.valid).toBe(true);
      });
    });

    // Confidence scoring
    describe('confidence scoring', () => {
      it('should have higher confidence for strong sender signals', () => {
        const strongResult = validator.validateRewritePerspective(
          "I'm feeling frustrated and I need us to talk about this."
        );
        const weakResult = validator.validateRewritePerspective(
          'Maybe we could try something different.'
        );

        expect(strongResult.confidence).toBeGreaterThan(weakResult.confidence);
      });

      it('should indicate sender signals detected', () => {
        const result = validator.validateRewritePerspective('I need us to communicate better.');
        expect(result.senderSignals).toBe(true);
      });
    });
  });

  describe('validateIntervention', () => {
    it('should validate both rewrites', () => {
      const intervention = {
        rewrite1: "I'm feeling frustrated and need to talk.",
        rewrite2: "Can we discuss what's happening?",
      };

      const result = validator.validateIntervention(intervention, 'you suck');
      expect(result.valid).toBe(true);
      expect(result.anyFailed).toBe(false);
      expect(result.bothFailed).toBe(false);
    });

    it('should detect when one rewrite fails', () => {
      const intervention = {
        rewrite1: "I'm feeling frustrated.",
        rewrite2: 'That hurt me. Why would you say that?', // Receiver perspective
      };

      const result = validator.validateIntervention(intervention, 'you suck');
      expect(result.valid).toBe(false);
      expect(result.anyFailed).toBe(true);
      expect(result.bothFailed).toBe(false);
      expect(result.rewrite1.valid).toBe(true);
      expect(result.rewrite2.valid).toBe(false);
    });

    it('should detect when both rewrites fail', () => {
      const intervention = {
        rewrite1: "I understand you're upset.",
        rewrite2: 'That hurt me. Can we talk?',
      };

      const result = validator.validateIntervention(intervention, 'you suck');
      expect(result.valid).toBe(false);
      expect(result.bothFailed).toBe(true);
    });

    it('should handle missing rewrites', () => {
      const intervention = {
        rewrite1: "I'm feeling frustrated.",
        rewrite2: null,
      };

      const result = validator.validateIntervention(intervention, 'you suck');
      expect(result.valid).toBe(false);
      expect(result.rewrite2.valid).toBe(false);
    });
  });
});

describe('Fallback Rewrites', () => {
  describe('detectCategory', () => {
    it('should detect attack/insult', () => {
      expect(fallbacks.detectCategory('you suck')).toBe('attack');
      expect(fallbacks.detectCategory("you're an idiot")).toBe('attack');
      expect(fallbacks.detectCategory("you're such a jerk")).toBe('attack');
      expect(fallbacks.detectCategory("you're a terrible person")).toBe('attack');
    });

    it('should detect blame', () => {
      expect(fallbacks.detectCategory("It's your fault")).toBe('blame');
      expect(fallbacks.detectCategory('because of you')).toBe('blame');
      expect(fallbacks.detectCategory('you always mess things up')).toBe('blame');
      expect(fallbacks.detectCategory('you never help')).toBe('blame');
    });

    it('should detect triangulation', () => {
      expect(fallbacks.detectCategory('tell your dad he needs to pay')).toBe('triangulation');
      expect(fallbacks.detectCategory('tell him to call me')).toBe('triangulation');
      expect(fallbacks.detectCategory("tell your mom she's wrong")).toBe('triangulation');
      expect(fallbacks.detectCategory("tell the kids their dad doesn't care")).toBe(
        'triangulation'
      );
    });

    it('should detect threats', () => {
      expect(fallbacks.detectCategory("I'll call my lawyer")).toBe('threat');
      expect(fallbacks.detectCategory('you better do this or else')).toBe('threat');
      expect(fallbacks.detectCategory("I'll go to court")).toBe('threat');
      expect(fallbacks.detectCategory('I will tell the police')).toBe('threat');
    });

    it('should detect demands', () => {
      expect(fallbacks.detectCategory('you should pick her up')).toBe('demand');
      expect(fallbacks.detectCategory('you must do this')).toBe('demand');
      expect(fallbacks.detectCategory('you need to be more responsible')).toBe('demand');
      expect(fallbacks.detectCategory('you have to help more')).toBe('demand');
    });

    it('should default to generic', () => {
      expect(fallbacks.detectCategory('whatever')).toBe('generic');
      expect(fallbacks.detectCategory('fine')).toBe('generic');
      expect(fallbacks.detectCategory('okay')).toBe('generic');
    });

    it('should handle null/undefined input', () => {
      expect(fallbacks.detectCategory(null)).toBe('generic');
      expect(fallbacks.detectCategory(undefined)).toBe('generic');
    });

    it('should use language analysis when available', () => {
      const analysisWithTriangulation = {
        patterns: {
          child_triangulation: true,
        },
      };
      expect(fallbacks.detectCategory('some message', analysisWithTriangulation)).toBe(
        'triangulation'
      );

      const analysisWithCharacterEval = {
        patterns: {
          evaluative_character: true,
        },
      };
      expect(fallbacks.detectCategory('some message', analysisWithCharacterEval)).toBe('attack');
    });
  });

  describe('getFallbackRewrites', () => {
    it('should return appropriate fallbacks for attack', () => {
      const result = fallbacks.getFallbackRewrites('you suck');
      expect(result.category).toBe('attack');
      expect(result.rewrite1).toContain('frustrated');
      expect(result.rewrite2).toContain("isn't working");
      expect(result.tip).toContain('feeling');
      expect(result.isFallback).toBe(true);
    });

    it('should return appropriate fallbacks for blame', () => {
      const result = fallbacks.getFallbackRewrites("It's your fault");
      expect(result.category).toBe('blame');
      expect(result.rewrite1).toContain('overwhelmed');
      expect(result.isFallback).toBe(true);
    });

    it('should return triangulation fallbacks', () => {
      const result = fallbacks.getFallbackRewrites('tell your dad to pay up');
      expect(result.category).toBe('triangulation');
      expect(result.rewrite1).toContain('directly');
      expect(result.rewrite2).toContain('middle');
      expect(result.isFallback).toBe(true);
    });

    it('should return threat fallbacks', () => {
      const result = fallbacks.getFallbackRewrites("I'll call my lawyer");
      expect(result.category).toBe('threat');
      expect(result.rewrite1).toContain('progress');
      expect(result.isFallback).toBe(true);
    });

    it('should return demand fallbacks', () => {
      const result = fallbacks.getFallbackRewrites('you should do this');
      expect(result.category).toBe('demand');
      expect(result.tip).toContain('request');
      expect(result.isFallback).toBe(true);
    });

    it('should return generic fallbacks for unclassified', () => {
      const result = fallbacks.getFallbackRewrites('whatever');
      expect(result.category).toBe('generic');
      expect(result.rewrite1).toContain('concern');
      expect(result.isFallback).toBe(true);
    });

    it('should always set isFallback to true', () => {
      const categories = [
        'you suck',
        "it's your fault",
        'tell your dad',
        "I'll call my lawyer",
        'you should',
        'hello',
      ];
      categories.forEach(msg => {
        const result = fallbacks.getFallbackRewrites(msg);
        expect(result.isFallback).toBe(true);
      });
    });
  });

  describe('FALLBACK_REWRITES structure', () => {
    it('should have all required categories', () => {
      const expectedCategories = [
        'attack',
        'blame',
        'demand',
        'threat',
        'triangulation',
        'generic',
      ];
      expectedCategories.forEach(category => {
        expect(fallbacks.FALLBACK_REWRITES[category]).toBeDefined();
      });
    });

    it('should have rewrite1, rewrite2, and tip for each category', () => {
      Object.values(fallbacks.FALLBACK_REWRITES).forEach(fb => {
        expect(fb.rewrite1).toBeDefined();
        expect(fb.rewrite2).toBeDefined();
        expect(fb.tip).toBeDefined();
        expect(typeof fb.rewrite1).toBe('string');
        expect(typeof fb.rewrite2).toBe('string');
        expect(typeof fb.tip).toBe('string');
      });
    });

    it('should have non-empty rewrites', () => {
      Object.values(fallbacks.FALLBACK_REWRITES).forEach(fb => {
        expect(fb.rewrite1.length).toBeGreaterThan(10);
        expect(fb.rewrite2.length).toBeGreaterThan(10);
        expect(fb.tip.length).toBeGreaterThan(5);
      });
    });
  });
});

describe('Module Exports', () => {
  it('should export VERSION', () => {
    expect(validator.VERSION).toBeDefined();
    expect(typeof validator.VERSION).toBe('string');
  });

  it('should export RECEIVER_INDICATORS array', () => {
    expect(Array.isArray(validator.RECEIVER_INDICATORS)).toBe(true);
    expect(validator.RECEIVER_INDICATORS.length).toBeGreaterThan(0);
  });

  it('should export SENDER_INDICATORS array', () => {
    expect(Array.isArray(validator.SENDER_INDICATORS)).toBe(true);
    expect(validator.SENDER_INDICATORS.length).toBeGreaterThan(0);
  });
});
