import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { assertNotProduction, DEMO_PASSWORD, removeDemoData, seedDemoData } from '../prisma/demo-data.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';
import { AVATAR_IDS } from '../src/utils/avatars.js';

// "Today" is 2026-10-15 in Istanbul.
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));

let admin;
let realMember;

beforeEach(async () => {
  await resetDatabase();
  admin = await createUser({ role: 'ADMIN', email: 'admin@gym.com' });
  // "Real" data that the demo seed must never touch.
  realMember = (await createUser({ role: 'MEMBER', email: 'real.member@gym.com' })).user;
  const realPlan = await createPlan({ name: 'Real plan' });
  await prisma.membership.create({
    data: { userId: realMember.id, planId: realPlan.id, startDate: parseDate('2026-10-01'), endDate: parseDate('2026-10-31'), price: 1000 },
  });
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

const counts = async () =>
  (await request(app).get('/api/users?role=MEMBER').set('Authorization', bearer(admin.token))).body.counts;

describe('seedDemoData', () => {
  it('also works on days where an exact end date is impossible (e.g. monthly ending 30 October)', async () => {
    // On 18 October, "ends in 12 days" means 30 October – no monthly membership ends on that day.
    await expect(seedDemoData(prisma, { today: parseDate('2026-10-18') })).resolves.toBeDefined();
  });

  it('gives some members a body history, one of them due for the monthly check-in', async () => {
    await seedDemoData(prisma, { today: parseDate('2026-10-15') });

    const elif = await prisma.user.findFirst({ where: { firstName: 'Elif' }, include: { bodyCheckIns: { orderBy: { recordedOn: 'desc' } } } });
    expect(elif.bodyCheckIns.length).toBeGreaterThan(1);
    // Latest check-in 35 days ago: the reminder shows for Elif.
    expect(elif.bodyCheckIns[0].recordedOn).toEqual(parseDate('2026-09-10'));
  });

  it('adds partner gyms for the map, and removes only those again', async () => {
    await prisma.partnerGym.create({ data: { name: 'Real partner', address: 'A', district: 'B', latitude: 41, longitude: 29, hours: [] } });
    await seedDemoData(prisma, { today: parseDate('2026-10-15') });
    expect(await prisma.partnerGym.count()).toBeGreaterThan(1);

    await removeDemoData(prisma);
    expect((await prisma.partnerGym.findMany()).map((g) => g.name)).toEqual(['Real partner']);
  });

  it('fills the exercise library with every muscle group, without duplicates when run twice', async () => {
    await seedDemoData(prisma, { today: parseDate('2026-10-15') });
    await seedDemoData(prisma, { today: parseDate('2026-10-15') });

    const groups = await prisma.exercise.groupBy({ by: ['muscleGroup'], _count: true });
    expect(groups).toHaveLength(8);
    expect(await prisma.exercise.count()).toBe(32);
  });

  it('gives demo people valid avatars, and leaves some with their initials', async () => {
    await seedDemoData(prisma, { today: parseDate('2026-10-15') });

    const demoUsers = await prisma.user.findMany({ where: { email: { endsWith: '@demo.gymflow.local' } } });
    const avatars = demoUsers.map((user) => user.avatar);
    expect(avatars.filter(Boolean).every((id) => AVATAR_IDS.includes(id))).toBe(true);
    expect(avatars).toContain(null);
  });

  it('creates members in every membership situation', async () => {
    await seedDemoData(prisma, { today: parseDate('2026-10-15') });

    // 12 demo members + 1 real member (who is active)
    expect(await counts()).toEqual({ all: 13, active: 9, expiring: 4, expired: 2, upcoming: 1, none: 1 });
  });

  it('creates memberships whose length matches their plan', async () => {
    await seedDemoData(prisma, { today: parseDate('2026-10-15') });

    const can = await prisma.user.findFirst({ where: { firstName: 'Can' }, include: { memberships: true } });
    expect(can.memberships[0].startDate.toISOString().slice(0, 10)).toBe('2026-09-19');
    expect(can.memberships[0].endDate.toISOString().slice(0, 10)).toBe('2026-10-18');
  });

  it('creates accounts you can log in with', async () => {
    await seedDemoData(prisma, { today: parseDate('2026-10-15') });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'elif@demo.gymflow.local', password: DEMO_PASSWORD });

    expect(login.status).toBe(200);
  });

  it('can be run again without creating duplicates', async () => {
    await seedDemoData(prisma, { today: parseDate('2026-10-15') });
    await seedDemoData(prisma, { today: parseDate('2026-10-15') });

    expect(await prisma.user.count({ where: { email: { endsWith: '@demo.gymflow.local' } } })).toBe(14);
    expect(await prisma.membershipPlan.count({ where: { name: 'Monthly' } })).toBe(1);
  });

  it('never changes real users or their memberships', async () => {
    await seedDemoData(prisma, { today: parseDate('2026-10-15') });

    const real = await prisma.user.findUnique({ where: { id: realMember.id }, include: { memberships: true } });
    expect(real.memberships).toHaveLength(1);
    expect(await prisma.user.count({ where: { email: { endsWith: '@gym.com' } } })).toBe(2);
  });
});

