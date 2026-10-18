import { apiRequest } from './client.js';

// POST /api/nutrition/analyze – image: a photo as data URL → { isFood, items, totals, note }
export function analyzeMealPhoto(image) {
  return apiRequest('/nutrition/analyze', { method: 'POST', body: { image } });
}
