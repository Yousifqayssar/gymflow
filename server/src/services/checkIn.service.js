import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { formatDate, formatReadableDate, todayInGym } from '../utils/dates.js';
import { getMembershipStatus, MembershipStatus, pickCurrentMembership, daysRemaining } from './membershipStatus.js';
import { memberPoints } from './attendance.service.js';

// What is written in a member's QR code: "GYMFLOW:" followed by their secret token.
export const QR_PREFIX = 'GYMFLOW:';

// Error code for "this member may not enter", so the client does not mix it up with
// a missing staff permission (both are 403).
export const MEMBERSHIP_NOT_ACTIVE = 'MEMBERSHIP_NOT_ACTIVE';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MEMBER_NUMBER = /^GF-?0*(\d+)$/i;

// Understands a scanned or typed code:
//   "GYMFLOW:<token>" or just "<token>"  → { qrToken, method: 'QR' }
//   "GF-00053", "gf-53"                   → { memberId: 53, method: 'MANUAL' }
export function parseCheckInCode(code) {
  const text = code.trim();
  const token = text.toUpperCase().startsWith(QR_PREFIX) ? text.slice(QR_PREFIX.length) : text;
  if (UUID.test(token)) {
    return { qrToken: token.toLowerCase(), method: 'QR' };
  }
  const number = MEMBER_NUMBER.exec(text);
  if (number) {
    return { memberId: Number(number[1]), method: 'MANUAL' };
  }
  throw new AppError(400, 'This is not a GymFlow member code');
}

// Why a member may not enter, in words the staff can read out.
function refusalMessage(member, current, status) {
  const name = member.firstName;
  if (status === MembershipStatus.EXPIRED) {
    return `${name}'s membership expired on ${formatReadableDate(current.endDate)}`;
  }
  if (status === MembershipStatus.UPCOMING) {
    return `${name}'s membership only starts on ${formatReadableDate(current.startDate)}`;
  }
  return `${name} has no membership`;
}

// The information staff see after a scan.
async function checkInResult(member, current, today, checkIn, alreadyCheckedIn) {
  // missedClasses is left out: staff only need the totals.
  const { missedClasses, ...points } = await memberPoints(prisma, member.id);
  return {
    alreadyCheckedIn,
    checkIn: { id: checkIn.id, checkedInAt: checkIn.checkedInAt, method: checkIn.method },
    member: {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      avatar: member.avatar,
      membership: {
        planName: current.plan.name,
        endDate: formatDate(current.endDate),
        status: getMembershipStatus(current, today),
        daysRemaining: daysRemaining(current, today),
      },
    },
    ...points,
  };
}

// POST /api/check-ins – staff check a member in by QR code or member number.
// Business rule: a member with an expired or no membership cannot check in.
// A member is checked in (and earns points) at most once per gym day.
export async function checkIn(code, staff) {
  const { qrToken, memberId, method } = parseCheckInCode(code);

  const member = await prisma.user.findUnique({
    where: qrToken ? { qrToken } : { id: memberId },
    include: { memberships: { include: { plan: true } } },
  });
  if (!member || member.role !== 'MEMBER') {
    throw new AppError(404, 'No member found for this code');
  }

  const now = new Date();
  const today = todayInGym(now);
  const current = pickCurrentMembership(member.memberships, today);
  const status = getMembershipStatus(current, today);
  if (status !== MembershipStatus.ACTIVE && status !== MembershipStatus.EXPIRING_SOON) {
    throw new AppError(403, refusalMessage(member, current, status), undefined, MEMBERSHIP_NOT_ACTIVE);
  }

  const existing = await prisma.checkIn.findUnique({ where: { memberId_gymDay: { memberId: member.id, gymDay: today } } });
  if (existing) {
    return checkInResult(member, current, today, existing, true);
  }

  try {
    const created = await prisma.checkIn.create({
      data: { memberId: member.id, gymDay: today, checkedInAt: now, method, checkedInById: staff.id },
    });
    return checkInResult(member, current, today, created, false);
  } catch (error) {
    // Two scans at the same moment: the unique index (member, day) lets only one through.
    if (error.code === 'P2002') {
      const winner = await prisma.checkIn.findUnique({ where: { memberId_gymDay: { memberId: member.id, gymDay: today } } });
      return checkInResult(member, current, today, winner, true);
    }
    throw error;
  }
}

// GET /api/check-ins/today – today's visits, newest first.
export async function listTodaysCheckIns() {
  const checkIns = await prisma.checkIn.findMany({
    where: { gymDay: todayInGym() },
    include: { member: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    orderBy: { checkedInAt: 'desc' },
  });
  return checkIns.map((checkIn) => ({
    id: checkIn.id,
    checkedInAt: checkIn.checkedInAt,
    method: checkIn.method,
    member: checkIn.member,
  }));
}
