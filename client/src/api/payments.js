import { apiRequest } from './client.js';

// GET /api/me/membership/preview?planId= (Member) – { preview: { startDate, endDate, listPrice, level, discountPercent, price } }
export function previewMyMembership(planId) {
  return apiRequest(`/me/membership/preview?planId=${planId}`);
}

// POST /api/me/checkout (Member) – { membership, payment }
// body: { planId, checkoutId, card: { number, expMonth, expYear, cvc, holderName } }
// A declined card throws ApiError 402 with code 'CARD_DECLINED'.
export function checkout(body) {
  return apiRequest('/me/checkout', { method: 'POST', body });
}

// GET /api/me/payments (Member) – { payments } newest first
export function listMyPayments() {
  return apiRequest('/me/payments');
}

// GET /api/payments?status=&userId= (Admin) – { payments, totals }
export function listPayments({ status = '', userId = '' } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (userId) params.set('userId', userId);
  const query = params.toString();
  return apiRequest(`/payments${query ? `?${query}` : ''}`);
}
