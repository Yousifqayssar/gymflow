import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createClass } from './helpers/classes.js';

// "Now" is Thursday 15 October 2026, 09:00 UTC (12:00 in Istanbul).
vi.useFakeTimers({ toFake: ['Date'] });

const stats = (token) => request(app).get('/api/gym/stats').set('Authorization', bearer(token));

let member;
let trainer;

beforeEach(async () => {
  vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));
  await resetDatabase();
  member = await createUser({ role: 'MEMBER' });
  await createUser({ role: 'MEMBER' });
  trainer = await createUser({ role: 'TRAINER' });
  await createUser({ role: 'ADMIN' });
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

describe('GET /api/gym/stats', () => {
  it('counts members and trainers (admins are not counted)', async () => {
    const response = await stats(member.token);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ members: 2, trainers: 1 });
  });

  it('counts only classes in the next 7 days that are not cancelled', async () => {
    const trainerId = trainer.user.id;
    await createClass({ trainerId, startsAt: new Date('2026-10-16T07:00:00Z') }); // tomorrow
    await createClass({ trainerId, startsAt: new Date('2026-10-21T07:00:00Z') }); // in 6 days
    await createClass({ trainerId, startsAt: new Date('2026-10-23T07:00:00Z') }); // in 8 days: too late
    await createClass({ trainerId, startsAt: new Date('2026-10-14T07:00:00Z') }); // yesterday
    await createClass({ trainerId, startsAt: new Date('2026-10-17T07:00:00Z'), isCancelled: true });

    expect((await stats(member.token)).body.classesThisWeek).toBe(2);
  });

  it('counts the visits of the current month only', async () => {
    const visit = (day) =>
      prisma.checkIn.create({
        data: { memberId: member.user.id, gymDay: parseDate(day), checkedInAt: new Date(`${day}T08:00:00Z`), method: 'QR' },
      });
    await visit('2026-10-01');
    await visit('2026-10-14');
    await visit('2026-09-30');

    expect((await stats(member.token)).body.visitsThisMonth).toBe(2);
  });

  it('needs a login (401)', async () => {
    expect((await request(app).get('/api/gym/stats')).status).toBe(401);
  });
});
