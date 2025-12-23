/**
 * Auth Feature Barrel Export Tests
 *
 * Ensures all exports from the auth feature are valid and importable.
 * Catches issues like exporting from wrong files.
 */

import { describe, it, expect } from 'vitest';

describe('Auth Feature Exports', () => {
  it('exports useAuth hook', async () => {
    const { useAuth } = await import('./index.js');
    expect(useAuth).toBeDefined();
    expect(typeof useAuth).toBe('function');
  });

  it('exports useEmailAuth hook', async () => {
    const { useEmailAuth } = await import('./index.js');
    expect(useEmailAuth).toBeDefined();
    expect(typeof useEmailAuth).toBe('function');
  });

  it('exports useGoogleAuth hook', async () => {
    const { useGoogleAuth } = await import('./index.js');
    expect(useGoogleAuth).toBeDefined();
    expect(typeof useGoogleAuth).toBe('function');
  });

  it('exports useSessionVerification hook', async () => {
    const { useSessionVerification } = await import('./index.js');
    expect(useSessionVerification).toBeDefined();
    expect(typeof useSessionVerification).toBe('function');
  });

  it('exports useAuthRedirect hook', async () => {
    const { useAuthRedirect } = await import('./index.js');
    expect(useAuthRedirect).toBeDefined();
    expect(typeof useAuthRedirect).toBe('function');
  });

  it('exports calculateUserProperties from useSessionVerification', async () => {
    const { calculateUserProperties } = await import('./index.js');
    expect(calculateUserProperties).toBeDefined();
    expect(typeof calculateUserProperties).toBe('function');
  });

  it('all exports are accessible from feature barrel', async () => {
    const authFeature = await import('../index.js');

    // All hooks should be re-exported from feature barrel
    expect(authFeature.useAuth).toBeDefined();
    expect(authFeature.useEmailAuth).toBeDefined();
    expect(authFeature.useGoogleAuth).toBeDefined();
    expect(authFeature.useSessionVerification).toBeDefined();
    expect(authFeature.useAuthRedirect).toBeDefined();
    expect(authFeature.calculateUserProperties).toBeDefined();
  });
});
