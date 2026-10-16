import { apiRequest } from './client.js';

// Each function matches one endpoint of the API's /api/plans routes.

export function listPlans() {
  return apiRequest('/plans');
}

// plan: { name, durationMonths, price }
export function createPlan(plan) {
  return apiRequest('/plans', { method: 'POST', body: plan });
}

// changes: any of { name, durationMonths, price, isActive }
export function updatePlan(id, changes) {
  return apiRequest(`/plans/${id}`, { method: 'PATCH', body: changes });
}
