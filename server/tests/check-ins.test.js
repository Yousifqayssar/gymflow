import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';

// "Now" starts at Thursday 15 October 2026, 09:00 UTC (12:00 in Istanbul) in every test.
vi.useFakeTimers({ toFake: ['Date'] });
const setNow = (iso) => vi.setSystemTime(new Date(iso));

let staff;
let plan;
let member;

async function memberWithMembership(start = '2026-10-01', end = '2026-10-31', firstName = 'Elif') {
  const { user } = await createUser({ role: 'MEMBER', firstName, lastName: 'Yilmaz' });
  if (start) {
    await prisma.membership.create({
      data: { userId: user.id, planId: plan.id, startDate: parseDate(start), endDate: parseDate(end), price: 1500 },
    });
  }
  return user;
}

beforeEach(async () => {
  setNow('2026-10-15T09:00:00Z');
  await resetDatabase();
  plan = await createPlan({ name: 'Monthly' });
  staff = await createUser({ role: 'TRAINER' });
  member = await memberWithMembership();
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

const scan = (code, token = staff.token) =>
  request(app).post('/api/check-ins').set('Authorization', bearer(token)).send({ code });
const qrOf = (user) => `GYMFLOW:${user.qrToken}`;

describe('POST /api/check-ins – allowed', () => {
  it('checks in a member with a valid membership by QR code', async () => {
    const response = await scan(qrOf(member));

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      alreadyCheckedIn: false,
      checkIn: { method: 'QR' },
      member: { id: member.id, firstName: 'Elif', membership: { planName: 'Monthly', status: 'ACTIVE', daysRemaining: 17 } },
      visits: 1,
      points: 10,
      level: 'Bronze',
    });
    const stored = await prisma.checkIn.findFirst();
    expect(stored.checkedInById).toBe(staff.user.id);
    expect(stored.gymDay.toISOString().slice(0, 10)).toBe('2026-10-15');
  });

  it('accepts the token without the GYMFLOW: prefix', async () => {
    expect((await scan(member.qrToken)).status).toBe(201);
  });

  it.each([
    ['GF-00002 (as printed)', (id) => `GF-${String(id).padStart(5, '0')}`],
    ['gf-2 (lower case, no zeros)', (id) => `gf-${id}`],
    ['GF2 (no dash)', (id) => `GF${id}`],
  ])('checks in by typed member number: %s', async (_label, format) => {
    // The trainer is created first (id 1), so the member has id 2.
    const response = await scan(format(member.id));

    expect(response.status).toBe(201);
    expect(response.body.checkIn.method).toBe('MANUAL');
    expect(response.body.member.id).toBe(member.id);
  });

  it('also lets members whose membership expires soon in', async () => {
    const soon = await memberWithMembership('2026-10-01', '2026-10-18', 'Can');

    expect((await scan(qrOf(soon))).body.member.membership.status).toBe('EXPIRING_SOON');
  });

  it('can be done by admins too', async () => {
    const admin = await createUser({ role: 'ADMIN' });

    expect((await scan(qrOf(member), admin.token)).status).toBe(201);
  });
});

describe('POST /api/check-ins – once per day and points', () => {
  it('does not create a second visit on the same day (200, already checked in)', async () => {
    await scan(qrOf(member));
    setNow('2026-10-15T15:00:00Z');

    const response = await scan(qrOf(member));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ alreadyCheckedIn: true, visits: 1, points: 10 });
    expect(await prisma.checkIn.count()).toBe(1);
  });

  it('counts a visit on the next day and adds points', async () => {
    await scan(qrOf(member));
    setNow('2026-10-16T08:00:00Z');

    const response = await scan(qrOf(member));

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ visits: 2, points: 20 });
  });

  it('uses the gym’s midnight (Istanbul), not UTC midnight, to decide the day', async () => {
    setNow('2026-10-15T20:59:00Z'); // 23:59 on 15 October in Istanbul
    await scan(qrOf(member));
    setNow('2026-10-15T21:01:00Z'); // 00:01 on 16 October in Istanbul, still 15 October in UTC

    const response = await scan(qrOf(member));

    expect(response.status).toBe(201);
    expect(response.body.visits).toBe(2);
  });

  it('handles a scan that arrives while another scan is saving the same visit', async () => {
    // Recreate the exact race on purpose: the visit is already saved, but our first lookup
    // still sees "no visit yet" (as if the other scan saved it a millisecond later).
    await prisma.checkIn.create({ data: { memberId: member.id, gymDay: parseDate('2026-10-15'), method: 'QR' } });
    const lookup = vi.spyOn(prisma.checkIn, 'findUnique').mockResolvedValueOnce(null);

    const response = await scan(qrOf(member));
    lookup.mockRestore();

    // Saving hits the unique index (member, day); the service answers "already checked in" instead of crashing.
    expect(response.status).toBe(200);
    expect(response.body.alreadyCheckedIn).toBe(true);
    expect(await prisma.checkIn.count()).toBe(1);
  });

  it('lets only one of many simultaneous scans count (e.g. a scanner firing repeatedly)', async () => {
    const responses = await Promise.all(Array.from({ length: 8 }, () => scan(qrOf(member))));

    const statuses = responses.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 200, 200, 200, 200, 200, 200, 201]);
    expect(await prisma.checkIn.count()).toBe(1);
  });
});

