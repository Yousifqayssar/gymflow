import { z } from 'zod';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a time like 06:00');

// One open day: { day: 1 (Monday) … 7 (Sunday), open: "06:00", close: "23:00" }.
// "HH:MM" texts can be compared directly because they always have two digits.
const openDay = z
  .object({
    day: z.number().int().min(1).max(7),
    open: time,
    close: time,
  })
  .refine((h) => h.open < h.close, { message: 'Closing time must be after opening time', path: ['close'] });

const text = (label, min, max) =>
  z
    .string({ error: `Enter the ${label}` })
    .trim()
    .min(min, `Enter the ${label}`)
    .max(max, `The ${label} can have at most ${max} characters`);

// Body of POST /api/partner-gyms and PUT /api/partner-gyms/:id (always the complete gym).
export const partnerGymSchema = z.object({
  name: text('name', 2, 80),
  address: text('address', 2, 120),
  district: text('district', 2, 60),
  phone: z.string().trim().max(30, 'The phone number can have at most 30 characters').nullish().transform((v) => v || null),
  latitude: z.number({ error: 'Choose the position on the map' }).min(-90).max(90),
  longitude: z.number({ error: 'Choose the position on the map' }).min(-180).max(180),
  hours: z
    .array(openDay)
    .max(7)
    .refine((days) => new Set(days.map((d) => d.day)).size === days.length, 'Each weekday can only appear once'),
});
