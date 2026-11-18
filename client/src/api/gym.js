import { apiRequest } from './client.js';

// GET /api/gym/stats (any logged-in user) – { members, trainers, classesThisWeek, visitsThisMonth }
export function getGymStats() {
  return apiRequest('/gym/stats');
}

// GET /api/gym/admin-dashboard (Admin) – { revenueByMonth: [{ month, label, revenue }], attendance: { classes, booked, attended, noShows, rate } }
export function getAdminDashboard() {
  return apiRequest('/gym/admin-dashboard');
}
