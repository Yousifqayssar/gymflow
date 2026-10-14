import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

// We can't easily stop the real database during a test, so we replace ("mock")
// the service with a fake version that always says the database is down.
// vi.mock is moved to the top of the file by Vitest, before the imports run,
// so app.js receives the fake service instead of the real one.
vi.mock('../src/services/health.service.js', () => ({
  isDatabaseReachable: vi.fn().mockResolvedValue(false),
}));

describe('GET /api/health when the database is down', () => {
  it('returns 503 with status error', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('error');
    expect(response.body.database).toBe('down');
  });
});
