import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';

// Freeze "now" at 15 October 2026, 12:00 in Istanbul, so "today" is always 2026-10-15.
// Only Date is faked; real timers keep working for the database and HTTP requests.
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));

let adminToken;
let member;
let monthly;

beforeEach(async () => {
  await resetDatabase();
  adminToken = (await createUser({ role: 'ADMIN' })).token;
  member = (await createUser({ role: 'MEMBER' })).user;
  monthly = await createPlan({ name: 'Monthly', durationMonths: 1, price: 1500 });
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

const assign = (userId, body, token = adminToken) =>
  request(app).post(`/api/users/${userId}/memberships`).set('Authorization', bearer(token)).send(body);

// Puts an existing membership straight into the database.
const existingMembership = (start, end) =>
  prisma.membership.create({
    data: { userId: member.id, planId: monthly.id, startDate: parseDate(start), endDate: parseDate(end), price: 1500 },
  });

describe('POST /api/users/:id/memberships', () => {
  it('starts today and calculates the end date when the member has no membership', async () => {
    const response = await assign(member.id, { planId: monthly.id });

    expect(response.status).toBe(201);
    expect(response.body.membership).toMatchObject({
      plan: { id: monthly.id, name: 'Monthly' },
      startDate: '2026-10-15',
      endDate: '2026-11-14',
      price: '1500.00',
      status: 'ACTIVE',
      daysRemaining: 31,
    });
  });

  it('calculates multi-month plans', async () => {
    const quarterly = await createPlan({ name: 'Quarterly', durationMonths: 3, price: 4000 });

    const response = await assign(member.id, { planId: quarterly.id });

    expect(response.body.membership.endDate).toBe('2027-01-14');
  });

  it('renews: starts the day after the current membership ends', async () => {
    await existingMembership('2026-10-01', '2026-10-31');

    const response = await assign(member.id, { planId: monthly.id });

    expect(response.status).toBe(201);
    expect(response.body.membership).toMatchObject({
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      status: 'UPCOMING',
      daysUntilStart: 17, // from 15 October
    });
  });

  it('reports 0 days until start for a membership that has already started', async () => {
    const response = await assign(member.id, { planId: monthly.id });

    expect(response.body.membership.daysUntilStart).toBe(0);
  });

  it('starts today when the previous membership has already ended', async () => {
    await existingMembership('2026-09-01', '2026-09-30');

    const response = await assign(member.id, { planId: monthly.id });

    expect(response.body.membership.startDate).toBe('2026-10-15');
  });

  it('accepts a chosen start date in the future', async () => {
    const response = await assign(member.id, { planId: monthly.id, startDate: '2026-11-10' });

    expect(response.status).toBe(201);
    expect(response.body.membership).toMatchObject({ startDate: '2026-11-10', endDate: '2026-12-09' });
  });

  it('rejects a start date in the past (400)', async () => {
    const response = await assign(member.id, { planId: monthly.id, startDate: '2026-10-14' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('The start date cannot be in the past');
  });

  it('rejects a start date that overlaps an existing membership (409)', async () => {
    await existingMembership('2026-10-01', '2026-10-31');

    const response = await assign(member.id, { planId: monthly.id, startDate: '2026-10-20' });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toContain('1 Oct 2026 to 31 Oct 2026');
  });

  it('allows a chosen start date right after the existing membership', async () => {
    await existingMembership('2026-10-01', '2026-10-31');

    const response = await assign(member.id, { planId: monthly.id, startDate: '2026-11-01' });

    expect(response.status).toBe(201);
  });

  it('never creates two overlapping memberships, even for two requests at the same time', async () => {
    const [first, second] = await Promise.all([
      assign(member.id, { planId: monthly.id, startDate: '2026-11-01' }),
      assign(member.id, { planId: monthly.id, startDate: '2026-11-01' }),
    ]);

    expect([first.status, second.status].sort()).toEqual([201, 409]);
    expect(await prisma.membership.count()).toBe(1);
  });

  it('copies the price, so later price changes do not rewrite the sale', async () => {
    await assign(member.id, { planId: monthly.id });
    await prisma.membershipPlan.update({ where: { id: monthly.id }, data: { price: 2000 } });

    const response = await request(app).get(`/api/users/${member.id}`).set('Authorization', bearer(adminToken));

    expect(response.body.memberships[0].price).toBe('1500.00');
  });

  it('rejects an inactive plan (400)', async () => {
    const oldPlan = await createPlan({ isActive: false });

    const response = await assign(member.id, { planId: oldPlan.id });

    expect(response.status).toBe(400);
  });

  it('returns 404 for an unknown plan or user', async () => {
    const unknownPlan = await assign(member.id, { planId: 9999 });
    const unknownUser = await assign(9999, { planId: monthly.id });

    expect(unknownPlan.status).toBe(404);
    expect(unknownUser.status).toBe(404);
  });

  it('only gives memberships to members, not trainers (400)', async () => {
    const trainer = (await createUser({ role: 'TRAINER' })).user;

    const response = await assign(trainer.id, { planId: monthly.id });

    expect(response.status).toBe(400);
  });

  it.each([
    ['a badly formatted date', '15/11/2026'],
    ['a date that does not exist', '2026-02-30'],
  ])('rejects %s (400)', async (_label, startDate) => {
    const response = await assign(member.id, { planId: monthly.id, startDate });

    expect(response.status).toBe(400);
  });

  it('is forbidden for members (403)', async () => {
    const { token } = await createUser({ role: 'MEMBER' });

    const response = await assign(member.id, { planId: monthly.id }, token);

    expect(response.status).toBe(403);
  });
});

describe('GET /api/users/:id/memberships/preview', () => {
  it('shows the dates and price without saving anything', async () => {
    const response = await request(app)
      .get(`/api/users/${member.id}/memberships/preview?planId=${monthly.id}`)
      .set('Authorization', bearer(adminToken));

    expect(response.status).toBe(200);
    expect(response.body.preview).toEqual({
      plan: { id: monthly.id, name: 'Monthly' },
      startDate: '2026-10-15',
      endDate: '2026-11-14',
      price: '1500.00',
    });
    expect(await prisma.membership.count()).toBe(0);
  });

  it('applies the same rules as saving (overlap → 409)', async () => {
    await existingMembership('2026-10-01', '2026-10-31');

    const response = await request(app)
      .get(`/api/users/${member.id}/memberships/preview?planId=${monthly.id}&startDate=2026-10-20`)
      .set('Authorization', bearer(adminToken));

    expect(response.status).toBe(409);
  });
});

describe('GET /api/users/:id', () => {
  it('returns the member with memberships (newest first) and the current status', async () => {
    await existingMembership('2026-08-01', '2026-08-31');
    await existingMembership('2026-10-01', '2026-10-20');

    const response = await request(app).get(`/api/users/${member.id}`).set('Authorization', bearer(adminToken));

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(member.id);
    expect(response.body.status).toBe('EXPIRING_SOON');
    expect(response.body.currentMembership.endDate).toBe('2026-10-20');
    expect(response.body.memberships.map((m) => m.status)).toEqual(['EXPIRING_SOON', 'EXPIRED']);
  });

  it('reports NONE for a member without memberships', async () => {
    const response = await request(app).get(`/api/users/${member.id}`).set('Authorization', bearer(adminToken));

    expect(response.body.status).toBe('NONE');
    expect(response.body.currentMembership).toBeNull();
  });
});

describe('database constraint', () => {
  it('rejects a membership whose end date is not after its start date, even when the API is bypassed', async () => {
    await expect(existingMembership('2026-10-15', '2026-10-15')).rejects.toThrow(/Membership_endDate_after_startDate/);
  });
});
