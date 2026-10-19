import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { addDays, calculateEndDate, daysBetween, formatDate, formatReadableDate, parseDate, todayInGym } from '../utils/dates.js';
import { toPublicUser } from '../utils/publicUser.js';
import { daysRemaining, getMembershipStatus, pickCurrentMembership } from './membershipStatus.js';
import { findPlanOrThrow } from './plan.service.js';
import { memberPoints } from './attendance.service.js';
import { newPaymentReference } from './cardGateway.js';

// A membership as sent to clients, including its status on `today`.
export function toPublicMembership(membership, today) {
  return {
    id: membership.id,
    plan: { id: membership.plan.id, name: membership.plan.name },
    startDate: formatDate(membership.startDate),
    endDate: formatDate(membership.endDate),
    price: membership.price.toFixed(2),
    discountPercent: membership.discountPercent,
    classesPerMonth: membership.classesPerMonth, // 0 = Basic (gym only)
    status: getMembershipStatus(membership, today),
    daysRemaining: daysRemaining(membership, today),
    // For upcoming memberships: how many days until it starts (0 once it has started).
    daysUntilStart: Math.max(0, daysBetween(today, membership.startDate)),
    createdAt: membership.createdAt,
  };
}

// The member, their membership history (newest first) and the membership that describes them today.
export async function getMemberWithMemberships(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberships: { include: { plan: true }, orderBy: { startDate: 'desc' } } },
  });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const today = todayInGym();
  const current = pickCurrentMembership(user.memberships, today);

  return {
    user: toPublicUser(user),
    currentMembership: current ? toPublicMembership(current, today) : null,
    status: getMembershipStatus(current, today),
    memberships: user.memberships.map((membership) => toPublicMembership(membership, today)),
  };
}

// Works out the dates and price of a new membership and checks every business rule,
// without saving anything. Used for the preview AND before saving, so both always agree.
// `db` is the Prisma client or a transaction. Also used by the online card checkout (payment.service.js).
export async function planMembership(db, userId, { planId, startDate }) {
  const user = await db.user.findUnique({ where: { id: userId }, include: { memberships: true } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  if (user.role !== 'MEMBER') {
    throw new AppError(400, 'Only members can have a membership');
  }

  const plan = await findPlanOrThrow(planId);
  if (!plan.isActive) {
    throw new AppError(400, 'This plan is no longer available');
  }

  const today = todayInGym();
  const start = startDate ? parseDate(startDate) : defaultStartDate(user.memberships, today);
  if (start < today) {
    throw new AppError(400, 'The start date cannot be in the past');
  }

  const end = calculateEndDate(start, plan.durationMonths);

  // Business rule: memberships of one member may not overlap.
  const overlapping = user.memberships.find((m) => m.startDate <= end && m.endDate >= start);
  if (overlapping) {
    throw new AppError(
      409,
      `This period overlaps an existing membership (${formatReadableDate(overlapping.startDate)} to ${formatReadableDate(overlapping.endDate)})`,
    );
  }

  // Loyalty reward: the member's level (visits minus missed classes) gives a discount on the plan price.
  const { level, discountPercent } = await memberPoints(db, userId);
  const price = plan.price.mul(100 - discountPercent).div(100).toDecimalPlaces(2);

  return { plan, startDate: start, endDate: end, listPrice: plan.price, level, discountPercent, price };
}

// Without a chosen date: start today, or the day after the last membership that hasn't ended yet.
function defaultStartDate(memberships, today) {
  const notEnded = memberships.filter((m) => m.endDate >= today);
  if (notEnded.length === 0) return today;

  const lastEnd = notEnded.reduce((latest, m) => (m.endDate > latest ? m.endDate : latest), notEnded[0].endDate);
  return addDays(lastEnd, 1);
}

// GET /api/users/:id/memberships/preview – what would be created, without saving.
export async function previewMembership(userId, input) {
  const planned = await planMembership(prisma, userId, input);
  return {
    plan: { id: planned.plan.id, name: planned.plan.name },
    startDate: formatDate(planned.startDate),
    endDate: formatDate(planned.endDate),
    listPrice: planned.listPrice.toFixed(2),
    level: planned.level,
    discountPercent: planned.discountPercent,
    price: planned.price.toFixed(2),
  };
}

// POST /api/users/:id/memberships – sells a plan to a member.
export async function assignMembership(userId, input) {
  const membership = await prisma.$transaction(async (tx) => {
    // Lock this member's row until the transaction ends. If the admin double-clicks,
    // the second request waits here and then sees the first membership in the overlap check.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

    const planned = await planMembership(tx, userId, input);

    const created = await tx.membership.create({
      data: {
        userId,
        planId: planned.plan.id,
        startDate: planned.startDate,
        endDate: planned.endDate,
        price: planned.price, // copied: later price changes don't rewrite this sale
        discountPercent: planned.discountPercent,
        classesPerMonth: planned.plan.classesPerMonth, // copied too: Basic or Premium as sold
      },
      include: { plan: true },
    });
    // Paid at the front desk: recorded too, so the revenue report includes every sale.
    await tx.payment.create({
      data: {
        reference: newPaymentReference(),
        userId,
        planId: planned.plan.id,
        membershipId: created.id,
        amount: planned.price,
        discountPercent: planned.discountPercent,
        method: 'DESK',
        status: 'PAID',
      },
    });
    return created;
  });

  return toPublicMembership(membership, todayInGym());
}
