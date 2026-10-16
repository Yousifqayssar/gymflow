import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';

// "Today" is 2026-10-15 in Istanbul.
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));

let plan;

beforeEach(async () => {
  await resetDatabase();
  plan = await createPlan({ name: 'Monthly' });
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

const addMembership = (userId, start, end) =>
  prisma.membership.create({
    data: { userId, planId: plan.id, startDate: parseDate(start), endDate: parseDate(end), price: 1000 },
  });

const getMine = (token) => request(app).get('/api/me/membership').set('Authorization', bearer(token));

describe('GET /api/me/membership', () => {
  it('returns the logged-in member’s current membership and history', async () => {
    const { user, token } = await createUser({ role: 'MEMBER' });
    await addMembership(user.id, '2026-08-01', '2026-08-31');
    await addMembership(user.id, '2026-10-01', '2026-10-31');

    const response = await getMine(token);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ACTIVE');
    expect(response.body.currentMembership).toMatchObject({
      plan: { name: 'Monthly' },
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      daysRemaining: 17,
    });
    expect(response.body.memberships).toHaveLength(2);
  });

  it('only ever shows the member’s own memberships', async () => {
    const me = await createUser({ role: 'MEMBER' });
    const someoneElse = await createUser({ role: 'MEMBER' });
    await addMembership(someoneElse.user.id, '2026-10-01', '2026-10-31');

    const response = await getMine(me.token);

    expect(response.body.status).toBe('NONE');
    expect(response.body.currentMembership).toBeNull();
    expect(response.body.memberships).toEqual([]);
  });

  it('does not include account details such as the password hash', async () => {
    const { token } = await createUser({ role: 'MEMBER' });

    const response = await getMine(token);

    expect(response.body).not.toHaveProperty('user');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('requires login (401)', async () => {
    const response = await request(app).get('/api/me/membership');

    expect(response.status).toBe(401);
  });

  it('is only for members; admins and trainers get 403', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const trainer = await createUser({ role: 'TRAINER' });

    expect((await getMine(admin.token)).status).toBe(403);
    expect((await getMine(trainer.token)).status).toBe(403);
  });
});