describe('POST /api/check-ins – refused', () => {
  it('refuses a member with an expired membership (403) and says why', async () => {
    const expired = await memberWithMembership('2026-09-01', '2026-09-30', 'Burak');

    const response = await scan(qrOf(expired));

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe("Burak's membership expired on 30 Sep 2026");
    expect(response.body.error.code).toBe('MEMBERSHIP_NOT_ACTIVE');
    expect(await prisma.checkIn.count()).toBe(0);
  });

  it('refuses a member without any membership (403)', async () => {
    const none = await memberWithMembership(null, null, 'Selin');

    const response = await scan(qrOf(none));

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('Selin has no membership');
    expect(response.body.error.code).toBe('MEMBERSHIP_NOT_ACTIVE');
  });

  it('refuses a member whose membership has not started yet (403)', async () => {
    const upcoming = await memberWithMembership('2026-10-21', '2026-11-20', 'Ece');

    const response = await scan(qrOf(upcoming));

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe("Ece's membership only starts on 21 Oct 2026");
  });

  it('refuses on the day after the membership ended', async () => {
    setNow('2026-11-01T09:00:00Z');
    // Login tokens expire after a day, so the staff member logs in again on 1 November.
    const staffToday = await createUser({ role: 'TRAINER' });

    expect((await scan(qrOf(member), staffToday.token)).status).toBe(403);
  });

  it('returns 404 for an unknown token or member number', async () => {
    expect((await scan('GYMFLOW:00000000-0000-0000-0000-000000000000')).status).toBe(404);
    expect((await scan('GF-99999')).status).toBe(404);
  });

  it('does not check in staff accounts (404)', async () => {
    expect((await scan(qrOf(staff.user))).status).toBe(404);
  });

  it.each(['hello', 'https://example.com', ''])('rejects "%s", which is not a GymFlow code (400)', async (code) => {
    expect((await scan(code)).status).toBe(400);
  });

  it('cannot be used by members, not even for themselves (403)', async () => {
    const { token } = await createUser({ role: 'MEMBER' });

    const response = await scan(qrOf(member), token);

    expect(response.status).toBe(403);
    // Not a membership refusal: the client must not show "Entry refused" for this.
    expect(response.body.error.code).toBeUndefined();
  });
});

describe('GET /api/check-ins/today', () => {
  it('lists only today’s visits, newest first', async () => {
    const second = await memberWithMembership('2026-10-01', '2026-10-31', 'Mehmet');
    await prisma.checkIn.create({ data: { memberId: member.id, gymDay: parseDate('2026-10-14'), method: 'QR' } });
    setNow('2026-10-15T06:00:00Z');
    await scan(qrOf(member));
    setNow('2026-10-15T08:00:00Z');
    await scan(qrOf(second));

    const response = await request(app).get('/api/check-ins/today').set('Authorization', bearer(staff.token));

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(2);
    expect(response.body.checkIns.map((c) => c.member.firstName)).toEqual(['Mehmet', 'Elif']);
  });

  it('is only for staff (403 for members)', async () => {
    const { token } = await createUser({ role: 'MEMBER' });

    expect((await request(app).get('/api/check-ins/today').set('Authorization', bearer(token))).status).toBe(403);
  });
});
