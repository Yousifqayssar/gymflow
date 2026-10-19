import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { pointsSummary } from './points.js';

// Class attendance: the trainer shows a QR code, members who booked scan it with their phone.
// Booked but not scanned when the class is over = no-show = −10 loyalty points (see points.js).

const MS_PER_MINUTE = 60 * 1000;
// The QR changes every 30 seconds, so a photo sent to a friend at home is useless.
export const CODE_LIFETIME_MS = 30 * 1000;
// Members can check in from 15 minutes before the class until it ends.
export const OPENS_BEFORE_START_MS = 15 * MS_PER_MINUTE;

const endsAt = (gymClass) => new Date(gymClass.startsAt.getTime() + gymClass.durationMinutes * MS_PER_MINUTE);
const opensAt = (gymClass) => new Date(gymClass.startsAt.getTime() - OPENS_BEFORE_START_MS);
const isOpen = (gymClass, now) => !gymClass.isCancelled && now >= opensAt(gymClass) && now <= endsAt(gymClass);

// ---------- the changing QR code ----------

// A short signature of (class, 30-second window), made with the server's secret: it cannot be guessed
// or made up, and nothing needs to be stored. "attendance:" keeps it apart from the login tokens.
function codeFor(classId, window) {
  return crypto.createHmac('sha256', env.JWT_SECRET).update(`attendance:${classId}:${window}`).digest('base64url').slice(0, 12);
}

const windowAt = (time) => Math.floor(time.getTime() / CODE_LIFETIME_MS);

export function currentCode(classId, now = new Date()) {
  const window = windowAt(now);
  return { code: codeFor(classId, window), expiresAt: new Date((window + 1) * CODE_LIFETIME_MS) };
}

