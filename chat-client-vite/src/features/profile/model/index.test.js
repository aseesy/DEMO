/**
 * Profile Feature Barrel Export Tests
 *
 * Ensures all exports from the profile feature are valid and importable.
 */

import { describe, it, expect } from 'vitest';

describe('Profile Feature Exports', () => {
  it('exports useProfile hook', async () => {
    const { useProfile } = await import('./index.js');
    expect(useProfile).toBeDefined();
    expect(typeof useProfile).toBe('function');
  });

  it('all exports are accessible from feature barrel', async () => {
    const profileFeature = await import('../index.js');

    expect(profileFeature.useProfile).toBeDefined();
  });
});
