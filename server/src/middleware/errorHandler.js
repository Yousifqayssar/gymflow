import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// Shown instead of the real message when something unexpected breaks in production.
export const GENERIC_MESSAGE = 'Something went wrong on our side. Please try again in a moment.';

// Central error handler: every error thrown in a route ends up here
// and is turned into the same JSON shape: { error: { message, details?, code? } }
// Express recognises an error handler by its 4 parameters, so `next` must stay
// even though we don't use it.
export function errorHandler(err, req, res, next) {
  // Request body is not valid JSON (thrown by express.json()).
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Request body must be valid JSON' } });
  }

  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error(err);
  }

  // Never leak internal details (stack traces, SQL errors) to clients in production. Our own
  // AppError messages are written for users (e.g. "The food scanner is busy …"), so they are
  // always shown – also for 5xx answers like 502 or 504.
  const isUnexpected = !(err instanceof AppError) && statusCode >= 500;
  const message = isUnexpected && env.NODE_ENV === 'production' ? GENERIC_MESSAGE : err.message;

  const body = { error: { message } };
  if (err.details) {
    body.error.details = err.details;
  }
  // Only our own codes: other errors (e.g. from Prisma) also have a `code`, which must not leak.
  if (err instanceof AppError && err.code) {
    body.error.code = err.code;
  }

  res.status(statusCode).json(body);
}