// The current code and the one just before it are accepted (a scan right when the QR changes still works).
export function isValidCode(classId, code, now = new Date()) {
  const window = windowAt(now);
  return [window, window - 1].some((w) => {
    const expected = Buffer.from(codeFor(classId, w));
    const given = Buffer.from(String(code));
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}

// ---------- no-shows and points ----------

// A booking is a no-show when the class is over, was not cancelled, attendance was taken,
// and the member was never marked present.
export function isNoShow(booking, gymClass, now = new Date()) {
  return !booking.attendedAt && !gymClass.isCancelled && Boolean(gymClass.attendanceOpenedAt) && endsAt(gymClass) < now;
}

// The member's missed classes, newest first: [{ classId, title, startsAt }]
export async function listNoShows(db, memberId, now = new Date()) {
  const bookings = await db.booking.findMany({
    where: { memberId, attendedAt: null, gymClass: { isCancelled: false, attendanceOpenedAt: { not: null }, startsAt: { lt: now } } },
    include: { gymClass: { select: { id: true, title: true, startsAt: true, durationMinutes: true, isCancelled: true, attendanceOpenedAt: true } } },
    orderBy: { gymClass: { startsAt: 'desc' } },
  });
  return bookings
    .filter((booking) => isNoShow(booking, booking.gymClass, now))
    .map(({ gymClass }) => ({ classId: gymClass.id, title: gymClass.title, startsAt: gymClass.startsAt.toISOString() }));
}

// Points, level and discount of a member: visits earn points, no-shows cost points.
// The one place every feature (check-in, rewards, membership discount) gets points from.
export async function memberPoints(db, memberId, now = new Date()) {
  const [visits, noShows] = await Promise.all([db.checkIn.count({ where: { memberId } }), listNoShows(db, memberId, now)]);
  return { ...pointsSummary(visits, noShows.length), missedClasses: noShows };
}

// ---------- trainer: the attendance screen ----------

async function findClassForStaff(classId, actor) {
  const gymClass = await prisma.gymClass.findUnique({ where: { id: classId } });
  if (!gymClass) {
    throw new AppError(404, 'Class not found');
  }
  if (actor.role !== 'ADMIN' && gymClass.trainerId !== actor.id) {
    throw new AppError(403, 'You can only take attendance for your own classes');
  }
  return gymClass;
}

function toAttendee(booking) {
  return {
    ...booking.member,
    bookedAt: booking.createdAt,
    attendedAt: booking.attendedAt,
    attendanceMethod: booking.attendanceMethod,
  };
}

// GET /api/classes/:id/attendance (Admin, the class's trainer)
// The booked members with who is present, and – while check-in is open – the current QR code.
// Opening this screen during the class is what "takes attendance": from then on, no-shows count.
export async function getAttendance(classId, actor, now = new Date()) {
  let gymClass = await findClassForStaff(classId, actor);
  const open = isOpen(gymClass, now);
  if (open && !gymClass.attendanceOpenedAt) {
    gymClass = await prisma.gymClass.update({ where: { id: classId }, data: { attendanceOpenedAt: now } });
  }

  const bookings = await prisma.booking.findMany({
    where: { classId },
    include: { member: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    orderBy: [{ member: { firstName: 'asc' } }, { member: { lastName: 'asc' } }],
  });

  return {
    classId,
    // The server's clock: the trainer's screen uses it so the countdown matches even if the device clock is off.
    serverTime: now.toISOString(),
    isOpen: open,
    opensAt: opensAt(gymClass).toISOString(),
    closesAt: endsAt(gymClass).toISOString(),
    attendanceTaken: Boolean(gymClass.attendanceOpenedAt),
    // The page puts the code in a link: scanning with any phone camera opens GymFlow's check-in page.
    qr: open ? { ...currentCode(classId, now), path: `/attend/${classId}` } : null,
    attendees: bookings.map(toAttendee),
    presentCount: bookings.filter((b) => b.attendedAt).length,
  };
}

// PUT /api/classes/:id/attendance/:memberId { present } (Admin, the class's trainer)
// Backup for a member whose phone is dead – or to correct a mistake. Also counts as taking attendance.
export async function markAttendance(classId, memberId, present, actor, now = new Date()) {
  const gymClass = await findClassForStaff(classId, actor);
  if (gymClass.isCancelled) {
    throw new AppError(400, 'This class has been cancelled');
  }
  if (now < opensAt(gymClass)) {
    throw new AppError(400, 'Attendance opens 15 minutes before the class starts');
  }

  const booking = await prisma.booking.findUnique({ where: { classId_memberId: { classId, memberId } } });
  if (!booking) {
    throw new AppError(404, 'This member has not booked the class');
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: present ? { attendedAt: booking.attendedAt ?? now, attendanceMethod: booking.attendanceMethod ?? 'TRAINER' } : { attendedAt: null, attendanceMethod: null },
    }),
    ...(gymClass.attendanceOpenedAt ? [] : [prisma.gymClass.update({ where: { id: classId }, data: { attendanceOpenedAt: now } })]),
  ]);
  return getAttendance(classId, actor, now);
}

// ---------- member: scanning the QR ----------

// POST /api/classes/:id/attend { code } (Member)
export async function attendClass(classId, code, member, now = new Date()) {
  const gymClass = await prisma.gymClass.findUnique({ where: { id: classId } });
  if (!gymClass) {
    throw new AppError(404, 'Class not found');
  }
  if (gymClass.isCancelled) {
    throw new AppError(400, 'This class has been cancelled', undefined, 'CLASS_CANCELLED');
  }
  if (now < opensAt(gymClass)) {
    throw new AppError(400, 'Check-in opens 15 minutes before the class starts', undefined, 'TOO_EARLY');
  }
  if (now > endsAt(gymClass)) {
    throw new AppError(400, 'This class has already ended', undefined, 'CLASS_ENDED');
  }
  if (!isValidCode(classId, code, now)) {
    throw new AppError(400, 'This QR code has expired. Scan the trainer’s screen again.', undefined, 'INVALID_CODE');
  }

  const booking = await prisma.booking.findUnique({ where: { classId_memberId: { classId, memberId: member.id } } });
  if (!booking) {
    throw new AppError(403, 'You have not booked this class, so you cannot check in to it', undefined, 'NOT_BOOKED');
  }

  const alreadyAttended = Boolean(booking.attendedAt);
  const updated = alreadyAttended
    ? booking
    : await prisma.booking.update({ where: { id: booking.id }, data: { attendedAt: now, attendanceMethod: 'QR' } });

  return {
    alreadyAttended,
    attendedAt: updated.attendedAt,
    gymClass: { id: gymClass.id, title: gymClass.title, startsAt: gymClass.startsAt.toISOString(), location: gymClass.location },
  };
}
