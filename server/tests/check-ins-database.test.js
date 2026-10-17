import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { parseDate } from '../src/utils/dates.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';

// Database rules for QR tokens and check-ins ("last line of defence").

let member;

beforeEach(async () => {
  await resetDatabase();
  member = (await createUser({ role: 'MEMBER' })).user;
});

afterAll(async () => {
  await prisma.$disconnect();
});

const checkIn = (day, method = 'QR') =>
  prisma.checkIn.create({ data: { memberId: member.id, gymDay: parseDate(day), method } });

describe('QR tokens', () => {
  it('gives every new user a random token automatically', async () => {
    const other = (await createUser({ role: 'MEMBER' })).user;

    expect(member.qrToken).toMatch(/^[0-9a-f-]{36}$/);
    expect(other.qrToken).not.toBe(member.qrToken);
  });

  it('never sends QR tokens in user lists (they are secret)', async () => {
    const { token } = await createUser({ role: 'ADMIN' });

    const response = await request(app).get('/api/users').set('Authorization', bearer(token));

    expect(JSON.stringify(response.body)).not.toContain('qrToken');
    expect(JSON.stringify(response.body)).not.toContain(member.qrToken);
  });

  it('rejects two users with the same token', async () => {
    const other = (await createUser({ role: 'MEMBER' })).user;

    await expect(prisma.user.update({ where: { id: other.id }, data: { qrToken: member.qrToken } })).rejects.toThrow(/Unique constraint/);
  });
});

describe('check-in rules', () => {
  it('stores a check-in with the time it happened', async () => {
    const visit = await checkIn('2026-10-15');

    expect(visit.checkedInAt).toBeInstanceOf(Date);
    expect(visit.method).toBe('QR');
  });

  it('allows only one check-in per member per day', async () => {
    await checkIn('2026-10-15');

    await expect(checkIn('2026-10-15', 'MANUAL')).rejects.toThrow(/Unique constraint/);
  });

  it('allows check-ins on different days', async () => {
    await checkIn('2026-10-15');
    await checkIn('2026-10-16');

    expect(await prisma.checkIn.count()).toBe(2);
  });

  it('deletes a member’s visits with the member', async () => {
    await checkIn('2026-10-15');

    await prisma.user.delete({ where: { id: member.id } });

    expect(await prisma.checkIn.count()).toBe(0);
  });

  it('keeps the visit when the staff account that recorded it is deleted', async () => {
    const staff = (await createUser({ role: 'TRAINER' })).user;
    await prisma.checkIn.create({ data: { memberId: member.id, gymDay: parseDate('2026-10-15'), method: 'QR', checkedInById: staff.id } });

    await prisma.user.delete({ where: { id: staff.id } });

    const visit = await prisma.checkIn.findFirst();
    expect(visit.checkedInById).toBeNull();
  });
});
