import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';

let trainer;
let member;
let squat;
let bench;

const exercise = (name, muscleGroup, equipment = 'BARBELL', isActive = true) =>
  prisma.exercise.create({ data: { name, muscleGroup, equipment, description: 'How to do this exercise well.', isActive } });

// A two-day plan for `member`, written with the given exercises.
const planFor = (memberId, overrides = {}) => ({
  memberId,
  name: 'Strength – 2 days',
  notes: 'Warm up 10 minutes first.',
  days: [
    { name: 'Day A – Legs', exercises: [{ exerciseId: squat.id, sets: 4, reps: 8, targetWeightKg: 62.25, restSeconds: 120 }] },
    {
      name: 'Day B – Push',
      exercises: [
        { exerciseId: bench.id, sets: 3, reps: 10, targetWeightKg: 40, restSeconds: 90, notes: 'Slow on the way down' },
        { exerciseId: squat.id, sets: 2, reps: 12, restSeconds: 60 },
      ],
    },
  ],
  ...overrides,
});

const api = (method, path, token = trainer.token) => request(app)[method](`/api${path}`).set('Authorization', bearer(token));

beforeEach(async () => {
  await resetDatabase();
  trainer = await createUser({ role: 'TRAINER' });
  member = await createUser({ role: 'MEMBER' });
  squat = await exercise('Back squat', 'LEGS');
  bench = await exercise('Bench press', 'CHEST');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/workout-plans', () => {
  it('lets a trainer write a plan with days and exercises in order', async () => {
    const response = await api('post', '/workout-plans').send(planFor(member.user.id));

    expect(response.status).toBe(201);
    const { plan } = response.body;
    expect(plan).toMatchObject({ name: 'Strength – 2 days', isActive: true, member: { id: member.user.id }, author: { id: trainer.user.id } });
    expect(plan.days.map((d) => d.name)).toEqual(['Day A – Legs', 'Day B – Push']);
    expect(plan.days[1].exercises.map((e) => e.exercise.name)).toEqual(['Bench press', 'Back squat']);
    expect(plan.days[0].exercises[0]).toMatchObject({ sets: 4, reps: 8, targetWeightKg: 62.3, restSeconds: 120 });
    expect(plan.days[1].exercises[1].targetWeightKg).toBeNull();
  });

  it('only makes plans for members (400 for a trainer account)', async () => {
    const other = await createUser({ role: 'TRAINER' });
    expect((await api('post', '/workout-plans').send(planFor(other.user.id))).status).toBe(400);
  });

  it('only accepts active exercises from the library', async () => {
    const old = await exercise('Old exercise', 'ARMS', 'CABLE', false);
    const body = planFor(member.user.id, { days: [{ name: 'Day A', exercises: [{ exerciseId: old.id, sets: 3, reps: 10, restSeconds: 60 }] }] });

    const response = await api('post', '/workout-plans').send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/active exercise/);
  });

  it.each([
    [{ days: [] }, 'days'],
    [{ name: '' }, 'name'],
    [{ days: [{ name: 'Day A', exercises: [] }] }, 'days.0.exercises'],
    [{ days: [{ name: 'Day A', exercises: [{ exerciseId: 1, sets: 0, reps: 10, restSeconds: 60 }] }] }, 'days.0.exercises.0.sets'],
    [{ days: [{ name: 'Day A', exercises: [{ exerciseId: 1, sets: 3, reps: 10, restSeconds: 900 }] }] }, 'days.0.exercises.0.restSeconds'],
  ])('rejects invalid plans (400) – %#', async (overrides, field) => {
    const response = await api('post', '/workout-plans').send(planFor(member.user.id, overrides));

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((d) => d.field)).toContain(field);
  });

  it('does not let members write plans (403)', async () => {
    expect((await api('post', '/workout-plans', member.token).send(planFor(member.user.id))).status).toBe(403);
  });
});

describe('PUT /api/workout-plans/:id', () => {
  let planId;
  beforeEach(async () => {
    planId = (await api('post', '/workout-plans').send(planFor(member.user.id))).body.plan.id;
  });

  it('replaces the days and can switch the plan off', async () => {
    const body = planFor(member.user.id, {
      isActive: false,
      days: [{ name: 'Full body', exercises: [{ exerciseId: bench.id, sets: 5, reps: 5, targetWeightKg: 45, restSeconds: 150 }] }],
    });

    const response = await api('put', `/workout-plans/${planId}`).send(body);

    expect(response.status).toBe(200);
    expect(response.body.plan.isActive).toBe(false);
    expect(response.body.plan.days).toHaveLength(1);
    expect(await prisma.workoutPlanExercise.count()).toBe(1); // the old exercises are gone
  });

  it('lets only the author or an admin change a plan', async () => {
    const otherTrainer = await createUser({ role: 'TRAINER' });
    const admin = await createUser({ role: 'ADMIN' });

    expect((await api('put', `/workout-plans/${planId}`, otherTrainer.token).send(planFor(member.user.id))).status).toBe(403);
    expect((await api('put', `/workout-plans/${planId}`, admin.token).send(planFor(member.user.id))).status).toBe(200);
  });

  it('cannot move a plan to another member (400) and returns 404 for an unknown plan', async () => {
    const other = await createUser({ role: 'MEMBER' });

    expect((await api('put', `/workout-plans/${planId}`).send(planFor(other.user.id))).status).toBe(400);
    expect((await api('put', '/workout-plans/9999').send(planFor(member.user.id))).status).toBe(404);
  });
});

describe('reading plans', () => {
  it('shows a member only their own active plans', async () => {
    await api('post', '/workout-plans').send(planFor(member.user.id));
    await api('post', '/workout-plans').send(planFor(member.user.id, { name: 'Old plan', isActive: false }));
    const other = await createUser({ role: 'MEMBER' });
    await api('post', '/workout-plans').send(planFor(other.user.id));

    const response = await api('get', '/me/workout-plans', member.token);

    expect(response.body.plans.map((p) => p.name)).toEqual(['Strength – 2 days']);
  });

  it("hides another member's plan (404) but shows it to staff", async () => {
    const other = await createUser({ role: 'MEMBER' });
    const { id } = (await api('post', '/workout-plans').send(planFor(other.user.id))).body.plan;

    expect((await api('get', `/workout-plans/${id}`, member.token)).status).toBe(404);
    expect((await api('get', `/workout-plans/${id}`, other.token)).status).toBe(200);
    expect((await api('get', `/workout-plans/${id}`)).status).toBe(200);
  });

  it('lists the plans of one member for staff, active ones first', async () => {
    await api('post', '/workout-plans').send(planFor(member.user.id, { name: 'Old plan', isActive: false }));
    await api('post', '/workout-plans').send(planFor(member.user.id));

    const response = await api('get', `/workout-plans?memberId=${member.user.id}`);

    expect(response.body.plans.map((p) => p.name)).toEqual(['Strength – 2 days', 'Old plan']);
    expect((await api('get', '/workout-plans', member.token)).status).toBe(403);
  });
});

describe('GET /api/members', () => {
  it('gives staff a short member list to choose from, without emails', async () => {
    await createUser({ role: 'MEMBER', firstName: 'Zeynep' });

    const response = await api('get', '/members?search=zey');

    expect(response.status).toBe(200);
    expect(response.body.members).toEqual([{ id: expect.any(Number), firstName: 'Zeynep', lastName: 'MEMBER', avatar: null }]);
    expect((await api('get', '/members', member.token)).status).toBe(403);
  });
});
