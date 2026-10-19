import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { currentCode } from '../src/services/attendance.service.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';
import { createClass } from './helpers/classes.js';

// "Now" is Thursday 15 October 2026, 09:00 UTC. The class starts at 09:05 and lasts 60 minutes,
// so check-in is open (it opens 15 minutes before the start).
const NOW = new Date('2026-10-15T09:00:00Z');
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(NOW);

let trainer;
let member;
let gymClass;
let plan;

const at = (iso) => vi.setSystemTime(new Date(iso));
const book = (classId, memberId) => prisma.booking.create({ data: { classId, memberId } });
const addVisits = (memberId, count) =>
  prisma.checkIn.createMany({
    data: Array.from({ length: count }, (_, i) => ({
      memberId,
      checkedInAt: new Date(Date.UTC(2026, 8, 1 + i, 8)),
      gymDay: new Date(Date.UTC(2026, 8, 1 + i)),
      method: 'QR',
    })),
  });

beforeEach(async () => {
  at(NOW.toISOString());
  await resetDatabase();
  plan = await createPlan();
  trainer = await createUser({ role: 'TRAINER' });
  member = await createUser({ role: 'MEMBER', firstName: 'Elif' });
  gymClass = await createClass({ trainerId: trainer.user.id, startsAt: new Date('2026-10-15T09:05:00Z'), durationMinutes: 60 });
  await book(gymClass.id, member.user.id);
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

const openAttendance = (classId = gymClass.id, token = trainer.token) =>
  request(app).get(`/api/classes/${classId}/attendance`).set('Authorization', bearer(token));
const scan = (code, classId = gymClass.id, token = member.token) =>
  request(app).post(`/api/classes/${classId}/attend`).set('Authorization', bearer(token)).send({ code });
const visits = (token = member.token) => request(app).get('/api/me/visits').set('Authorization', bearer(token));

describe('GET /api/classes/:id/attendance (trainer screen)', () => {
  it('gives the changing QR code and the booked members, and records that attendance was taken', async () => {
    const response = await openAttendance();

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      serverTime: expect.any(String),
      isOpen: true,
      attendanceTaken: true,
      qr: { code: expect.any(String), path: `/attend/${gymClass.id}`, expiresAt: expect.any(String) },
      presentCount: 0,
      attendees: [{ id: member.user.id, firstName: 'Elif', attendedAt: null }],
    });
    expect((await prisma.gymClass.findUniqueOrThrow({ where: { id: gymClass.id } })).attendanceOpenedAt).not.toBeNull();
  });

  it('shows no code before check-in opens, and does not count as taking attendance', async () => {
    const later = await createClass({ trainerId: trainer.user.id, startsAt: new Date('2026-10-15T11:00:00Z') });

    const response = await openAttendance(later.id);

    expect(response.body).toMatchObject({ isOpen: false, qr: null, attendanceTaken: false });
  });

  it('only the class trainer and admins can open it', async () => {
    const otherTrainer = await createUser({ role: 'TRAINER' });
    const admin = await createUser({ role: 'ADMIN' });

    expect((await openAttendance(gymClass.id, otherTrainer.token)).status).toBe(403);
    expect((await openAttendance(gymClass.id, member.token)).status).toBe(403);
    expect((await openAttendance(gymClass.id, admin.token)).status).toBe(200);
  });
});

describe('POST /api/classes/:id/attend (member scans)', () => {
  it('marks the member present with the current code; scanning again is harmless', async () => {
    const { code } = currentCode(gymClass.id);

    const first = await scan(code);
    const second = await scan(code);

    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ alreadyAttended: false, gymClass: { id: gymClass.id, title: 'Morning Yoga' } });
    expect(second.body.alreadyAttended).toBe(true);
    const list = await openAttendance();
    expect(list.body.presentCount).toBe(1);
    expect(list.body.attendees[0].attendanceMethod).toBe('QR');
  });

  it('accepts the code that just changed, but not an older one (a photo sent home stops working)', async () => {
    const { code } = currentCode(gymClass.id);

    at('2026-10-15T09:00:31Z');
    expect((await scan(code)).status).toBe(200);

    await prisma.booking.updateMany({ data: { attendedAt: null } });
    at('2026-10-15T09:01:05Z');
    const tooOld = await scan(code);
    expect(tooOld.status).toBe(400);
    expect(tooOld.body.error.code).toBe('INVALID_CODE');
  });

  it('rejects made-up codes and codes of another class', async () => {
    const other = await createClass({ trainerId: trainer.user.id, startsAt: new Date('2026-10-15T09:05:00Z') });

    expect((await scan('not-a-real-code')).body.error.code).toBe('INVALID_CODE');
    expect((await scan(currentCode(other.id).code)).body.error.code).toBe('INVALID_CODE');
  });

  it('only members who booked the class can check in', async () => {
    const walkIn = await createUser({ role: 'MEMBER' });

    const response = await scan(currentCode(gymClass.id).code, gymClass.id, walkIn.token);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('NOT_BOOKED');
  });

  it('is open from 15 minutes before the start until the end of the class', async () => {
    at('2026-10-15T08:49:00Z');
    expect((await scan(currentCode(gymClass.id).code)).body.error.code).toBe('TOO_EARLY');

    at('2026-10-15T10:06:00Z');
    expect((await scan(currentCode(gymClass.id).code)).body.error.code).toBe('CLASS_ENDED');
  });

  it('a cancelled class cannot be checked in to', async () => {
    await prisma.gymClass.update({ where: { id: gymClass.id }, data: { isCancelled: true } });

    expect((await scan(currentCode(gymClass.id).code)).body.error.code).toBe('CLASS_CANCELLED');
  });
});

