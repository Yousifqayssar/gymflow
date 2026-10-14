import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, bearer } from './helpers/users.js';

beforeEach(resetDatabase);

afterAll(async () => {
  await prisma.$disconnect();
});

// GET /api/users is our first admin-only route: it proves role-based access control.
describe('GET /api/users (role-based access)', () => {
  it('returns 401 when not logged in', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(401);
  });

  it('returns 403 for a MEMBER', async () => {
    const { token } = await createUser({ role: 'MEMBER' });

    const response = await request(app).get('/api/users').set('Authorization', bearer(token));

    expect(response.status).toBe(403);
  });

  it('returns 403 for a TRAINER', async () => {
    const { token } = await createUser({ role: 'TRAINER' });

    const response = await request(app).get('/api/users').set('Authorization', bearer(token));

    expect(response.status).toBe(403);
  });

  it('returns all users for an ADMIN, without password hashes', async () => {
    const { token } = await createUser({ role: 'ADMIN' });
    await createUser({ role: 'MEMBER' });
    await createUser({ role: 'TRAINER' });

    const response = await request(app).get('/api/users').set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(3);
    for (const user of response.body.users) {
      expect(user).not.toHaveProperty('passwordHash');
    }
  });

  it('uses the current role from the database, not the role inside the token', async () => {
    // The token was issued while the user was a MEMBER...
    const { user, token } = await createUser({ role: 'MEMBER' });
    // ...then an admin promotes them. The same token must now have admin access.
    await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });

    const response = await request(app).get('/api/users').set('Authorization', bearer(token));

    expect(response.status).toBe(200);
  });
});
