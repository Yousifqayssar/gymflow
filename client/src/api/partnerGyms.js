import { apiRequest } from './client.js';

// GET /api/partner-gyms (any logged-in user) – { gyms }
export function listPartnerGyms() {
  return apiRequest('/partner-gyms');
}

// POST /api/partner-gyms (Admin) – { gym }
export function createPartnerGym(gym) {
  return apiRequest('/partner-gyms', { method: 'POST', body: gym });
}

// PUT /api/partner-gyms/:id (Admin) – { gym }
export function updatePartnerGym(id, gym) {
  return apiRequest(`/partner-gyms/${id}`, { method: 'PUT', body: gym });
}

// DELETE /api/partner-gyms/:id (Admin)
export function deletePartnerGym(id) {
  return apiRequest(`/partner-gyms/${id}`, { method: 'DELETE' });
}
