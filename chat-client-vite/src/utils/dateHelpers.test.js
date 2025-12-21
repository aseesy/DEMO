/**
 * dateHelpers.js Unit Tests
 *
 * Tests pure date utility functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime, isWithinMinutes, isToday } from './dateHelpers.js';

describe('dateHelpers', () => {
  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Mock Date.now() to have consistent tests
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('recent times', () => {
      it('should return "Just now" for current time', () => {
        const now = new Date().toISOString();
        expect(formatRelativeTime(now)).toBe('Just now');
      });

      it('should return "Just now" for times less than 1 minute ago', () => {
        const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
        expect(formatRelativeTime(thirtySecondsAgo)).toBe('Just now');
      });

      it('should return minutes for times 1-59 minutes ago', () => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
        expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
      });

      it('should return "1m ago" for exactly 1 minute', () => {
        const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
        expect(formatRelativeTime(oneMinuteAgo)).toBe('1m ago');
      });

      it('should return "59m ago" for 59 minutes', () => {
        const fiftyNineMinutesAgo = new Date(Date.now() - 59 * 60000).toISOString();
        expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe('59m ago');
      });
    });

    describe('hours', () => {
      it('should return hours for times 1-23 hours ago', () => {
        const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
        expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
      });

      it('should return "1h ago" for exactly 1 hour', () => {
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        expect(formatRelativeTime(oneHourAgo)).toBe('1h ago');
      });

      it('should return "23h ago" for 23 hours', () => {
        const twentyThreeHoursAgo = new Date(Date.now() - 23 * 3600000).toISOString();
        expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('23h ago');
      });
    });

    describe('days', () => {
      it('should return days for times 1-6 days ago', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
        expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
      });

      it('should return "1d ago" for exactly 1 day', () => {
        const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
        expect(formatRelativeTime(oneDayAgo)).toBe('1d ago');
      });

      it('should return "6d ago" for 6 days', () => {
        const sixDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString();
        expect(formatRelativeTime(sixDaysAgo)).toBe('6d ago');
      });
    });

    describe('older dates', () => {
      it('should return formatted date for 7+ days ago', () => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const result = formatRelativeTime(sevenDaysAgo);
        // Should be a date string, not "Xd ago"
        expect(result).not.toContain('d ago');
        expect(result).toMatch(/\d+/); // Contains numbers (date)
      });

      it('should return formatted date for 30 days ago', () => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        const result = formatRelativeTime(thirtyDaysAgo);
        expect(result).not.toContain('d ago');
      });
    });

    describe('edge cases', () => {
      it('should return empty string for null input', () => {
        expect(formatRelativeTime(null)).toBe('');
      });

      it('should return empty string for undefined input', () => {
        expect(formatRelativeTime(undefined)).toBe('');
      });

      it('should return empty string for empty string input', () => {
        expect(formatRelativeTime('')).toBe('');
      });

      it('should return empty string for invalid date string', () => {
        expect(formatRelativeTime('not-a-date')).toBe('');
      });

      it('should handle Date objects', () => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
        expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
      });

      it('should return "Just now" for future dates', () => {
        const futureDate = new Date(Date.now() + 60000).toISOString();
        expect(formatRelativeTime(futureDate)).toBe('Just now');
      });
    });
  });

  describe('isWithinMinutes', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for time within specified minutes', () => {
      const threeMinutesAgo = new Date(Date.now() - 3 * 60000).toISOString();
      expect(isWithinMinutes(threeMinutesAgo, 5)).toBe(true);
    });

    it('should return false for time outside specified minutes', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60000).toISOString();
      expect(isWithinMinutes(tenMinutesAgo, 5)).toBe(false);
    });

    it('should return true for current time', () => {
      const now = new Date().toISOString();
      expect(isWithinMinutes(now, 1)).toBe(true);
    });

    it('should return false for exactly at the boundary', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
      expect(isWithinMinutes(fiveMinutesAgo, 5)).toBe(false);
    });

    it('should return false for null input', () => {
      expect(isWithinMinutes(null, 5)).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(isWithinMinutes(undefined, 5)).toBe(false);
    });

    it('should return false for invalid date', () => {
      expect(isWithinMinutes('not-a-date', 5)).toBe(false);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      expect(isWithinMinutes(futureDate, 5)).toBe(false);
    });

    it('should handle Date objects', () => {
      const threeMinutesAgo = new Date(Date.now() - 3 * 60000);
      expect(isWithinMinutes(threeMinutesAgo, 5)).toBe(true);
    });
  });

  describe('isToday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for current time', () => {
      const now = new Date().toISOString();
      expect(isToday(now)).toBe(true);
    });

    it('should return true for earlier today', () => {
      const earlierToday = new Date('2024-06-15T08:00:00.000Z');
      expect(isToday(earlierToday)).toBe(true);
    });

    it('should return true for later today', () => {
      const laterToday = new Date('2024-06-15T18:00:00.000Z');
      expect(isToday(laterToday)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date('2024-06-14T12:00:00.000Z');
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date('2024-06-16T12:00:00.000Z');
      expect(isToday(tomorrow)).toBe(false);
    });

    it('should return false for null input', () => {
      expect(isToday(null)).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(isToday(undefined)).toBe(false);
    });

    it('should return false for invalid date', () => {
      expect(isToday('not-a-date')).toBe(false);
    });

    it('should handle Date objects', () => {
      const now = new Date();
      expect(isToday(now)).toBe(true);
    });

    it('should handle ISO string input', () => {
      // Use the same date as mocked system time (12:00 UTC)
      const todayISO = '2024-06-15T12:00:00.000Z';
      expect(isToday(todayISO)).toBe(true);
    });
  });
});
