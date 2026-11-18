import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createClass } from './helpers/classes.js';

// "Now" is Thursday 15 October 2026, 09:00 UTC (12:00 in Istanbul), so the current month is October.
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));

let admin;
let trainer;
let member;
let reference = 0;

const dashboard = (token) => request(app).get('/api/gym/admin-dashboard').set('Authorization', bearer(token));

// A single-class payment on a given day, so revenue tests do not need a membership plan.
const pay = (amount, status, createdAt) =>
  prisma.payment.create({
    data: { reference: `GF-TEST-${(reference += 1)}`, userId: member.id, kind: 'CLASS', amount, method: 'CARD', status, createdAt: new Date(createdAt) },
  });

beforeEach(async () => {
  vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));
  await resetDatabase();
  admin = await createUser({ role: 'ADMIN' });
  trainer = await createUser({ role: 'TRAINER' });
  member = (await createUser({ role: 'MEMBER' })).user;
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

describe('GET /api/gym/admin-dashboard – revenue by month', () => {
  it('returns the last 6 months, newest last, summing only paid payments of each gym month', async () => {
    await pay('1000.00', 'PAID', '2026-10-05T10:00:00Z'); // October (this month)
    await pay('500.00', 'PAID', '2026-10-12T10:00:00Z'); // October
    await pay('4000.00', 'PAID', '2026-09-10T10:00:00Z'); // September
    await pay('250.00', 'PAID', '2026-07-01T10:00:00Z'); // July

    const response = await dashboard(admin.token);

    expect(response.status).toBe(200);
    const { revenueByMonth } = response.body;
    expect(revenueByMonth).toHaveLength(6);
    expect(revenueByMonth.map((m) => m.label)).toEqual(['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']);
    expect(revenueByMonth.at(-1)).toEqual({ month: '2026-10', label: 'Oct', revenue: '1500.00' });
    expect(revenueByMonth.find((m) => m.month === '2026-09').revenue).toBe('4000.00');
    expect(revenueByMonth.find((m) => m.month === '2026-07').revenue).toBe('250.00');
    expect(revenueByMonth.find((m) => m.month === '2026-08').revenue).toBe('0.00');
  });

  it('ignores declined and refunded payments, and anything older than 6 months', async () => {
    await pay('900.00', 'DECLINED', '2026-10-05T10:00:00Z');
    await pay('900.00', 'REFUNDED', '2026-10-06T10:00:00Z');
    await pay('900.00', 'PAID', '2026-03-10T10:00:00Z'); // March: outside the 6-month window

    const response = await dashboard(admin.token);

    const total = response.body.revenueByMonth.reduce((sum, m) => sum + Number(m.revenue), 0);
    expect(total).toBe(0);
  });
});

describe('GET /api/gym/admin-dashboard – class attendance (last 30 days)', () => {
  // A past class where attendance was taken, with `booked` bookings of which `attended` came.
  async function pastClass(booked, attended, startsAt = '2026-10-10T07:00:00Z') {
    const gymClass = await createClass({ trainerId: trainer.user.id, startsAt: new Date(startsAt), attendanceOpenedAt: new Date(startsAt) });
    for (let i = 0; i < booked; i++) {
      const { user } = await createUser({ role: 'MEMBER' });
      await prisma.booking.create({
        data: { classId: gymClass.id, memberId: user.id, attendedAt: i < attended ? new Date(startsAt) : null, attendanceMethod: i < attended ? 'QR' : null },
      });
    }
    return gymClass;
  }

  it('computes the share of booked members who actually came', async () => {
    await pastClass(5, 4); // 4 of 5
    await pastClass(3, 2); // 2 of 3

    const response = await dashboard(admin.token);

    expect(response.body.attendance).toEqual({ classes: 2, booked: 8, attended: 6, noShows: 2, rate: 75 });
  });

  it('leaves out classes where attendance was never taken, future classes, and cancelled classes', async () => {
    await pastClass(4, 4); // counts
    // Attendance never opened: a no-show here would be unfair, so it is excluded.
    const noAttendance = await createClass({ trainerId: trainer.user.id, startsAt: new Date('2026-10-11T07:00:00Z') });
    await prisma.booking.create({ data: { classId: noAttendance.id, memberId: member.id } });
    // A future class.
    await pastClass(3, 0, '2026-10-25T07:00:00Z');
    // Older than 30 days.
    await pastClass(2, 0, '2026-09-01T07:00:00Z');

    const response = await dashboard(admin.token);

    expect(response.body.attendance).toMatchObject({ classes: 1, booked: 4, attended: 4, rate: 100 });
  });

  it('reports rate null when there are no bookings to judge', async () => {
    const response = await dashboard(admin.token);

    expect(response.body.attendance).toEqual({ classes: 0, booked: 0, attended: 0, noShows: 0, rate: null });
  });
});

describe('GET /api/gym/admin-dashboard – access', () => {
  it('is admin-only (403 for a trainer, 401 without a token)', async () => {
    expect((await dashboard(trainer.token)).status).toBe(403);
    expect((await request(app).get('/api/gym/admin-dashboard')).status).toBe(401);
  });
});
