import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';

// "Now" starts at Thursday 15 October 2026, 09:00 UTC (12:00 in Istanbul).
vi.useFakeTimers({ toFake: ['Date'] });
const setNow = (iso) => vi.setSystemTime(new Date(iso));

const VALID = { heightCm: 178, weightKg: 82.4, goal: 'LOSE_WEIGHT', targetWeightKg: 75 };

let member;
const getBody = (token = member.token) => request(app).get('/api/me/body').set('Authorization', bearer(token));
const saveBody = (body, token = member.token) => request(app).post('/api/me/body').set('Authorization', bearer(token)).send(body);

// A check-in from an earlier day, written straight into the database.
const pastCheckIn = (day, weightKg = 85) =>
  prisma.bodyCheckIn.create({
    data: { memberId: member.user.id, recordedOn: parseDate(day), heightCm: 178, weightKg, goal: 'LOSE_WEIGHT' },
  });

beforeEach(async () => {
  setNow('2026-10-15T09:00:00Z');
  await resetDatabase();
  member = await createUser({ role: 'MEMBER' });
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

describe('GET /api/me/body', () => {
  it('asks a new member for their first check-in', async () => {
    const response = await getBody();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ latest: null, history: [], isDue: true, nextDueOn: '2026-10-15' });
  });

  it('is not due until 30 days after the last check-in', async () => {
    await pastCheckIn('2026-09-16'); // 29 days ago

    expect((await getBody()).body).toMatchObject({ isDue: false, nextDueOn: '2026-10-16' });

    setNow('2026-10-15T22:00:00Z'); // 16 October 01:00 in Istanbul: exactly 30 days later
    expect((await getBody()).body.isDue).toBe(true);
  });

  it('returns the history oldest first, for the chart', async () => {
    await pastCheckIn('2026-08-15', 88);
    await pastCheckIn('2026-09-15', 86);

    const { history } = (await getBody()).body;

    expect(history.map((h) => [h.recordedOn, h.weightKg])).toEqual([
      ['2026-08-15', 88],
      ['2026-09-15', 86],
    ]);
  });

  it('is only for members (403 for trainers)', async () => {
    const trainer = await createUser({ role: 'TRAINER' });
    expect((await getBody(trainer.token)).status).toBe(403);
  });
});

describe('POST /api/me/body', () => {
  it('saves the check-in and calculates the BMI', async () => {
    const response = await saveBody(VALID);

    expect(response.status).toBe(201);
    expect(response.body.latest).toMatchObject({
      recordedOn: '2026-10-15',
      heightCm: 178,
      weightKg: 82.4,
      goal: 'LOSE_WEIGHT',
      targetWeightKg: 75,
      bmi: 26, // 82.4 / 1.78² = 26.0
    });
    expect(response.body).toMatchObject({ isDue: false, nextDueOn: '2026-11-14' });
  });

  it('replaces the check-in of the same day instead of adding a second one', async () => {
    await saveBody(VALID);
    await saveBody({ ...VALID, weightKg: 81 });

    expect(await prisma.bodyCheckIn.count()).toBe(1);
    expect((await getBody()).body.latest.weightKg).toBe(81);
  });

  it('keeps every month as its own entry', async () => {
    await pastCheckIn('2026-09-10');
    await saveBody(VALID);

    expect((await getBody()).body.history).toHaveLength(2);
  });

  it('allows leaving out the target weight', async () => {
    const response = await saveBody({ heightCm: 165, weightKg: 60, goal: 'GET_FIT' });

    expect(response.status).toBe(201);
    expect(response.body.latest.targetWeightKg).toBeNull();
  });

  it('rounds to one decimal', async () => {
    const response = await saveBody({ ...VALID, weightKg: 82.46 });

    expect(response.body.latest.weightKg).toBe(82.5);
  });

  it.each([
    [{ ...VALID, heightCm: 90 }, 'heightCm'],
    [{ ...VALID, heightCm: 260 }, 'heightCm'],
    [{ ...VALID, weightKg: 20 }, 'weightKg'],
    [{ ...VALID, weightKg: '82' }, 'weightKg'],
    [{ ...VALID, goal: 'GET_RICH' }, 'goal'],
    [{ ...VALID, targetWeightKg: 500 }, 'targetWeightKg'],
  ])('rejects invalid values (400) – %o', async (body, field) => {
    const response = await saveBody(body);

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((d) => d.field)).toContain(field);
  });
});

describe('GET /api/members/:id/body', () => {
  it.each(['ADMIN', 'TRAINER'])('lets a %s see a member\'s body information', async (role) => {
    await saveBody(VALID);
    const staff = await createUser({ role });

    const response = await request(app).get(`/api/members/${member.user.id}/body`).set('Authorization', bearer(staff.token));

    expect(response.status).toBe(200);
    expect(response.body.latest).toMatchObject({ weightKg: 82.4, goal: 'LOSE_WEIGHT' });
  });

  it('is not for members, not even for other members (403)', async () => {
    const other = await createUser({ role: 'MEMBER' });

    const response = await request(app).get(`/api/members/${member.user.id}/body`).set('Authorization', bearer(other.token));

    expect(response.status).toBe(403);
  });

  it('returns 404 for staff accounts and unknown ids', async () => {
    const trainer = await createUser({ role: 'TRAINER' });
    const get = (id) => request(app).get(`/api/members/${id}/body`).set('Authorization', bearer(trainer.token));

    expect((await get(trainer.user.id)).status).toBe(404);
    expect((await get(999999)).status).toBe(404);
  });
});
