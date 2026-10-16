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

describe('GET /api/users filters', () => {
  let adminToken;

  beforeEach(async () => {
    adminToken = (await createUser({ role: 'ADMIN', firstName: 'Gym', lastName: 'Admin' })).token;
    await createUser({ role: 'MEMBER', firstName: 'Ali', lastName: 'Kaya', email: 'ali@example.com' });
    await createUser({ role: 'MEMBER', firstName: 'Zeynep', lastName: 'Demir', email: 'zeynep@example.com' });
    await createUser({ role: 'TRAINER', firstName: 'Mert', lastName: 'Aliyev', email: 'mert@example.com' });
  });

  const names = (response) => response.body.users.map((user) => user.firstName).sort();

  it('filters by role', async () => {
    const members = await request(app).get('/api/users?role=MEMBER').set('Authorization', bearer(adminToken));
    const trainers = await request(app).get('/api/users?role=TRAINER').set('Authorization', bearer(adminToken));

    expect(names(members)).toEqual(['Ali', 'Zeynep']);
    expect(names(trainers)).toEqual(['Mert']);
  });

  it('searches first name, last name and email, ignoring letter case', async () => {
    // "ali" matches the first name Ali, the last name Aliyev and the email ali@example.com
    const response = await request(app).get('/api/users?search=ALI').set('Authorization', bearer(adminToken));

    expect(names(response)).toEqual(['Ali', 'Mert']);
  });

  it('combines role and search', async () => {
    const response = await request(app)
      .get('/api/users?role=MEMBER&search=demir')
      .set('Authorization', bearer(adminToken));

    expect(names(response)).toEqual(['Zeynep']);
  });

  it('rejects an unknown role with 400', async () => {
    const response = await request(app).get('/api/users?role=SUPERUSER').set('Authorization', bearer(adminToken));

    expect(response.status).toBe(400);
  });
});

describe('POST /api/users (admin creates accounts)', () => {
  let adminToken;
  const newTrainer = {
    email: 'Coach@Example.com',
    password: 'trainer123',
    firstName: 'Mert',
    lastName: 'Aydin',
    role: 'TRAINER',
  };

  beforeEach(async () => {
    adminToken = (await createUser({ role: 'ADMIN' })).token;
  });

  it('creates a trainer account', async () => {
    const response = await request(app).post('/api/users').set('Authorization', bearer(adminToken)).send(newTrainer);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ email: 'coach@example.com', role: 'TRAINER' });
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('creates a member account', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', bearer(adminToken))
      .send({ ...newTrainer, role: 'MEMBER' });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('MEMBER');
  });

  it('creates an account the new user can log in with', async () => {
    await request(app).post('/api/users').set('Authorization', bearer(adminToken)).send(newTrainer);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'coach@example.com', password: 'trainer123' });

    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('TRAINER');
  });

  it('does not allow creating another ADMIN (400)', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', bearer(adminToken))
      .send({ ...newTrainer, role: 'ADMIN' });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('role');
  });

  it('requires a role (400)', async () => {
    const { role: _role, ...withoutRole } = newTrainer;

    const response = await request(app).post('/api/users').set('Authorization', bearer(adminToken)).send(withoutRole);

    expect(response.status).toBe(400);
  });

  it('rejects an email that is already registered (409)', async () => {
    await createUser({ email: 'coach@example.com' });

    const response = await request(app).post('/api/users').set('Authorization', bearer(adminToken)).send(newTrainer);

    expect(response.status).toBe(409);
  });

  it('is forbidden for trainers and members (403)', async () => {
    const trainer = await createUser({ role: 'TRAINER' });
    const member = await createUser({ role: 'MEMBER' });

    const byTrainer = await request(app).post('/api/users').set('Authorization', bearer(trainer.token)).send(newTrainer);
    const byMember = await request(app).post('/api/users').set('Authorization', bearer(member.token)).send(newTrainer);

    expect(byTrainer.status).toBe(403);
    expect(byMember.status).toBe(403);
  });
});
