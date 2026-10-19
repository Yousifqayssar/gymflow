import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { CLASS_INCLUDE, toPublicClass } from './class.service.js';
// classDay: the calendar day of a class in the gym's time zone. A class at 00:30 on 1 November in
// Istanbul is on 1 November, even though it is still 31 October in UTC.
import { assertCanUseClass, classDay, quoteClass, toPublicQuote } from './classBalance.service.js';
import { chargeCard, newPaymentReference } from './cardGateway.js';
import { PAYMENT_INCLUDE, toPublicPayment } from './payment.service.js';

async function loadPublicClass(db, classId, member) {
  const gymClass = await db.gymClass.findUnique({ where: { id: classId }, include: CLASS_INCLUDE });
  return toPublicClass(gymClass, member);
}

// The member's membership on the day of the class, or null.
function findMembershipOn(db, memberId, gymClass) {
  const day = classDay(gymClass);
  return db.membership.findFirst({ where: { userId: memberId, startDate: { lte: day }, endDate: { gte: day } } });
}

// Every booking rule except the price, for free AND paid bookings: { gymClass, membership }.
// Runs inside a transaction that locks the class row, so two members can never take the last spot at
// the same moment (the second waits, then sees the class is full), and the member row, so two quick
// bookings cannot both use the last included class of the month.
async function lockAndCheck(tx, classId, member) {
  await tx.$queryRaw`SELECT id FROM "GymClass" WHERE id = ${classId} FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${member.id} FOR UPDATE`;

  const gymClass = await tx.gymClass.findUnique({ where: { id: classId }, include: { bookings: true } });
  if (!gymClass) {
    throw new AppError(404, 'Class not found');
  }
  if (gymClass.isCancelled) {
    throw new AppError(400, 'This class has been cancelled');
  }
  // Business rule: a member cannot book a class that has already started.
  if (gymClass.startsAt <= new Date()) {
    throw new AppError(400, 'This class has already started');
  }
  // Only members with a valid membership on the day of the class can book (Basic too: they pay per class).
  const membership = await findMembershipOn(tx, member.id, gymClass);
  if (!membership) {
    throw new AppError(403, 'You need a valid membership on the day of the class');
  }
  // Business rule: a member cannot book the same class twice.
  if (gymClass.bookings.some((booking) => booking.memberId === member.id)) {
    throw new AppError(409, 'You have already booked this class');
  }
  // Business rule: a class cannot be booked beyond its capacity.
  if (gymClass.bookings.length >= gymClass.capacity) {
    throw new AppError(409, 'This class is full');
  }
  return { gymClass, membership };
}

// POST /api/classes/:id/book – a member books a spot with one of the month's included classes (Premium).
export async function bookClass(classId, member) {
  return prisma.$transaction(async (tx) => {
    const { gymClass, membership } = await lockAndCheck(tx, classId, member);
    // Basic, or no classes left this month: refused with BASIC_PLAN / NO_CLASSES_LEFT – the member can pay instead.
    await assertCanUseClass(tx, membership, gymClass);

    await tx.booking.create({ data: { classId, memberId: member.id } });
    return loadPublicClass(tx, classId, member);
  });
}

// GET /api/classes/:id/booking-quote – whether booking this class is free for the member or costs money, and how much.
export async function getBookingQuote(classId, member) {
  const gymClass = await prisma.gymClass.findUnique({ where: { id: classId } });
  if (!gymClass) {
    throw new AppError(404, 'Class not found');
  }
  const membership = await findMembershipOn(prisma, member.id, gymClass);
  if (!membership) {
    return { quote: null }; // no membership that day: the class cannot be booked at all
  }
  return { quote: toPublicQuote(await quoteClass(prisma, membership, gymClass)) };
}

// POST /api/classes/:id/book-and-pay { checkoutId, card } – pays for one class by card and books the spot in one step.
// For Basic members (full price) and Premium members with no classes left this month (with a discount).
// A declined card is saved (the member and the admin can see the attempt) but books nothing.
export async function bookAndPay(classId, member, { checkoutId, card }) {
  const result = await prisma.$transaction(async (tx) => {
    // This checkout was already sent (double click, or the network retried): never charge it again.
    if (await tx.payment.findUnique({ where: { checkoutId } })) {
      throw new AppError(409, 'This payment was already sent. Check your receipts before paying again.', undefined, 'ALREADY_PROCESSED');
    }
    const { gymClass, membership } = await lockAndCheck(tx, classId, member);

    const quote = await quoteClass(tx, membership, gymClass);
    if (!quote.mustPay) {
      throw new AppError(409, 'This class is included in your membership – book it without paying.', undefined, 'PAYMENT_NOT_NEEDED');
    }

    const charge = chargeCard(card);
    const payment = {
      kind: 'CLASS',
      reference: newPaymentReference(),
      checkoutId,
      userId: member.id,
      classId,
      amount: quote.price,
      discountPercent: quote.discountPercent,
      method: 'CARD',
      cardBrand: charge.brand,
      cardLast4: charge.last4,
    };
    if (!charge.approved) {
      await tx.payment.create({ data: { ...payment, status: 'DECLINED', declineReason: charge.declineReason } });
      return { declineReason: charge.declineReason };
    }

    const paid = await tx.payment.create({ data: { ...payment, status: 'PAID' } });
    await tx.booking.create({ data: { classId, memberId: member.id, paymentId: paid.id } });
    return {
      gymClass: await loadPublicClass(tx, classId, member),
      payment: await tx.payment.findUnique({ where: { id: paid.id }, include: PAYMENT_INCLUDE }),
    };
  });

  // Thrown after the transaction, so the declined attempt stays saved. 402 = Payment Required.
  if (result.declineReason) {
    throw new AppError(402, result.declineReason, undefined, 'CARD_DECLINED');
  }
  return { class: result.gymClass, payment: toPublicPayment(result.payment) };
}

// Marks the payment of a paid booking as refunded (test gateway: nothing to send back to a real bank).
export function refundBookingPayment(db, paymentId, now = new Date()) {
  return db.payment.update({ where: { id: paymentId }, data: { status: 'REFUNDED', refundedAt: now } });
}

// DELETE /api/classes/:id/book – a member gives their spot back (before the class starts).
// A paid class is refunded. Returns { class, refunded } – refunded is the amount ("140.00") or null.
export async function cancelBooking(classId, member) {
  const booking = await prisma.booking.findUnique({
    where: { classId_memberId: { classId, memberId: member.id } },
    include: { gymClass: true, payment: true },
  });
  if (!booking) {
    throw new AppError(404, 'You have not booked this class');
  }
  if (booking.gymClass.startsAt <= new Date()) {
    throw new AppError(400, 'A booking cannot be cancelled after the class has started');
  }

  await prisma.$transaction(async (tx) => {
    if (booking.payment) await refundBookingPayment(tx, booking.payment.id);
    await tx.booking.delete({ where: { id: booking.id } });
  });
  return { class: await loadPublicClass(prisma, classId, member), refunded: booking.payment ? booking.payment.amount.toFixed(2) : null };
}

// GET /api/me/bookings – the member's upcoming booked classes, earliest first.
export async function listMyUpcomingBookings(member) {
  const classes = await prisma.gymClass.findMany({
    where: { startsAt: { gt: new Date() }, bookings: { some: { memberId: member.id } } },
    include: CLASS_INCLUDE,
    orderBy: { startsAt: 'asc' },
  });
  return classes.map((gymClass) => toPublicClass(gymClass, member));
}
