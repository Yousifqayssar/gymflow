import { apiRequest } from './client.js';

// GET /api/classes?category=YOGA – the schedule for the next 14 days
export function listClasses({ category } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  const query = params.toString();
  return apiRequest(`/classes${query ? `?${query}` : ''}`);
}

// GET /api/classes/:id
export function getClass(id) {
  return apiRequest(`/classes/${id}`);
}

// POST /api/classes (Admin, Trainer)
export function createClass(gymClass) {
  return apiRequest('/classes', { method: 'POST', body: gymClass });
}

// PATCH /api/classes/:id (Admin, the class's own trainer)
export function updateClass(id, changes) {
  return apiRequest(`/classes/${id}`, { method: 'PATCH', body: changes });
}

// POST /api/classes/:id/cancel (Admin, the class's own trainer)
export function cancelClass(id) {
  return apiRequest(`/classes/${id}/cancel`, { method: 'POST' });
}
