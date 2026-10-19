import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';

vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));

let member;
let staff;

beforeEach(async () => {
  await resetDatabase();
  const plan = await createPlan();
  staff = await createUser({ role: 'TRAINER' });
  member = await createUser({ role: 'MEMBER' });
  await prisma.membership.create({
    data: { userId: member.user.id, planId: plan.id, startDate: parseDate('2026-10-01'), endDate: parseDate('2026-10-31'), price: 1000 },
  });
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

const get = (path, token = member.token) => request(app).get(path).set('Authorization', bearer(token));
const addVisits = (days) =>
  prisma.checkIn.createMany({ data: days.map((day) => ({ memberId: member.user.id, gymDay: parseDate(day), checkedInAt: new Date(`${day}T07:00:00Z`), method: 'QR' })) });

describe('GET /api/me/qr', () => {
  it('returns the content of the member’s own QR code', async () => {
    const response = await get('/api/me/qr');

    expect(response.status).toBe(200);
    expect(response.body.qrContent).toBe(`GYMFLOW:${member.user.qrToken}`);
  });

  it('is only for members (403 for staff)', async () => {
    expect((await get('/api/me/qr', staff.token)).status).toBe(403);
  });
});

describe('POST /api/me/qr/reset', () => {
  it('gives a new code, and the old code no longer checks the member in', async () => {
    const oldCode = (await get('/api/me/qr')).body.qrContent;

    const reset = await request(app).post('/api/me/qr/reset').set('Authorization', bearer(member.token));
    const newCode = reset.body.qrContent;

    expect(reset.status).toBe(200);
    expect(newCode).not.toBe(oldCode);
    const withOld = await request(app).post('/api/check-ins').set('Authorization', bearer(staff.token)).send({ code: oldCode });
    const withNew = await request(app).post('/api/check-ins').set('Authorization', bearer(staff.token)).send({ code: newCode });
    expect(withOld.status).toBe(404);
    expect(withNew.status).toBe(201);
  });
});

describe('GET /api/me/visits', () => {
  it('returns visits, points and level for a new member', async () => {
    const response = await get('/api/me/visits');

    expect(response.body).toEqual({
      visits: 0,
      noShows: 0,
      points: 0,
      level: 'Bronze',
      nextLevel: 'Silver',
      pointsToNextLevel: 100,
      discountPercent: 0,
      missedClasses: [],
      recentVisits: [],
    });
  });

  it('gives 10 points per visit and shows the latest visits first', async () => {
    await addVisits(['2026-10-10', '2026-10-12', '2026-10-14']);

    const response = await get('/api/me/visits');

    expect(response.body).toMatchObject({ visits: 3, points: 30, level: 'Bronze', pointsToNextLevel: 70 });
    expect(response.body.recentVisits.map((v) => v.checkedInAt.slice(0, 10))).toEqual(['2026-10-14', '2026-10-12', '2026-10-10']);
  });

  it.each([
    [10, 'Silver', 'Gold', 200, 5],
    [29, 'Silver', 'Gold', 10, 5],
    [30, 'Gold', 'Platinum', 300, 10],
    [60, 'Platinum', null, 0, 15],
  ])('with %i visits the level is %s', async (count, level, nextLevel, pointsToNextLevel, discountPercent) => {
    // One visit per day, going back from 14 October 2026.
    const days = Array.from({ length: count }, (_, i) => new Date(Date.UTC(2026, 9, 14 - i)).toISOString().slice(0, 10));
    await addVisits(days);

    const response = await get('/api/me/visits');

    expect(response.body).toMatchObject({ level, nextLevel, pointsToNextLevel, discountPercent });
  });

  it('shows at most the 10 most recent visits', async () => {
    await addVisits(Array.from({ length: 15 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`));

    expect((await get('/api/me/visits')).body.recentVisits).toHaveLength(10);
  });

  it('only counts the member’s own visits', async () => {
    const other = await createUser({ role: 'MEMBER' });
    await prisma.checkIn.create({ data: { memberId: other.user.id, gymDay: parseDate('2026-10-14'), method: 'QR' } });

    expect((await get('/api/me/visits')).body.visits).toBe(0);
  });
});
