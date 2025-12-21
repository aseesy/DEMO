import { describe, it, expect } from 'vitest';
import { shouldMediate } from './mediatorLogic';

describe('shouldMediate', () => {
  const baseContext = {
    co_parent: 'Alex',
    children: [],
    contacts: [],
  };

  it('returns false for empty message', () => {
    expect(shouldMediate(null, baseContext)).toBe(false);
    expect(shouldMediate({}, baseContext)).toBe(false);
    expect(shouldMediate({ text: '' }, baseContext)).toBe(false);
  });

  it('returns true for conflict keywords when co-parent is defined', () => {
    const message = { text: 'Why do you always start a fight?' };
    expect(shouldMediate(message, baseContext)).toBe(true);
  });

  it('returns false for conflict keywords when co-parent is NOT defined', () => {
    const message = { text: 'Why do you always start a fight?' };
    const context = { ...baseContext, co_parent: null };
    // The logic is: if (keywords && userContext.co_parent)
    expect(shouldMediate(message, context)).toBe(false);
  });

  it('returns true for long messages (potential rant)', () => {
    const longText = 'a'.repeat(201);
    const message = { text: longText };
    expect(shouldMediate(message, baseContext)).toBe(true);
  });

  it('returns false for long messages if already flagged by user', () => {
    const longText = 'a'.repeat(201);
    const message = { text: longText, user_flagged_by: ['me'] };
    expect(shouldMediate(message, baseContext)).toBe(false);
  });

  it('returns false for normal messages', () => {
    const message = { text: 'Hello, can you pick up Sam?' };
    expect(shouldMediate(message, baseContext)).toBe(false);
  });
});
