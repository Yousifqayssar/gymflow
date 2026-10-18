import * as workoutLogService from '../services/workoutLog.service.js';
import { parseId } from '../utils/params.js';

// POST /api/me/workouts  (Member)
export async function logWorkout(req, res) {
  res.status(201).json({ workout: await workoutLogService.logWorkout(req.user.id, req.body) });
}

// GET /api/me/workouts  (Member)
export async function listMyWorkouts(req, res) {
  res.json({ workouts: await workoutLogService.listWorkoutLogs(req.user.id) });
}

// GET /api/members/:id/workouts  (Admin, Trainer)
export async function listMemberWorkouts(req, res) {
  res.json({ workouts: await workoutLogService.listMemberWorkoutLogs(parseId(req.params.id, 'Member')) });
}
