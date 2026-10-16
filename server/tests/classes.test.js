import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createClass } from './helpers/classes.js';

// "Now" is Thursday 15 October 2026, 09:00 UTC (12:00 in Istanbul).
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));

let admin;
let trainer;
let otherTrainer;
let member;

beforeEach(async () => {
  await resetDatabase();
  admin = await createUser({ role: 'ADMIN' });
  trainer = await createUser({ role: 'TRAINER', firstName: 'Mert', lastName: 'Aydin' });
  otherTrainer = await createUser({ role: 'TRAINER', firstName: 'Gizem', lastName: 'Erdem' });
  member = await createUser({ role: 'MEMBER' });
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

const runningClub = {
  title: 'Running Club',
  category: 'RUNNING',
  description: 'A 10 km group run along the Bosphorus from Bebek Park to Ortaköy at a steady pace.',
  location: 'Bebek Park, main entrance',
  startsAt: '2026-10-24T08:00:00+03:00',
  durationMinutes: 75,
  capacity: 15,
  level: 'INTERMEDIATE',
  intensity: 'HIGH',
  whatToBring: 'Running shoes, water bottle',
  healthNotes: 'Not suitable for knee or ankle injuries.',
};

const post = (token, body) => request(app).post('/api/classes').set('Authorization', bearer(token)).send(body);
const patch = (token, id, body) => request(app).patch(`/api/classes/${id}`).set('Authorization', bearer(token)).send(body);
const book = (classId, memberId) => prisma.booking.create({ data: { classId, memberId } });

describe('POST /api/classes', () => {
  it('lets an admin create a class for a trainer, with all its information', async () => {
    const response = await post(admin.token, { ...runningClub, trainerId: trainer.user.id });

    expect(response.status).toBe(201);
    expect(response.body.class).toMatchObject({
      title: 'Running Club',
      category: 'RUNNING',
      location: 'Bebek Park, main entrance',
      startsAt: '2026-10-24T05:00:00.000Z', // 08:00 in Istanbul = 05:00 UTC
      endsAt: '2026-10-24T06:15:00.000Z',
      capacity: 15,
      bookedCount: 0,
      spotsLeft: 15,
      whatToBring: 'Running shoes, water bottle',
      healthNotes: 'Not suitable for knee or ankle injuries.',
      isCancelled: false,
      trainer: { id: trainer.user.id, firstName: 'Mert', lastName: 'Aydin' },
    });
  });

  it('makes a trainer the trainer of their own class, even if another trainer id is sent', async () => {
    const response = await post(trainer.token, { ...runningClub, trainerId: otherTrainer.user.id });

    expect(response.status).toBe(201);
    expect(response.body.class.trainer.id).toBe(trainer.user.id);
  });

  it('requires admins to choose a trainer', async () => {
    const response = await post(admin.token, runningClub);

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('trainerId');
  });

  it('only accepts real trainers as trainer', async () => {
    const response = await post(admin.token, { ...runningClub, trainerId: member.user.id });

    expect(response.status).toBe(400);
  });

  it('rejects a class that starts in the past', async () => {
    const response = await post(trainer.token, { ...runningClub, startsAt: '2026-10-15T08:59:00Z' });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0]).toEqual({ field: 'startsAt', message: 'The class must start in the future' });
  });

  it.each([
    ['a capacity of 0', { capacity: 0 }, 'capacity'],
    ['a description that is too short', { description: 'Run fast.' }, 'description'],
    ['a duration of 10 minutes', { durationMinutes: 10 }, 'durationMinutes'],
    ['an unknown category', { category: 'SWIMMING' }, 'category'],
    ['a start time without time zone', { startsAt: '2026-10-24 08:00' }, 'startsAt'],
  ])('rejects %s (400)', async (_label, change, field) => {
    const response = await post(trainer.token, { ...runningClub, ...change });

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((d) => d.field)).toContain(field);
  });

  it('is forbidden for members (403)', async () => {
    const response = await post(member.token, runningClub);

    expect(response.status).toBe(403);
  });
});

describe('GET /api/classes (schedule)', () => {
  it('lists upcoming classes, earliest first, with spots left', async () => {
    const later = await createClass({ trainerId: trainer.user.id, title: 'Later', startsAt: new Date('2026-10-22T07:00:00Z') });
    const sooner = await createClass({ trainerId: trainer.user.id, title: 'Sooner', startsAt: new Date('2026-10-16T07:00:00Z'), capacity: 2 });
    await createClass({ trainerId: trainer.user.id, title: 'Yesterday', startsAt: new Date('2026-10-14T07:00:00Z') });
    await createClass({ trainerId: trainer.user.id, title: 'In a month', startsAt: new Date('2026-11-20T07:00:00Z') });
    await book(sooner.id, member.user.id);

    const response = await request(app).get('/api/classes').set('Authorization', bearer(member.token));

    expect(response.status).toBe(200);
    expect(response.body.classes.map((c) => c.title)).toEqual(['Sooner', 'Later']);
    expect(response.body.classes[0]).toMatchObject({ bookedCount: 1, spotsLeft: 1, isBookedByMe: true });
    expect(response.body.classes[1]).toMatchObject({ id: later.id, isBookedByMe: false });
  });

  it('filters by category', async () => {
    await createClass({ trainerId: trainer.user.id, title: 'Yoga', category: 'YOGA' });
    await createClass({ trainerId: trainer.user.id, title: 'Boxing', category: 'BOXING' });

    const response = await request(app).get('/api/classes?category=BOXING').set('Authorization', bearer(member.token));

    expect(response.body.classes.map((c) => c.title)).toEqual(['Boxing']);
  });

  it('accepts a custom date range', async () => {
    await createClass({ trainerId: trainer.user.id, title: 'In a month', startsAt: new Date('2026-11-20T07:00:00Z') });

    const response = await request(app)
      .get('/api/classes?from=2026-11-01T00:00:00Z&to=2026-12-01T00:00:00Z')
      .set('Authorization', bearer(member.token));

    expect(response.body.classes.map((c) => c.title)).toEqual(['In a month']);
  });

  it('requires login (401)', async () => {
    expect((await request(app).get('/api/classes')).status).toBe(401);
  });
});

