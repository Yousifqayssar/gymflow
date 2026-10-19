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
