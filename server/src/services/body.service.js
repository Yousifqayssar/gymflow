import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { addDays, formatDate, todayInGym } from '../utils/dates.js';

// Members should update their body information every month.
export const CHECK_IN_INTERVAL_DAYS = 30;
// The chart shows about the last year of monthly check-ins.
const HISTORY_LIMIT = 12;

// Body Mass Index: weight (kg) / height (m)², with one decimal.
export function bmi(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function toPublicBodyCheckIn(entry) {
  const heightCm = Number(entry.heightCm);
  const weightKg = Number(entry.weightKg);
  return {
    id: entry.id,
    recordedOn: formatDate(entry.recordedOn),
    heightCm,
    weightKg,
    goal: entry.goal,
    targetWeightKg: entry.targetWeightKg === null ? null : Number(entry.targetWeightKg),
    bmi: bmi(weightKg, heightCm),
  };
}

// The member's latest body information, their history (oldest first, for the chart)
// and whether the monthly update is due.
async function bodyOverview(memberId, today) {
  const entries = await prisma.bodyCheckIn.findMany({
    where: { memberId },
    orderBy: { recordedOn: 'desc' },
    take: HISTORY_LIMIT,
  });
  const latest = entries[0] ?? null;
  const nextDueOn = latest ? addDays(latest.recordedOn, CHECK_IN_INTERVAL_DAYS) : today;

  return {
    latest: latest ? toPublicBodyCheckIn(latest) : null,
    history: entries.map(toPublicBodyCheckIn).reverse(),
    // Business rule: due when there is no check-in yet, or the last one is 30 days old or older.
    isDue: nextDueOn <= today,
    nextDueOn: formatDate(nextDueOn),
  };
}

// GET /api/me/body
export function getMyBody(memberId) {
  return bodyOverview(memberId, todayInGym());
}

// POST /api/me/body – saves today's check-in. A second update on the same day replaces the first.
export async function recordMyBody(memberId, input) {
  const today = todayInGym();
  const data = {
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    goal: input.goal,
    targetWeightKg: input.targetWeightKg ?? null,
  };
  await prisma.bodyCheckIn.upsert({
    where: { memberId_recordedOn: { memberId, recordedOn: today } },
    create: { memberId, recordedOn: today, ...data },
    update: data,
  });
  return bodyOverview(memberId, today);
}

// GET /api/members/:id/body (Admin, Trainer) – trainers use it to plan workouts.
export async function getMemberBody(memberId) {
  const member = await prisma.user.findUnique({ where: { id: memberId } });
  if (!member || member.role !== 'MEMBER') {
    throw new AppError(404, 'Member not found');
  }
  return bodyOverview(memberId, todayInGym());
}
