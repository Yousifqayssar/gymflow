import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validate } from '../src/middleware/validate.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { AppError } from '../src/utils/AppError.js';

// A tiny app with test-only routes, so we can test the middleware on its own.
function buildTestApp() {
  const app = express();
  app.use(express.json());

  const schema = z.object({
    name: z.string().min(2),
    age: z.number().int().positive(),
  });

  // Echoes back the body the controller received (after validation).
  app.post('/echo', validate(schema), (req, res) => res.json(req.body));

  app.get('/conflict', () => {
    throw new AppError(409, 'Already exists');
  });

  app.get('/crash', () => {
    throw new Error('Something unexpected');
  });

  app.use(errorHandler);
  return app;
}

describe('validate middleware', () => {
  const app = buildTestApp();

  it('passes valid data to the controller', async () => {
    const response = await request(app).post('/echo').send({ name: 'Ali', age: 25 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: 'Ali', age: 25 });
  });

  it('removes fields that are not in the schema', async () => {
    const response = await request(app).post('/echo').send({ name: 'Ali', age: 25, role: 'ADMIN' });

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty('role');
  });

  it('returns 400 with the invalid fields listed', async () => {
    const response = await request(app).post('/echo').send({ name: 'A', age: -3 });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
    const fields = response.body.error.details.map((detail) => detail.field);
    expect(fields).toEqual(['name', 'age']);
  });

  it('returns 400 when the body is missing', async () => {
    const response = await request(app).post('/echo');

    expect(response.status).toBe(400);
  });
});

describe('errorHandler middleware', () => {
  const app = buildTestApp();

  it('uses the status code of an AppError', async () => {
    const response = await request(app).get('/conflict');

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: { message: 'Already exists' } });
  });

  it('returns 500 for unexpected errors', async () => {
    const response = await request(app).get('/crash');

    expect(response.status).toBe(500);
  });

  it('returns 400 for malformed JSON', async () => {
    const response = await request(app)
      .post('/echo')
      .set('Content-Type', 'application/json')
      .send('{ not valid json');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Request body must be valid JSON');
  });
});
