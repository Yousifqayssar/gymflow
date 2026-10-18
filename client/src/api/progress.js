import { apiRequest } from './client.js';

// GET /api/me/progress (Member) – { totals, weeks, exercises }
export function getMyProgress() {
  return apiRequest('/me/progress');
}

// GET /api/members/:id/progress (Admin, Trainer)
export function getMemberProgress(memberId) {
  return apiRequest(`/members/${memberId}/progress`);
}
