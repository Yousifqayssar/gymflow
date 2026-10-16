import { apiRequest } from './client.js';

// GET /api/me/membership – the logged-in member's own membership (Member only)
export function getMyMembership() {
  return apiRequest('/me/membership');
}

// GET /api/me/bookings – the logged-in member's upcoming booked classes (Member only)
export function listMyBookings() {
  return apiRequest('/me/bookings');
}
