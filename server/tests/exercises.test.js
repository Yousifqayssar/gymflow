import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';

const SQUAT = {
  name: 'Back squat',
  muscleGroup: 'LEGS',
  equipment: 'BARBELL',
  description: 'Bar on the upper back, sit down between your heels and stand up again.',
};

let trainer;
let member;
const api = (method, path, token = trainer.token) => request(app)[method](`/api/exercises${path}`).set('Authorization', bearer(token));
const create = (body, token) => api('post', '', token).send(body);

beforeEach(async () => {
  await resetDatabase();
  trainer = await createUser({ role: 'TRAINER' });
  member = await createUser({ role: 'MEMBER' });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('exercise library', () => {
  it.each(['TRAINER', 'ADMIN'])('lets a %s add an exercise that members can then see', async (role) => {
    const { token } = await createUser({ role });

    const created = await create(SQUAT, token);

    expect(created.status).toBe(201);
    expect(created.body.exercise).toMatchObject({ ...SQUAT, isActive: true });
    expect((await api('get', '', member.token)).body.exercises.map((e) => e.name)).toEqual(['Back squat']);
  });

  it('does not let members add exercises (403)', async () => {
    expect((await create(SQUAT, member.token)).status).toBe(403);
  });

  it('sorts by muscle group, then name, and filters by muscle group and search text', async () => {
    await create(SQUAT);
    await create({ ...SQUAT, name: 'Leg press', equipment: 'MACHINE' });
    await create({ ...SQUAT, name: 'Bench press', muscleGroup: 'CHEST' });

    expect((await api('get', '')).body.exercises.map((e) => e.name)).toEqual(['Bench press', 'Back squat', 'Leg press']);
    expect((await api('get', '?muscleGroup=LEGS')).body.exercises).toHaveLength(2);
    expect((await api('get', '?search=PRESS')).body.exercises.map((e) => e.name)).toEqual(['Bench press', 'Leg press']);
  });

  it('hides deactivated exercises – staff can still list them for managing', async () => {
    const { id } = (await create(SQUAT)).body.exercise;
    await api('put', `/${id}`).send({ ...SQUAT, isActive: false });

    expect((await api('get', '', member.token)).body.exercises).toEqual([]);
    expect((await api('get', '?includeInactive=true', member.token)).body.exercises).toEqual([]);
    expect((await api('get', '?includeInactive=true')).body.exercises).toHaveLength(1);
  });

  it('lets staff edit an exercise', async () => {
    const { id } = (await create(SQUAT)).body.exercise;

    const response = await api('put', `/${id}`).send({ ...SQUAT, name: 'Barbell back squat' });

    expect(response.status).toBe(200);
    expect(response.body.exercise.name).toBe('Barbell back squat');
  });

  it('does not allow two exercises with the same name (409)', async () => {
    await create(SQUAT);
    expect((await create(SQUAT)).status).toBe(409);
  });

  it.each([
    [{ ...SQUAT, name: 'X' }, 'name'],
    [{ ...SQUAT, muscleGroup: 'NECK' }, 'muscleGroup'],
    [{ ...SQUAT, equipment: 'ROCKS' }, 'equipment'],
    [{ ...SQUAT, description: 'Squat.' }, 'description'],
  ])('rejects invalid data (400) – %#', async (body, field) => {
    const response = await create(body);

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((d) => d.field)).toContain(field);
  });

  it('rejects an unknown muscle group filter (400) and an unknown exercise (404)', async () => {
    expect((await api('get', '?muscleGroup=NECK')).status).toBe(400);
    expect((await api('put', '/9999').send(SQUAT)).status).toBe(404);
  });

  it('needs a login (401)', async () => {
    expect((await request(app).get('/api/exercises')).status).toBe(401);
  });
});
