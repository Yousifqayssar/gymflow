import { daysBetween } from '../utils/dates.js';

// A membership counts as "expiring soon" if it ends within this many days.
export const EXPIRING_SOON_DAYS = 7;

export const MembershipStatus = Object.freeze({
  NONE: 'NONE', // never had a membership
  UPCOMING: 'UPCOMING', // starts in the future
  ACTIVE: 'ACTIVE',
  EXPIRING_SOON: 'EXPIRING_SOON', // active, but ends within EXPIRING_SOON_DAYS
  EXPIRED: 'EXPIRED',
});

// The status of one membership on a given day. Both dates are inclusive:
// a membership ending on 31 Oct is still valid on 31 Oct.
export function getMembershipStatus(membership, today) {
  if (!membership) return MembershipStatus.NONE;
  if (today < membership.startDate) return MembershipStatus.UPCOMING;
  if (today > membership.endDate) return MembershipStatus.EXPIRED;
  if (daysBetween(today, membership.endDate) <= EXPIRING_SOON_DAYS) return MembershipStatus.EXPIRING_SOON;
  return MembershipStatus.ACTIVE;
}

// From all memberships of one member, picks the one that describes them today:
// 1. the one valid today, otherwise
// 2. the next upcoming one, otherwise
// 3. the most recently ended one (or null if there are none).
export function pickCurrentMembership(memberships, today) {
  const validToday = memberships.find((m) => m.startDate <= today && today <= m.endDate);
  if (validToday) return validToday;

  const upcoming = memberships
    .filter((m) => m.startDate > today)
    .sort((a, b) => a.startDate - b.startDate);
  if (upcoming.length > 0) return upcoming[0];

  const past = [...memberships].sort((a, b) => b.endDate - a.endDate);
  return past[0] ?? null;
}

// Days left including today (0 if expired). 31 Oct on 31 Oct → 1 day left.
export function daysRemaining(membership, today) {
  return Math.max(0, daysBetween(today, membership.endDate) + 1);
}
