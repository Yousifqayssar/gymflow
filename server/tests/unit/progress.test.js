import { describe, expect, it } from 'vitest';
import { buildProgress, estimatedOneRepMax, weekStart } from '../../src/services/progress.service.js';
import { formatDate, parseDate } from '../../src/utils/dates.js';

const BENCH = { exerciseId: 1, exercise: { name: 'Bench press', muscleGroup: 'CHEST' } };
const PULLUP = { exerciseId: 2, exercise: { name: 'Pull-up', muscleGroup: 'BACK' } };

// A workout on a date (17:00 UTC = 20:00 in Istanbul, the same calendar day).
const log = (date, sets, durationSeconds = 3600) => ({ performedAt: new Date(`${date}T17:00:00Z`), durationSeconds, sets });
const set = (exercise, reps, weightKg) => ({ ...exercise, reps, weightKg });

describe('estimatedOneRepMax (Epley)', () => {
  it('estimates the one-rep maximum from a set, rounded to 0.5 kg', () => {
    expect(estimatedOneRepMax(60, 8)).toBe(76); // 60 × (1 + 8/30) = 76
    expect(estimatedOneRepMax(100, 5)).toBe(116.5); // 116.67 → 116.5
  });

  it('is the weight itself for a single rep, and 0 without weight', () => {
    expect(estimatedOneRepMax(120, 1)).toBe(120);
    expect(estimatedOneRepMax(null, 10)).toBe(0);
  });
});

describe('weekStart', () => {
  it('returns the Monday of the week', () => {
    expect(formatDate(weekStart(parseDate('2026-10-15')))).toBe('2026-10-12'); // Thursday → Monday
    expect(formatDate(weekStart(parseDate('2026-10-18')))).toBe('2026-10-12'); // Sunday → same week
    expect(formatDate(weekStart(parseDate('2026-10-12')))).toBe('2026-10-12');
  });
});

describe('buildProgress', () => {
  const today = parseDate('2026-10-15');
  const logs = [
    log('2026-09-28', [set(BENCH, 8, 50), set(BENCH, 6, 52.5), set(PULLUP, 5, null)]),
    log('2026-10-05', [set(BENCH, 8, 55), set(PULLUP, 7, null)]),
    log('2026-10-13', [set(BENCH, 5, 60), set(PULLUP, 6, null)], 1800),
  ];
  const progress = buildProgress(logs, today);

  it('adds up the totals', () => {
    // volume: 400 + 315 + 440 + 300 = 1455 kg
    expect(progress.totals).toEqual({ workouts: 3, sets: 7, volumeKg: 1455, minutes: 150, streakWeeks: 3 });
  });

  it('shows the last 8 weeks, also the weeks without a workout', () => {
    expect(progress.weeks).toHaveLength(8);
    expect(progress.weeks.at(-1)).toEqual({ weekStart: '2026-10-12', workouts: 1, volumeKg: 300 });
    expect(progress.weeks.at(-4)).toEqual({ weekStart: '2026-09-21', workouts: 0, volumeKg: 0 });
  });

  it('keeps the best set of each workout per exercise and finds the personal best', () => {
    const bench = progress.exercises.find((e) => e.name === 'Bench press');

    expect(bench.sessions.map((s) => s.estimatedMaxKg)).toEqual([63.5, 69.5, 70]);
    expect(bench.personalBest).toEqual({ date: '2026-10-13', weightKg: 60, reps: 5, estimatedMaxKg: 70 });
    expect(bench.improvementPercent).toBe(10); // 63.5 → 70
  });

  it('uses reps instead of weight for bodyweight exercises', () => {
    const pullUp = progress.exercises.find((e) => e.name === 'Pull-up');

    expect(pullUp).toMatchObject({ isBodyweight: true, personalBest: { reps: 7, weightKg: null } });
  });

  it('breaks the streak after a week without training', () => {
    const withGap = buildProgress([log('2026-09-21', [set(BENCH, 5, 50)]), log('2026-10-13', [set(BENCH, 5, 50)])], today);
    expect(withGap.totals.streakWeeks).toBe(1);
  });

  it('works for a member without any workout', () => {
    expect(buildProgress([], today)).toMatchObject({ totals: { workouts: 0, streakWeeks: 0 }, exercises: [] });
  });
});
