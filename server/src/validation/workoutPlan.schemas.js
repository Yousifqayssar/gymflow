import { z } from 'zod';

const planExercise = z.object({
  exerciseId: z.number({ error: 'Choose an exercise' }).int().positive('Choose an exercise'),
  sets: z.number({ error: 'Enter the sets' }).int().min(1, 'At least 1 set').max(10, 'At most 10 sets'),
  reps: z.number({ error: 'Enter the reps' }).int().min(1, 'At least 1 rep').max(100, 'At most 100 reps'),
  // Empty for bodyweight exercises; rounded to one decimal (e.g. 22.5 kg).
  targetWeightKg: z
    .number()
    .min(0)
    .max(500, 'At most 500 kg')
    .transform((kg) => Math.round(kg * 10) / 10)
    .nullish(),
  restSeconds: z.number({ error: 'Enter the rest time' }).int().min(0).max(600, 'At most 10 minutes rest'),
  notes: z.string().trim().max(200, 'At most 200 characters').nullish().transform((v) => v || null),
});

const day = z.object({
  name: z.string({ error: 'Name the day' }).trim().min(1, 'Name the day').max(40, 'At most 40 characters'),
  exercises: z.array(planExercise).min(1, 'Add at least one exercise to every day').max(15, 'At most 15 exercises per day'),
});

// Body of POST /api/workout-plans and PUT /api/workout-plans/:id (always the complete plan).
export const workoutPlanSchema = z.object({
  memberId: z.number({ error: 'Choose a member' }).int().positive('Choose a member'),
  name: z.string({ error: 'Name the plan' }).trim().min(2, 'Name the plan').max(60, 'At most 60 characters'),
  notes: z.string().trim().max(500, 'At most 500 characters').nullish().transform((v) => v || null),
  isActive: z.boolean().optional(),
  days: z.array(day).min(1, 'Add at least one day').max(7, 'At most 7 days'),
});

// Query of GET /api/workout-plans?memberId=4
export const listWorkoutPlansQuerySchema = z.object({
  memberId: z.coerce.number().int().positive().optional(),
});

// Query of GET /api/members?search=eli
export const listMembersQuerySchema = z.object({
  search: z.string().trim().max(60).optional(),
});
