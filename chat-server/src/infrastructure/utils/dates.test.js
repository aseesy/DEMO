/**
 * Unit Tests: Dates Utility
 *
 * @module src/utils/__tests__/dates.test
 */

const {
  now,
  timestamp,
  timestampSeconds,
  expiresIn,
  expiresInISO,
  isExpired,
  timeRemaining,
  formatDate,
  formatDateTime,
  relativeTime,
  isToday,
  startOfDay,
  endOfDay,
  addTime,
} = require('../dates');

describe('Dates Utility', () => {
  describe('now', () => {
    it('should return ISO 8601 formatted string', () => {
      const result = now();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return current time', () => {
      const before = Date.now();
      const result = new Date(now()).getTime();
      const after = Date.now();
      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });
  });

  describe('timestamp', () => {
    it('should return Unix timestamp in milliseconds', () => {
      const before = Date.now();
      const result = timestamp();
      const after = Date.now();
      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });
  });

  describe('timestampSeconds', () => {
    it('should return Unix timestamp in seconds', () => {
      const result = timestampSeconds();
      const expected = Math.floor(Date.now() / 1000);
      expect(Math.abs(result - expected)).toBeLessThanOrEqual(1);
    });
  });

  describe('expiresIn', () => {
    it('should calculate expiration for milliseconds', () => {
      const result = expiresIn(5000, 'ms');
      const expected = Date.now() + 5000;
      expect(Math.abs(result.getTime() - expected)).toBeLessThan(100);
    });

    it('should calculate expiration for seconds', () => {
      const result = expiresIn(60, 's');
      const expected = Date.now() + 60000;
      expect(Math.abs(result.getTime() - expected)).toBeLessThan(100);
    });

    it('should calculate expiration for minutes', () => {
      const result = expiresIn(30, 'm');
      const expected = Date.now() + 30 * 60 * 1000;
      expect(Math.abs(result.getTime() - expected)).toBeLessThan(100);
    });

    it('should calculate expiration for hours', () => {
      const result = expiresIn(24, 'h');
      const expected = Date.now() + 24 * 60 * 60 * 1000;
      expect(Math.abs(result.getTime() - expected)).toBeLessThan(100);
    });

    it('should calculate expiration for days', () => {
      const result = expiresIn(7, 'd');
      const expected = Date.now() + 7 * 24 * 60 * 60 * 1000;
      expect(Math.abs(result.getTime() - expected)).toBeLessThan(100);
    });

    it('should calculate expiration for weeks', () => {
      const result = expiresIn(2, 'w');
      const expected = Date.now() + 14 * 24 * 60 * 60 * 1000;
      expect(Math.abs(result.getTime() - expected)).toBeLessThan(100);
    });

    it('should return Date object', () => {
      expect(expiresIn(1, 'h')).toBeInstanceOf(Date);
    });
  });

  describe('expiresInISO', () => {
    it('should return ISO string', () => {
      const result = expiresInISO(1, 'h');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('isExpired', () => {
    it('should return true for past dates', () => {
      expect(isExpired(new Date('2020-01-01'))).toBe(true);
      expect(isExpired(Date.now() - 1000)).toBe(true);
      expect(isExpired('2020-01-01T00:00:00Z')).toBe(true);
    });

    it('should return false for future dates', () => {
      expect(isExpired(new Date('2030-01-01'))).toBe(false);
      expect(isExpired(Date.now() + 10000)).toBe(false);
      expect(isExpired('2030-01-01T00:00:00Z')).toBe(false);
    });

    it('should return true for null/undefined', () => {
      expect(isExpired(null)).toBe(true);
      expect(isExpired(undefined)).toBe(true);
    });
  });

  describe('timeRemaining', () => {
    it('should return positive milliseconds for future date', () => {
      const future = Date.now() + 10000;
      const result = timeRemaining(future);
      expect(result).toBeGreaterThan(9000);
      expect(result).toBeLessThanOrEqual(10000);
    });

    it('should return negative milliseconds for past date', () => {
      const past = Date.now() - 10000;
      const result = timeRemaining(past);
      expect(result).toBeLessThan(0);
    });

    it('should return -1 for null/undefined', () => {
      expect(timeRemaining(null)).toBe(-1);
      expect(timeRemaining(undefined)).toBe(-1);
    });
  });

  describe('formatDate', () => {
    it('should format date with medium style by default', () => {
      // Use UTC date to avoid timezone issues
      const result = formatDate(new Date('2024-01-15T12:00:00Z'));
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
    });

    it('should accept custom options', () => {
      const result = formatDate(new Date('2024-01-15'), { dateStyle: 'full' });
      expect(result).toContain('January');
      expect(result).toContain('2024');
    });

    it('should handle string dates', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('2024');
    });

    it('should return empty string for null/undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDate('not-a-date')).toBe('');
    });
  });

  describe('formatDateTime', () => {
    it('should include both date and time', () => {
      const result = formatDateTime(new Date('2024-01-15T10:30:00'));
      expect(result).toContain('2024');
      expect(result).toMatch(/\d+:\d+/); // contains time
    });
  });

  describe('relativeTime', () => {
    it('should return "just now" for recent times', () => {
      expect(relativeTime(Date.now())).toBe('just now');
      expect(relativeTime(Date.now() - 30000)).toBe('just now');
    });

    it('should return minutes ago', () => {
      expect(relativeTime(Date.now() - 60000)).toBe('1 minute ago');
      expect(relativeTime(Date.now() - 120000)).toBe('2 minutes ago');
    });

    it('should return hours ago', () => {
      expect(relativeTime(Date.now() - 3600000)).toBe('1 hour ago');
      expect(relativeTime(Date.now() - 7200000)).toBe('2 hours ago');
    });

    it('should return days ago', () => {
      expect(relativeTime(Date.now() - 86400000)).toBe('1 day ago');
      expect(relativeTime(Date.now() - 172800000)).toBe('2 days ago');
    });

    it('should return formatted date for old dates', () => {
      const result = relativeTime(Date.now() - 8 * 86400000); // 8 days ago
      expect(result).toContain('2'); // should contain year or day
    });

    it('should return empty string for null/undefined', () => {
      expect(relativeTime(null)).toBe('');
      expect(relativeTime(undefined)).toBe('');
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true);
      expect(isToday(Date.now())).toBe(true);
    });

    it('should return false for other days', () => {
      expect(isToday(new Date('2020-01-01'))).toBe(false);
      expect(isToday(Date.now() + 2 * 86400000)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isToday(null)).toBe(false);
      expect(isToday(undefined)).toBe(false);
    });
  });

  describe('startOfDay', () => {
    it('should set time to midnight', () => {
      const result = startOfDay(new Date('2024-01-15T15:30:45.123'));
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should use current date by default', () => {
      const result = startOfDay();
      const today = new Date();
      expect(result.getDate()).toBe(today.getDate());
      expect(result.getHours()).toBe(0);
    });
  });

  describe('endOfDay', () => {
    it('should set time to 23:59:59.999', () => {
      const result = endOfDay(new Date('2024-01-15T15:30:45.123'));
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('addTime', () => {
    it('should add time in various units', () => {
      const base = new Date('2024-01-15T12:00:00Z');

      const plusHour = addTime(base, 1, 'h');
      expect(plusHour.getTime() - base.getTime()).toBe(3600000);

      const plusDay = addTime(base, 1, 'd');
      expect(plusDay.getTime() - base.getTime()).toBe(86400000);

      const plusWeek = addTime(base, 1, 'w');
      expect(plusWeek.getTime() - base.getTime()).toBe(7 * 86400000);
    });

    it('should handle string dates', () => {
      const result = addTime('2024-01-15T12:00:00Z', 1, 'd');
      expect(result.getUTCDate()).toBe(16);
    });
  });
});
