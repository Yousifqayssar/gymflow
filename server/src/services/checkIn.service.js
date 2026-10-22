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
// Basic members may only train at our own gym; partner gyms are a Premium benefit.
export const PARTNER_GYM_PREMIUM_ONLY = 'PARTNER_GYM_PREMIUM_ONLY';

// Where a visit happened, as sent to clients: null = our own gym.
const toLocation = (partnerGym) => (partnerGym ? { id: partnerGym.id, name: partnerGym.name } : null);

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
async function checkInResult(member, current, today, checkIn, alreadyCheckedIn, location) {
  // missedClasses is left out: staff only need the totals.
  const { missedClasses, ...points } = await memberPoints(prisma, member.id);
  return {
    alreadyCheckedIn,
    checkIn: { id: checkIn.id, checkedInAt: checkIn.checkedInAt, method: checkIn.method, location },
    member: {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      avatar: member.avatar,
      membership: {
        planName: current.plan.name,
        isPremium: current.classesPerMonth > 0,
        endDate: formatDate(current.endDate),
        status: getMembershipStatus(current, today),
        daysRemaining: daysRemaining(current, today),
      },
    },
    ...points,
  };
}

// POST /api/check-ins – staff check a member in by QR code or member number, at our own gym
// (partnerGymId empty) or at a partner gym.
// Business rules: a member with an expired or no membership cannot check in; at partner gyms only
// Premium members can. A member is checked in (and earns points) at most once per gym day.
export async function checkIn(code, staff, partnerGymId = null) {
  const { qrToken, memberId, method } = parseCheckInCode(code);

  const partnerGym = partnerGymId ? await prisma.partnerGym.findUnique({ where: { id: partnerGymId } }) : null;
  if (partnerGymId && !partnerGym) {
    throw new AppError(404, 'This partner gym does not exist (any more)');
  }

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
  if (partnerGym && current.classesPerMonth === 0) {
    throw new AppError(
      403,
      `${member.firstName} has a Basic membership, which is for our own gym only. Training at partner gyms is included in Premium.`,
      undefined,
      PARTNER_GYM_PREMIUM_ONLY,
    );
  }

  const todaysVisit = { memberId_gymDay: { memberId: member.id, gymDay: today } };
  const existing = await prisma.checkIn.findUnique({ where: todaysVisit, include: { partnerGym: true } });
  if (existing) {
    return checkInResult(member, current, today, existing, true, toLocation(existing.partnerGym));
  }

  try {
    const created = await prisma.checkIn.create({
      data: { memberId: member.id, gymDay: today, checkedInAt: now, method, checkedInById: staff.id, partnerGymId: partnerGym?.id ?? null },
    });
    return checkInResult(member, current, today, created, false, toLocation(partnerGym));
  } catch (error) {
    // Two scans at the same moment: the unique index (member, day) lets only one through.
    if (error.code === 'P2002') {
      const winner = await prisma.checkIn.findUnique({ where: todaysVisit, include: { partnerGym: true } });
      return checkInResult(member, current, today, winner, true, toLocation(winner.partnerGym));
    }
    throw error;
  }
}

// GET /api/check-ins/today – today's visits, newest first.
export async function listTodaysCheckIns() {
  const checkIns = await prisma.checkIn.findMany({
    where: { gymDay: todayInGym() },
    include: { member: { select: { id: true, firstName: true, lastName: true, avatar: true } }, partnerGym: true },
    orderBy: { checkedInAt: 'desc' },
  });
  return checkIns.map((checkIn) => ({
    id: checkIn.id,
    checkedInAt: checkIn.checkedInAt,
    method: checkIn.method,
    location: toLocation(checkIn.partnerGym),
    member: checkIn.member,
  }));
}
