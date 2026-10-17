import { apiRequest } from './client.js';

// POST /api/check-ins (Admin, Trainer) – code: scanned QR content or a typed member number
export function checkInMember(code) {
  return apiRequest('/check-ins', { method: 'POST', body: { code } });
}

// GET /api/check-ins/today (Admin, Trainer) – { checkIns, count }
export function listTodaysCheckIns() {
  return apiRequest('/check-ins/today');
}
