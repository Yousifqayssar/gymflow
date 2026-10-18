import { apiRequest } from './client.js';

// GET /api/workout-plans?memberId= (Admin, Trainer) – { plans }
export function listWorkoutPlans(memberId) {
  return apiRequest(`/workout-plans${memberId ? `?memberId=${memberId}` : ''}`);
}

// GET /api/workout-plans/:id (staff, or the member it belongs to) – { plan }
export function getWorkoutPlan(id) {
  return apiRequest(`/workout-plans/${id}`);
}

// POST /api/workout-plans (Admin, Trainer) – { plan }
export function createWorkoutPlan(plan) {
  return apiRequest('/workout-plans', { method: 'POST', body: plan });
}

// PUT /api/workout-plans/:id (author or admin) – { plan }
export function updateWorkoutPlan(id, plan) {
  return apiRequest(`/workout-plans/${id}`, { method: 'PUT', body: plan });
}

// GET /api/me/workout-plans (Member) – { plans }: the member's active plans
export function listMyWorkoutPlans() {
  return apiRequest('/me/workout-plans');
}

// GET /api/members?search= (Admin, Trainer) – { members }: id, name and avatar only
export function listMembersForStaff(search = '') {
  return apiRequest(`/members${search ? `?search=${encodeURIComponent(search)}` : ''}`);
}
