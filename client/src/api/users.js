import { apiRequest } from './client.js';

// GET /api/users?role=MEMBER&search=ali  (Admin only)
export function listUsers({ role, search } = {}) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (search) params.set('search', search);
  const query = params.toString();
  return apiRequest(`/users${query ? `?${query}` : ''}`);
}

// POST /api/users  (Admin only) – user: { email, password, firstName, lastName, role }
export function createUser(user) {
  return apiRequest('/users', { method: 'POST', body: user });
}