describe('PUT /api/classes/:id/attendance/:memberId (trainer marks by hand)', () => {
  const mark = (present, token = trainer.token) =>
    request(app).put(`/api/classes/${gymClass.id}/attendance/${member.user.id}`).set('Authorization', bearer(token)).send({ present });

  it('marks a member present (e.g. their phone is dead) and can undo it', async () => {
    const present = await mark(true);
    expect(present.body.attendees[0]).toMatchObject({ attendanceMethod: 'TRAINER', attendedAt: expect.any(String) });
    expect(present.body.attendanceTaken).toBe(true);

    const absent = await mark(false);
    expect(absent.body.attendees[0]).toMatchObject({ attendanceMethod: null, attendedAt: null });
  });

  it('can still correct the list after the class', async () => {
    at('2026-10-15T18:00:00Z');
    expect((await mark(true)).status).toBe(200);
  });

  it('is refused for members who did not book, and for other trainers', async () => {
    const stranger = await createUser({ role: 'MEMBER' });
    const otherTrainer = await createUser({ role: 'TRAINER' });

    const notBooked = await request(app).put(`/api/classes/${gymClass.id}/attendance/${stranger.user.id}`).set('Authorization', bearer(trainer.token)).send({ present: true });
    expect(notBooked.status).toBe(404);
    expect((await mark(true, otherTrainer.token)).status).toBe(403);
  });
});

describe('No-show penalty', () => {
  it('booked, attendance taken, did not scan, class over → −10 points and the class is listed', async () => {
    await addVisits(member.user.id, 3); // 30 points
    await openAttendance();

    at('2026-10-15T10:10:00Z'); // the class ended at 10:05
    const response = await visits();

    expect(response.body).toMatchObject({ visits: 3, noShows: 1, points: 20 });
    expect(response.body.missedClasses).toEqual([{ classId: gymClass.id, title: 'Morning Yoga', startsAt: '2026-10-15T09:05:00.000Z' }]);
    const detail = await request(app).get(`/api/classes/${gymClass.id}`).set('Authorization', bearer(member.token));
    expect(detail.body.class.myAttendance).toBe('MISSED');
  });

  it('no penalty while the class is still running', async () => {
    await addVisits(member.user.id, 3);
    await openAttendance();

    expect((await visits()).body.points).toBe(30);
  });

  it('no penalty for members who scanned', async () => {
    await addVisits(member.user.id, 3);
    await openAttendance();
    await scan(currentCode(gymClass.id).code);

    at('2026-10-15T10:10:00Z');
    expect((await visits()).body).toMatchObject({ noShows: 0, points: 30 });
    const detail = await request(app).get(`/api/classes/${gymClass.id}`).set('Authorization', bearer(member.token));
    expect(detail.body.class.myAttendance).toBe('ATTENDED');
  });

  it('no penalty when the trainer never took attendance', async () => {
    await addVisits(member.user.id, 3);

    at('2026-10-15T10:10:00Z');
    expect((await visits()).body).toMatchObject({ noShows: 0, points: 30 });
  });

  it('no penalty for a cancelled class', async () => {
    await addVisits(member.user.id, 3);
    await openAttendance();
    await prisma.gymClass.update({ where: { id: gymClass.id }, data: { isCancelled: true } });

    at('2026-10-15T10:10:00Z');
    expect((await visits()).body.noShows).toBe(0);
  });

  it('points never go below 0', async () => {
    await openAttendance();

    at('2026-10-15T10:10:00Z');
    expect((await visits()).body).toMatchObject({ visits: 0, noShows: 1, points: 0, level: 'Bronze' });
  });

  it('a no-show can lower the level and the membership discount', async () => {
    await addVisits(member.user.id, 30); // 300 points = Gold (10 %)
    await openAttendance();

    at('2026-10-15T10:10:00Z'); // 290 points = Silver (5 %)
    const summary = await visits();
    const preview = await request(app).get(`/api/me/membership/preview?planId=${plan.id}`).set('Authorization', bearer(member.token));

    expect(summary.body).toMatchObject({ points: 290, level: 'Silver' });
    expect(preview.body.preview).toMatchObject({ level: 'Silver', discountPercent: 5 });
  });

  it('the staff check-in screen shows the same points', async () => {
    await prisma.membership.create({
      data: { userId: member.user.id, planId: plan.id, startDate: parseDate('2026-10-01'), endDate: parseDate('2026-10-31'), price: 1000 },
    });
    await addVisits(member.user.id, 3);
    await openAttendance();

    at('2026-10-15T10:10:00Z');
    const qr = await request(app).get('/api/me/qr').set('Authorization', bearer(member.token));
    const checkIn = await request(app).post('/api/check-ins').set('Authorization', bearer(trainer.token)).send({ code: qr.body.qrContent });

    // 3 old visits + today's = 40, minus 10 for the missed class
    expect(checkIn.body).toMatchObject({ visits: 4, noShows: 1, points: 30 });
  });
});
