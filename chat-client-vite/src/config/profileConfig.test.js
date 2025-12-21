/**
 * profileConfig.js Unit Tests
 *
 * Tests pure configuration functions and constants.
 */

import { describe, it, expect } from 'vitest';
import {
  PROFILE_TABS,
  CORE_VALUES_OPTIONS,
  SCHEDULE_FLEXIBILITY_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  IMAGE_UPLOAD_CONFIG,
  parseMultiSelectValues,
  serializeMultiSelectValues,
  toggleMultiSelectValue,
} from './profileConfig.js';

describe('Profile Configuration', () => {
  describe('PROFILE_TABS', () => {
    it('should have three tabs', () => {
      expect(PROFILE_TABS).toHaveLength(3);
    });

    it('should have personal tab', () => {
      expect(PROFILE_TABS.find(t => t.id === 'personal')).toBeDefined();
    });

    it('should have motivations tab', () => {
      expect(PROFILE_TABS.find(t => t.id === 'motivations')).toBeDefined();
    });

    it('should have background tab', () => {
      expect(PROFILE_TABS.find(t => t.id === 'background')).toBeDefined();
    });

    it('should have labels for all tabs', () => {
      PROFILE_TABS.forEach(tab => {
        expect(tab.label).toBeTruthy();
        expect(typeof tab.label).toBe('string');
      });
    });
  });

  describe('CORE_VALUES_OPTIONS', () => {
    it('should have at least 20 options', () => {
      expect(CORE_VALUES_OPTIONS.length).toBeGreaterThanOrEqual(20);
    });

    it('should have value and label for each option', () => {
      CORE_VALUES_OPTIONS.forEach(option => {
        expect(option.value).toBeTruthy();
        expect(option.label).toBeTruthy();
      });
    });

    it('should include common values', () => {
      const values = CORE_VALUES_OPTIONS.map(o => o.value);
      expect(values).toContain('honesty');
      expect(values).toContain('respect');
      expect(values).toContain('empathy');
    });
  });

  describe('SCHEDULE_FLEXIBILITY_OPTIONS', () => {
    it('should have options for high, medium, low', () => {
      const values = SCHEDULE_FLEXIBILITY_OPTIONS.map(o => o.value);
      expect(values).toContain('high');
      expect(values).toContain('medium');
      expect(values).toContain('low');
    });

    it('should have empty value for default', () => {
      expect(SCHEDULE_FLEXIBILITY_OPTIONS[0].value).toBe('');
    });
  });

  describe('EDUCATION_LEVEL_OPTIONS', () => {
    it('should have common education levels', () => {
      const values = EDUCATION_LEVEL_OPTIONS.map(o => o.value);
      expect(values).toContain('high_school');
      expect(values).toContain('bachelors');
      expect(values).toContain('masters');
    });
  });

  describe('IMAGE_UPLOAD_CONFIG', () => {
    it('should have max size of 5MB', () => {
      expect(IMAGE_UPLOAD_CONFIG.maxSizeBytes).toBe(5 * 1024 * 1024);
      expect(IMAGE_UPLOAD_CONFIG.maxSizeMB).toBe(5);
    });

    it('should accept image types', () => {
      expect(IMAGE_UPLOAD_CONFIG.acceptAttribute).toBe('image/*');
    });
  });
});

describe('parseMultiSelectValues', () => {
  it('should parse comma-separated values', () => {
    expect(parseMultiSelectValues('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('should handle single value', () => {
    expect(parseMultiSelectValues('single')).toEqual(['single']);
  });

  it('should filter empty values', () => {
    expect(parseMultiSelectValues('a,,b,,,c')).toEqual(['a', 'b', 'c']);
  });

  it('should return empty array for empty string', () => {
    expect(parseMultiSelectValues('')).toEqual([]);
  });

  it('should return empty array for null', () => {
    expect(parseMultiSelectValues(null)).toEqual([]);
  });

  it('should return empty array for undefined', () => {
    expect(parseMultiSelectValues(undefined)).toEqual([]);
  });

  it('should return empty array for non-string', () => {
    expect(parseMultiSelectValues(123)).toEqual([]);
    expect(parseMultiSelectValues({})).toEqual([]);
  });
});

describe('serializeMultiSelectValues', () => {
  it('should join array with commas', () => {
    expect(serializeMultiSelectValues(['a', 'b', 'c'])).toBe('a,b,c');
  });

  it('should handle single value', () => {
    expect(serializeMultiSelectValues(['single'])).toBe('single');
  });

  it('should filter empty values', () => {
    expect(serializeMultiSelectValues(['a', '', 'b', null, 'c'])).toBe('a,b,c');
  });

  it('should return empty string for empty array', () => {
    expect(serializeMultiSelectValues([])).toBe('');
  });

  it('should return empty string for non-array', () => {
    expect(serializeMultiSelectValues(null)).toBe('');
    expect(serializeMultiSelectValues('string')).toBe('');
  });
});

describe('toggleMultiSelectValue', () => {
  it('should add value when not selected', () => {
    expect(toggleMultiSelectValue('a,b', 'c')).toBe('a,b,c');
  });

  it('should remove value when selected', () => {
    expect(toggleMultiSelectValue('a,b,c', 'b')).toBe('a,c');
  });

  it('should add first value to empty string', () => {
    expect(toggleMultiSelectValue('', 'first')).toBe('first');
  });

  it('should return empty string when removing last value', () => {
    expect(toggleMultiSelectValue('only', 'only')).toBe('');
  });

  it('should handle null current values', () => {
    expect(toggleMultiSelectValue(null, 'new')).toBe('new');
  });

  it('should preserve order when removing', () => {
    expect(toggleMultiSelectValue('a,b,c,d', 'b')).toBe('a,c,d');
  });

  it('should append when adding', () => {
    expect(toggleMultiSelectValue('x,y', 'z')).toBe('x,y,z');
  });
});
