import * as nutritionService from '../services/nutrition.service.js';

// POST /api/nutrition/analyze  (any logged-in user)
export async function analyzeMeal(req, res) {
  res.json(await nutritionService.analyzeMeal(req.user.id, req.body.image));
}
