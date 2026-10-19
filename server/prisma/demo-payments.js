import { addDays } from '../src/utils/dates.js';
import { newPaymentReference } from '../src/services/cardGateway.js';

const HOUR_MS = 60 * 60 * 1000;
const CARDS = [
  { cardBrand: 'VISA', cardLast4: '4242' },
  { cardBrand: 'MASTERCARD', cardLast4: '4444' },
];

// One payment for every demo membership, so receipts and the admin's revenue page have data.
// Members take turns: one paid online by card (Visa or Mastercard), the next at the front desk.
// Elif also has one declined attempt just before her successful card payment.
//   members: demo members with their memberships (oldest member first)
export async function seedDemoPayments(prisma, { today, now, members }) {
  const payments = [];

  members.forEach((member, index) => {
    const paysByCard = index % 2 === 0;
    const card = CARDS[(index / 2) % 2 === 0 ? 0 : 1];

    for (const membership of member.memberships) {
      // Bought on its first day at 10:00 (Istanbul), or yesterday for memberships that start later.
      const createdAt = membership.startDate <= today ? new Date(membership.startDate.getTime() + 7 * HOUR_MS) : new Date(addDays(now, -1));
      const base = {
        userId: member.id,
        planId: membership.planId,
        amount: membership.price,
        discountPercent: membership.discountPercent,
        createdAt,
      };

      if (!paysByCard) {
        payments.push({ ...base, reference: newPaymentReference(), membershipId: membership.id, method: 'DESK', status: 'PAID' });
        continue;
      }
      if (member.firstName === 'Elif') {
        payments.push({
          ...base,
          reference: newPaymentReference(),
          method: 'CARD',
          status: 'DECLINED',
          cardBrand: 'VISA',
          cardLast4: '0002',
          declineReason: 'Your card was declined. Please use another card.',
          createdAt: new Date(createdAt.getTime() - 0.05 * HOUR_MS),
        });
      }
      payments.push({ ...base, ...card, reference: newPaymentReference(), membershipId: membership.id, method: 'CARD', status: 'PAID' });
    }
  });

  await prisma.payment.createMany({ data: payments });
  return payments.length;
}

// Paying per class: Can (Basic) paid by card for his next class, and Zeynep (Basic) paid for one and
// cancelled it again (refunded) – so class receipts and refunds show up on the Payments page.
// Runs after the demo classes exist. Returns the number of payments created.
export async function seedDemoClassPayments(prisma, { now, members }) {
  const byName = (name) => members.find((member) => member.firstName === name);
  const upcoming = await prisma.gymClass.findMany({
    where: { startsAt: { gt: now }, isCancelled: false, trainer: { email: { endsWith: '@demo.gymflow.local' } } },
    include: { _count: { select: { bookings: true } } },
    orderBy: { startsAt: 'asc' },
  });
  const withSpace = upcoming.filter((gymClass) => gymClass._count.bookings < gymClass.capacity);
  let count = 0;

  const can = byName('Can');
  const canClass = withSpace[0];
  if (can && canClass) {
    const payment = await prisma.payment.create({
      data: {
        kind: 'CLASS', reference: newPaymentReference(), userId: can.id, classId: canClass.id, amount: canClass.price,
        method: 'CARD', status: 'PAID', ...CARDS[0], createdAt: new Date(now.getTime() - 3 * HOUR_MS),
      },
    });
    await prisma.booking.create({ data: { classId: canClass.id, memberId: can.id, paymentId: payment.id } });
    count++;
  }

  const zeynep = byName('Zeynep');
  const zeynepClass = withSpace[1];
  if (zeynep && zeynepClass) {
    await prisma.payment.create({
      data: {
        kind: 'CLASS', reference: newPaymentReference(), userId: zeynep.id, classId: zeynepClass.id, amount: zeynepClass.price,
        method: 'CARD', status: 'REFUNDED', ...CARDS[1], createdAt: new Date(now.getTime() - 26 * HOUR_MS), refundedAt: new Date(now.getTime() - 20 * HOUR_MS),
      },
    });
    count++;
  }
  return count;
}
