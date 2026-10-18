import { apiRequest } from './client.js';

// GET /api/gym/stats (any logged-in user) – { members, trainers, classesThisWeek, visitsThisMonth }
export function getGymStats() {
  return apiRequest('/gym/stats');
}
