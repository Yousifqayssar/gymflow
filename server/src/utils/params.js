import { AppError } from './AppError.js';

// Reads a numeric id from the URL, e.g. /api/plans/5 → 5.
// Anything that is not a positive whole number (e.g. /api/plans/abc) can't exist → 404.
export function parseId(value, resourceName = 'Resource') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(404, `${resourceName} not found`);
  }
  return id;
}
