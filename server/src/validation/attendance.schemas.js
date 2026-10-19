import { z } from 'zod';

// Body of POST /api/classes/:id/attend – the code from the trainer's QR.
export const attendSchema = z.object({
  code: z.string({ error: 'Scan the trainer’s QR code' }).trim().min(1, 'Scan the trainer’s QR code').max(64),
});

// Body of PUT /api/classes/:id/attendance/:memberId
export const markAttendanceSchema = z.object({
  present: z.boolean({ error: 'Say whether the member was present' }),
});