describe('GET /api/classes/:id', () => {
  it('shows the list of booked members to the class’s trainer and to admins', async () => {
    const gymClass = await createClass({ trainerId: trainer.user.id });
    await book(gymClass.id, member.user.id);

    const byTrainer = await request(app).get(`/api/classes/${gymClass.id}`).set('Authorization', bearer(trainer.token));
    const byAdmin = await request(app).get(`/api/classes/${gymClass.id}`).set('Authorization', bearer(admin.token));

    expect(byTrainer.body.class.attendees.map((a) => a.id)).toEqual([member.user.id]);
    expect(byAdmin.body.class.attendees).toHaveLength(1);
  });

  it('hides the list of booked members from members and other trainers', async () => {
    const gymClass = await createClass({ trainerId: trainer.user.id });
    await book(gymClass.id, member.user.id);

    const byMember = await request(app).get(`/api/classes/${gymClass.id}`).set('Authorization', bearer(member.token));
    const byOther = await request(app).get(`/api/classes/${gymClass.id}`).set('Authorization', bearer(otherTrainer.token));

    expect(byMember.body.class).not.toHaveProperty('attendees');
    expect(byMember.body.class.bookedCount).toBe(1);
    expect(byOther.body.class).not.toHaveProperty('attendees');
  });

  it('returns 404 for an unknown class', async () => {
    const response = await request(app).get('/api/classes/9999').set('Authorization', bearer(member.token));

    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/classes/:id', () => {
  it('lets the trainer change their own class', async () => {
    const gymClass = await createClass({ trainerId: trainer.user.id });

    const response = await patch(trainer.token, gymClass.id, { location: 'Studio 2', capacity: 12 });

    expect(response.status).toBe(200);
    expect(response.body.class).toMatchObject({ location: 'Studio 2', capacity: 12 });
  });

  it('forbids trainers to change another trainer’s class (403)', async () => {
    const gymClass = await createClass({ trainerId: trainer.user.id });

    const response = await patch(otherTrainer.token, gymClass.id, { location: 'Studio 2' });

    expect(response.status).toBe(403);
  });

  it('lets an admin move a class to another trainer', async () => {
    const gymClass = await createClass({ trainerId: trainer.user.id });

    const response = await patch(admin.token, gymClass.id, { trainerId: otherTrainer.user.id });

    expect(response.body.class.trainer.id).toBe(otherTrainer.user.id);
  });

  it('does not lower the capacity below the bookings already made', async () => {
    const gymClass = await createClass({ trainerId: trainer.user.id, capacity: 5 });
    const second = await createUser({ role: 'MEMBER' });
    await book(gymClass.id, member.user.id);
    await book(gymClass.id, second.user.id);

    const response = await patch(trainer.token, gymClass.id, { capacity: 1 });

    expect(response.status).toBe(400);
  });

  it('does not change a class that has already started', async () => {
    const gymClass = await createClass({ trainerId: trainer.user.id, startsAt: new Date('2026-10-15T08:30:00Z') });

    const response = await patch(trainer.token, gymClass.id, { location: 'Studio 2' });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/classes/:id/cancel', () => {
  it('cancels a class, which stays visible as cancelled', async () => {
    const gymClass = await createClass({ trainerId: trainer.user.id });

    const response = await request(app).post(`/api/classes/${gymClass.id}/cancel`).set('Authorization', bearer(trainer.token));
    const list = await request(app).get('/api/classes').set('Authorization', bearer(member.token));

    expect(response.status).toBe(200);
    expect(response.body.class.isCancelled).toBe(true);
    expect(list.body.classes[0].isCancelled).toBe(true);
  });

  it('cannot cancel a class that has already started', async () => {
    const gymClass = await createClass({ trainerId: trainer.user.id, startsAt: new Date('2026-10-15T08:30:00Z') });

    const response = await request(app).post(`/api/classes/${gymClass.id}/cancel`).set('Authorization', bearer(admin.token));

    expect(response.status).toBe(400);
  });

  it('is forbidden for members (403)', async () => {
    const gymClass = await createClass({ trainerId: trainer.user.id });

    const response = await request(app).post(`/api/classes/${gymClass.id}/cancel`).set('Authorization', bearer(member.token));

    expect(response.status).toBe(403);
  });
});
