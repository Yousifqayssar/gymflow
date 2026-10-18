import { z } from 'zod';

const loggedSet = z.object({
  exerciseId: z.number().int().positive(),
  setNumber: z.number().int().min(1).max(20),
  reps: z.number({ error: 'Enter the reps' }).int().min(0).max(200, 'At most 200 reps'),
  weightKg: z
    .number()
    .min(0)
    .max(500, 'At most 500 kg')
    .transform((kg) => Math.round(kg * 10) / 10)
    .nullish(),
});

// Body of POST /api/me/workouts – a finished workout of one plan day.
export const logWorkoutSchema = z.object({
  planId: z.number().int().positive(),
  dayId: z.number().int().positive(),
  durationSeconds: z.number().int().min(0).max(6 * 60 * 60, 'A workout can last at most 6 hours'),
  notes: z.string().trim().max(300).nullish().transform((v) => v || null),
  sets: z.array(loggedSet).min(1, 'Do at least one set before finishing').max(200),
});
