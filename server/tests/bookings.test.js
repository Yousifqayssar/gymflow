import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';
import { createClass } from './helpers/classes.js';

// "Now" is Thursday 15 October 2026, 09:00 UTC (12:00 in Istanbul).
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));

let trainer;
let member;
let plan;

// A member with a Premium membership (10 classes a month) valid for the whole of October.
// The class limits themselves are tested in class-balance.test.js.
async function memberWithMembership(start = '2026-10-01', end = '2026-10-31') {
  const created = await createUser({ role: 'MEMBER' });
  await prisma.membership.create({
    data: { userId: created.user.id, planId: plan.id, startDate: parseDate(start), endDate: parseDate(end), price: 1000, classesPerMonth: 10 },
  });
  return created;
}

beforeEach(async () => {
  await resetDatabase();
  plan = await createPlan();
  trainer = await createUser({ role: 'TRAINER' });
  member = await memberWithMembership();
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

const book = (classId, token = member.token) =>
  request(app).post(`/api/classes/${classId}/book`).set('Authorization', bearer(token));
const unbook = (classId, token = member.token) =>
  request(app).delete(`/api/classes/${classId}/book`).set('Authorization', bearer(token));
const newClass = (overrides = {}) => createClass({ trainerId: trainer.user.id, ...overrides });

describe('POST /api/classes/:id/book', () => {
  it('books a spot for a member with a valid membership', async () => {
    const gymClass = await newClass();

    const response = await book(gymClass.id);

    expect(response.status).toBe(201);
    expect(response.body.class).toMatchObject({ isBookedByMe: true, bookedCount: 1, spotsLeft: 9 });
  });

  it('does not let a member book the same class twice (409)', async () => {
    const gymClass = await newClass();
    await book(gymClass.id);

    const response = await book(gymClass.id);

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('You have already booked this class');
  });

  it('does not book a class beyond its capacity (409)', async () => {
    const gymClass = await newClass({ capacity: 1 });
    const other = await memberWithMembership();
    await book(gymClass.id, other.token);

    const response = await book(gymClass.id);

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('This class is full');
  });

  it('does not book a class that has already started (400)', async () => {
    const gymClass = await newClass({ startsAt: new Date('2026-10-15T08:30:00Z') });

    const response = await book(gymClass.id);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('This class has already started');
  });

  it('does not book a cancelled class (400)', async () => {
    const gymClass = await newClass({ isCancelled: true });

    const response = await book(gymClass.id);

    expect(response.status).toBe(400);
  });

  it('requires a membership (403)', async () => {
    const withoutMembership = await createUser({ role: 'MEMBER' });
    const gymClass = await newClass();

    const response = await book(gymClass.id, withoutMembership.token);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('You need a valid membership on the day of the class');
  });

  it('requires the membership to be valid on the day of the class, not just today', async () => {
    const gymClass = await newClass({ startsAt: new Date('2026-11-05T07:00:00Z') }); // membership ends 31 Oct

    const response = await book(gymClass.id);

    expect(response.status).toBe(403);
  });

  it('accepts a membership that starts later, if it is valid on the class day', async () => {
    const renewing = await memberWithMembership('2026-11-01', '2026-11-30');
    const gymClass = await newClass({ startsAt: new Date('2026-11-05T07:00:00Z') });

    const response = await book(gymClass.id, renewing.token);

    expect(response.status).toBe(201);
  });

  it('uses the gym’s time zone for the class day', async () => {
    // Membership ends on 31 October. 20:30 UTC is 23:30 in Istanbul (still 31 Oct) → allowed.
    // 21:30 UTC is 00:30 on 1 November in Istanbul → not allowed, although it is 31 Oct in UTC.
    const lateEvening = await newClass({ startsAt: new Date('2026-10-31T20:30:00Z') });
    const afterMidnight = await newClass({ startsAt: new Date('2026-10-31T21:30:00Z') });

    expect((await book(lateEvening.id)).status).toBe(201);
    expect((await book(afterMidnight.id)).status).toBe(403);
  });

  it('never overbooks when many members try to book the last spots at the same time', async () => {
    const gymClass = await newClass({ capacity: 2 });
    const members = await Promise.all([1, 2, 3, 4, 5, 6].map(() => memberWithMembership()));

    // Six members press "Book" at the same moment for the last two spots.
    const responses = await Promise.all(members.map((m) => book(gymClass.id, m.token)));

    const statuses = responses.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 201, 409, 409, 409, 409]);
    expect(await prisma.booking.count({ where: { classId: gymClass.id } })).toBe(2);
  });

  it('is only for members (trainers and admins get 403)', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const gymClass = await newClass();

    expect((await book(gymClass.id, trainer.token)).status).toBe(403);
    expect((await book(gymClass.id, admin.token)).status).toBe(403);
  });

  it('returns 404 for an unknown class', async () => {
    expect((await book(9999)).status).toBe(404);
  });
});

describe('DELETE /api/classes/:id/book', () => {
  it('cancels the booking and frees the spot', async () => {
    const gymClass = await newClass({ capacity: 1 });
    await book(gymClass.id);

    const response = await unbook(gymClass.id);

    expect(response.status).toBe(200);
    expect(response.body.class).toMatchObject({ isBookedByMe: false, spotsLeft: 1 });
  });

  it('lets another member book the freed spot', async () => {
    const gymClass = await newClass({ capacity: 1 });
    const other = await memberWithMembership();
    await book(gymClass.id);
    await unbook(gymClass.id);

    expect((await book(gymClass.id, other.token)).status).toBe(201);
  });

  it('returns 404 when the member has not booked the class', async () => {
    const gymClass = await newClass();

    expect((await unbook(gymClass.id)).status).toBe(404);
  });

  it('cannot cancel after the class has started (400)', async () => {
    const gymClass = await newClass({ startsAt: new Date('2026-10-15T08:30:00Z') });
    await prisma.booking.create({ data: { classId: gymClass.id, memberId: member.user.id } });

    expect((await unbook(gymClass.id)).status).toBe(400);
  });
});

describe('GET /api/me/bookings', () => {
  it('lists the member’s upcoming booked classes, earliest first', async () => {
    const later = await newClass({ title: 'Later', startsAt: new Date('2026-10-22T07:00:00Z') });
    const sooner = await newClass({ title: 'Sooner', startsAt: new Date('2026-10-16T07:00:00Z') });
    await newClass({ title: 'Not booked' });
    const past = await newClass({ title: 'Past', startsAt: new Date('2026-10-14T07:00:00Z') });
    await book(later.id);
    await book(sooner.id);
    await prisma.booking.create({ data: { classId: past.id, memberId: member.user.id } });

    const response = await request(app).get('/api/me/bookings').set('Authorization', bearer(member.token));

    expect(response.status).toBe(200);
    expect(response.body.classes.map((c) => c.title)).toEqual(['Sooner', 'Later']);
  });

  it('is only for members (403)', async () => {
    const response = await request(app).get('/api/me/bookings').set('Authorization', bearer(trainer.token));

    expect(response.status).toBe(403);
  });
});
