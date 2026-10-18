import { prisma } from '../lib/prisma.js';
import { addDays, todayInGym } from '../utils/dates.js';

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
