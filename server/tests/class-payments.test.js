import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';
import { createClass } from './helpers/classes.js';

// Paying per class: Basic members pay the class price, Premium members with no classes left pay it with 30% off.
// "Now" is Thursday 15 October 2026, 09:00 UTC (12:00 in Istanbul).
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));

const VISA = { number: '4242 4242 4242 4242', expMonth: 12, expYear: 28, cvc: '123', holderName: 'Can Ozturk' };
const DECLINED = { ...VISA, number: '4000 0000 0000 0002' };

let admin;
let trainer;
let basic;
let premium; // 1 included class per month, 9 Oct–8 Nov is the current membership month

async function memberWith(classesPerMonth) {
  const created = await createUser({ role: 'MEMBER' });
  const plan = await createPlan({ durationMonths: 3, classesPerMonth });
  await prisma.membership.create({
    data: { userId: created.user.id, planId: plan.id, startDate: parseDate('2026-09-09'), endDate: parseDate('2026-12-08'), price: 1000, classesPerMonth },
  });
  return created;
}

beforeEach(async () => {
  await resetDatabase();
  admin = await createUser({ role: 'ADMIN' });
  trainer = await createUser({ role: 'TRAINER' });
  basic = await memberWith(0);
  premium = await memberWith(1);
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

const classOn = (isoStart, overrides = {}) => createClass({ trainerId: trainer.user.id, startsAt: new Date(isoStart), price: 200, ...overrides });
const quote = (classId, token) => request(app).get(`/api/classes/${classId}/booking-quote`).set('Authorization', bearer(token));
const book = (classId, token) => request(app).post(`/api/classes/${classId}/book`).set('Authorization', bearer(token));
const unbook = (classId, token) => request(app).delete(`/api/classes/${classId}/book`).set('Authorization', bearer(token));
const payFor = (classId, token, card = VISA, checkoutId = crypto.randomUUID()) =>
  request(app).post(`/api/classes/${classId}/book-and-pay`).set('Authorization', bearer(token)).send({ checkoutId, card });

describe('GET /api/classes/:id/booking-quote', () => {
  it('Basic: the full class price', async () => {
    const gymClass = await classOn('2026-10-20T07:00:00Z');

    const response = await quote(gymClass.id, basic.token);

    expect(response.body.quote).toMatchObject({ mustPay: true, reason: 'BASIC_PLAN', listPrice: '200.00', discountPercent: 0, price: '200.00' });
  });

  it('Premium with a class left: free', async () => {
    const response = await quote((await classOn('2026-10-20T07:00:00Z')).id, premium.token);

    expect(response.body.quote).toMatchObject({ mustPay: false, reason: null, price: '0.00' });
  });

  it('Premium with no classes left: 30% off the class price', async () => {
    await book((await classOn('2026-10-18T07:00:00Z')).id, premium.token); // uses the 1 included class

    const response = await quote((await classOn('2026-10-20T07:00:00Z')).id, premium.token);

    expect(response.body.quote).toMatchObject({ mustPay: true, reason: 'NO_CLASSES_LEFT', listPrice: '200.00', discountPercent: 30, price: '140.00' });
  });

  it('is null without a membership on the class day', async () => {
    const response = await quote((await classOn('2027-01-20T07:00:00Z')).id, basic.token);

    expect(response.body).toEqual({ quote: null });
  });
});

describe('POST /api/classes/:id/book (free booking)', () => {
  it('tells a Basic member they can pay for the class (403 BASIC_PLAN)', async () => {
    const response = await book((await classOn('2026-10-20T07:00:00Z')).id, basic.token);

    expect(response.status).toBe(403);
    expect(response.body.error).toMatchObject({ code: 'BASIC_PLAN', message: expect.stringContaining('pay for this class (₺200.00)') });
  });
});

describe('POST /api/classes/:id/book-and-pay', () => {
  it('Basic: charges the class price and books the spot, with a receipt', async () => {
    const gymClass = await classOn('2026-10-20T07:00:00Z');

    const response = await payFor(gymClass.id, basic.token);

    expect(response.status).toBe(201);
    expect(response.body.class).toMatchObject({ isBookedByMe: true, isMyBookingPaid: true, bookedCount: 1 });
    expect(response.body.payment).toMatchObject({
      kind: 'CLASS',
      status: 'PAID',
      amount: '200.00',
      plan: null,
      gymClass: { id: gymClass.id, title: 'Morning Yoga' },
      card: { brand: 'VISA', last4: '4242' },
    });
    const receipts = await request(app).get('/api/me/payments').set('Authorization', bearer(basic.token));
    expect(receipts.body.payments).toHaveLength(1);
  });

  it('Premium with no classes left: charges the discounted price, and it does not use the next month', async () => {
    await book((await classOn('2026-10-18T07:00:00Z')).id, premium.token);

    const response = await payFor((await classOn('2026-10-20T07:00:00Z')).id, premium.token);

    expect(response.status).toBe(201);
    expect(response.body.payment).toMatchObject({ amount: '140.00', discountPercent: 30 });
    // The paid class is extra: the balance still shows 1 of 1 used, not 2.
    const balance = await request(app).get('/api/me/class-balance').set('Authorization', bearer(premium.token));
    expect(balance.body.balance).toMatchObject({ used: 1, left: 0 });
  });

  it('refuses to charge a Premium member who still has an included class (409 PAYMENT_NOT_NEEDED)', async () => {
    const response = await payFor((await classOn('2026-10-20T07:00:00Z')).id, premium.token);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('PAYMENT_NOT_NEEDED');
    expect(await prisma.payment.count()).toBe(0);
  });

  it('saves a declined card but books nothing (402 CARD_DECLINED)', async () => {
    const gymClass = await classOn('2026-10-20T07:00:00Z');

    const response = await payFor(gymClass.id, basic.token, DECLINED);

    expect(response.status).toBe(402);
    expect(response.body.error.code).toBe('CARD_DECLINED');
    expect(await prisma.payment.findFirst()).toMatchObject({ kind: 'CLASS', status: 'DECLINED' });
    expect(await prisma.booking.count()).toBe(0);
  });

  it('never charges the same checkout twice (409 ALREADY_PROCESSED)', async () => {
    const gymClass = await classOn('2026-10-20T07:00:00Z');
    const checkoutId = crypto.randomUUID();

    await payFor(gymClass.id, basic.token, VISA, checkoutId);
    const second = await payFor(gymClass.id, basic.token, VISA, checkoutId);

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('ALREADY_PROCESSED');
    expect(await prisma.payment.count()).toBe(1);
  });

  it('checks the usual booking rules before charging (full class → 409, no payment)', async () => {
    const gymClass = await classOn('2026-10-20T07:00:00Z', { capacity: 1 });
    await payFor(gymClass.id, (await memberWith(0)).token);

    const response = await payFor(gymClass.id, basic.token);

    expect(response.status).toBe(409);
    expect(await prisma.payment.count()).toBe(1);
  });
});

describe('refunds', () => {
  it('refunds a paid class when the member cancels the booking', async () => {
    const gymClass = await classOn('2026-10-20T07:00:00Z');
    await payFor(gymClass.id, basic.token);

    const response = await unbook(gymClass.id, basic.token);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ refunded: '200.00', class: { isBookedByMe: false } });
    expect(await prisma.payment.findFirst()).toMatchObject({ status: 'REFUNDED', refundedAt: expect.any(Date) });
  });

  it('refunds everyone who paid when the trainer cancels the class', async () => {
    const gymClass = await classOn('2026-10-20T07:00:00Z');
    await payFor(gymClass.id, basic.token);

    await request(app).post(`/api/classes/${gymClass.id}/cancel`).set('Authorization', bearer(trainer.token));

    expect(await prisma.payment.findFirst()).toMatchObject({ status: 'REFUNDED' });
  });

  it('leaves refunds out of the revenue, and the admin can list them', async () => {
    const gymClass = await classOn('2026-10-20T07:00:00Z');
    await payFor(gymClass.id, basic.token);
    await unbook(gymClass.id, basic.token);

    const all = await request(app).get('/api/payments').set('Authorization', bearer(admin.token));
    const refunded = await request(app).get('/api/payments?status=REFUNDED').set('Authorization', bearer(admin.token));

    expect(all.body.totals).toMatchObject({ revenueAllTime: '0.00', paymentsAllTime: 0 });
    expect(refunded.body.payments).toHaveLength(1);
  });
});

describe('class price', () => {
  it('is set when creating a class (200 by default) and shown to everyone', async () => {
    const body = {
      title: 'Boxing Basics',
      category: 'BOXING',
      description: 'Learn the basic punches, footwork and defence in a friendly group.',
      location: 'Studio 2',
      startsAt: '2026-10-22T16:00:00Z',
      durationMinutes: 60,
      capacity: 10,
      level: 'BEGINNER',
      intensity: 'HIGH',
    };

    const priced = await request(app).post('/api/classes').set('Authorization', bearer(trainer.token)).send({ ...body, price: 250 });
    const standard = await request(app).post('/api/classes').set('Authorization', bearer(trainer.token)).send({ ...body, title: 'Boxing Two' });

    expect(priced.body.class.price).toBe('250.00');
    expect(standard.body.class.price).toBe('200.00');
  });
});
