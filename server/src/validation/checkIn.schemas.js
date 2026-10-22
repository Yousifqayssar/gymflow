import { z } from 'zod';

// Body of POST /api/check-ins: the scanned QR content or a typed member number.
export const checkInSchema = z.object({
  code: z
    .string({ error: 'Scan a QR code or type a member number' })
    .trim()
    .min(1, 'Scan a QR code or type a member number')
    .max(100, 'This is not a GymFlow member code'),
  // Where the member is checked in: empty = our own gym, otherwise a partner gym's id.
  partnerGymId: z.coerce.number({ error: 'Choose a location' }).int().positive().optional().nullable(),
});
