import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';

let trainer;
let member;
let plan;
let bench;

const api = (method, path, token = member.token) => request(app)[method](`/api${path}`).set('Authorization', bearer(token));
const doWorkout = (weightKg, reps) =>
  api('post', '/me/workouts').send({
    planId: plan.id,
    dayId: plan.days[0].id,
    durationSeconds: 1800,
    sets: [{ exerciseId: bench.id, setNumber: 1, reps, weightKg }],
  });

beforeEach(async () => {
  await resetDatabase();
  trainer = await createUser({ role: 'TRAINER' });
  member = await createUser({ role: 'MEMBER' });
  bench = await prisma.exercise.create({ data: { name: 'Bench press', muscleGroup: 'CHEST', equipment: 'BARBELL', description: 'Press the bar up from your chest.' } });
  plan = (
    await api('post', '/workout-plans', trainer.token).send({
      memberId: member.user.id,
      name: 'Plan',
      days: [{ name: 'Day A', exercises: [{ exerciseId: bench.id, sets: 3, reps: 8, restSeconds: 90 }] }],
    })
  ).body.plan;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('personal bests after a workout', () => {
  it('is not a record the first time, but is when a later workout is better', async () => {
    const first = await doWorkout(50, 8);
    expect(first.body.workout.personalBests).toEqual([]);

    const weaker = await doWorkout(45, 8);
    expect(weaker.body.workout.personalBests).toEqual([]);

    const better = await doWorkout(55, 8);
    expect(better.body.workout.personalBests).toEqual([
      { exerciseId: bench.id, exerciseName: 'Bench press', weightKg: 55, reps: 8, estimatedMaxKg: 69.5 },
    ]);
  });
});

describe('GET /api/me/progress', () => {
  it('returns totals, weeks and the progress per exercise', async () => {
    await doWorkout(50, 8);
    await doWorkout(55, 8);

    const response = await api('get', '/me/progress');

    expect(response.status).toBe(200);
    expect(response.body.totals).toMatchObject({ workouts: 2, sets: 2, volumeKg: 840, minutes: 60, streakWeeks: 1 });
    expect(response.body.weeks).toHaveLength(8);
    expect(response.body.exercises[0]).toMatchObject({ name: 'Bench press', personalBest: { weightKg: 55, reps: 8 }, improvementPercent: 9 });
  });

  it('is empty for a new member', async () => {
    expect((await api('get', '/me/progress')).body).toMatchObject({ totals: { workouts: 0 }, exercises: [] });
  });
});

describe('GET /api/members/:id/progress', () => {
  it('lets staff see the progress of a member, but not other members', async () => {
    await doWorkout(50, 8);
    const other = await createUser({ role: 'MEMBER' });

    expect((await api('get', `/members/${member.user.id}/progress`, trainer.token)).body.totals.workouts).toBe(1);
    expect((await api('get', `/members/${member.user.id}/progress`, other.token)).status).toBe(403);
    expect((await api('get', `/members/${trainer.user.id}/progress`, trainer.token)).status).toBe(404);
  });
});
