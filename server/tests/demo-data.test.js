import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { assertNotProduction, DEMO_PASSWORD, removeDemoData, seedDemoData } from '../prisma/demo-data.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';

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
