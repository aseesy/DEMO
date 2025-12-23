/**
 * Profile Feature Module Export Tests
 *
 * Ensures profile feature modules are properly exported.
 */

const { describe, it, expect } = require('@jest/globals');

describe('Profile Feature Exports', () => {
  it('exports profile constants', () => {
    const profile = require('../../features/profile/index');

    expect(profile.SENSITIVE_FIELDS).toBeDefined();
    expect(Array.isArray(profile.SENSITIVE_FIELDS)).toBe(true);

    expect(profile.PROFILE_SECTIONS).toBeDefined();
    expect(typeof profile.PROFILE_SECTIONS).toBe('object');

    expect(profile.DEFAULT_PRIVACY_SETTINGS).toBeDefined();
    expect(typeof profile.DEFAULT_PRIVACY_SETTINGS).toBe('object');
  });

  it('constants are accessible from constants subfolder', () => {
    const constants = require('../../features/profile/constants/index');

    expect(constants.SENSITIVE_FIELDS).toBeDefined();
    expect(constants.PROFILE_SECTIONS).toBeDefined();
    expect(constants.DEFAULT_PRIVACY_SETTINGS).toBeDefined();
  });
});
