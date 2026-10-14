import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

// Integration tests: these go through the real Express app AND the real database.
// The PostgreSQL container must be running (docker compose up -d).

afterAll(async () => {
  // Close the database connection so the test process can exit cleanly.
  await prisma.$disconnect();
});

describe('GET /api/health', () => {
  it('returns 200 with status ok when the database is reachable', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.database).toBe('up');
    expect(typeof response.body.uptimeSeconds).toBe('number');
  });
});

describe('Unknown routes', () => {
  it('returns 404 with a JSON error message', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Route not found: GET /api/does-not-exist');
  });
});
