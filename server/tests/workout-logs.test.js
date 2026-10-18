import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';

let trainer;
let member;
let plan; // { id, days: [{ id, exercises: [...] }] }
let squat;
let bench;
let row;

const exercise = (name, muscleGroup) =>
  prisma.exercise.create({ data: { name, muscleGroup, equipment: 'BARBELL', description: 'How to do this exercise well.' } });

const api = (method, path, token = member.token) => request(app)[method](`/api${path}`).set('Authorization', bearer(token));

// A finished "Day A" with two sets of squats and one set of bench press.
const workout = (overrides = {}) => ({
  planId: plan.id,
  dayId: plan.days[0].id,
  durationSeconds: 2700,
  notes: 'Felt strong',
  sets: [
    { exerciseId: squat.id, setNumber: 1, reps: 8, weightKg: 60 },
    { exerciseId: squat.id, setNumber: 2, reps: 6, weightKg: 62.46 },
    { exerciseId: bench.id, setNumber: 1, reps: 10, weightKg: null },
  ],
  ...overrides,
});

beforeEach(async () => {
  await resetDatabase();
  trainer = await createUser({ role: 'TRAINER' });
  member = await createUser({ role: 'MEMBER' });
  squat = await exercise('Back squat', 'LEGS');
  bench = await exercise('Bench press', 'CHEST');
  row = await exercise('Seated cable row', 'BACK');
  const created = await request(app)
    .post('/api/workout-plans')
    .set('Authorization', bearer(trainer.token))
    .send({
      memberId: member.user.id,
      name: 'Plan',
      days: [
        { name: 'Day A', exercises: [{ exerciseId: squat.id, sets: 3, reps: 8, restSeconds: 90 }, { exerciseId: bench.id, sets: 3, reps: 10, restSeconds: 90 }] },
        { name: 'Day B', exercises: [{ exerciseId: row.id, sets: 3, reps: 10, restSeconds: 90 }] },
      ],
    });
  plan = created.body.plan;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/me/workouts', () => {
  it('saves the workout and calculates the summary itself', async () => {
    const response = await api('post', '/me/workouts').send(workout());

    expect(response.status).toBe(201);
    expect(response.body.workout).toMatchObject({
      dayName: 'Day A',
      planName: 'Plan',
      durationSeconds: 2700,
      notes: 'Felt strong',
      // volume: 8 × 60 + 6 × 62.5 + 10 × 0 = 855 kg
      summary: { exercises: 2, sets: 3, reps: 24, volumeKg: 855 },
    });
    expect(response.body.workout.sets[1]).toMatchObject({ exerciseName: 'Back squat', reps: 6, weightKg: 62.5 });
  });

  it('keeps the history when the trainer rebuilds the plan', async () => {
    await api('post', '/me/workouts').send(workout());
    await prisma.workoutDay.deleteMany({ where: { planId: plan.id } }); // what a plan update does

    const { workouts } = (await api('get', '/me/workouts')).body;

    expect(workouts).toHaveLength(1);
    expect(workouts[0]).toMatchObject({ dayName: 'Day A', summary: { sets: 3 } });
  });

  it("only logs exercises of the chosen day (bench press is not on day B)", async () => {
    const response = await api('post', '/me/workouts').send(workout({ dayId: plan.days[1].id }));

    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/exercises of this training day/);
  });

  it("does not log on another member's plan (404) or an inactive plan (400)", async () => {
    const other = await createUser({ role: 'MEMBER' });
    expect((await api('post', '/me/workouts', other.token).send(workout())).status).toBe(404);

    await prisma.workoutPlan.update({ where: { id: plan.id }, data: { isActive: false } });
    expect((await api('post', '/me/workouts').send(workout())).status).toBe(400);
  });

  it('rejects a day of another plan (400)', async () => {
    const otherPlan = await prisma.workoutPlan.create({
      data: { memberId: member.user.id, name: 'Other', days: { create: [{ name: 'X', position: 0 }] } },
      include: { days: true },
    });

    expect((await api('post', '/me/workouts').send(workout({ dayId: otherPlan.days[0].id }))).status).toBe(400);
  });

  it.each([
    [{ sets: [] }, 'sets'],
    [{ durationSeconds: -5 }, 'durationSeconds'],
    [{ sets: [{ exerciseId: 1, setNumber: 1, reps: 500, weightKg: 10 }] }, 'sets.0.reps'],
  ])('rejects invalid workouts (400) – %#', async (overrides, field) => {
    const response = await api('post', '/me/workouts').send(workout(overrides));

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((d) => d.field)).toContain(field);
  });

  it('is only for members (403 for trainers)', async () => {
    expect((await api('post', '/me/workouts', trainer.token).send(workout())).status).toBe(403);
  });
});

describe('workout history', () => {
  it('lists the newest workout first', async () => {
    await api('post', '/me/workouts').send(workout({ notes: 'first' }));
    await api('post', '/me/workouts').send(workout({ notes: 'second' }));

    const { workouts } = (await api('get', '/me/workouts')).body;

    expect(workouts.map((w) => w.notes)).toEqual(['second', 'first']);
  });

  it('lets staff see a member\'s workouts, but not members', async () => {
    await api('post', '/me/workouts').send(workout());

    expect((await api('get', `/members/${member.user.id}/workouts`, trainer.token)).body.workouts).toHaveLength(1);
    expect((await api('get', `/members/${member.user.id}/workouts`)).status).toBe(403);
    expect((await api('get', `/members/${trainer.user.id}/workouts`, trainer.token)).status).toBe(404);
  });
});
