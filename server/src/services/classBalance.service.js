import { Prisma } from '../generated/prisma/client.ts';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { addDays, calculateEndDate, formatDate, formatReadableDate, todayInGym, todayInTimeZone } from '../utils/dates.js';

// Membership types and the monthly class balance.
//   Basic   (classesPerMonth = 0): gym access; group classes are paid one by one at the class price.
//   Premium (e.g. 10): that many classes per MEMBERSHIP month. A member who started on the 9th
//   gets a new balance on the 9th of every month; unused classes are lost (they do not carry over).
// A booking uses one class of the month the class takes place in. Cancelling the booking, or the
// trainer cancelling the class, gives it back. A no-show still uses it (the spot was blocked for others).

// The calendar day of a class in the gym's time zone (same rule as booking.service.js).
export const classDay = (gymClass) => todayInTimeZone(env.GYM_TIMEZONE, gymClass.startsAt);

// The membership month that contains `day`: { start, end } (calendar dates, both inclusive).
// Month k starts the day after a k-month membership would end, using the app's end-date rule:
//   started 9 Sep → 9 Sep–8 Oct, 9 Oct–8 Nov, …   started 31 Jan → 31 Jan–28 Feb, 1 Mar–30 Mar, …
export function membershipMonthOn(membership, day) {
  for (let k = 0; ; k++) {
    const start = k === 0 ? membership.startDate : addDays(calculateEndDate(membership.startDate, k), 1);
    const end = calculateEndDate(membership.startDate, k + 1);
    if (day <= end || end >= membership.endDate) {
      return { start, end: end < membership.endDate ? end : membership.endDate };
    }
  }
}

// How many of the month's included classes the member has used (not counting cancelled classes,
// nor classes they paid for separately). `db` is the Prisma client or a transaction.
async function countUsed(db, memberId, month) {
  // A day of margin on both sides for the time zone; the exact gym day decides below.
  const bookings = await db.booking.findMany({
    where: {
      memberId,
      paymentId: null,
      gymClass: { isCancelled: false, startsAt: { gte: addDays(month.start, -1), lt: addDays(month.end, 2) } },
    },
    select: { gymClass: { select: { startsAt: true } } },
  });
  return bookings.filter(({ gymClass }) => {
    const day = classDay(gymClass);
    return day >= month.start && day <= month.end;
  }).length;
}

// The class balance of a membership for the month containing `day`.
export async function balanceOn(db, membership, day) {
  const month = membershipMonthOn(membership, day);
  const used = membership.classesPerMonth > 0 ? await countUsed(db, membership.userId, month) : 0;
  return {
    type: membership.classesPerMonth > 0 ? 'PREMIUM' : 'BASIC',
    classesPerMonth: membership.classesPerMonth,
    used,
    left: Math.max(0, membership.classesPerMonth - used),
    monthStart: formatDate(month.start),
    monthEnd: formatDate(month.end),
    // The day unused classes are lost and the new balance starts (null when the membership ends first).
    resetsOn: month.end < membership.endDate ? formatDate(addDays(month.end, 1)) : null,
  };
}

// ---------- paying per class ----------

// Premium members who used all their classes of the month pay a class with this discount.
export const PREMIUM_EXTRA_CLASS_DISCOUNT_PERCENT = 30;

// What booking this class costs the member, given their membership on the class day:
//   Premium with classes left → free (uses one of the month's classes)
//   Premium with none left    → the class price minus the Premium discount
//   Basic                     → the full class price
// { mustPay, reason: null | 'BASIC_PLAN' | 'NO_CLASSES_LEFT', listPrice, discountPercent, price, resetsOn }
export async function quoteClass(db, membership, gymClass) {
  const listPrice = gymClass.price;
  if (membership.classesPerMonth === 0) {
    return { mustPay: true, reason: 'BASIC_PLAN', listPrice, discountPercent: 0, price: listPrice, resetsOn: null };
  }
  const balance = await balanceOn(db, membership, classDay(gymClass));
  if (balance.left > 0) {
    return { mustPay: false, reason: null, listPrice, discountPercent: 0, price: new Prisma.Decimal(0), resetsOn: balance.resetsOn };
  }
  const discountPercent = PREMIUM_EXTRA_CLASS_DISCOUNT_PERCENT;
  const price = listPrice.mul(100 - discountPercent).div(100).toDecimalPlaces(2);
  return { mustPay: true, reason: 'NO_CLASSES_LEFT', listPrice, discountPercent, price, resetsOn: balance.resetsOn };
}

// The quote as sent to clients (money as exact strings).
export function toPublicQuote(quote) {
  return { ...quote, listPrice: quote.listPrice.toFixed(2), price: quote.price.toFixed(2) };
}

// Business rule for a FREE booking (called inside the booking transaction): the membership on the class day
// must include classes, and that month must still have one left. Otherwise the member can pay for the class.
export async function assertCanUseClass(db, membership, gymClass) {
  const quote = await quoteClass(db, membership, gymClass);
  if (quote.reason === 'BASIC_PLAN') {
    throw new AppError(
      403,
      `Your Basic membership includes the gym only. You can pay for this class (${formatMoney(quote.price)}) or choose a Premium plan.`,
      undefined,
      'BASIC_PLAN',
    );
  }
  if (quote.reason === 'NO_CLASSES_LEFT') {
    const when = quote.resetsOn ? ` You get ${membership.classesPerMonth} new classes on ${formatReadableDate(new Date(quote.resetsOn))}.` : '';
    throw new AppError(
      403,
      `You have used all ${membership.classesPerMonth} classes of this membership month.${when} You can still book this class for ${formatMoney(quote.price)} (${quote.discountPercent}% Premium discount).`,
      undefined,
      'NO_CLASSES_LEFT',
    );
  }
}

// 140 → "₺140.00", for messages.
const formatMoney = (amount) => `₺${amount.toFixed(2)}`;

// GET /api/me/class-balance (Member) – the balance of the membership valid today, or null without one.
export async function getMyClassBalance(memberId) {
  const today = todayInGym();
  const membership = await prisma.membership.findFirst({
    where: { userId: memberId, startDate: { lte: today }, endDate: { gte: today } },
    include: { plan: { select: { name: true } } },
  });
  if (!membership) return { balance: null };
  return { balance: { planName: membership.plan.name, ...(await balanceOn(prisma, membership, today)) } };
}
