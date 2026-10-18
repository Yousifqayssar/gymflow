import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';

const BESIKTAS = {
  name: 'Besiktas Strength Studio',
  address: 'Example Street 5',
  district: 'Besiktas, Istanbul',
  phone: '+90 212 000 00 01',
  latitude: 41.0428,
  longitude: 29.0075,
  hours: [
    { day: 6, open: '09:00', close: '20:00' },
    { day: 1, open: '06:00', close: '23:00' },
  ],
};

let admin;
let member;
const api = (method, path, token = admin.token) => request(app)[method](`/api/partner-gyms${path}`).set('Authorization', bearer(token));

beforeEach(async () => {
  await resetDatabase();
  admin = await createUser({ role: 'ADMIN' });
  member = await createUser({ role: 'MEMBER' });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('partner gyms', () => {
  it('lets an admin add a gym that every logged-in user then sees, hours sorted Monday first', async () => {
    const created = await api('post', '').send(BESIKTAS);

    expect(created.status).toBe(201);
    const list = await api('get', '', member.token);
    expect(list.status).toBe(200);
    expect(list.body.gyms).toEqual([
      expect.objectContaining({
        name: 'Besiktas Strength Studio',
        latitude: 41.0428,
        longitude: 29.0075,
        hours: [
          { day: 1, open: '06:00', close: '23:00' },
          { day: 6, open: '09:00', close: '20:00' },
        ],
      }),
    ]);
  });

  it('lets an admin edit and delete a gym', async () => {
    const { id } = (await api('post', '').send(BESIKTAS)).body.gym;

    const updated = await api('put', `/${id}`).send({ ...BESIKTAS, phone: '', hours: [] });
    expect(updated.status).toBe(200);
    expect(updated.body.gym).toMatchObject({ phone: null, hours: [] });

    expect((await api('delete', `/${id}`)).status).toBe(204);
    expect(await prisma.partnerGym.count()).toBe(0);
  });

  it('does not allow two gyms with the same name (409)', async () => {
    await api('post', '').send(BESIKTAS);

    expect((await api('post', '').send(BESIKTAS)).status).toBe(409);
  });

  it.each([
    [{ ...BESIKTAS, latitude: 120 }, 'latitude'],
    [{ ...BESIKTAS, name: ' ' }, 'name'],
    [{ ...BESIKTAS, hours: [{ day: 1, open: '23:00', close: '06:00' }] }, 'hours'],
    [{ ...BESIKTAS, hours: [{ day: 8, open: '06:00', close: '23:00' }] }, 'hours'],
    [{ ...BESIKTAS, hours: [{ day: 1, open: '6am', close: '23:00' }] }, 'hours'],
    [{ ...BESIKTAS, hours: [{ day: 1, open: '06:00', close: '12:00' }, { day: 1, open: '13:00', close: '20:00' }] }, 'hours'],
  ])('rejects invalid data (400) – %#', async (body, field) => {
    const response = await api('post', '').send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.details.some((d) => d.field.startsWith(field))).toBe(true);
  });

  it.each(['MEMBER', 'TRAINER'])('does not let a %s manage gyms (403)', async (role) => {
    const { token } = await createUser({ role });

    expect((await api('post', '', token).send(BESIKTAS)).status).toBe(403);
  });

  it('returns 404 for an unknown gym', async () => {
    expect((await api('put', '/9999').send(BESIKTAS)).status).toBe(404);
    expect((await api('delete', '/9999')).status).toBe(404);
  });

  it('needs a login to see the gyms (401)', async () => {
    expect((await request(app).get('/api/partner-gyms')).status).toBe(401);
  });
});
