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

// POST /api/classes/:id/book (Member) – returns the updated class
export function bookClass(id) {
  return apiRequest(`/classes/${id}/book`, { method: 'POST' });
}

// DELETE /api/classes/:id/book (Member) – { class, refunded } (refunded: amount of a paid class, e.g. "150.00", or null)
export function cancelBooking(id) {
  return apiRequest(`/classes/${id}/book`, { method: 'DELETE' });
}

// POST /api/classes/:id/cancel (Admin, the class's own trainer)
export function cancelClass(id) {
  return apiRequest(`/classes/${id}/cancel`, { method: 'POST' });
}

// GET /api/classes/:id/attendance (Admin, the class's own trainer) – who is present + the current QR code
export function getAttendance(id) {
  return apiRequest(`/classes/${id}/attendance`);
}

// PUT /api/classes/:id/attendance/:memberId (Admin, the class's own trainer) – mark a member present or not
export function markAttendance(id, memberId, present) {
  return apiRequest(`/classes/${id}/attendance/${memberId}`, { method: 'PUT', body: { present } });
}

// POST /api/classes/:id/attend (Member) – the member scanned the trainer's QR code
export function attendClass(id, code) {
  return apiRequest(`/classes/${id}/attend`, { method: 'POST', body: { code } });
}

// GET /api/classes/:id/booking-quote (Member) – free with the membership, or the price to pay:
// { quote: { mustPay, reason: null | 'BASIC_PLAN' | 'NO_CLASSES_LEFT', listPrice, discountPercent, price, resetsOn } | null }
export function getBookingQuote(id) {
  return apiRequest(`/classes/${id}/booking-quote`);
}

// POST /api/classes/:id/book-and-pay (Member) – pay one class by card and book it: { class, payment }
// body: { checkoutId, card }. A declined card throws ApiError 402 with code 'CARD_DECLINED'.
export function bookAndPay(id, body) {
  return apiRequest(`/classes/${id}/book-and-pay`, { method: 'POST', body });
}
