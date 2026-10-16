import { apiRequest } from './client.js';

// GET /api/users/:id – member with current status and membership history (Admin)
export function getMember(id) {
  return apiRequest(`/users/${id}`);
}

// GET /api/users/:id/memberships/preview – dates and price, without saving (Admin)
export function previewMembership(id, { planId, startDate }) {
  const params = new URLSearchParams({ planId: String(planId) });
  if (startDate) params.set('startDate', startDate);
  return apiRequest(`/users/${id}/memberships/preview?${params}`);
}

// POST /api/users/:id/memberships – sell a plan to a member (Admin)
export function assignMembership(id, { planId, startDate }) {
  return apiRequest(`/users/${id}/memberships`, {
    method: 'POST',
    body: { planId, ...(startDate ? { startDate } : {}) },
  });
}
