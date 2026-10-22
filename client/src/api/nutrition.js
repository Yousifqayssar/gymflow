import { apiRequest } from './client.js';

// The server gives up after 30 seconds (see nutrition.service.js); the browser waits a little
// longer for the upload and the answer, then stops on its own.
export const SCANNER_LIMIT_SECONDS = 30;
const BROWSER_TIMEOUT_MS = 40_000;

// POST /api/nutrition/analyze – image: a photo as data URL → { isFood, items, totals, note }
// signal: lets the page cancel the analysis.
export function analyzeMealPhoto(image, { signal } = {}) {
  return apiRequest('/nutrition/analyze', { method: 'POST', body: { image }, timeoutMs: BROWSER_TIMEOUT_MS, signal });
}
