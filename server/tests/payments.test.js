import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';

// Freeze "today" at 2026-10-15 in Istanbul.
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));

let member;
let memberToken;
let adminToken;
let monthly;

const VISA = { number: '4242 4242 4242 4242', expMonth: 12, expYear: 28, cvc: '123', holderName: 'Elif Yilmaz' };
const MASTERCARD = { ...VISA, number: '5555 5555 5555 4444' };
const DECLINED = { ...VISA, number: '4000 0000 0000 0002' };
const NO_FUNDS = { ...VISA, number: '4000 0000 0000 9995' };

beforeEach(async () => {
  await resetDatabase();
  ({ user: member, token: memberToken } = await createUser({ role: 'MEMBER', firstName: 'Elif' }));
  adminToken = (await createUser({ role: 'ADMIN' })).token;
  monthly = await createPlan({ name: 'Monthly', durationMonths: 1, price: 1500 });
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

// Each call is a new checkout (new id), unless a checkoutId is given – like a double click on the same page.
const pay = (card, planId = monthly.id, token = memberToken, checkoutId = crypto.randomUUID()) =>
  request(app).post('/api/me/checkout').set('Authorization', bearer(token)).send({ planId, checkoutId, card });

describe('POST /api/me/checkout', () => {
  it('charges a Visa card and creates the membership with a receipt', async () => {
    const response = await pay(VISA);

    expect(response.status).toBe(201);
    expect(response.body.membership).toMatchObject({ plan: { name: 'Monthly' }, startDate: '2026-10-15', endDate: '2026-11-14', status: 'ACTIVE', price: '1500.00' });
    expect(response.body.payment).toMatchObject({
      reference: expect.stringMatching(/^GF-/),
      amount: '1500.00',
      method: 'CARD',
      status: 'PAID',
      card: { brand: 'VISA', last4: '4242' },
      plan: { name: 'Monthly' },
      membership: { startDate: '2026-10-15', endDate: '2026-11-14' },
    });
  });

  it('accepts Mastercard', async () => {
    const response = await pay(MASTERCARD);

    expect(response.status).toBe(201);
    expect(response.body.payment.card).toEqual({ brand: 'MASTERCARD', last4: '4444' });
  });

  it('never stores the full card number or the CVC', async () => {
    await pay(VISA);

    const saved = await prisma.payment.findFirstOrThrow();
    const everything = JSON.stringify(saved);
    expect(everything).not.toContain('4242424242424242');
    expect(saved.cardLast4).toBe('4242');
    expect(Object.keys(saved)).not.toContain('cvc');
  });

  it('applies the loyalty discount to the charged amount', async () => {
    // 30 visits × 10 points = 300 points = Gold level = 10 % off.
    const visits = Array.from({ length: 30 }, (_, i) => ({
      memberId: member.id,
      checkedInAt: new Date(Date.UTC(2026, 6, 1 + i, 8)),
      gymDay: new Date(Date.UTC(2026, 6, 1 + i)),
      method: 'QR',
    }));
    await prisma.checkIn.createMany({ data: visits });

    const preview = await request(app).get(`/api/me/membership/preview?planId=${monthly.id}`).set('Authorization', bearer(memberToken));
    const response = await pay(VISA);

    expect(preview.body.preview).toMatchObject({ level: 'Gold', discountPercent: 10, price: '1350.00' });
    expect(response.body.payment.amount).toBe(preview.body.preview.price);
    expect(response.body.payment.discountPercent).toBe(preview.body.preview.discountPercent);
  });

  it('renews: the new membership starts the day after the current one ends', async () => {
    await prisma.membership.create({
      data: { userId: member.id, planId: monthly.id, startDate: parseDate('2026-10-01'), endDate: parseDate('2026-10-31'), price: 1500 },
    });

    const response = await pay(VISA);

    expect(response.status).toBe(201);
    expect(response.body.membership.startDate).toBe('2026-11-01');
  });

  it('declined card: 402 with the reason, the attempt is recorded, no membership is created', async () => {
    const response = await pay(DECLINED);

    expect(response.status).toBe(402);
    expect(response.body.error).toMatchObject({ code: 'CARD_DECLINED', message: expect.stringContaining('declined') });
    expect(await prisma.membership.count()).toBe(0);
    const attempt = await prisma.payment.findFirstOrThrow();
    expect(attempt).toMatchObject({ status: 'DECLINED', membershipId: null, cardLast4: '0002' });
  });

  it('insufficient funds has its own message', async () => {
    const response = await pay(NO_FUNDS);

    expect(response.status).toBe(402);
    expect(response.body.error.message).toBe('Insufficient funds on this card.');
  });

  it('rejects invalid cards before charging anything', async () => {
    const cases = [
      [{ ...VISA, number: '4242 4242 4242 4241' }, 'card.number', 'not valid'],
      [{ ...VISA, number: '3782 822463 10005' }, 'card.number', 'Visa and Mastercard'],
      [{ ...VISA, expMonth: 9, expYear: 26 }, 'card.expYear', 'expired'],
      [{ ...VISA, expMonth: 13 }, 'card.expMonth', '01–12'],
      [{ ...VISA, cvc: '12' }, 'card.cvc', '3 digits'],
      [{ ...VISA, holderName: '' }, 'card.holderName', 'name'],
    ];
    for (const [card, field, text] of cases) {
      const response = await pay(card);
      expect(response.status).toBe(400);
      expect(response.body.error.details).toContainEqual({ field, message: expect.stringContaining(text) });
    }
    expect(await prisma.payment.count()).toBe(0);
  });

  it('never repeats the card number in error messages', async () => {
    const response = await pay({ ...VISA, number: '4242 4242 4242 4241' });

    expect(JSON.stringify(response.body)).not.toContain('4241');
  });

  it('a double click (same checkout id) charges only once', async () => {
    const checkoutId = crypto.randomUUID();
    const [first, second] = await Promise.all([pay(VISA, monthly.id, memberToken, checkoutId), pay(VISA, monthly.id, memberToken, checkoutId)]);

    expect([first.status, second.status].sort()).toEqual([201, 409]);
    expect([first, second].find((r) => r.status === 409).body.error.code).toBe('ALREADY_PROCESSED');
    expect(await prisma.payment.count()).toBe(1);
    expect(await prisma.membership.count()).toBe(1);
  });

  it('refuses inactive plans and unknown plans', async () => {
    const old = await createPlan({ name: 'Old', isActive: false });

    expect((await pay(VISA, old.id)).status).toBe(400);
    expect((await pay(VISA, 9999)).status).toBe(404);
    expect(await prisma.payment.count()).toBe(0);
  });

  it('needs a checkout id', async () => {
    const response = await request(app).post('/api/me/checkout').set('Authorization', bearer(memberToken)).send({ planId: monthly.id, card: VISA });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toContainEqual({ field: 'checkoutId', message: 'Checkout id is missing' });
  });

  it('after a declined card, a new checkout with another card works', async () => {
    expect((await pay(DECLINED)).status).toBe(402);
    expect((await pay(MASTERCARD)).status).toBe(201);
    expect(await prisma.membership.count()).toBe(1);
  });

  it('is only for members', async () => {
    expect((await pay(VISA, monthly.id, adminToken)).status).toBe(403);
    expect((await request(app).post('/api/me/checkout').send({ planId: monthly.id, card: VISA })).status).toBe(401);
  });
});

describe('GET /api/me/payments', () => {
  it('lists my receipts newest first, including declined attempts, and not other members’ payments', async () => {
    const other = await createUser({ role: 'MEMBER' });
    await pay(DECLINED);
    vi.setSystemTime(new Date('2026-10-15T09:05:00Z'));
    await pay(VISA);
    await pay(VISA, monthly.id, other.token);

    const response = await request(app).get('/api/me/payments').set('Authorization', bearer(memberToken));

    expect(response.status).toBe(200);
    expect(response.body.payments.map((p) => p.status)).toEqual(['PAID', 'DECLINED']);
    vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));
  });
});

