import { env } from '../config/env.js';

// Central error handler: every error thrown in a route ends up here
// and is turned into the same JSON shape.
// Express recognises an error handler by its 4 parameters, so `next` must stay
// even though we don't use it.
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error(err);
  }

  // Never leak internal details (stack traces, SQL errors) to clients in production.
  const message =
    statusCode >= 500 && env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({ error: { message } });
}
