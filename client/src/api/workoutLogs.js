import { apiRequest } from './client.js';

// POST /api/me/workouts (Member) – { planId, dayId, durationSeconds, notes, sets } → { workout }
export function logWorkout(workout) {
  return apiRequest('/me/workouts', { method: 'POST', body: workout });
}

// GET /api/me/workouts (Member) – { workouts }: the latest workouts, newest first
export function listMyWorkouts() {
  return apiRequest('/me/workouts');
}
