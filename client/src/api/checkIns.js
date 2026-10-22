import { apiRequest } from './client.js';

// POST /api/check-ins (Admin, Trainer) – code: scanned QR content or a typed member number;
// partnerGymId: where the member is checked in (null = our own gym; partner gyms: Premium members only)
export function checkInMember(code, partnerGymId = null) {
  return apiRequest('/check-ins', { method: 'POST', body: { code, partnerGymId } });
}

// GET /api/check-ins/today (Admin, Trainer) – { checkIns, count }
export function listTodaysCheckIns() {
  return apiRequest('/check-ins/today');
}
