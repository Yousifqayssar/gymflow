import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { verifyPassword } from '../src/utils/password.js';
import { resetDatabase } from './helpers/database.js';
import { authLimiterStore } from '../src/middleware/security.js';
import { createUser, bearer, TEST_PASSWORD } from './helpers/users.js';

const validRegistration = {
  email: 'ali@example.com',
  password: 'secret123',
  firstName: 'Ali',
  lastName: 'Kaya',
};

// Every test starts with an empty database.
// A clean database and a clean login-attempt counter for every test (see security.test.js for the limit itself).
beforeEach(async () => {
  await resetDatabase();
  await authLimiterStore.resetAll();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('creates a member account and returns the user with a token', async () => {
    const response = await request(app).post('/api/auth/register').send(validRegistration);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      email: 'ali@example.com',
      firstName: 'Ali',
      lastName: 'Kaya',
      role: 'MEMBER',
    });
    expect(response.body.token).toEqual(expect.any(String));
  });

  it('never returns the password or its hash', async () => {
    const response = await request(app).post('/api/auth/register').send(validRegistration);

    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('stores a bcrypt hash instead of the plain password', async () => {
    await request(app).post('/api/auth/register').send(validRegistration);

    const stored = await prisma.user.findUnique({ where: { email: 'ali@example.com' } });
    expect(stored.passwordHash).not.toBe(validRegistration.password);
    expect(await verifyPassword(validRegistration.password, stored.passwordHash)).toBe(true);
  });

  it('ignores a role sent by the client and always creates a MEMBER', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegistration, role: 'ADMIN' });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('MEMBER');
  });

  it('normalises the email (trim + lower case)', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegistration, email: '  Ali@Example.COM ' });

    expect(response.body.user.email).toBe('ali@example.com');
  });

  it('returns 409 when the email is already registered (in any letter case)', async () => {
    await request(app).post('/api/auth/register').send(validRegistration);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegistration, email: 'ALI@example.com' });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('Email is already registered');
  });

  it('returns 400 and lists every invalid field', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' });

    expect(response.status).toBe(400);
    const fields = response.body.error.details.map((detail) => detail.field);
    expect(fields).toEqual(['email', 'password', 'firstName', 'lastName']);
  });

  it('rejects passwords longer than 72 characters', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegistration, password: 'a'.repeat(73) });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await createUser({ email: 'member@example.com' });
  });

  it('returns the user and a token for correct credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@example.com', password: TEST_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('member@example.com');
    expect(response.body.token).toEqual(expect.any(String));
  });

  it('accepts the email in any letter case', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'MEMBER@example.com', password: TEST_PASSWORD });

    expect(response.status).toBe(200);
  });

  it('returns 401 for a wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@example.com', password: 'wrong-password' });

    expect(response.status).toBe(401);
  });

  it('gives the same answer for an unknown email as for a wrong password', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@example.com', password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: TEST_PASSWORD });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it('returns a token that works on protected routes', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@example.com', password: TEST_PASSWORD });

    const me = await request(app).get('/api/auth/me').set('Authorization', bearer(login.body.token));

    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('member@example.com');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the logged-in user', async () => {
    const { user, token } = await createUser();

    const response = await request(app).get('/api/auth/me').set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 401 without a token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
  });

  it('returns 401 when the header does not use the Bearer scheme', async () => {
    const { token } = await createUser();

    const response = await request(app).get('/api/auth/me').set('Authorization', `Token ${token}`);

    expect(response.status).toBe(401);
  });

  it('returns 401 for a token whose content was changed', async () => {
    const { token } = await createUser();
    // Change the role inside the token to ADMIN without re-signing it.
    const [header, payload, signature] = token.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const forgedPayload = Buffer.from(JSON.stringify({ ...decoded, role: 'ADMIN' })).toString('base64url');

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', bearer(`${header}.${forgedPayload}.${signature}`));

    expect(response.status).toBe(401);
  });

  it('returns 401 for a token signed with a different secret', async () => {
    const { user } = await createUser();
    const fakeToken = jwt.sign({ sub: String(user.id), role: 'ADMIN' }, 'some-other-secret-that-is-long-enough');

    const response = await request(app).get('/api/auth/me').set('Authorization', bearer(fakeToken));

    expect(response.status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    const { user } = await createUser();
    const oneMinuteAgo = Math.floor(Date.now() / 1000) - 60;
    const expiredToken = jwt.sign(
      { sub: String(user.id), role: user.role, exp: oneMinuteAgo },
      process.env.JWT_SECRET,
    );

    const response = await request(app).get('/api/auth/me').set('Authorization', bearer(expiredToken));

    expect(response.status).toBe(401);
  });

  it('returns 401 when the user no longer exists', async () => {
    const { user, token } = await createUser();
    await prisma.user.delete({ where: { id: user.id } });

    const response = await request(app).get('/api/auth/me').set('Authorization', bearer(token));

    expect(response.status).toBe(401);
  });
});
