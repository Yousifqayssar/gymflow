import { z } from 'zod';

export const CLASS_CATEGORIES = ['RUNNING', 'YOGA', 'HIIT', 'CYCLING', 'PILATES', 'BOXING', 'STRENGTH', 'MOBILITY'];
export const CLASS_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'];
export const CLASS_INTENSITIES = ['LOW', 'MEDIUM', 'HIGH'];

const text = (label, min, max) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(min, min === 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalText = (label, max) =>
  z.string({ error: `${label} must be text` }).trim().max(max, `${label} must be at most ${max} characters`);

// A moment in time with its time zone, e.g. "2026-10-24T08:00:00+03:00" or "...Z".
const moment = z.iso
  .datetime({ offset: true, error: 'Start time must be a date and time, e.g. 2026-10-24T08:00:00+03:00' })
  .transform((value) => new Date(value));

const id = z.coerce.number().int().positive();

const classFields = {
  title: text('Title', 3, 80),
  category: z.enum(CLASS_CATEGORIES, { error: 'Choose a category' }),
  description: text('Description', 20, 2000),
  location: text('Location', 2, 120),
  startsAt: moment,
  durationMinutes: z
    .number({ error: 'Duration must be a number of minutes' })
    .int('Duration must be a whole number of minutes')
    .min(15, 'A class lasts at least 15 minutes')
    .max(300, 'A class lasts at most 300 minutes'),
  // Business rule: capacities must be positive.
  capacity: z
    .number({ error: 'Capacity must be a number' })
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(200, 'Capacity must be at most 200'),
  level: z.enum(CLASS_LEVELS, { error: 'Choose a level' }),
  intensity: z.enum(CLASS_INTENSITIES, { error: 'Choose an intensity' }),
  whatToBring: optionalText('What to bring', 300),
  healthNotes: optionalText('Health notes', 500),
  // Price of one class for members who pay per class. Money has at most 2 decimals.
  price: z
    .number({ error: 'Price must be a number' })
    .positive('Price must be greater than 0')
    .max(99_999_999.99, 'Price is too large')
    .multipleOf(0.01, 'Price can have at most 2 decimals'),
  // Admins choose the trainer; for trainers it is always themselves (set by the server).
  trainerId: id.optional(),
};

export const createClassSchema = z.object({
  ...classFields,
  whatToBring: classFields.whatToBring.default(''),
  healthNotes: classFields.healthNotes.default(''),
  price: classFields.price.default(200),
});

// Every field is optional when editing, but at least one must be sent.
export const updateClassSchema = z
  .object(Object.fromEntries(Object.entries(classFields).map(([key, schema]) => [key, schema.optional()])))
  .refine((data) => Object.keys(data).length > 0, 'Send at least one field to change');

// Query of GET /api/classes, e.g. ?category=YOGA&from=2026-10-20T00:00:00Z
export const listClassesQuerySchema = z.object({
  category: z.enum(CLASS_CATEGORIES, { error: 'Unknown category' }).optional(),
  trainerId: id.optional(),
  from: moment.optional(),
  to: moment.optional(),
});
