import { Prisma } from '../generated/prisma/client.ts';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { addDays, formatDate, todayInGym } from '../utils/dates.js';
import { chargeCard, newPaymentReference } from './cardGateway.js';
import { planMembership, previewMembership, toPublicMembership } from './membership.service.js';

export const PAYMENT_INCLUDE = {
  plan: { select: { id: true, name: true } },
  gymClass: { select: { id: true, title: true, startsAt: true } },
  membership: { select: { startDate: true, endDate: true } },
  user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
};

// A payment as sent to clients. There is no full card number to leak: it was never stored.
export function toPublicPayment(payment) {
  return {
    id: payment.id,
    kind: payment.kind, // MEMBERSHIP or CLASS
    reference: payment.reference,
    amount: payment.amount.toFixed(2),
    discountPercent: payment.discountPercent,
    method: payment.method,
    status: payment.status,
    card: payment.cardBrand ? { brand: payment.cardBrand, last4: payment.cardLast4 } : null,
    declineReason: payment.declineReason,
    plan: payment.plan, // MEMBERSHIP payments
    // CLASS payments: the class (null if a demo class was deleted later)
    gymClass: payment.gymClass ? { ...payment.gymClass, startsAt: payment.gymClass.startsAt.toISOString() } : null,
    refundedAt: payment.refundedAt,
    membership: payment.membership ? { startDate: formatDate(payment.membership.startDate), endDate: formatDate(payment.membership.endDate) } : null,
    member: payment.user,
    createdAt: payment.createdAt,
  };
}

// GET /api/me/membership/preview?planId= – the member sees price (after loyalty discount) and dates before paying.
export function previewMyMembership(memberId, { planId }) {
  return previewMembership(memberId, { planId });
}

// POST /api/me/checkout – the member pays by card and gets the membership in one step.
// A declined card is recorded (the member and the admin can see the attempt) but creates no membership.
export async function checkout(memberId, { planId, checkoutId, card }) {
  const result = await prisma.$transaction(async (tx) => {
    // Same lock as the front desk: a double-click waits here, then fails the overlap check
    // BEFORE the card is charged a second time.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${memberId} FOR UPDATE`;

    // This checkout was already sent (double click, or the network retried): never charge it again.
    if (await tx.payment.findUnique({ where: { checkoutId } })) {
      throw new AppError(409, 'This payment was already sent. Check your receipts before paying again.', undefined, 'ALREADY_PROCESSED');
    }

    const planned = await planMembership(tx, memberId, { planId });
    const charge = chargeCard(card);
    const payment = {
      reference: newPaymentReference(),
      checkoutId,
      userId: memberId,
      planId: planned.plan.id,
      amount: planned.price,
      discountPercent: planned.discountPercent,
      method: 'CARD',
      cardBrand: charge.brand,
      cardLast4: charge.last4,
    };

    if (!charge.approved) {
      await tx.payment.create({ data: { ...payment, status: 'DECLINED', declineReason: charge.declineReason } });
      return { declineReason: charge.declineReason };
    }

    const membership = await tx.membership.create({
      data: {
        userId: memberId,
        planId: planned.plan.id,
        startDate: planned.startDate,
        endDate: planned.endDate,
        price: planned.price,
        discountPercent: planned.discountPercent,
        classesPerMonth: planned.plan.classesPerMonth,
      },
      include: { plan: true },
    });
    const paid = await tx.payment.create({ data: { ...payment, status: 'PAID', membershipId: membership.id }, include: PAYMENT_INCLUDE });
    return { membership, payment: paid };
  });

  // Thrown after the transaction, so the declined attempt stays saved. 402 = Payment Required.
  if (result.declineReason) {
    throw new AppError(402, result.declineReason, undefined, 'CARD_DECLINED');
  }
  return { membership: toPublicMembership(result.membership, todayInGym()), payment: toPublicPayment(result.payment) };
}

// GET /api/me/payments – the member's receipts, newest first.
export async function listMyPayments(memberId) {
  const payments = await prisma.payment.findMany({ where: { userId: memberId }, include: PAYMENT_INCLUDE, orderBy: { createdAt: 'desc' } });
  return { payments: payments.map(toPublicPayment) };
}

const MAX_LISTED = 200;

// GET /api/payments?status=&userId= (Admin) – all payments plus revenue totals.
export async function listPayments({ status, userId }) {
  const where = { ...(status && { status }), ...(userId && { userId }) };
  const [payments, totals] = await Promise.all([
    prisma.payment.findMany({ where, include: PAYMENT_INCLUDE, orderBy: { createdAt: 'desc' }, take: MAX_LISTED }),
    paymentTotals(userId),
  ]);
  return { payments: payments.map(toPublicPayment), totals };
}

// Revenue this month (in the gym's time zone) and all time. Optional: for one member only.
async function paymentTotals(userId) {
  const today = todayInGym();
  const monthKey = formatDate(today).slice(0, 7); // "2026-10"
  const memberFilter = userId ? { userId } : {};

  // Payments of this month: a day of margin for the time zone, then the exact gym day decides.
  const firstOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const recent = await prisma.payment.findMany({
    where: { ...memberFilter, createdAt: { gte: addDays(firstOfMonth, -1) } },
    select: { amount: true, status: true, createdAt: true },
  });
  const thisMonth = recent.filter((p) => formatDate(todayInGym(p.createdAt)).startsWith(monthKey));
  const paidThisMonth = thisMonth.filter((p) => p.status === 'PAID');

  const allTime = await prisma.payment.aggregate({ where: { ...memberFilter, status: 'PAID' }, _sum: { amount: true }, _count: true });

  return {
    revenueThisMonth: paidThisMonth.reduce((sum, p) => sum.add(p.amount), new Prisma.Decimal(0)).toFixed(2),
    paymentsThisMonth: paidThisMonth.length,
    declinedThisMonth: thisMonth.length - paidThisMonth.length,
    revenueAllTime: (allTime._sum.amount ?? new Prisma.Decimal(0)).toFixed(2),
    paymentsAllTime: allTime._count,
  };
}
