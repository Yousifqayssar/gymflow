// Demo bookings follow the same membership-type rule as the app: Basic members get no classes,
// Premium members at most their classes per membership month. Shared by the future classes
// (demo-classes.js) and the past attendance history (demo-attendance.js).
import { formatDate } from '../src/utils/dates.js';
import { membershipMonthOn } from '../src/services/classBalance.service.js';

const DEMO_MAX_PER_MONTH = 7;

export function createClassAllowance() {
  const used = new Map(); // "memberId:monthStart" → classes booked in that membership month

  function slot(member, day) {
    const membership = member.memberships.find((m) => m.startDate <= day && day <= m.endDate && m.classesPerMonth > 0);
    if (!membership) return null;
    const key = `${member.id}:${formatDate(membershipMonthOn(membership, day).start)}`;
    // At most 7 demo bookings per month, so demo members still have a few classes left to try booking.
    return { key, limit: Math.min(membership.classesPerMonth, DEMO_MAX_PER_MONTH) };
  }

  return {
    // May this member book a class on `day`?
    canBook(member, day) {
      const s = slot(member, day);
      return Boolean(s) && (used.get(s.key) ?? 0) < s.limit;
    },
    // Count a booking made on `day`.
    use(member, day) {
      const s = slot(member, day);
      used.set(s.key, (used.get(s.key) ?? 0) + 1);
    },
  };
}
