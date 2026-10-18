import * as exerciseService from '../services/exercise.service.js';
import { parseQuery } from '../middleware/validate.js';
import { listExercisesQuerySchema } from '../validation/exercise.schemas.js';
import { parseId } from '../utils/params.js';

// GET /api/exercises  (any logged-in user)
export async function listExercises(req, res) {
  const query = parseQuery(listExercisesQuerySchema, req.query);
  res.json({ exercises: await exerciseService.listExercises(query, req.user) });
}

// POST /api/exercises  (Admin, Trainer)
export async function createExercise(req, res) {
  res.status(201).json({ exercise: await exerciseService.createExercise(req.body) });
}

// PUT /api/exercises/:id  (Admin, Trainer)
export async function updateExercise(req, res) {
  res.json({ exercise: await exerciseService.updateExercise(parseId(req.params.id, 'Exercise'), req.body) });
}
