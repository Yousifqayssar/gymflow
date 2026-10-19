import { describe, expect, it } from 'vitest';
import { pointsForVisits, pointsSummary } from '../../src/services/points.js';
import { isNoShow } from '../../src/services/attendance.service.js';

describe('pointsForVisits', () => {
  it('gives 10 points per visit and takes 10 per missed class', () => {
    expect(pointsForVisits(5)).toBe(50);
    expect(pointsForVisits(5, 2)).toBe(30);
  });

  it('never goes below 0', () => {
    expect(pointsForVisits(1, 3)).toBe(0);
  });
});

describe('pointsSummary', () => {
  it('uses the points after penalties for the level and discount', () => {
    expect(pointsSummary(30)).toMatchObject({ points: 300, level: 'Gold', discountPercent: 10 });
    expect(pointsSummary(30, 1)).toMatchObject({ noShows: 1, points: 290, level: 'Silver', discountPercent: 5, pointsToNextLevel: 10 });
  });
});

describe('isNoShow', () => {
  const now = new Date('2026-10-15T12:00:00Z');
  const ended = { startsAt: new Date('2026-10-15T09:00:00Z'), durationMinutes: 60, isCancelled: false, attendanceOpenedAt: new Date('2026-10-15T09:00:00Z') };

  it('is a no-show only when the class is over, attendance was taken and the member never came', () => {
    expect(isNoShow({ attendedAt: null }, ended, now)).toBe(true);
    expect(isNoShow({ attendedAt: new Date() }, ended, now)).toBe(false);
    expect(isNoShow({ attendedAt: null }, { ...ended, attendanceOpenedAt: null }, now)).toBe(false);
    expect(isNoShow({ attendedAt: null }, { ...ended, isCancelled: true }, now)).toBe(false);
    expect(isNoShow({ attendedAt: null }, ended, new Date('2026-10-15T09:30:00Z'))).toBe(false);
  });
});
