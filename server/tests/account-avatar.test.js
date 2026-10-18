import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';

const setAvatar = (token, avatar) =>
  request(app).put('/api/account/avatar').set('Authorization', bearer(token)).send({ avatar });

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('PUT /api/account/avatar', () => {
  it.each(['MEMBER', 'TRAINER', 'ADMIN'])('lets a %s choose an avatar', async (role) => {
    const { token, user } = await createUser({ role });

    const response = await setAvatar(token, 'notionists-felix');

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ id: user.id, avatar: 'notionists-felix' });
    expect((await prisma.user.findUnique({ where: { id: user.id } })).avatar).toBe('notionists-felix');
  });

  it('shows the chosen avatar after the next login check (GET /api/auth/me)', async () => {
    const { token } = await createUser();
    await setAvatar(token, 'badge-dumbbell');

    const me = await request(app).get('/api/auth/me').set('Authorization', bearer(token));

    expect(me.body.user.avatar).toBe('badge-dumbbell');
  });

  it('goes back to the initials with null', async () => {
    const { token } = await createUser();
    await setAvatar(token, 'lorelei-mia');

    const response = await setAvatar(token, null);

    expect(response.status).toBe(200);
    expect(response.body.user.avatar).toBeNull();
  });

  it.each(['notionists-unknown', 'https://example.com/me.png', '', 42])('rejects %s, which is not one of our avatars (400)', async (avatar) => {
    const { token } = await createUser();

    expect((await setAvatar(token, avatar)).status).toBe(400);
  });

  it('needs a login (401)', async () => {
    expect((await request(app).put('/api/account/avatar').send({ avatar: 'badge-zap' })).status).toBe(401);
  });

  it('only changes the logged-in user', async () => {
    const me = await createUser();
    const other = await createUser();

    await setAvatar(me.token, 'badge-zap');

    expect((await prisma.user.findUnique({ where: { id: other.user.id } })).avatar).toBeNull();
  });
});
