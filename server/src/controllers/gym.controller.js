import * as gymService from '../services/gym.service.js';

// GET /api/gym/stats  (any logged-in user)
export async function getStats(req, res) {
  res.json(await gymService.getGymStats());
}
