import { formatDate } from './format.js';

// What a payment bought, for receipts and lists: "Premium 3 Months" or "Morning Yoga class".
export function paymentItem(payment) {
  if (payment.kind === 'CLASS') return payment.gymClass ? `${payment.gymClass.title} class` : 'Class';
  return payment.plan?.name ?? 'Membership';
}

// Extra line for class payments: "Class on 20 Oct 2026" (null for memberships).
export function paymentItemDetail(payment) {
  return payment.kind === 'CLASS' && payment.gymClass ? `Class on ${formatDate(payment.gymClass.startsAt)}` : null;
}
