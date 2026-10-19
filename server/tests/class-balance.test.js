import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { membershipMonthOn } from '../src/services/classBalance.service.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';
import { createClass } from './helpers/classes.js';

// Membership types: Basic (gym only) and Premium (a number of classes per membership month).
// "Now" is Thursday 15 October 2026, 09:00 UTC (12:00 in Istanbul).
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));

let trainer;
let premium; // 3 months from 9 September, 2 classes per month: 9 Sep–8 Oct, 9 Oct–8 Nov, 9 Nov–8 Dec
let basic;

async function memberWith(classesPerMonth, start = '2026-09-09', end = '2026-12-08') {
  const created = await createUser({ role: 'MEMBER' });
  const plan = await createPlan({ durationMonths: 3, classesPerMonth });
  await prisma.membership.create({
    data: { userId: created.user.id, planId: plan.id, startDate: parseDate(start), endDate: parseDate(end), price: 1000, classesPerMonth },
  });
  return created;
}

beforeEach(async () => {
  await resetDatabase();
  trainer = await createUser({ role: 'TRAINER' });
  premium = await memberWith(2);
  basic = await memberWith(0);
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

const book = (classId, token = premium.token) => request(app).post(`/api/classes/${classId}/book`).set('Authorization', bearer(token));
const unbook = (classId, token = premium.token) => request(app).delete(`/api/classes/${classId}/book`).set('Authorization', bearer(token));
const balance = (token = premium.token) => request(app).get('/api/me/class-balance').set('Authorization', bearer(token));
const classOn = (isoStart, overrides = {}) => createClass({ trainerId: trainer.user.id, startsAt: new Date(isoStart), ...overrides });

describe('booking with a Basic membership', () => {
  it('is refused: Basic is gym only (403 BASIC_PLAN)', async () => {
    const gymClass = await classOn('2026-10-20T07:00:00Z');

    const response = await book(gymClass.id, basic.token);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('BASIC_PLAN');
    expect(await prisma.booking.count()).toBe(0);
  });
});

describe('booking with a Premium membership (2 classes a month here)', () => {
  it('allows the included classes, then refuses with the date of the new balance (403 NO_CLASSES_LEFT)', async () => {
    const first = await classOn('2026-10-20T07:00:00Z');
    const second = await classOn('2026-10-22T07:00:00Z');
    const third = await classOn('2026-10-25T07:00:00Z');

    expect((await book(first.id)).status).toBe(201);
    expect((await book(second.id)).status).toBe(201);
    const response = await book(third.id);

    expect(response.status).toBe(403);
    expect(response.body.error).toMatchObject({ code: 'NO_CLASSES_LEFT', message: expect.stringContaining('2 new classes on 9 Nov 2026') });
  });

  it('counts classes in the month the class takes place: next membership month has a fresh balance', async () => {
    await book((await classOn('2026-10-20T07:00:00Z')).id);
    await book((await classOn('2026-10-22T07:00:00Z')).id);

    const response = await book((await classOn('2026-11-10T07:00:00Z')).id);

    expect(response.status).toBe(201);
  });

  it('does not carry unused classes over: last month’s bookings do not count, and its leftovers are gone', async () => {
    const lastMonth = await classOn('2026-10-05T07:00:00Z'); // 9 Sep–8 Oct
    await prisma.booking.create({ data: { classId: lastMonth.id, memberId: premium.user.id } });

    const response = await balance();

    expect(response.body.balance).toMatchObject({ used: 0, left: 2, classesPerMonth: 2 });
  });

  it('gives the class back when the member cancels the booking', async () => {
    const gymClass = await classOn('2026-10-20T07:00:00Z');
    await book(gymClass.id);
    await book((await classOn('2026-10-22T07:00:00Z')).id);

    await unbook(gymClass.id);
    const response = await book((await classOn('2026-10-25T07:00:00Z')).id);

    expect(response.status).toBe(201);
  });

  it('does not count classes the trainer cancelled', async () => {
    const cancelled = await classOn('2026-10-20T07:00:00Z', { isCancelled: true });
    await prisma.booking.create({ data: { classId: cancelled.id, memberId: premium.user.id } });

    expect((await balance()).body.balance).toMatchObject({ used: 0, left: 2 });
  });

  it('still counts a missed class (no-show): the spot was blocked for others', async () => {
    const missed = await classOn('2026-10-10T07:00:00Z', { attendanceOpenedAt: new Date('2026-10-10T06:55:00Z') });
    await prisma.booking.create({ data: { classId: missed.id, memberId: premium.user.id } });

    expect((await balance()).body.balance).toMatchObject({ used: 1, left: 1 });
  });
});

describe('GET /api/me/class-balance', () => {
  it('shows the Premium balance of the current membership month and when it resets', async () => {
    await book((await classOn('2026-10-20T07:00:00Z')).id);

    const response = await balance();

    expect(response.status).toBe(200);
    expect(response.body.balance).toEqual({
      planName: expect.any(String),
      type: 'PREMIUM',
      classesPerMonth: 2,
      used: 1,
      left: 1,
      monthStart: '2026-10-09',
      monthEnd: '2026-11-08',
      resetsOn: '2026-11-09',
    });
  });

  it('says BASIC for a gym-only membership', async () => {
    const response = await balance(basic.token);

    expect(response.body.balance).toMatchObject({ type: 'BASIC', classesPerMonth: 0, left: 0 });
  });

  it('has no reset date in the last month of the membership', async () => {
    vi.setSystemTime(new Date('2026-11-20T09:00:00Z'));
    try {
      const member = await memberWith(2); // created now, so its login token is not expired
      const response = await balance(member.token);
      expect(response.body.balance).toMatchObject({ monthStart: '2026-11-09', monthEnd: '2026-12-08', resetsOn: null });
    } finally {
      vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));
    }
  });

  it('is null without a membership today', async () => {
    const response = await balance((await createUser({ role: 'MEMBER' })).token);

    expect(response.body).toEqual({ balance: null });
  });
});

describe('selling a plan', () => {
  it('copies the plan’s classes per month to the membership', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const member = await createUser({ role: 'MEMBER' });
    const plan = await createPlan({ name: 'Premium Monthly', classesPerMonth: 10 });

    const response = await request(app).post(`/api/users/${member.user.id}/memberships`).set('Authorization', bearer(admin.token)).send({ planId: plan.id });

    expect(response.status).toBe(201);
    expect(response.body.membership.classesPerMonth).toBe(10);
  });
});

describe('membershipMonthOn (membership months)', () => {
  const membership = (start, end) => ({ startDate: parseDate(start), endDate: parseDate(end) });
  const month = (m, day) => {
    const { start, end } = membershipMonthOn(m, parseDate(day));
    return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
  };

  it('runs from the start day to the day before the same day next month', () => {
    const m = membership('2026-09-09', '2026-12-08');
    expect(month(m, '2026-09-09')).toEqual(['2026-09-09', '2026-10-08']);
    expect(month(m, '2026-10-08')).toEqual(['2026-09-09', '2026-10-08']);
    expect(month(m, '2026-10-09')).toEqual(['2026-10-09', '2026-11-08']);
    expect(month(m, '2026-12-08')).toEqual(['2026-11-09', '2026-12-08']);
  });

  it('handles a start on the 31st (short months)', () => {
    const m = membership('2027-01-31', '2027-04-30');
    expect(month(m, '2027-02-15')).toEqual(['2027-01-31', '2027-02-28']);
    expect(month(m, '2027-03-01')).toEqual(['2027-03-01', '2027-03-30']);
  });
});
