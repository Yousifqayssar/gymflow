import { apiRequest } from './client.js';

// GET /api/me/body (Member) – { latest, history, isDue, nextDueOn }
export function getMyBody() {
  return apiRequest('/me/body');
}

// POST /api/me/body (Member) – { heightCm, weightKg, goal, targetWeightKg? }; answers like getMyBody
export function saveMyBody(values) {
  return apiRequest('/me/body', { method: 'POST', body: values });
}

// GET /api/members/:id/body (Admin, Trainer)
export function getMemberBody(memberId) {
  return apiRequest(`/members/${memberId}/body`);
}
