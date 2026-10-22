import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { AUTH_LIMIT, authLimiterStore } from '../src/middleware/security.js';
import { resetDatabase } from './helpers/database.js';
import { createUser, TEST_PASSWORD } from './helpers/users.js';

beforeEach(async () => {
  await resetDatabase();
  await authLimiterStore.resetAll();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const login = (email, password) => request(app).post('/api/auth/login').send({ email, password });

describe('login rate limit (against password guessing)', () => {
  it(`blocks the ${AUTH_LIMIT + 1}th failed attempt with 429 – even with the right password`, async () => {
    const { user } = await createUser({ role: 'MEMBER' });

    for (let i = 0; i < AUTH_LIMIT; i++) {
      expect((await login(user.email, 'wrong-password')).status).toBe(401);
    }
    const blocked = await login(user.email, TEST_PASSWORD);

    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatchObject({ code: 'TOO_MANY_ATTEMPTS', message: expect.stringContaining('15 minutes') });
  });

  it('does not count successful logins, so normal use is never blocked', async () => {
    const { user } = await createUser({ role: 'MEMBER' });

    for (let i = 0; i < AUTH_LIMIT + 5; i++) {
      expect((await login(user.email, TEST_PASSWORD)).status).toBe(200);
    }
  });

  it('also limits registration attempts', async () => {
    let last;
    for (let i = 0; i <= AUTH_LIMIT; i++) {
      last = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: 'x' });
    }

    expect(last.status).toBe(429);
  });

  it('tells the client how many attempts are left', async () => {
    const response = await login('nobody@gym.com', 'wrong-password');

    // e.g. "10-in-15min"; r=9; t=900 – 9 attempts left, the window resets in 900 seconds.
    expect(response.headers.ratelimit).toMatch(/r=9/);
  });
});

describe('security headers', () => {
  it('sends a strict Content Security Policy and other protective headers', async () => {
    const response = await request(app).get('/api/health');

    const csp = response.headers['content-security-policy'];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'wasm-unsafe-eval'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
