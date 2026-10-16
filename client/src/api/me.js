import { apiRequest } from './client.js';

// GET /api/me/membership – the logged-in member's own membership (Member only)
export function getMyMembership() {
  return apiRequest('/me/membership');
}
