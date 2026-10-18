import { z } from 'zod';

export const MUSCLE_GROUPS = ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'FULL_BODY', 'CARDIO'];
export const EQUIPMENT = ['BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'KETTLEBELL', 'BODYWEIGHT', 'BAND', 'CARDIO_MACHINE'];

// Body of POST /api/exercises and PUT /api/exercises/:id (the complete exercise).
export const exerciseSchema = z.object({
  name: z.string({ error: 'Enter a name' }).trim().min(2, 'Enter a name').max(60, 'The name can have at most 60 characters'),
  muscleGroup: z.enum(MUSCLE_GROUPS, { error: 'Choose a muscle group' }),
  equipment: z.enum(EQUIPMENT, { error: 'Choose the equipment' }),
  description: z
    .string({ error: 'Describe how to do the exercise' })
    .trim()
    .min(10, 'Describe how to do the exercise (at least 10 characters)')
    .max(600, 'The description can have at most 600 characters'),
  isActive: z.boolean().optional(),
});

// Query of GET /api/exercises?muscleGroup=LEGS&search=squat&includeInactive=true
export const listExercisesQuerySchema = z.object({
  muscleGroup: z.enum(MUSCLE_GROUPS).optional(),
  search: z.string().trim().max(60).optional(),
  includeInactive: z.enum(['true', 'false']).optional(),
});
