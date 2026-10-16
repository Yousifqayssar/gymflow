import { z } from 'zod';

const name = z
  .string({ error: 'Name is required' })
  .trim()
  .min(1, 'Name is required')
  .max(60, 'Name must be at most 60 characters');

const durationMonths = z
  .number({ error: 'Duration must be a number of months' })
  .int('Duration must be a whole number of months')
  .min(1, 'Duration must be at least 1 month')
  .max(60, 'Duration must be at most 60 months');

// Business rule: prices must be positive. Money has at most 2 decimals.
// The database column is DECIMAL(10, 2), so the largest possible value is 99,999,999.99.
const price = z
  .number({ error: 'Price must be a number' })
  .positive('Price must be greater than 0')
  .max(99_999_999.99, 'Price is too large')
  .multipleOf(0.01, 'Price can have at most 2 decimals');

export const createPlanSchema = z.object({ name, durationMonths, price });

// Every field is optional when editing, but at least one must be sent.
export const updatePlanSchema = z
  .object({
    name: name.optional(),
    durationMonths: durationMonths.optional(),
    price: price.optional(),
    isActive: z.boolean({ error: 'isActive must be true or false' }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Send at least one field to change');
