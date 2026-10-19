import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { CLASS_INCLUDE, toPublicClass } from './class.service.js';
// classDay: the calendar day of a class in the gym's time zone. A class at 00:30 on 1 November in
// Istanbul is on 1 November, even though it is still 31 October in UTC.
import { assertCanUseClass, classDay } from './classBalance.service.js';

async function loadPublicClass(db, classId, member) {
  const gymClass = await db.gymClass.findUnique({ where: { id: classId }, include: CLASS_INCLUDE });
  return toPublicClass(gymClass, member);
}

// POST /api/classes/:id/book – a member books a spot.
// Runs in a transaction that locks the class row, so two members can never take
// the last spot at the same moment (the second waits, then sees the class is full).
export async function bookClass(classId, member) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "GymClass" WHERE id = ${classId} FOR UPDATE`;
    // Also lock the member: two quick bookings of different classes cannot both use the last class of the month.
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

    // Only members with a valid membership on the day of the class can book.
    const day = classDay(gymClass);
    const validMembership = await tx.membership.findFirst({
      where: { userId: member.id, startDate: { lte: day }, endDate: { gte: day } },
    });
    if (!validMembership) {
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
    // Membership type: Basic has no classes; Premium has a number of classes per membership month.
    await assertCanUseClass(tx, validMembership, gymClass);

    await tx.booking.create({ data: { classId, memberId: member.id } });
    return loadPublicClass(tx, classId, member);
  });
}

// DELETE /api/classes/:id/book – a member gives their spot back (before the class starts).
export async function cancelBooking(classId, member) {
  const booking = await prisma.booking.findUnique({
    where: { classId_memberId: { classId, memberId: member.id } },
    include: { gymClass: true },
  });
  if (!booking) {
    throw new AppError(404, 'You have not booked this class');
  }
  if (booking.gymClass.startsAt <= new Date()) {
    throw new AppError(400, 'A booking cannot be cancelled after the class has started');
  }

  await prisma.booking.delete({ where: { id: booking.id } });
  return loadPublicClass(prisma, classId, member);
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
