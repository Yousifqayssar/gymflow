import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../utils/password.js';
import { formatDate, todayInGym } from '../utils/dates.js';
import { toPublicUser } from '../utils/publicUser.js';
import { daysRemaining, getMembershipStatus, MembershipStatus, pickCurrentMembership } from './membershipStatus.js';

// Creates a user account. Shared by public sign-up (always MEMBER)
// and by admins creating Member/Trainer accounts. Returns the database row.
export async function createUserAccount({ email, password, firstName, lastName, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email is already registered');
  }

  return prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      role,
    },
  });
}

// Which statuses each list filter shows.
const FILTER_STATUSES = {
  active: [MembershipStatus.ACTIVE, MembershipStatus.EXPIRING_SOON],
  expiring: [MembershipStatus.EXPIRING_SOON],
  expired: [MembershipStatus.EXPIRED],
  upcoming: [MembershipStatus.UPCOMING],
  none: [MembershipStatus.NONE],
};

// Lists users, newest first, without password hashes.
// Filters: role, search (first name, last name or email, ignoring case) and,
// for members, a membership status filter. Asking for a status implies role MEMBER.
//
// Members also get their current membership and status. Statuses are calculated with the
// same tested functions as everywhere else, so the list, detail page and check-in always agree.
export async function listUsers({ role, search, status } = {}) {
  const effectiveRole = status ? 'MEMBER' : role;

  const where = {};
  if (effectiveRole) {
    where.role = effectiveRole;
  }
  if (search) {
    const contains = { contains: search, mode: 'insensitive' };
    where.OR = [{ firstName: contains }, { lastName: contains }, { email: contains }];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: effectiveRole === 'MEMBER' ? { memberships: { include: { plan: true } } } : undefined,
  });

  if (effectiveRole !== 'MEMBER') {
    return { users: users.map(toPublicUser) };
  }

  const today = todayInGym();
  const members = users.map((user) => toMemberListItem(user, today));

  // Counts per filter (after the search, before the status filter) for the filter chips.
  const counts = { all: members.length };
  for (const [filter, statuses] of Object.entries(FILTER_STATUSES)) {
    counts[filter] = members.filter((member) => statuses.includes(member.membership.status)).length;
  }

  let result = members;
  if (status) {
    result = members.filter((member) => FILTER_STATUSES[status].includes(member.membership.status));
  }
  if (status === 'expiring') {
    // Most urgent first: whoever has the fewest days left.
    result = [...result].sort((a, b) => a.membership.daysRemaining - b.membership.daysRemaining);
  }

  return { users: result, counts };
}

// A member as shown in the list: public data plus a summary of their current membership.
function toMemberListItem(user, today) {
  const current = pickCurrentMembership(user.memberships, today);
  return {
    ...toPublicUser(user),
    membership: current
      ? {
          status: getMembershipStatus(current, today),
          planName: current.plan.name,
          startDate: formatDate(current.startDate),
          endDate: formatDate(current.endDate),
          daysRemaining: daysRemaining(current, today),
        }
      : { status: MembershipStatus.NONE },
  };
}
