import { describe, expect, it } from 'vitest';
import {
  daysRemaining,
  getMembershipStatus,
  MembershipStatus,
  pickCurrentMembership,
} from '../../src/services/membershipStatus.js';
import { parseDate } from '../../src/utils/dates.js';

const today = parseDate('2026-10-15');
const membership = (start, end) => ({ startDate: parseDate(start), endDate: parseDate(end) });

describe('getMembershipStatus', () => {
  it('is NONE without a membership', () => {
    expect(getMembershipStatus(null, today)).toBe(MembershipStatus.NONE);
  });

  it('is UPCOMING before the start date', () => {
    expect(getMembershipStatus(membership('2026-10-16', '2026-11-15'), today)).toBe(MembershipStatus.UPCOMING);
  });

  it('is ACTIVE on the start date', () => {
    expect(getMembershipStatus(membership('2026-10-15', '2026-11-14'), today)).toBe(MembershipStatus.ACTIVE);
  });

  it('is ACTIVE when more than 7 days are left', () => {
    expect(getMembershipStatus(membership('2026-10-01', '2026-10-23'), today)).toBe(MembershipStatus.ACTIVE);
  });

  it('is EXPIRING_SOON when it ends exactly 7 days from today', () => {
    expect(getMembershipStatus(membership('2026-10-01', '2026-10-22'), today)).toBe(MembershipStatus.EXPIRING_SOON);
  });

  it('is EXPIRING_SOON on its last valid day', () => {
    expect(getMembershipStatus(membership('2026-09-15', '2026-10-15'), today)).toBe(MembershipStatus.EXPIRING_SOON);
  });

  it('is EXPIRED the day after the end date', () => {
    expect(getMembershipStatus(membership('2026-09-14', '2026-10-14'), today)).toBe(MembershipStatus.EXPIRED);
  });
});

describe('pickCurrentMembership', () => {
  const past = membership('2026-08-01', '2026-08-31');
  const current = membership('2026-10-01', '2026-10-31');
  const next = membership('2026-11-01', '2026-11-30');
  const later = membership('2026-12-01', '2026-12-31');

  it('returns null when there are no memberships', () => {
    expect(pickCurrentMembership([], today)).toBeNull();
  });

  it('prefers the membership that is valid today', () => {
    expect(pickCurrentMembership([past, next, current], today)).toBe(current);
  });

  it('otherwise returns the next upcoming membership', () => {
    expect(pickCurrentMembership([past, later, next], today)).toBe(next);
  });

  it('otherwise returns the most recently ended membership', () => {
    const older = membership('2026-01-01', '2026-01-31');
    expect(pickCurrentMembership([older, past], today)).toBe(past);
  });
});

describe('daysRemaining', () => {
  it('counts today as a remaining day', () => {
    expect(daysRemaining(membership('2026-10-01', '2026-10-15'), today)).toBe(1);
    expect(daysRemaining(membership('2026-10-01', '2026-10-22'), today)).toBe(8);
  });

  it('is 0 for an expired membership', () => {
    expect(daysRemaining(membership('2026-09-01', '2026-09-30'), today)).toBe(0);
  });
});
