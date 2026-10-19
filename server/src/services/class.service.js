import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { isNoShow, OPENS_BEFORE_START_MS } from './attendance.service.js';

const MS_PER_MINUTE = 60 * 1000;
// Without a date range, the schedule shows the next 14 days.
const DEFAULT_RANGE_DAYS = 14;

// What every class query loads: the trainer's name and the bookings (who, and whether they came).
export const CLASS_INCLUDE = {
  trainer: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  bookings: { select: { memberId: true, attendedAt: true } },
};

const hasStarted = (gymClass, now) => gymClass.startsAt <= now;

// A class as sent to clients. `viewer` is the logged-in user (to show "booked by me").
export function toPublicClass(gymClass, viewer, now = new Date()) {
  const bookedCount = gymClass.bookings.length;
  const myBooking = gymClass.bookings.find((booking) => booking.memberId === viewer.id);
  return {
    id: gymClass.id,
    title: gymClass.title,
    category: gymClass.category,
    description: gymClass.description,
    location: gymClass.location,
    startsAt: gymClass.startsAt.toISOString(),
    endsAt: new Date(gymClass.startsAt.getTime() + gymClass.durationMinutes * MS_PER_MINUTE).toISOString(),
    durationMinutes: gymClass.durationMinutes,
    capacity: gymClass.capacity,
    bookedCount,
    spotsLeft: Math.max(0, gymClass.capacity - bookedCount),
    level: gymClass.level,
    intensity: gymClass.intensity,
    whatToBring: gymClass.whatToBring,
    healthNotes: gymClass.healthNotes,
    isCancelled: gymClass.isCancelled,
    hasStarted: hasStarted(gymClass, now),
    isBookedByMe: Boolean(myBooking),
    // For the member who booked: ATTENDED (scanned the QR), MISSED (no-show, −10 points) or null (not decided yet).
    myAttendance: myBooking ? (myBooking.attendedAt ? 'ATTENDED' : isNoShow(myBooking, gymClass, now) ? 'MISSED' : null) : null,
    // From this moment members can scan the trainer's attendance QR.
    attendanceOpensAt: new Date(gymClass.startsAt.getTime() - OPENS_BEFORE_START_MS).toISOString(),
    trainer: gymClass.trainer,
  };
}

// The schedule: classes in a date range (default: from now for 14 days), earliest first.
export async function listClasses({ category, trainerId, from, to }, viewer) {
  const now = new Date();
  const start = from ?? now;
  const end = to ?? new Date(start.getTime() + DEFAULT_RANGE_DAYS * 24 * 60 * MS_PER_MINUTE);

  const classes = await prisma.gymClass.findMany({
    where: {
      startsAt: { gte: start, lt: end },
      ...(category ? { category } : {}),
      ...(trainerId ? { trainerId } : {}),
    },
    include: CLASS_INCLUDE,
    orderBy: { startsAt: 'asc' },
  });

  return classes.map((gymClass) => toPublicClass(gymClass, viewer, now));
}

// One class. The Admin and the class's own trainer also see who booked (privacy for everyone else).
export async function getClass(id, viewer) {
  const gymClass = await prisma.gymClass.findUnique({
    where: { id },
    include: {
      ...CLASS_INCLUDE,
      bookings: {
        select: {
          memberId: true,
          createdAt: true,
          attendedAt: true,
          attendanceMethod: true,
          member: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!gymClass) {
    throw new AppError(404, 'Class not found');
  }

  const result = toPublicClass(gymClass, viewer);
  if (canManage(gymClass, viewer)) {
    result.attendanceTaken = Boolean(gymClass.attendanceOpenedAt);
    result.attendees = gymClass.bookings.map((booking) => ({
      ...booking.member,
      bookedAt: booking.createdAt,
      attendedAt: booking.attendedAt,
      attendanceMethod: booking.attendanceMethod,
    }));
  }
  return result;
}

// POST /api/classes. Trainers always create classes for themselves; admins choose the trainer.
export async function createClass(input, actor) {
  const trainerId = actor.role === 'TRAINER' ? actor.id : input.trainerId;
  if (!trainerId) {
    throw new AppError(400, 'Validation failed', [{ field: 'trainerId', message: 'Choose a trainer' }]);
  }
  await assertIsTrainer(trainerId);
  assertInFuture(input.startsAt);

  const gymClass = await prisma.gymClass.create({
    data: { ...input, trainerId },
    include: CLASS_INCLUDE,
  });
  return toPublicClass(gymClass, actor);
}

// PATCH /api/classes/:id
export async function updateClass(id, changes, actor) {
  const gymClass = await findManageableClass(id, actor);
  assertEditable(gymClass);

  const data = { ...changes };
  if (actor.role === 'TRAINER') {
    delete data.trainerId; // trainers cannot hand their class to someone else
  } else if (data.trainerId !== undefined) {
    await assertIsTrainer(data.trainerId);
  }
  if (data.startsAt) {
    assertInFuture(data.startsAt);
  }
  // Members who already booked keep their spot.
  if (data.capacity !== undefined && data.capacity < gymClass.bookings.length) {
    throw new AppError(400, `Capacity cannot be lower than the ${gymClass.bookings.length} bookings already made`);
  }

  const updated = await prisma.gymClass.update({ where: { id }, data, include: CLASS_INCLUDE });
  return toPublicClass(updated, actor);
}

// POST /api/classes/:id/cancel. Cancelled classes stay visible, so booked members see what happened.
export async function cancelClass(id, actor) {
  const gymClass = await findManageableClass(id, actor);
  if (hasStarted(gymClass, new Date())) {
    throw new AppError(400, 'A class that has already started cannot be cancelled');
  }

  const updated = await prisma.gymClass.update({ where: { id }, data: { isCancelled: true }, include: CLASS_INCLUDE });
  return toPublicClass(updated, actor);
}

// ---------- helpers ----------

function canManage(gymClass, user) {
  return user.role === 'ADMIN' || (user.role === 'TRAINER' && gymClass.trainerId === user.id);
}

async function findManageableClass(id, actor) {
  const gymClass = await prisma.gymClass.findUnique({ where: { id }, include: CLASS_INCLUDE });
  if (!gymClass) {
    throw new AppError(404, 'Class not found');
  }
  if (!canManage(gymClass, actor)) {
    throw new AppError(403, 'You can only manage your own classes');
  }
  return gymClass;
}

function assertEditable(gymClass) {
  if (gymClass.isCancelled) {
    throw new AppError(400, 'A cancelled class cannot be changed');
  }
  if (hasStarted(gymClass, new Date())) {
    throw new AppError(400, 'A class that has already started cannot be changed');
  }
}

function assertInFuture(startsAt) {
  if (startsAt <= new Date()) {
    throw new AppError(400, 'Validation failed', [{ field: 'startsAt', message: 'The class must start in the future' }]);
  }
}

async function assertIsTrainer(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'TRAINER') {
    throw new AppError(400, 'Validation failed', [{ field: 'trainerId', message: 'Choose a trainer' }]);
  }
}
