import { apiRequest } from './client.js';

// All of these are about the logged-in member ("me"): there is never an id in the URL.

// GET /api/me/membership – the member's own membership
export function getMyMembership() {
  return apiRequest('/me/membership');
}

// GET /api/me/bookings – upcoming booked classes
export function listMyBookings() {
  return apiRequest('/me/bookings');
}

// GET /api/me/qr – { qrContent } to draw the member's QR code
export function getMyQrCode() {
  return apiRequest('/me/qr');
}

// POST /api/me/qr/reset – a new QR code; the old one stops working
export function resetMyQrCode() {
  return apiRequest('/me/qr/reset', { method: 'POST' });
}

// GET /api/me/visits – { visits, points, level, nextLevel, pointsToNextLevel, recentVisits }
export function getMyVisits() {
  return apiRequest('/me/visits');
}

// GET /api/me/class-balance – classes left this membership month:
// { balance: { planName, type: 'BASIC' | 'PREMIUM', classesPerMonth, used, left, monthStart, monthEnd, resetsOn } } or { balance: null }
export function getMyClassBalance() {
  return apiRequest('/me/class-balance');
}