describe('GET /api/payments (Admin)', () => {
  it('lists every payment (card and desk) with totals for this month', async () => {
    await pay(VISA);
    await pay(DECLINED, (await createPlan({ name: 'Quarterly', durationMonths: 3, price: 4000 })).id);
    const other = (await createUser({ role: 'MEMBER' })).user;
    await request(app).post(`/api/users/${other.id}/memberships`).set('Authorization', bearer(adminToken)).send({ planId: monthly.id });

    const response = await request(app).get('/api/payments').set('Authorization', bearer(adminToken));

    expect(response.status).toBe(200);
    expect(response.body.payments).toHaveLength(3);
    expect(response.body.payments.map((p) => p.method).sort()).toEqual(['CARD', 'CARD', 'DESK']);
    expect(response.body.payments[0].member).toMatchObject({ id: expect.any(Number), firstName: expect.any(String) });
    expect(response.body.totals).toEqual({
      revenueThisMonth: '3000.00',
      paymentsThisMonth: 2,
      declinedThisMonth: 1,
      revenueAllTime: '3000.00',
      paymentsAllTime: 2,
    });
  });

  it('filters by status and by member', async () => {
    await pay(VISA);
    await pay(DECLINED, (await createPlan({ name: 'Quarterly', durationMonths: 3, price: 4000 })).id);

    const declined = await request(app).get('/api/payments?status=DECLINED').set('Authorization', bearer(adminToken));
    const mine = await request(app).get(`/api/payments?userId=${member.id}`).set('Authorization', bearer(adminToken));

    expect(declined.body.payments).toHaveLength(1);
    expect(mine.body.payments).toHaveLength(2);
    expect(mine.body.totals.revenueAllTime).toBe('1500.00');
  });

  it('is only for admins', async () => {
    expect((await request(app).get('/api/payments').set('Authorization', bearer(memberToken))).status).toBe(403);
  });
});
