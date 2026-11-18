import * as gymService from '../services/gym.service.js';

// GET /api/gym/stats  (any logged-in user)
export async function getStats(req, res) {
  res.json(await gymService.getGymStats());
}

// GET /api/gym/admin-dashboard  (Admin only)
export async function getAdminDashboard(req, res) {
  res.json(await gymService.getAdminDashboard());
}
