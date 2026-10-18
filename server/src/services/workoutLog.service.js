import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

const HISTORY_LIMIT = 20;

// A logged workout with its summary: totals are calculated from the sets, never sent by the app.
function toPublicLog(log) {
  const sets = log.sets.map((set) => ({
    exerciseId: set.exerciseId,
    exerciseName: set.exercise.name,
    muscleGroup: set.exercise.muscleGroup,
    setNumber: set.setNumber,
    reps: set.reps,
    weightKg: set.weightKg === null ? null : Number(set.weightKg),
  }));
  return {
    id: log.id,
    dayName: log.dayName,
    planId: log.planId,
    planName: log.plan?.name ?? null,
    performedAt: log.performedAt,
    durationSeconds: log.durationSeconds,
    notes: log.notes,
    sets,
    summary: {
      exercises: new Set(sets.map((s) => s.exerciseId)).size,
      sets: sets.length,
      reps: sets.reduce((sum, s) => sum + s.reps, 0),
      // Training volume: kilos lifted in total (reps × weight), rounded to whole kilos.
      volumeKg: Math.round(sets.reduce((sum, s) => sum + s.reps * (s.weightKg ?? 0), 0)),
    },
  };
}

const LOG_INCLUDE = {
  plan: { select: { name: true } },
  sets: { orderBy: [{ id: 'asc' }], include: { exercise: { select: { name: true, muscleGroup: true } } } },
};

// POST /api/me/workouts – saves a finished workout.
// Business rules: the plan is the member's own and active, the day belongs to it,
// and only exercises of that day can be logged.
export async function logWorkout(memberId, input, now = new Date()) {
  const plan = await prisma.workoutPlan.findUnique({
    where: { id: input.planId },
    include: { days: { include: { exercises: { select: { exerciseId: true } } } } },
  });
  if (!plan || plan.memberId !== memberId) {
    throw new AppError(404, 'Workout plan not found');
  }
  if (!plan.isActive) {
    throw new AppError(400, 'This plan is no longer active');
  }
  const day = plan.days.find((d) => d.id === input.dayId);
  if (!day) {
    throw new AppError(400, 'This day is not part of the plan');
  }
  const allowed = new Set(day.exercises.map((e) => e.exerciseId));
  if (!input.sets.every((set) => allowed.has(set.exerciseId))) {
    throw new AppError(400, 'Only the exercises of this training day can be logged');
  }

  const log = await prisma.workoutLog.create({
    data: {
      memberId,
      planId: plan.id,
      dayId: day.id,
      dayName: day.name,
      performedAt: now,
      durationSeconds: input.durationSeconds,
      notes: input.notes,
      sets: {
        create: input.sets.map((set) => ({
          exerciseId: set.exerciseId,
          setNumber: set.setNumber,
          reps: set.reps,
          weightKg: set.weightKg ?? null,
        })),
      },
    },
    include: LOG_INCLUDE,
  });
  return toPublicLog(log);
}

// GET /api/me/workouts and GET /api/members/:id/workouts – the latest workouts, newest first.
export async function listWorkoutLogs(memberId) {
  const logs = await prisma.workoutLog.findMany({
    where: { memberId },
    include: LOG_INCLUDE,
    orderBy: { performedAt: 'desc' },
    take: HISTORY_LIMIT,
  });
  return logs.map(toPublicLog);
}

// For staff: only members have workout logs.
export async function listMemberWorkoutLogs(memberId) {
  const member = await prisma.user.findUnique({ where: { id: memberId } });
  if (!member || member.role !== 'MEMBER') {
    throw new AppError(404, 'Member not found');
  }
  return listWorkoutLogs(memberId);
}
