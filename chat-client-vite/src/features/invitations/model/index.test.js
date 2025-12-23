/**
 * Invitations Feature Barrel Export Tests
 *
 * Ensures all exports from the invitations feature are valid and importable.
 */

import { describe, it, expect } from 'vitest';

describe('Invitations Feature Exports', () => {
  it('exports useInviteDetection hook', async () => {
    const module = await import('../index.js');
    expect(module.useInviteDetection).toBeDefined();
    expect(typeof module.useInviteDetection).toBe('function');
  });

  it('exports useInviteManagement hook', async () => {
    const module = await import('../index.js');
    expect(module.useInviteManagement).toBeDefined();
    expect(typeof module.useInviteManagement).toBe('function');
  });

  it('exports usePairing hook', async () => {
    const module = await import('../index.js');
    expect(module.usePairing).toBeDefined();
    expect(typeof module.usePairing).toBe('function');
  });

  it('exports useInvitations hook', async () => {
    const module = await import('../index.js');
    expect(module.useInvitations).toBeDefined();
    expect(typeof module.useInvitations).toBe('function');
  });

  it('exports useAcceptInvitation hook', async () => {
    const module = await import('../index.js');
    expect(module.useAcceptInvitation).toBeDefined();
    expect(typeof module.useAcceptInvitation).toBe('function');
  });

  it('exports useInviteCoParent hook', async () => {
    const module = await import('../index.js');
    expect(module.useInviteCoParent).toBeDefined();
    expect(typeof module.useInviteCoParent).toBe('function');
  });
});
