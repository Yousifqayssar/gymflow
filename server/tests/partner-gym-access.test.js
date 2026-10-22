import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';
import { createPlan } from './helpers/plans.js';

// Partner gyms are part of the membership: Premium members may also train there, Basic members
// only at our own gym. Every visit records where it happened.
// "Now" is Thursday 15 October 2026, 09:00 UTC (12:00 in Istanbul).
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-15T09:00:00Z'));

const BESIKTAS = {
  name: 'Besiktas Strength Studio',
  address: 'Example Street 5',
  district: 'Besiktas, Istanbul',
  latitude: 41.0428,
  longitude: 29.0075,
  hours: [{ day: 4, open: '06:00', close: '23:00' }],
};

let staff;
let admin;
let partner;

async function memberWith(classesPerMonth, firstName) {
  const created = await createUser({ role: 'MEMBER', firstName });
  const plan = await createPlan({ classesPerMonth });
  await prisma.membership.create({
    data: { userId: created.user.id, planId: plan.id, startDate: parseDate('2026-10-01'), endDate: parseDate('2026-10-31'), price: 1500, classesPerMonth },
  });
  return created;
}

beforeEach(async () => {
  await resetDatabase();
  staff = await createUser({ role: 'TRAINER' });
  admin = await createUser({ role: 'ADMIN' });
  partner = await prisma.partnerGym.create({ data: BESIKTAS });
});

afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

const scan = (member, partnerGymId) =>
  request(app).post('/api/check-ins').set('Authorization', bearer(staff.token)).send({ code: `GYMFLOW:${member.user.qrToken}`, partnerGymId });
const gymsFor = (token) => request(app).get('/api/partner-gyms').set('Authorization', bearer(token));

describe('check-in at a partner gym', () => {
  it('lets a Premium member in and records the location', async () => {
    const premium = await memberWith(10, 'Elif');

    const response = await scan(premium, partner.id);

    expect(response.status).toBe(201);
    expect(response.body.checkIn.location).toEqual({ id: partner.id, name: 'Besiktas Strength Studio' });
    expect(response.body.member.membership.isPremium).toBe(true);
    expect((await prisma.checkIn.findFirst()).partnerGymId).toBe(partner.id);
  });

  it('refuses a Basic member with the reason (403 PARTNER_GYM_PREMIUM_ONLY) and records nothing', async () => {
    const basic = await memberWith(0, 'Can');

    const response = await scan(basic, partner.id);

    expect(response.status).toBe(403);
    expect(response.body.error).toMatchObject({ code: 'PARTNER_GYM_PREMIUM_ONLY', message: expect.stringContaining('Can has a Basic membership') });
    expect(await prisma.checkIn.count()).toBe(0);
  });

  it('still lets a Basic member in at our own gym (no location)', async () => {
    const basic = await memberWith(0, 'Can');

    const response = await scan(basic);

    expect(response.status).toBe(201);
    expect(response.body.checkIn.location).toBeNull();
  });

  it('answers 404 for a partner gym that does not exist', async () => {
    const premium = await memberWith(10, 'Elif');

    expect((await scan(premium, 9999)).status).toBe(404);
  });

  it('counts one visit per day across all gyms, and says where the first one was', async () => {
    const premium = await memberWith(10, 'Elif');
    await scan(premium);

    const second = await scan(premium, partner.id);

    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({ alreadyCheckedIn: true, checkIn: { location: null }, points: 10 });
  });

  it('shows the location in today’s list and in the member’s recent visits', async () => {
    const premium = await memberWith(10, 'Elif');
    await scan(premium, partner.id);

    const today = await request(app).get('/api/check-ins/today').set('Authorization', bearer(staff.token));
    const visits = await request(app).get('/api/me/visits').set('Authorization', bearer(premium.token));

    expect(today.body.checkIns[0].location).toEqual({ id: partner.id, name: 'Besiktas Strength Studio' });
    expect(visits.body.recentVisits[0].location).toEqual({ id: partner.id, name: 'Besiktas Strength Studio' });
  });
});

describe('GET /api/partner-gyms – what the viewer may do', () => {
  it('Premium member: may train everywhere, with their visits per gym', async () => {
    const premium = await memberWith(10, 'Elif');
    await scan(premium, partner.id);

    const response = await gymsFor(premium.token);

    expect(response.body).toMatchObject({
      access: 'PREMIUM',
      homeGym: { canTrainHere: true, myVisits: 0 },
      gyms: [{ name: 'Besiktas Strength Studio', canTrainHere: true, myVisits: 1 }],
    });
  });

  it('Basic member: our own gym only', async () => {
    const basic = await memberWith(0, 'Can');

    const response = await gymsFor(basic.token);

    expect(response.body).toMatchObject({ access: 'BASIC', homeGym: { canTrainHere: true }, gyms: [{ canTrainHere: false }] });
  });

  it('member without a valid membership: nowhere', async () => {
    const nobody = await createUser({ role: 'MEMBER' });

    const response = await gymsFor(nobody.token);

    expect(response.body).toMatchObject({ access: 'NONE', homeGym: { canTrainHere: false }, gyms: [{ canTrainHere: false }] });
  });

  it('staff: visits per gym this month instead', async () => {
    const premium = await memberWith(10, 'Elif');
    await scan(premium, partner.id);

    const response = await gymsFor(admin.token);

    expect(response.body).toMatchObject({ access: null, homeGym: { visitsThisMonth: 0 }, gyms: [{ visitsThisMonth: 1 }] });
    expect(response.body.gyms[0].canTrainHere).toBeUndefined();
  });
});
