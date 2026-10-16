import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';

// "Today" is 2026-10-15 in Istanbul for every test in this file.
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));

let adminToken;

// Creates a member with the given memberships: [[start, end], ...]
async function memberWith(firstName, periods, plan) {
  const { user } = await createUser({ role: 'MEMBER', firstName, lastName: 'Test' });
  for (const [start, end] of periods) {
    await prisma.membership.create({
      data: { userId: user.id, planId: plan.id, startDate: parseDate(start), endDate: parseDate(end), price: 1000 },
    });
  }
  return user;
}

beforeEach(async () => {
  await resetDatabase();
  adminToken = (await createUser({ role: 'ADMIN' })).token;
  const plan = await createPlan({ name: 'Monthly' });

  await memberWith('Active', [['2026-10-01', '2026-11-30']], plan); // 46 days left
  await memberWith('SoonFive', [['2026-09-20', '2026-10-19']], plan); // ends in 4 days → 5 days left
  await memberWith('SoonOne', [['2026-09-16', '2026-10-15']], plan); // last day today → 1 day left
  await memberWith('Expired', [['2026-08-01', '2026-08-31']], plan);
  await memberWith('Upcoming', [['2026-11-01', '2026-11-30']], plan);
  await memberWith('Nobody', [], plan);
  await createUser({ role: 'TRAINER', firstName: 'Trainer' }); // must never appear in member lists
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

const list = (query) => request(app).get(`/api/users?${query}`).set('Authorization', bearer(adminToken));
const names = (response) => response.body.users.map((user) => user.firstName).sort();

describe('GET /api/users?role=MEMBER (member list with membership status)', () => {
  it('gives every member their current membership status', async () => {
    const response = await list('role=MEMBER');

    const statusByName = Object.fromEntries(response.body.users.map((u) => [u.firstName, u.membership.status]));
    expect(statusByName).toEqual({
      Active: 'ACTIVE',
      SoonFive: 'EXPIRING_SOON',
      SoonOne: 'EXPIRING_SOON',
      Expired: 'EXPIRED',
      Upcoming: 'UPCOMING',
      Nobody: 'NONE',
    });
  });

  it('includes plan name, end date and days remaining', async () => {
    const response = await list('role=MEMBER');

    const soon = response.body.users.find((u) => u.firstName === 'SoonFive');
    expect(soon.membership).toEqual({
      status: 'EXPIRING_SOON',
      planName: 'Monthly',
      startDate: '2026-09-20',
      endDate: '2026-10-19',
      daysRemaining: 5,
    });
  });

  it('returns the number of members per filter', async () => {
    const response = await list('role=MEMBER');

    expect(response.body.counts).toEqual({ all: 6, active: 3, expiring: 2, expired: 1, upcoming: 1, none: 1 });
  });
});

describe('status filters', () => {
  it.each([
    ['active', ['Active', 'SoonFive', 'SoonOne']], // "active" includes expiring soon
    ['expiring', ['SoonFive', 'SoonOne']],
    ['expired', ['Expired']],
    ['upcoming', ['Upcoming']],
    ['none', ['Nobody']],
  ])('status=%s shows the right members', async (status, expected) => {
    const response = await list(`role=MEMBER&status=${status}`);

    expect(response.status).toBe(200);
    expect(names(response)).toEqual(expected);
  });

  it('sorts expiring members by urgency (fewest days left first)', async () => {
    const response = await list('status=expiring');

    expect(response.body.users.map((u) => u.firstName)).toEqual(['SoonOne', 'SoonFive']);
  });

  it('only returns members when a status is given, even without role', async () => {
    const response = await list('status=none');

    expect(names(response)).toEqual(['Nobody']);
  });

  it('combines status and search; counts follow the search', async () => {
    const response = await list('role=MEMBER&status=expiring&search=one');

    expect(names(response)).toEqual(['SoonOne']);
    expect(response.body.counts.all).toBe(1);
  });

  it('rejects an unknown status (400)', async () => {
    const response = await list('status=forever');

    expect(response.status).toBe(400);
  });
});
