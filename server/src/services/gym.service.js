import { Prisma } from '../generated/prisma/client.ts';
import { prisma } from '../lib/prisma.js';
import { addDays, formatDate, todayInGym } from '../utils/dates.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// GET /api/gym/stats – a few numbers about the gym for the home page ("13 members train with us").
// Only counts, never names, so every logged-in user may see them.
export async function getGymStats(now = new Date()) {
  const today = todayInGym(now);
  const firstOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  const [members, trainers, classesThisWeek, visitsThisMonth] = await Promise.all([
    prisma.user.count({ where: { role: 'MEMBER' } }),
    prisma.user.count({ where: { role: 'TRAINER' } }),
    prisma.gymClass.count({ where: { isCancelled: false, startsAt: { gte: now, lt: addDays(now, 7) } } }),
    prisma.checkIn.count({ where: { gymDay: { gte: firstOfMonth } } }),
  ]);

  return { members, trainers, classesThisWeek, visitsThisMonth };
}

// Paid revenue per gym-month for the last 6 months, oldest first.
// Declined and refunded payments do not count as revenue.
async function revenueByMonth(today) {
  const windowStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1));
  const payments = await prisma.payment.findMany({
    // A day of margin for the time zone; the exact gym month decides below.
    where: { status: 'PAID', createdAt: { gte: addDays(windowStart, -1) } },
    select: { amount: true, createdAt: true },
  });

  // Six buckets, newest last, so the last bar is the current month.
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    months.push({ month, label: MONTH_NAMES[d.getUTCMonth()], total: new Prisma.Decimal(0) });
  }
  const byMonth = new Map(months.map((m) => [m.month, m]));
  for (const payment of payments) {
    const bucket = byMonth.get(formatDate(todayInGym(payment.createdAt)).slice(0, 7));
    if (bucket) bucket.total = bucket.total.add(payment.amount);
  }
  return months.map(({ month, label, total }) => ({ month, label, revenue: total.toFixed(2) }));
}

// How many booked members actually came, over the classes of the last 30 days where the trainer took
// attendance. Classes where attendance was never taken are left out (nobody could be a no-show there).
async function recentAttendance(now, today) {
  const classes = await prisma.gymClass.findMany({
    where: { isCancelled: false, attendanceOpenedAt: { not: null }, startsAt: { gte: addDays(today, -30), lt: now } },
    select: { bookings: { select: { attendedAt: true } } },
  });
  let booked = 0;
  let attended = 0;
  for (const gymClass of classes) {
    booked += gymClass.bookings.length;
    attended += gymClass.bookings.filter((booking) => booking.attendedAt).length;
  }
  return {
    classes: classes.length,
    booked,
    attended,
    noShows: booked - attended,
    // null when there were no bookings yet, so the page shows "no data" instead of 0 %.
    rate: booked ? Math.round((attended / booked) * 100) : null,
  };
}

// GET /api/gym/admin-dashboard (Admin) – revenue over the last 6 months and recent class attendance.
export async function getAdminDashboard(now = new Date()) {
  const today = todayInGym(now);
  const [revenue, attendance] = await Promise.all([revenueByMonth(today), recentAttendance(now, today)]);
  return { revenueByMonth: revenue, attendance };
}
