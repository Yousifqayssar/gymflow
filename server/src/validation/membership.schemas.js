import { z } from 'zod';

// A calendar date as text: "2026-10-15". Rejects impossible dates like "2026-02-30".
const dateText = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must look like 2026-10-15')
  .refine((text) => {
    const date = new Date(`${text}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(text);
  }, 'Date does not exist');

const planId = z.coerce
  .number({ error: 'Choose a plan' })
  .int('Choose a plan')
  .positive('Choose a plan');

// Body of POST /api/users/:id/memberships.
// startDate is optional: without it, the membership starts today, or the day after
// the member's current membership ends (renewal).
export const assignMembershipSchema = z.object({
  planId,
  startDate: dateText.optional(),
});

// Query of GET /api/users/:id/memberships/preview – same fields, coming from the URL.
export const previewMembershipQuerySchema = z.object({
  planId,
  startDate: dateText.optional().or(z.literal('').transform(() => undefined)),
});
