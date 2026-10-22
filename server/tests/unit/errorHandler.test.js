import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../../src/config/env.js';
import { errorHandler, GENERIC_MESSAGE } from '../../src/middleware/errorHandler.js';
import { AppError } from '../../src/utils/AppError.js';

// A tiny stand-in for Express's response object that remembers what was sent.
function fakeResponse() {
  const res = { statusCode: 0, body: null };
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (body) => ((res.body = body), res);
  return res;
}
const handle = (error) => {
  const res = fakeResponse();
  errorHandler(error, {}, res, () => {});
  return res;
};

const realEnv = env.NODE_ENV;
afterEach(() => {
  env.NODE_ENV = realEnv;
});

describe('errorHandler in production', () => {
  it('shows our own messages to users, also for 5xx answers (e.g. the busy food scanner)', () => {
    env.NODE_ENV = 'production';
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = handle(new AppError(502, 'The food scanner is not available right now.', undefined, 'SCANNER_UNAVAILABLE'));

    expect(res.statusCode).toBe(502);
    expect(res.body.error).toEqual({ message: 'The food scanner is not available right now.', code: 'SCANNER_UNAVAILABLE' });
  });

  it('hides the details of unexpected errors behind a friendly message', () => {
    env.NODE_ENV = 'production';
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = handle(new Error('connect ECONNREFUSED 10.0.0.5:5432 (password=secret)'));

    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe(GENERIC_MESSAGE);
    expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
  });
});

describe('errorHandler in development', () => {
  it('shows the real message of unexpected errors, to help debugging', () => {
    env.NODE_ENV = 'development';
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(handle(new Error('Something broke')).body.error.message).toBe('Something broke');
  });
});
