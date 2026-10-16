import { apiRequest } from './client.js';

// GET /api/users?role=MEMBER&status=expiring&search=ali  (Admin only)
// Returns { users } and, for members, { counts } per membership filter.
export function listUsers({ role, status, search } = {}) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  const query = params.toString();
  return apiRequest(`/users${query ? `?${query}` : ''}`);
}

// POST /api/users  (Admin only) – user: { email, password, firstName, lastName, role }
export function createUser(user) {
  return apiRequest('/users', { method: 'POST', body: user });
}
