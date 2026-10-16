import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';

let adminToken;
let memberToken;

beforeEach(async () => {
  await resetDatabase();
  adminToken = (await createUser({ role: 'ADMIN' })).token;
  memberToken = (await createUser({ role: 'MEMBER' })).token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

const monthly = { name: 'Monthly', durationMonths: 1, price: 1500 };

describe('POST /api/plans', () => {
  it('lets an admin create a plan', async () => {
    const response = await request(app).post('/api/plans').set('Authorization', bearer(adminToken)).send(monthly);

    expect(response.status).toBe(201);
    expect(response.body.plan).toEqual({
      id: expect.any(Number),
      name: 'Monthly',
      durationMonths: 1,
      price: '1500.00',
      isActive: true,
    });
  });

  it('keeps prices with cents exact', async () => {
    const response = await request(app)
      .post('/api/plans')
      .set('Authorization', bearer(adminToken))
      .send({ ...monthly, price: 199.99 });

    expect(response.body.plan.price).toBe('199.99');
  });

  it.each([
    ['a price of 0', { price: 0 }, 'price'],
    ['a negative price', { price: -100 }, 'price'],
    ['more than 2 decimals', { price: 10.555 }, 'price'],
    ['a duration of 0 months', { durationMonths: 0 }, 'durationMonths'],
    ['a fractional duration', { durationMonths: 1.5 }, 'durationMonths'],
    ['an empty name', { name: '   ' }, 'name'],
  ])('rejects %s with 400', async (_label, change, field) => {
    const response = await request(app)
      .post('/api/plans')
      .set('Authorization', bearer(adminToken))
      .send({ ...monthly, ...change });

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((detail) => detail.field)).toContain(field);
  });

  it('rejects a duplicate name, ignoring letter case, with 409', async () => {
    await createPlan({ name: 'Monthly' });

    const response = await request(app)
      .post('/api/plans')
      .set('Authorization', bearer(adminToken))
      .send({ ...monthly, name: 'MONTHLY' });

    expect(response.status).toBe(409);
  });

  it('is forbidden for members (403)', async () => {
    const response = await request(app).post('/api/plans').set('Authorization', bearer(memberToken)).send(monthly);

    expect(response.status).toBe(403);
  });

  it('is forbidden for trainers (403)', async () => {
    const { token } = await createUser({ role: 'TRAINER' });

    const response = await request(app).post('/api/plans').set('Authorization', bearer(token)).send(monthly);

    expect(response.status).toBe(403);
  });
});

describe('GET /api/plans', () => {
  beforeEach(async () => {
    await createPlan({ name: 'Monthly', isActive: true });
    await createPlan({ name: 'Old offer', isActive: false });
  });

  it('shows all plans, including inactive ones, to admins', async () => {
    const response = await request(app).get('/api/plans').set('Authorization', bearer(adminToken));

    expect(response.status).toBe(200);
    expect(response.body.plans.map((plan) => plan.name)).toEqual(['Monthly', 'Old offer']);
  });

  it('shows only active plans to members', async () => {
    const response = await request(app).get('/api/plans').set('Authorization', bearer(memberToken));

    expect(response.body.plans.map((plan) => plan.name)).toEqual(['Monthly']);
  });

  it('requires login (401)', async () => {
    const response = await request(app).get('/api/plans');

    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/plans/:id', () => {
  it('lets an admin change the price', async () => {
    const plan = await createPlan({ price: 1000 });

    const response = await request(app)
      .patch(`/api/plans/${plan.id}`)
      .set('Authorization', bearer(adminToken))
      .send({ price: 1200 });

    expect(response.status).toBe(200);
    expect(response.body.plan.price).toBe('1200.00');
  });

  it('lets an admin deactivate a plan', async () => {
    const plan = await createPlan();

    const response = await request(app)
      .patch(`/api/plans/${plan.id}`)
      .set('Authorization', bearer(adminToken))
      .send({ isActive: false });

    expect(response.body.plan.isActive).toBe(false);
  });

  it('rejects renaming to an existing name (409)', async () => {
    await createPlan({ name: 'Monthly' });
    const plan = await createPlan({ name: 'Yearly' });

    const response = await request(app)
      .patch(`/api/plans/${plan.id}`)
      .set('Authorization', bearer(adminToken))
      .send({ name: 'monthly' });

    expect(response.status).toBe(409);
  });

  it('allows keeping the same name while changing other fields', async () => {
    const plan = await createPlan({ name: 'Monthly' });

    const response = await request(app)
      .patch(`/api/plans/${plan.id}`)
      .set('Authorization', bearer(adminToken))
      .send({ name: 'Monthly', price: 900 });

    expect(response.status).toBe(200);
  });

  it('rejects an empty change (400)', async () => {
    const plan = await createPlan();

    const response = await request(app)
      .patch(`/api/plans/${plan.id}`)
      .set('Authorization', bearer(adminToken))
      .send({});

    expect(response.status).toBe(400);
  });

  it('returns 404 for an unknown or invalid id', async () => {
    const unknown = await request(app).patch('/api/plans/9999').set('Authorization', bearer(adminToken)).send({ price: 5 });
    const invalid = await request(app).patch('/api/plans/abc').set('Authorization', bearer(adminToken)).send({ price: 5 });

    expect(unknown.status).toBe(404);
    expect(invalid.status).toBe(404);
  });

  it('is forbidden for members (403)', async () => {
    const plan = await createPlan();

    const response = await request(app)
      .patch(`/api/plans/${plan.id}`)
      .set('Authorization', bearer(memberToken))
      .send({ price: 1 });

    expect(response.status).toBe(403);
  });
});

describe('database constraints (last line of defence)', () => {
  it('rejects a non-positive price even when the API is bypassed', async () => {
    await expect(createPlan({ price: 0 })).rejects.toThrow(/MembershipPlan_price_positive/);
  });

  it('rejects a non-positive duration even when the API is bypassed', async () => {
    await expect(createPlan({ durationMonths: 0 })).rejects.toThrow(/MembershipPlan_durationMonths_positive/);
  });
});
