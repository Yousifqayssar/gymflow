import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { addDays, formatDate, todayInGym } from '../utils/dates.js';

export const WEEKS_SHOWN = 8;

// Estimated one-rep maximum (Epley formula): the heaviest weight you could lift once,
// estimated from a set with more reps. 60 kg × 8 reps → 76 kg. Rounded to 0.5 kg.
export function estimatedOneRepMax(weightKg, reps) {
  if (!weightKg || reps <= 0) return 0;
  const value = reps === 1 ? weightKg : weightKg * (1 + reps / 30);
  return Math.round(value * 2) / 2;
}

// Monday of the gym week that contains `date` (a calendar date at 00:00 UTC).
export function weekStart(date) {
  const daysSinceMonday = (date.getUTCDay() + 6) % 7; // Sunday = 6
  return addDays(date, -daysSinceMonday);
}

const round = (value) => Math.round(value);

// The "score" of a set used for personal bests: the estimated maximum for weighted sets,
// the number of reps for bodyweight sets (a pull-up with more reps is better).
const scoreOf = (set) => (set.weightKg ? estimatedOneRepMax(set.weightKg, set.reps) : set.reps);

// Builds the progress overview from a member's workouts (oldest first).
export function buildProgress(logs, today = todayInGym()) {
  // ---------- per week ----------
  const thisWeek = weekStart(today);
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, i) => {
    const start = addDays(thisWeek, -7 * (WEEKS_SHOWN - 1 - i));
    return { weekStart: formatDate(start), workouts: 0, volumeKg: 0 };
  });
  const weekIndex = new Map(weeks.map((week, i) => [week.weekStart, i]));

  // ---------- per exercise ----------
  const exercises = new Map(); // exerciseId → { …, sessions: [] }
  let totalVolume = 0;
  let totalSets = 0;
  let totalSeconds = 0;
  const activeWeeks = new Set();

  for (const log of logs) {
    const gymDay = todayInGym(log.performedAt);
    const week = formatDate(weekStart(gymDay));
    activeWeeks.add(week);
    const volume = log.sets.reduce((sum, set) => sum + set.reps * (set.weightKg ?? 0), 0);
    totalVolume += volume;
    totalSets += log.sets.length;
    totalSeconds += log.durationSeconds;
    if (weekIndex.has(week)) {
      const bucket = weeks[weekIndex.get(week)];
      bucket.workouts += 1;
      bucket.volumeKg += volume;
    }

    // The best set of each exercise in this workout.
    const bestInLog = new Map();
    for (const set of log.sets) {
      const current = bestInLog.get(set.exerciseId);
      if (!current || scoreOf(set) > scoreOf(current)) bestInLog.set(set.exerciseId, set);
    }
    for (const [exerciseId, best] of bestInLog) {
      if (!exercises.has(exerciseId)) {
        exercises.set(exerciseId, { exerciseId, name: best.exercise.name, muscleGroup: best.exercise.muscleGroup, isBodyweight: !best.weightKg, sessions: [] });
      }
      exercises.get(exerciseId).sessions.push({
        date: formatDate(gymDay),
        weightKg: best.weightKg,
        reps: best.reps,
        estimatedMaxKg: best.weightKg ? estimatedOneRepMax(best.weightKg, best.reps) : null,
        score: scoreOf(best),
      });
    }
  }

  // Streak: weeks in a row (ending this week or last week) with at least one workout.
  let streakWeeks = 0;
  let cursor = activeWeeks.has(formatDate(thisWeek)) ? thisWeek : addDays(thisWeek, -7);
  while (activeWeeks.has(formatDate(cursor))) {
    streakWeeks += 1;
    cursor = addDays(cursor, -7);
  }

  const exerciseList = [...exercises.values()].map((exercise) => {
    const best = exercise.sessions.reduce((a, b) => (b.score > a.score ? b : a));
    const first = exercise.sessions[0];
    const last = exercise.sessions.at(-1);
    return {
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      isBodyweight: exercise.isBodyweight,
      sessions: exercise.sessions.map(({ score, ...session }) => session),
      personalBest: { date: best.date, weightKg: best.weightKg, reps: best.reps, estimatedMaxKg: best.estimatedMaxKg },
      // Change from the first to the latest session, in % of the first score.
      improvementPercent: first.score > 0 ? round(((last.score - first.score) / first.score) * 100) : 0,
    };
  });
  exerciseList.sort((a, b) => b.sessions.length - a.sessions.length || a.name.localeCompare(b.name));

  return {
    totals: { workouts: logs.length, sets: totalSets, volumeKg: round(totalVolume), minutes: round(totalSeconds / 60), streakWeeks },
    weeks: weeks.map((week) => ({ ...week, volumeKg: round(week.volumeKg) })),
    exercises: exerciseList,
  };
}

const LOG_INCLUDE = { sets: { include: { exercise: { select: { name: true, muscleGroup: true } } } } };

function toNumbers(logs) {
  return logs.map((log) => ({ ...log, sets: log.sets.map((set) => ({ ...set, weightKg: set.weightKg === null ? null : Number(set.weightKg) })) }));
}

// GET /api/me/progress
export async function getProgress(memberId) {
  const logs = await prisma.workoutLog.findMany({ where: { memberId }, include: LOG_INCLUDE, orderBy: { performedAt: 'asc' } });
  return buildProgress(toNumbers(logs));
}

// GET /api/members/:id/progress (Admin, Trainer)
export async function getMemberProgress(memberId) {
  const member = await prisma.user.findUnique({ where: { id: memberId } });
  if (!member || member.role !== 'MEMBER') throw new AppError(404, 'Member not found');
  return getProgress(memberId);
}

// After saving a workout: which exercises got a new personal best (better than every earlier workout)?
export async function newPersonalBests(memberId, log) {
  const earlier = await prisma.workoutSet.findMany({
    where: { log: { memberId, id: { not: log.id } }, exerciseId: { in: [...new Set(log.sets.map((s) => s.exerciseId))] } },
  });
  const bestBefore = new Map();
  for (const set of earlier) {
    const score = scoreOf({ weightKg: set.weightKg === null ? null : Number(set.weightKg), reps: set.reps });
    bestBefore.set(set.exerciseId, Math.max(bestBefore.get(set.exerciseId) ?? 0, score));
  }
  const bests = new Map();
  for (const set of log.sets) {
    const score = scoreOf(set);
    const previous = bestBefore.get(set.exerciseId);
    // Only a real improvement counts: the first time an exercise is done is not a "record".
    if (previous !== undefined && score > previous && score > (bests.get(set.exerciseId)?.score ?? 0)) {
      bests.set(set.exerciseId, { exerciseId: set.exerciseId, exerciseName: set.exerciseName, weightKg: set.weightKg, reps: set.reps, score });
    }
  }
  return [...bests.values()].map(({ score, ...best }) => ({ ...best, estimatedMaxKg: best.weightKg ? estimatedOneRepMax(best.weightKg, best.reps) : null }));
}

