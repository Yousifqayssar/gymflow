import { apiRequest } from './client.js';

// GET /api/exercises?muscleGroup=&search=&includeInactive= (any logged-in user) – { exercises }
export function listExercises({ muscleGroup = '', search = '', includeInactive = false } = {}) {
  const params = new URLSearchParams();
  if (muscleGroup) params.set('muscleGroup', muscleGroup);
  if (search) params.set('search', search);
  if (includeInactive) params.set('includeInactive', 'true');
  const query = params.toString();
  return apiRequest(`/exercises${query ? `?${query}` : ''}`);
}

// POST /api/exercises (Admin, Trainer) – { exercise }
export function createExercise(exercise) {
  return apiRequest('/exercises', { method: 'POST', body: exercise });
}

// PUT /api/exercises/:id (Admin, Trainer) – { exercise }; also deactivates with isActive: false
export function updateExercise(id, exercise) {
  return apiRequest(`/exercises/${id}`, { method: 'PUT', body: exercise });
}
