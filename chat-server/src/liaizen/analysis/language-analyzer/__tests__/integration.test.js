/**
 * Integration tests for Language Analyzer Library
 */

const languageAnalyzer = require('../index');

describe('Language Analyzer Integration', () => {
  describe('analyze()', () => {
    test('analyzes hostile message with global evaluation', () => {
      const text = "You're basically failing Vira with the way you're handling things.";
      const result = languageAnalyzer.analyze(text, { childNames: ['Vira'] });

      expect(result.patterns.global_negative).toBe(true);
      expect(result.patterns.evaluative_competence).toBe(true);
      expect(result.patterns.vague_complaint).toBe(true);
      expect(result.patterns.child_mentioned).toBe(true);
      expect(result.patterns.child_as_weapon).toBe(true);
      expect(result.patterns.has_concrete_request).toBe(false);

      expect(result.structure.sentence_type).toBe('accusation');
      expect(result.structure.target).toBe('other_parent');

      expect(result.summary).toContain('Uses global/absolute negative language');
      expect(result.meta.confidence).toBeGreaterThan(70);
    });

    test('analyzes logistics request correctly', () => {
      const text = 'Can we swap the Tuesday pickup? I have a work meeting until 4.';
      const result = languageAnalyzer.analyze(text);

      expect(result.patterns.global_negative).toBe(false);
      expect(result.patterns.evaluative_character).toBe(false);
      expect(result.patterns.logistics_focused).toBe(true);
      expect(result.patterns.specific_request).toBe(true);
      expect(result.patterns.has_concrete_request).toBe(true);

      expect(result.structure.sentence_type).toBe('request');
      expect(result.meta.confidence).toBeGreaterThan(70);
    });

    test('analyzes over-hedged message', () => {
      const text =
        "I'm sorry to bring this up again, but I just think maybe the homework situation isn't really working...";
      const result = languageAnalyzer.analyze(text);

      expect(result.patterns.apologetic_framing).toBe(true);
      expect(result.patterns.hedging_softeners).toBe(true);
      expect(result.patterns.vague_complaint).toBe(true);
      expect(result.patterns.direct_statement).toBe(false);

      expect(result.structure.hedges_used.length).toBeGreaterThan(2);
    });

    test('analyzes name-calling correctly', () => {
      const text = "You're such a terrible parent.";
      const result = languageAnalyzer.analyze(text);

      expect(result.patterns.evaluative_character).toBe(true);
      expect(result.patterns.global_negative).toBe(true);
      expect(result.structure.sentence_type).toBe('accusation');
    });

    test('analyzes triangulation correctly', () => {
      const text = "She told me she doesn't want to go to your house anymore.";
      const result = languageAnalyzer.analyze(text);

      expect(result.patterns.child_mentioned).toBe(true);
      expect(result.patterns.child_triangulation).toBe(true);
    });

    test('analyzes child as messenger correctly', () => {
      const text = 'Tell your dad he needs to pay the child support.';
      const result = languageAnalyzer.analyze(text);

      expect(result.patterns.child_as_messenger).toBe(true);
    });

    test('analyzes threat correctly', () => {
      const text = "If you don't change, I'll call my lawyer.";
      const result = languageAnalyzer.analyze(text);

      expect(result.structure.sentence_type).toBe('threat');
    });

    test('analyzes demand correctly', () => {
      const text = 'You need to stop being late.';
      const result = languageAnalyzer.analyze(text);

      expect(result.structure.sentence_type).toBe('demand');
    });

    test('allows neutral statements', () => {
      const text = 'The pickup is at 3pm.';
      const result = languageAnalyzer.analyze(text);

      expect(result.patterns.global_negative).toBe(false);
      expect(result.patterns.evaluative_character).toBe(false);
      expect(result.structure.sentence_type).toBe('statement');
    });

    test('handles empty input', () => {
      const result = languageAnalyzer.analyze('');

      expect(result.meta.error).toBe('empty_input');
      expect(result.meta.confidence).toBe(0);
    });

    test('handles null input', () => {
      const result = languageAnalyzer.analyze(null);

      expect(result.meta.error).toBe('invalid_input');
    });
  });

  describe('quickCheck()', () => {
    test('flags hostile messages', () => {
      expect(languageAnalyzer.quickCheck('You always mess things up')).toBe(true);
      expect(languageAnalyzer.quickCheck("You're a terrible parent")).toBe(true);
      expect(languageAnalyzer.quickCheck("It's your fault")).toBe(true);
    });

    test('passes neutral messages', () => {
      expect(languageAnalyzer.quickCheck('Can we discuss the schedule?')).toBe(false);
      expect(languageAnalyzer.quickCheck('The pickup is at 3')).toBe(false);
    });
  });

  describe('formatForPrompt()', () => {
    test('formats analysis for AI prompt', () => {
      const text = "You're basically failing Vira with the way you're handling things.";
      const analysis = languageAnalyzer.analyze(text, { childNames: ['Vira'] });
      const formatted = languageAnalyzer.formatForPrompt(analysis);

      expect(formatted).toContain('LANGUAGE ANALYSIS');
      expect(formatted).toContain('global_negative');
      expect(formatted).toContain('accusation');
    });
  });

  describe('performance', () => {
    test('analyzes message in under 10ms', () => {
      const text = "You're basically failing Vira with the way you're handling things.";
      const result = languageAnalyzer.analyze(text);

      expect(result.meta.processing_time_ms).toBeLessThan(10);
    });
  });
});
