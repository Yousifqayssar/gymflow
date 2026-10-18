import { describe, expect, it } from 'vitest';
import {
  addDays,
  calculateEndDate,
  daysBetween,
  formatDate,
  formatReadableDate,
  parseDate,
  todayInTimeZone,
} from '../../src/utils/dates.js';

// Small helper so the tests read like the business rule: "1 month from 2026-10-01 ends 2026-10-31".
const endDate = (start, months) => formatDate(calculateEndDate(parseDate(start), months));

describe('calculateEndDate', () => {
  it('ends the day before the same date one month later', () => {
    expect(endDate('2026-10-01', 1)).toBe('2026-10-31');
    expect(endDate('2026-10-15', 1)).toBe('2026-11-14');
  });

  it('handles multi-month plans', () => {
    expect(endDate('2026-10-15', 3)).toBe('2027-01-14');
    expect(endDate('2026-10-15', 6)).toBe('2027-04-14');
  });

  it('handles a 12-month plan across the year boundary', () => {
    expect(endDate('2026-01-01', 12)).toBe('2026-12-31');
    expect(endDate('2026-10-15', 12)).toBe('2027-10-14');
  });

  it('ends on the last day of February when the start day does not exist there', () => {
    expect(endDate('2027-01-31', 1)).toBe('2027-02-28');
    expect(endDate('2027-01-29', 1)).toBe('2027-02-28');
  });

  it('ends on 29 February in a leap year', () => {
    expect(endDate('2028-01-31', 1)).toBe('2028-02-29');
  });

  it('ends on the 30th when the 31st does not exist in the target month', () => {
    expect(endDate('2026-03-31', 1)).toBe('2026-04-30');
  });

  it('always ends after it starts, for every day of a year and every plan length', () => {
    for (let day = 0; day < 366; day++) {
      const start = addDays(parseDate('2028-01-01'), day);
      for (const months of [1, 3, 6, 12]) {
        expect(calculateEndDate(start, months) > start).toBe(true);
      }
    }
  });
});

describe('formatReadableDate', () => {
  it('writes the date the way people read it', () => {
    expect(formatReadableDate(parseDate('2026-09-30'))).toBe('30 Sep 2026');
    expect(formatReadableDate(parseDate('2027-01-01'))).toBe('1 Jan 2027');
  });
});

describe('todayInTimeZone', () => {
  it('returns the local calendar date of the gym, not the UTC date', () => {
    // 22:30 UTC on 15 October is already 01:30 on 16 October in Istanbul (UTC+3).
    const now = new Date('2026-10-15T22:30:00Z');

    expect(formatDate(todayInTimeZone('Europe/Istanbul', now))).toBe('2026-10-16');
    expect(formatDate(todayInTimeZone('UTC', now))).toBe('2026-10-15');
  });
});

describe('daysBetween and addDays', () => {
  it('counts calendar days', () => {
    expect(daysBetween(parseDate('2026-10-01'), parseDate('2026-10-31'))).toBe(30);
    expect(daysBetween(parseDate('2026-10-31'), parseDate('2026-10-01'))).toBe(-30);
  });

  it('is not affected by daylight saving time changes', () => {
    // Many countries change their clocks at the end of March.
    expect(formatDate(addDays(parseDate('2026-03-28'), 2))).toBe('2026-03-30');
  });
});