describe('demo classes', () => {
  const today = parseDate('2026-10-15'); // a Thursday; "now" is 12:00 in Istanbul

  it('creates future class sessions with full information', async () => {
    const { classes } = await seedDemoData(prisma, { today });

    const running = await prisma.gymClass.findFirst({ where: { title: 'Running Club' }, orderBy: { startsAt: 'asc' } });
    expect(classes).toBeGreaterThan(10);
    expect(running.startsAt.toISOString()).toBe('2026-10-17T05:00:00.000Z'); // Saturday 08:00 in Istanbul
    expect(running.location).toBe('Bebek Park, main entrance');
    expect(running.healthNotes).not.toBe('');
    expect(await prisma.gymClass.count({ where: { startsAt: { lte: new Date() } } })).toBe(0);
  });

  it('never books more members than a class has places', async () => {
    await seedDemoData(prisma, { today });

    const classes = await prisma.gymClass.findMany({ include: { _count: { select: { bookings: true } } } });
    for (const gymClass of classes) {
      expect(gymClass._count.bookings).toBeLessThanOrEqual(gymClass.capacity);
    }
  });

  it('only books members whose membership is valid on the class day', async () => {
    await seedDemoData(prisma, { today });

    const bookings = await prisma.booking.findMany({ include: { gymClass: true, member: { include: { memberships: true } } } });
    expect(bookings.length).toBeGreaterThan(0);
    for (const { gymClass, member } of bookings) {
      const day = parseDate(gymClass.startsAt.toISOString().slice(0, 10));
      expect(member.memberships.some((m) => m.startDate <= day && day <= m.endDate)).toBe(true);
    }
  });

  it('replaces demo classes when run again and keeps real classes', async () => {
    const realTrainer = await createUser({ role: 'TRAINER', email: 'real.trainer@gym.com' });
    await prisma.gymClass.create({
      data: {
        title: 'Real class', category: 'YOGA', description: 'A real class created by the gym itself.', location: 'Studio 3',
        startsAt: new Date('2026-10-20T07:00:00Z'), durationMinutes: 60, capacity: 10, level: 'BEGINNER', intensity: 'LOW',
        trainerId: realTrainer.user.id,
      },
    });

    const first = await seedDemoData(prisma, { today });
    await seedDemoData(prisma, { today });

    expect(await prisma.gymClass.count()).toBe(first.classes + 1);
    expect(await prisma.gymClass.count({ where: { title: 'Real class' } })).toBe(1);

    await removeDemoData(prisma);
    expect(await prisma.gymClass.count()).toBe(1);
  });
});

describe('demo check-ins', () => {
  const today = parseDate('2026-10-15'); // "now" is 12:00 in Istanbul

  it('creates a visit history with at most one visit per member per day', async () => {
    const { checkIns } = await seedDemoData(prisma, { today });

    expect(checkIns).toBeGreaterThan(50);
    // The unique index (member, day) would have rejected duplicates, so reaching here proves there are none.
    expect(await prisma.checkIn.count()).toBe(checkIns);
  });

  it('only records visits on days when the member’s membership was valid', async () => {
    await seedDemoData(prisma, { today });

    const visits = await prisma.checkIn.findMany({ include: { member: { include: { memberships: true } } } });
    for (const { gymDay, member } of visits) {
      expect(member.memberships.some((m) => m.startDate <= gymDay && gymDay <= m.endDate)).toBe(true);
    }
  });

  it('gives the most frequent visitor the Gold level', async () => {
    await seedDemoData(prisma, { today });

    const mehmet = await prisma.user.findFirst({ where: { firstName: 'Mehmet' } });
    expect(await prisma.checkIn.count({ where: { memberId: mehmet.id } })).toBeGreaterThanOrEqual(30);
  });

  it('includes check-ins from earlier today, but none in the future', async () => {
    await seedDemoData(prisma, { today });

    expect(await prisma.checkIn.count({ where: { gymDay: today } })).toBeGreaterThan(0);
    expect(await prisma.checkIn.count({ where: { checkedInAt: { gt: new Date() } } })).toBe(0);
  });
});

describe('removeDemoData', () => {
  it('removes demo accounts and keeps real data', async () => {
    await seedDemoData(prisma, { today: parseDate('2026-10-15') });

    const { removedUsers } = await removeDemoData(prisma);

    expect(removedUsers).toBe(14);
    expect(await prisma.user.count()).toBe(2);
    expect(await prisma.membership.count()).toBe(1); // the real member's membership
  });
});

describe('assertNotProduction', () => {
  it('refuses to run in production', () => {
    expect(() => assertNotProduction('production')).toThrow(/production/);
    expect(() => assertNotProduction('development')).not.toThrow();
  });
});
