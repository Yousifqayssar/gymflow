import { z } from 'zod';

export const BODY_GOALS = ['LOSE_WEIGHT', 'BUILD_MUSCLE', 'GET_FIT', 'IMPROVE_ENDURANCE', 'STAY_HEALTHY'];

// A number in a sensible range, rounded to one decimal (e.g. 72.45 → 72.5).
const measurement = (label, unit, min, max) =>
  z
    .number({ error: `Enter your ${label} in ${unit}` })
    .min(min, `${label[0].toUpperCase()}${label.slice(1)} must be between ${min} and ${max} ${unit}`)
    .max(max, `${label[0].toUpperCase()}${label.slice(1)} must be between ${min} and ${max} ${unit}`)
    .transform((value) => Math.round(value * 10) / 10);

// Body of POST /api/me/body.
export const bodyCheckInSchema = z.object({
  heightCm: measurement('height', 'cm', 100, 250),
  weightKg: measurement('weight', 'kg', 30, 300),
  goal: z.enum(BODY_GOALS, { error: 'Choose your goal' }),
  targetWeightKg: measurement('target weight', 'kg', 30, 300).nullish(),
});
